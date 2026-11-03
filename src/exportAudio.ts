import * as Tone from 'tone';
import {contentBars} from './projectLength';
import type {Project} from './types';
import {validateProject, projectFilename} from './projectFile';
import {prepareDrumSamples} from './acousticDrums';
import {prepareInstrumentSamples} from './melodicSamples';
import {prepareAudioAssets} from './audioAssets';
import {createVoice} from './voices';
import type {Voice} from './voices';
import {createTrackMix} from './trackMix';
const RATE = 44100, TAIL = 4, MAX_SECONDS = 300;
let exporting = false;
type BufferData = Pick<AudioBuffer, 'length' | 'sampleRate' | 'numberOfChannels' | 'getChannelData'>;
export async function encodeStereoWav(buffer: BufferData): Promise<{blob: Blob; peak: number}> {
  const frames = buffer.length, header = new ArrayBuffer(44), view = new DataView(header);
  const text = (offset: number, value: string) => [...value].forEach((letter, i) => view.setUint8(offset + i, letter.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + frames * 4, true); text(8, 'WAVE'); text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true); view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, frames * 4, true);
  const channels = [buffer.getChannelData(0), buffer.getChannelData(buffer.numberOfChannels > 1 ? 1 : 0)], parts: BlobPart[] = [header]; let peak = 0;
  for (let start = 0; start < frames; start += RATE) {
    const count = Math.min(RATE, frames - start), bytes = new ArrayBuffer(count * 4), data = new DataView(bytes);
    for (let i = 0; i < count; i++) for (let channel = 0; channel < 2; channel++) {
      const raw = channels[channel][start + i];
      if (!Number.isFinite(raw)) throw new Error('Le rendu contient un échantillon audio invalide. Le projet est conservé.');
      peak = Math.max(peak, Math.abs(raw)); const value = Math.max(-1, Math.min(1, raw));
      data.setInt16(i * 4 + channel * 2, value < 0 ? Math.round(value * 32768) : Math.round(value * 32767), true);
    }
    parts.push(bytes); await new Promise(resolve => setTimeout(resolve, 0));
  }
  return {blob: new Blob(parts, {type: 'audio/wav'}), peak};
}
export function mixFilename(name: string) {return projectFilename(name).replace(/\.minidaw$/, '.wav');}
export async function exportProjectAudio(project: Project, progress: (message: string) => void = () => {}) {
  if (exporting) throw new Error('Un export est déjà en cours.');
  const snapshot = validateProject(project), length = contentBars(snapshot, true) * 4 * 60 / snapshot.bpm;
  if (snapshot.pendingRetake) throw new Error('Valide ou refuse la nouvelle prise avant d’exporter le morceau.');
  if (length > MAX_SECONDS) throw new Error('Cette première version exporte les morceaux de 5 minutes maximum. Réduis le nombre de mesures avant de réessayer.');
  const tracks = snapshot.tracks.filter(track => !track.muted);
  if (!tracks.some(track => track.kind === 'audio' ? track.clips?.some(c => c.startSeconds < length) : track.notes.some(n => n.step < snapshot.bars * 16))) throw new Error('Aucune note ni prise à exporter sur les pistes actives.');
  exporting = true;
  const original = Tone.getContext(); let offline: Tone.OfflineContext | undefined, master: Tone.Volume | undefined;
  const nodes: {mix: ReturnType<typeof createTrackMix>; voice?: Voice}[] = [];
  try {
    progress('Chargement des instruments et des prises…');
    await Promise.all([prepareDrumSamples(tracks), prepareInstrumentSamples(tracks), prepareAudioAssets(tracks)]);
    offline = new Tone.OfflineContext(2, length + TAIL, RATE); Tone.setContext(offline);
    master = new Tone.Volume(snapshot.masterVolume ?? 0).toDestination();
    for (const track of tracks) {const mix = createTrackMix(track, master); nodes.push({mix});}
    await Promise.all(nodes.map(node => node.mix.ready));
    tracks.forEach((track, index) => {
      const node = nodes[index], voice = createVoice(track, node.mix.input); node.voice = voice;
      if (track.kind === 'audio') for (const clip of track.clips ?? []) {
        if (clip.startSeconds >= length) continue;
        const trimmed = {...clip, duration: Math.min(clip.duration, length - clip.startSeconds)};
        offline!.transport.schedule(time => voice.playClip?.(trimmed, time), clip.startSeconds);
      } else for (const note of track.notes) {
        const start = note.step * 60 / snapshot.bpm / 4; if (start >= length) continue;
        const duration = Math.min(note.duration * 60 / snapshot.bpm / 4, length - start);
        offline!.transport.schedule(time => voice.trigger(note.midi, duration, time, Math.max(.05, note.velocity)), start);
      }
    });
    progress('Rendu du mix en cours…'); offline.transport.start(0);
    const rendered = await offline.render();
    try {
      progress('Création du fichier WAV…'); const buffer = rendered.get(); if (!buffer) throw new Error('Le rendu audio est vide.');
      const encoded = await encodeStereoWav(buffer);
      return {...encoded, duration: buffer.duration, filename: mixFilename(snapshot.name)};
    } finally {rendered.dispose();}
  } finally {
    try {for (const node of nodes) {node.voice?.dispose(); node.mix.dispose();} master?.dispose(); offline?.dispose();}
    finally {Tone.setContext(original); exporting = false;}
  }
}
