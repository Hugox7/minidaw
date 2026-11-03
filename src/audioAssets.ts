import * as Tone from 'tone';
import {normalizeClip} from './clipEditing';
import type {AudioClip, Track} from './types';

type Asset = {id: string; blob: Blob; name: string};
let database: Promise<IDBDatabase> | undefined;
const decoded = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<void>>();
function db() {
  if (!database) database = new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB) {reject(new Error('La sauvegarde audio IndexedDB est indisponible dans ce navigateur.')); return;}
    const request = indexedDB.open('mini-daw-audio', 1);
    request.onupgradeneeded = () => {request.result.createObjectStore('assets', {keyPath: 'id'});};
    request.onsuccess = () => {const result = request.result; result.onversionchange = () => {result.close(); database = undefined;}; resolve(result);};
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Ferme les autres onglets miniDAW puis réessaie la sauvegarde.'));
  }).catch(error => {database = undefined; throw error;});
  return database;
}
async function readAsset(id: string): Promise<Asset> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction('assets', 'readonly'), request = tx.objectStore('assets').get(id);
    request.onsuccess = () => request.result ? resolve(request.result) : reject(new Error('Une prise audio est introuvable dans ce navigateur.'));
    request.onerror = () => reject(request.error);
  });
}
function peaks(buffer: AudioBuffer) {
  return Array.from({length: 128}, (_, i) => {
    let value = 0; const from = Math.floor(i * buffer.length / 128), end = Math.floor((i + 1) * buffer.length / 128);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let frame = from; frame < end; frame++) value = Math.max(value, Math.abs(data[frame]));
    }
    return value;
  });
}
export async function saveAudioAsset(blob: Blob, name: string): Promise<AudioClip> {
  if (!blob.size || blob.size > 64 * 1024 * 1024) throw new Error('Choisis une prise audio de moins de 64 Mo.');
  await Tone.start();
  const buffer = await Tone.getContext().decodeAudioData(await blob.arrayBuffer());
  if (!Number.isFinite(buffer.duration) || buffer.duration <= 0) throw new Error('Ce fichier audio ne contient pas de prise lisible.');
  const id = crypto.randomUUID(), database = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction('assets', 'readwrite');
    tx.objectStore('assets').put({id, blob, name} satisfies Asset);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('Stockage audio interrompu.'));
  });
  decoded.set(id, buffer);
  return {id: crypto.randomUUID(), assetId: id, name, startSeconds: 0, duration: buffer.duration, sourceOffset: 0, sourceDuration: buffer.duration, peaks: peaks(buffer)};
}
export async function prepareAudioAssets(tracks: Track[]) {
  const ids = new Set(tracks.filter(t => t.kind === 'audio').flatMap(t => (t.clips ?? []).map(c => c.assetId)));
  await Promise.all([...ids].map(id => {
    if (decoded.has(id)) return Promise.resolve();
    let promise = loading.get(id);
    if (!promise) {promise = readAsset(id).then(async asset => {decoded.set(id, await Tone.getContext().decodeAudioData(await asset.blob.arrayBuffer()));}).catch(error => {loading.delete(id); throw error;}); loading.set(id, promise);}
    return promise;
  }));
}
export function createAudioVoice(output: Tone.ToneAudioNode) {
  const active = new Set<Tone.ToneBufferSource>();
  return {
    trigger() {},
    playClip(clip: AudioClip, time: number) {
      const buffer = decoded.get(clip.assetId); if (!buffer) throw new Error('Prise audio non chargée.');
      const edited = normalizeClip(clip), offset = edited.sourceOffset!;
      const duration = Math.min(edited.duration, buffer.duration - offset); if (duration <= 0) return;
      const source = new Tone.ToneBufferSource({url: buffer, fadeIn: .003, fadeOut: .01, onended: () => {active.delete(source);}}).connect(output);
      active.add(source); source.start(time, offset, duration);
    },
    releaseAll() {for (const source of active) source.stop(Tone.immediate());},
    dispose() {for (const source of active) source.dispose(); active.clear();},
  };
}
export async function getAudioBlob(id: string) {return (await readAsset(id)).blob;}

/** Decode first, then commit all imported assets in one transaction under fresh IDs. */
export async function restoreProjectAssets(project: import('./types').Project, assets: import('./projectFile').ProjectAsset[]): Promise<import('./types').Project> {
  const restored: {oldId: string; asset: Asset; buffer: AudioBuffer}[] = [];
  for (const entry of assets) {
    const buffer = await Tone.getContext().decodeAudioData(await entry.blob.arrayBuffer());
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0) throw new Error(`Prise audio illisible : ${entry.name}`);
    restored.push({oldId: entry.id, asset: {id: crypto.randomUUID(), blob: entry.blob, name: entry.name}, buffer});
  }
  const remap = new Map(restored.map(entry => [entry.oldId, entry]));
  const mapClip = (clip: AudioClip) => {
    const entry = remap.get(clip.assetId); if (!entry) throw new Error('Une prise audio manque au projet.');
    if ((clip.sourceOffset ?? 0) + clip.duration > entry.buffer.duration + .002) throw new Error('Une portion audio dépasse la durée de sa prise.');
    return {...clip, assetId: entry.asset.id, sourceDuration: entry.buffer.duration};
  };
  const next = {...project, tracks: project.tracks.map(track => ({...track, ...(track.kind === 'audio' ? {clips: (track.clips ?? []).map(mapClip)} : {})})), ...(project.pendingRetake ? {pendingRetake: {...project.pendingRetake, clip: mapClip(project.pendingRetake.clip)}} : {})};
  if (restored.length) {
    const database = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('assets', 'readwrite'); for (const entry of restored) tx.objectStore('assets').put(entry.asset);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('Stockage audio interrompu.'));
    });
    for (const entry of restored) decoded.set(entry.asset.id, entry.buffer);
  }
  return next;
}
