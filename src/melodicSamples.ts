import * as Tone from 'tone';
import {SAMPLED_INSTRUMENTS, isSampledInstrument} from './sampledInstruments';
import type {SampledInstrumentId} from './sampledInstruments';
import type {Track} from './types';
import sustainLoops from './sustainLoops.json';

const buffers = new Map<SampledInstrumentId, Record<string, AudioBuffer>>();
const loading = new Map<SampledInstrumentId, Promise<void>>();
export async function prepareInstrumentSamples(tracks: Track[]) {
  const ids = new Set(tracks.filter(t => t.kind === 'synth').map(t => t.instrument));
  await Promise.all([...ids].filter(isSampledInstrument).map(id => {
    let promise = loading.get(id);
    if (!promise) {
      const preset = SAMPLED_INSTRUMENTS[id];
      promise = Promise.all(Object.entries(preset.samples).map(async ([note, filename]) => {
        const response = await fetch(`/samples/instruments/${preset.folder}/${filename}`);
        if (!response.ok) throw new Error(`${preset.name} : fichier ${filename} introuvable. Copie aussi le dossier public de miniDAW.`);
        const buffer = await Tone.getContext().decodeAudioData(await response.arrayBuffer());
        return [note, buffer] as const;
      })).then(entries => {buffers.set(id, Object.fromEntries(entries));}).catch(error => {loading.delete(id); throw error;});
      loading.set(id, promise);
    }
    return promise;
  }));
}
export function createSampledVoice(id: SampledInstrumentId, output: Tone.ToneAudioNode) {
  const urls = buffers.get(id);
  if (!urls) throw new Error('Instrument non chargé. Arrête puis relance la lecture.');
  const preset = SAMPLED_INSTRUMENTS[id];
  if ('sustain' in preset && preset.sustain) {
    const loopMap = sustainLoops[preset.folder as keyof typeof sustainLoops] as Record<string, {start: number; end: number}>;
    const gain = new Tone.Gain(Tone.dbToGain(preset.trimDb)).connect(output);
    const active = new Map<Tone.ToneBufferSource, number>();
    const samples = Object.entries(urls).map(([note, buffer]) => ({note, midi: Tone.Frequency(note).toMidi(), buffer}));
    return {
      trigger(midi: number, duration: number, time: number, velocity: number) {
        const nearest = samples.reduce((a, b) => Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a);
        const loop = loopMap[nearest.note];
        const source = new Tone.ToneBufferSource({url: nearest.buffer, loop: true, loopStart: loop.start, loopEnd: loop.end,
          playbackRate: Math.pow(2, (midi - nearest.midi) / 12), fadeIn: Math.min(preset.attack, duration / 2), fadeOut: preset.release, curve: 'linear',
          onended: node => {if (!node.context.isOffline) {active.delete(node as Tone.ToneBufferSource); node.dispose();}},
        }).connect(gain);
        active.set(source, time);
        source.start(time, 0, duration, Math.max(0, Math.min(1, velocity)));
      },
      releaseAll() {for (const [source, start] of active) source.stop(Math.max(Tone.now(), start));},
      dispose() {for (const source of active.keys()) source.dispose(); active.clear(); gain.dispose();},
    };
  }
  const sampler = new Tone.Sampler({urls, attack: preset.attack, release: preset.release}).connect(output);
  sampler.volume.value = preset.trimDb;
  return {
    trigger(midi: number, duration: number, time: number, velocity: number) {sampler.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), duration, time, velocity);},
    releaseAll() {sampler.releaseAll();},
    dispose() {sampler.dispose();},
  };
}
