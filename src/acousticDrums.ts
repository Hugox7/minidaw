import * as Tone from 'tone';
import type {Track} from './types';

export const ACOUSTIC_FILES = ['kick-01.wav', 'snare-01.wav', 'snare-02.wav', 'snare-03.wav', 'hihat-closed.wav', 'hihat-open.wav', 'crash-01.wav', 'crash-02.wav'] as const;
const buffers = new Map<string, AudioBuffer>();
let loading: Promise<void> | undefined;
export function prepareDrumSamples(tracks: Track[]): Promise<void> {
  if (!tracks.some(t => t.kind === 'drums' && t.drumKit === 'acoustic')) return Promise.resolve();
  if (!loading) {
    // Install the complete kit atomically, so a failed load can safely be retried.
    loading = Promise.all(ACOUSTIC_FILES.map(async name => {
      const response = await fetch(`samples/pearl/${name}`);
      if (!response.ok) throw new Error(`Sample ${name} introuvable (${response.status}). Copie aussi le dossier public de la V0.6.`);
      const buffer = await Tone.getContext().decodeAudioData(await response.arrayBuffer());
      return [name, buffer] as const;
    })).then(entries => {entries.forEach(([name, buffer]) => buffers.set(name, buffer));}).catch(error => {loading = undefined; throw error;});
  }
  return loading;
}
export function createAcousticDrumKit(output: Tone.ToneAudioNode) {
  const active = new Map<Tone.ToneBufferSource, number>();
  let snareIndex = 0, crashIndex = 0;
  // The source kit has no recorded handclap; keep that lane synthesized.
  const clapFilter = new Tone.Filter(1400, 'bandpass', -12).connect(output);
  const clap = new Tone.NoiseSynth({noise: {type: 'white'}, envelope: {attack: .003, decay: .12, sustain: 0, release: .03}, volume: -4}).connect(clapFilter);
  return {
    trigger(midi: number, _duration: number, time: number, velocity: number) {
      if (midi === 39) {clap.triggerAttackRelease(.06, time, velocity); return;}
      let name: string;
      switch (midi) {
        case 36: name = 'kick-01.wav'; break;
        case 38: name = ['snare-01.wav', 'snare-02.wav', 'snare-03.wav'][snareIndex++ % 3]; break;
        case 42:
          for (const [source, pitch] of active) if (pitch === 46) source.stop(time);
          name = 'hihat-closed.wav'; break;
        case 46: name = 'hihat-open.wav'; break;
        case 49: name = ['crash-01.wav', 'crash-02.wav'][crashIndex++ % 2]; break;
        default: return;
      }
      const buffer = buffers.get(name);
      if (!buffer) throw new Error('Kit acoustique non chargé. Arrête puis relance la lecture.');
      const source = new Tone.ToneBufferSource({url: buffer, fadeOut: .012, onended: () => {active.delete(source);}}).connect(output);
      active.set(source, midi);
      const level = midi === 42 ? .5 : midi === 46 ? .65 : midi === 49 ? .7 : 1;
      source.start(time, 0, undefined, Math.max(.01, Math.min(1, velocity)) * level);
    },
    releaseAll() {for (const source of active.keys()) source.stop(Tone.now()); clap.triggerRelease(Tone.now());},
    dispose() {for (const source of active.keys()) source.dispose(); active.clear(); clap.dispose(); clapFilter.dispose();},
  };
}
