import * as Tone from 'tone';
import {INSTRUMENTS, normalizeInstrument} from './instruments';
import type {InstrumentId} from './instruments';
import {prepareDrumSamples} from './acousticDrums';
import {createVoice} from './voices';
import type {Voice} from './voices';
import {prepareInstrumentSamples} from './melodicSamples';
import {prepareAudioAssets} from './audioAssets';
import {countInTiming} from './countIn';
import type {CountInBars} from './countIn';
import type {Track} from './types';
import {getOutputBus, disposeOutputBus} from './outputBus';
import {createTrackMix} from './trackMix';

type Node = {instrument: InstrumentId; kind: Track['kind']; drumKit: Track['drumKit']; voice: Voice; mix: ReturnType<typeof createTrackMix>};
const nodes = new Map<string, Node>();
let session = 0;
let countInSynth: Tone.Synth | undefined;
export type CountInOptions = {bars: CountInBars; onCount?: (beat: number, total: number) => void; onRecordingStart?: () => void};
let audition = 0;
let preview: {voice: Voice; mix: ReturnType<typeof createTrackMix>; trackId: string; timer: ReturnType<typeof setTimeout>} | undefined;

function stopPreview() {
  audition++;
  if (preview) {clearTimeout(preview.timer); preview.voice.dispose(); preview.mix.dispose(); preview = undefined;}
}
export function disposeTrack(id: string) {
  const node = nodes.get(id);
  if (node) {node.voice.dispose(); node.mix.dispose(); nodes.delete(id);}
  stopPreview();
}
function ensureNode(track: Track) {
  const instrument = normalizeInstrument(track.instrument);
  let node = nodes.get(track.id);
  if (node && (node.instrument !== instrument || node.kind !== track.kind || node.drumKit !== track.drumKit)) {disposeTrack(track.id); node = undefined;}
  if (!node) {
    const mix = createTrackMix(track);
    const voice = createVoice(track, mix.input);
    node = {instrument, kind: track.kind, drumKit: track.drumKit, voice, mix}; nodes.set(track.id, node);
  }
  node.mix.update(track);
  return node;
}
export async function startPlayback(tracks: Track[], bpm: number, steps: number, onStep: (step: number) => void, onEnd: () => void, onStart?: (time: number) => void, countIn?: CountInOptions, recording?: {durationSeconds: number}) {
  stopPlayback();
  if (recording && (!Number.isFinite(recording.durationSeconds) || recording.durationSeconds <= 0)) throw new Error('Durée maximale d’enregistrement invalide.');
  const request = session;
  await Tone.start();
  if (request !== session) return false;
  await Promise.all([prepareDrumSamples(tracks), prepareInstrumentSamples(tracks), prepareAudioAssets(tracks)]);
  if (request !== session) return false;
  tracks.forEach(ensureNode);
  await Promise.all(tracks.map(track => nodes.get(track.id)!.mix.ready));
  if (request !== session) return false;
  const transport = Tone.getTransport();
  transport.position = 0;
  transport.bpm.value = bpm;
  for (const id of nodes.keys()) if (!tracks.some(t => t.id === id)) disposeTrack(id);
  // Muted tracks are scheduled too, so unmuting during playback works.
  tracks.forEach(track => {
    const node = nodes.get(track.id)!;
    if (track.kind === 'audio') {
      const length = steps * 60 / bpm / 4;
      (track.clips ?? []).forEach(clip => {
        if (clip.startSeconds < 0 || clip.startSeconds >= length) return;
        transport.schedule(time => {if (request === session) node.voice.playClip?.({...clip, duration: Math.min(clip.duration, length - clip.startSeconds)}, time);}, clip.startSeconds);
      });
      return;
    }
    track.notes.forEach(note => {
      if (note.step >= steps) return;
      transport.schedule(time => {
        if (request !== session) return;
        const duration = Math.min(note.duration, steps - note.step) * 60 / bpm / 4;
        node.voice.trigger(note.midi, duration, time, Math.max(.05, note.velocity));
      }, `${Math.floor(note.step / 16)}:${Math.floor(note.step % 16 / 4)}:${note.step % 4}`);
    });
  });
  transport.scheduleRepeat(time => {
    const step = Math.round(transport.getTicksAtTime(time) / (transport.PPQ / 4));
    Tone.getDraw().schedule(() => {if (request === session) onStep(Math.min(step, recording ? Math.max(0, Math.ceil(recording.durationSeconds * bpm / 15 - 1e-7) - 1) : steps));}, time);
  }, '16n', 0);
  transport.scheduleOnce(time => {
    Tone.getDraw().schedule(() => {if (request === session) {stopPlayback(); onEnd();}}, time);
  }, recording ? recording.durationSeconds : `${Math.floor(steps / 16)}:${Math.floor(steps % 16 / 4)}:${steps % 4}`);
  const timing = countInTiming(bpm, countIn?.bars ?? 0, Tone.now() + .1);
  if (timing.clicks.length) {
    countInSynth = new Tone.Synth({oscillator: {type: 'sine'}, envelope: {attack: .001, decay: .025, sustain: 0, release: .01}, volume: -14}).connect(getOutputBus());
    timing.clicks.forEach(click => {
      countInSynth!.triggerAttackRelease(click.accented ? 'C7' : 'C6', .035, click.time, .7);
      Tone.getDraw().schedule(() => {if (request === session) countIn?.onCount?.(click.beat, timing.clicks.length);}, click.time);
    });
  }
  // Arm the recorder now for a future frame, after the final count-in beat.
  onStart?.(timing.startTime);
  if (countIn?.onRecordingStart) Tone.getDraw().schedule(() => {if (request === session) countIn.onRecordingStart?.();}, timing.startTime);
  transport.start(timing.startTime);
  return true;
}
export function getTrackPeaks(id: string) {return preview?.trackId === id ? preview.mix.peaks() : nodes.get(id)?.mix.peaks() ?? [0, 0];}
export function getPlaybackSeconds() {
  const seconds = Tone.getTransport().getSecondsAtTime(Tone.getContext().currentTime);
  return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
}
export function updateTrackMix(track: Track) {
  const node = nodes.get(track.id);
  if (node) node.mix.update(track);
  if (preview?.trackId === track.id) preview.mix.update(track);
}
export function stopPlayback() {
  session++;
  countInSynth?.dispose(); countInSynth = undefined;
  stopPreview();
  Tone.getTransport().stop(); Tone.getTransport().cancel();
  nodes.forEach(node => node.voice.releaseAll());
}
export function disposeAudio() {
  stopPlayback();
  for (const id of nodes.keys()) disposeTrack(id);
  disposeOutputBus();
}
async function previewNotes(midis: number[], track: Track, duration: number) {
  stopPreview();
  const request = audition;
  if (track.muted) return;
  await Tone.start();
  if (request !== audition) return;
  await Promise.all([prepareDrumSamples([track]), prepareInstrumentSamples([track])]);
  if (request !== audition) return;
  const instrument = normalizeInstrument(track.instrument);
  const mix = createTrackMix(track);
  try {await mix.ready;} catch (error) {mix.dispose(); throw error;}
  if (request !== audition) {mix.dispose(); return;}
  const voice = createVoice(track, mix.input);
  const time = Tone.now();
  midis.forEach((midi, index) => voice.trigger(midi, duration, time + (track.kind === 'drums' ? index * .18 : 0), .65));
  const preset = INSTRUMENTS[instrument];
  const release = track.kind === 'drums' ? 1.5 : 'options' in preset ? preset.options.envelope.release : preset.release;
  const timer = setTimeout(() => {voice.dispose(); mix.dispose(); if (preview?.voice === voice) preview = undefined;}, (duration + release + 1.6 + midis.length * .18 + .2) * 1000);
  preview = {voice, mix, trackId: track.id, timer};
}
export function previewNote(midi: number, track: Track) {return previewNotes([midi], track, 1);}
export function previewChord(midis: number[], track: Track) {return previewNotes(midis, track, 1.2);}
export function previewInstrument(track: Track) {return previewNotes(track.kind === 'drums' ? [36, 38, 42] : track.instrument === 'electricBass' ? [28, 35] : track.instrument === 'bass' ? [36, 43] : track.instrument === 'trombone' ? [48, 55] : [60, 64, 67], track, 1.5);}
