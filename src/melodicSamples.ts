import * as Tone from 'tone';
import {SAMPLED_INSTRUMENTS, isSampledInstrument} from './sampledInstruments';
import type {SampledInstrumentId} from './sampledInstruments';
import type {Track} from './types';

const buffers = new Map<SampledInstrumentId, Record<string, AudioBuffer>>();
const loading = new Map<SampledInstrumentId, Promise<void>>();
export async function prepareInstrumentSamples(tracks: Track[]) {
  const ids = new Set(tracks.filter(t => t.kind === 'synth').map(t => t.instrument));
  await Promise.all([...ids].filter(isSampledInstrument).map(id => {
    let promise = loading.get(id);
    if (!promise) {
      const preset = SAMPLED_INSTRUMENTS[id];
      promise = Promise.all(Object.entries(preset.samples).map(async ([note, filename]) => {
        const response = await fetch(`samples/instruments/${preset.folder}/${filename}`);
        if (!response.ok) throw new Error(`${preset.name} : fichier ${filename} introuvable. Copie aussi le dossier public de la V0.7.`);
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
  const sampler = new Tone.Sampler({urls, attack: preset.attack, release: preset.release}).connect(output);
  sampler.volume.value = preset.trimDb;
  return {
    trigger(midi: number, duration: number, time: number, velocity: number) {sampler.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), duration, time, velocity);},
    releaseAll() {sampler.releaseAll();},
    dispose() {sampler.dispose();},
  };
}
