import type {AudioClip, Note, Project, Track} from './types';
import {normalizeInstrument} from './instruments';
import {normalizeMix} from './mixSettings';
import {normalizeAmp, normalizeSource} from './ampSettings';
import {normalizePedals} from './pedalSettings';
import {normalizeClip} from './clipEditing';
import {MAX_TRACK_VOLUME_DB} from './volumeSettings';
const MAGIC = new TextEncoder().encode('MINIDAW1');
const MAX_FILE = 256 * 1024 * 1024, MAX_MANIFEST = 8 * 1024 * 1024;
export type ProjectAsset = {id: string; name: string; blob: Blob};
type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue {if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Structure du projet invalide.'); return value as RecordValue;}
function string(value: unknown, max = 1000): string {if (typeof value !== 'string' || !value.length || value.length > max) throw new Error('Nom ou identifiant de projet invalide.'); return value;}
function number(value: unknown, min: number, max: number, integer = false): number {if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new Error('Valeur numérique du projet invalide ou hors limites.'); return value;}
function array(value: unknown, max: number): unknown[] {if (!Array.isArray(value) || value.length > max) throw new Error('Liste du projet invalide ou trop volumineuse.'); return value;}
function clip(value: unknown): AudioClip {
  const c = object(value), duration = number(c.duration, .000001, 86400), offset = c.sourceOffset === undefined ? 0 : number(c.sourceOffset, 0, 86400);
  const sourceDuration = c.sourceDuration === undefined ? duration + offset : number(c.sourceDuration, .000001, 86400);
  if (offset + duration > sourceDuration + .00001) throw new Error('Une portion audio dépasse le fichier source.');
  return normalizeClip({id: string(c.id, 200), assetId: string(c.assetId, 200), name: string(c.name), startSeconds: number(c.startSeconds, 0, 86400), duration, sourceOffset: offset, sourceDuration, peaks: array(c.peaks, 4096).map(p => number(p, 0, 32))});
}
export function validateProject(value: unknown): Project {
  const p = object(value), ids = new Set<string>(); let count = 0;
  const tracks: Track[] = array(p.tracks, 128).map(value => {
    const t = object(value), id = string(t.id, 200); if (ids.has(id)) throw new Error('Deux pistes ont le même identifiant.'); ids.add(id);
    if (t.kind !== 'synth' && t.kind !== 'drums' && t.kind !== 'audio') throw new Error('Type de piste inconnu.');
    const noteIds = new Set<string>();
    const notes: Note[] = array(t.notes, 100000).map(value => {
      const n = object(value), id = string(n.id, 200); if (noteIds.has(id)) throw new Error('Deux notes ont le même identifiant.'); noteIds.add(id); count++;
      return {id, midi: number(n.midi, 0, 127, true), step: number(n.step, 0, 1048576, true), duration: number(n.duration, .000001, 1048576), velocity: number(n.velocity, 0, 1)};
    });
    const clips = t.kind === 'audio' ? array(t.clips ?? [], 10000).map(clip) : undefined;
    if (clips && new Set(clips.map(c => c.id)).size !== clips.length) throw new Error('Deux clips ont le même identifiant.');
    const color = typeof t.color === 'string' && /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : '#6ca6ec';
    return {id, kind: t.kind, name: string(t.name), color, volume: number(t.volume, -60, MAX_TRACK_VOLUME_DB), muted: t.muted === true, instrument: normalizeInstrument(t.instrument), notes, mix: normalizeMix(t.mix as Track['mix']), ...(t.repeatEndStep === undefined ? {} : {repeatEndStep: number(t.repeatEndStep, 0, 1048576, true)}), ...(t.kind === 'drums' ? {drumKit: t.drumKit === 'synthetic' ? 'synthetic' as const : 'acoustic' as const} : {}), ...(t.kind === 'audio' ? {clips, audioSource: normalizeSource(t.audioSource), amp: normalizeAmp(t.amp as Track['amp']), pedals: normalizePedals(t.pedals)} : {})};
  });
  if (!tracks.length || count > 200000) throw new Error('Le projet est vide ou contient trop de notes.');
  const result: Project = {name: string(p.name, 200), bpm: number(p.bpm, 40, 240), bars: number(p.bars, 1, 1024, true), tracks, masterVolume: p.masterVolume === undefined ? 0 : number(p.masterVolume, -60, 6)};
  if (p.countInBars !== undefined) {if (p.countInBars !== 0 && p.countInBars !== 1 && p.countInBars !== 2) throw new Error('Décompte invalide.'); result.countInBars = p.countInBars;}
  if (p.pendingRetake !== undefined) {const pending = object(p.pendingRetake), trackId = string(pending.trackId, 200); if (!tracks.some(t => t.id === trackId && t.kind === 'audio')) throw new Error('La piste de la nouvelle prise est introuvable.'); result.pendingRetake = {trackId, clip: clip(pending.clip)};}
  return result;
}
export function projectClips(project: Project): AudioClip[] {return [...project.tracks.flatMap(t => t.clips ?? []), ...(project.pendingRetake ? [project.pendingRetake.clip] : [])];}
async function hash(blob: Blob) {if (!crypto.subtle) throw new Error('La sauvegarde de projets nécessite localhost ou HTTPS.'); const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()); return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');}
export async function encodeProject(project: Project, read: (id: string) => Promise<Blob>): Promise<Blob> {
  const valid = validateProject(project), clips = projectClips(valid), assets = []; let total = 0;
  for (const id of new Set(clips.map(c => c.assetId))) {
    const blob = await read(id); total += blob.size;
    if (!blob.size || blob.size > 64 * 1024 * 1024 || total > MAX_FILE) throw new Error('Projet trop volumineux : maximum 256 Mo, avec 64 Mo par fichier audio.');
    assets.push({id, name: clips.find(c => c.assetId === id)!.name, type: blob.type, size: blob.size, sha256: await hash(blob), blob});
  }
  const manifest = new TextEncoder().encode(JSON.stringify({format: 'mini-daw', version: 1, project: valid, assets: assets.map(({blob: _blob, ...entry}) => entry)}));
  if (manifest.length > MAX_MANIFEST || total + manifest.length + 12 > MAX_FILE || assets.length > 256) throw new Error('Projet trop volumineux pour ce format de sauvegarde.');
  const header = new Uint8Array(12); header.set(MAGIC); new DataView(header.buffer).setUint32(8, manifest.length, true);
  return new Blob([header, manifest, ...assets.map(asset => asset.blob)], {type: 'application/octet-stream'});
}
export async function decodeProject(file: Blob): Promise<{project: Project; assets: ProjectAsset[]}> {
  if (file.size < 12 || file.size > MAX_FILE) throw new Error('Ce fichier de projet est vide, incomplet ou dépasse 256 Mo.');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer()); if (!MAGIC.every((byte, i) => byte === header[i])) throw new Error('Ce fichier n’est pas un projet .minidaw reconnu.');
  const length = new DataView(header.buffer).getUint32(8, true); if (length > MAX_MANIFEST || 12 + length > file.size) throw new Error('Le fichier de projet est incomplet.');
  let value: RecordValue; try {value = object(JSON.parse(await file.slice(12, 12 + length).text()));} catch {throw new Error('Le descriptif du projet est illisible.');}
  if (value.format !== 'mini-daw' || value.version !== 1) throw new Error('Version de projet non prise en charge.');
  const project = validateProject(value.project), entries = array(value.assets, 256), ids = new Set<string>(), assets: ProjectAsset[] = []; let offset = 12 + length;
  for (const entry of entries) {
    const a = object(entry), id = string(a.id, 200), size = number(a.size, 1, 64 * 1024 * 1024, true), name = string(a.name);
    if (ids.has(id) || offset + size > file.size) throw new Error('Un fichier audio du projet est manquant ou dupliqué.'); ids.add(id);
    const blob = file.slice(offset, offset + size, typeof a.type === 'string' ? a.type : 'application/octet-stream'); offset += size;
    if (await hash(blob) !== a.sha256) throw new Error('Une prise audio est corrompue. Le projet actuel est conservé.');
    assets.push({id, name, blob});
  }
  if (offset !== file.size || projectClips(project).some(c => !ids.has(c.assetId))) throw new Error('Le projet ne contient pas toutes les prises nécessaires.');
  return {project, assets};
}
export function projectFilename(name: string) {
  let base = name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 100) || 'Mon morceau';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(base)) base = `_${base}`;
  return `${base}.minidaw`;
}
