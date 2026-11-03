import * as Tone from 'tone';
import {SYNTH_INSTRUMENTS, normalizeInstrument} from './instruments';
import {createAcousticDrumKit} from './acousticDrums';
import {createDrumKit} from './drumAudio';
import {isSampledInstrument} from './sampledInstruments';
import {createSampledVoice} from './melodicSamples';
import type {AudioClip, Track} from './types';
import {createAudioVoice} from './audioAssets';
export type Voice = {playClip?: (clip: AudioClip, time: number) => void; trigger: (midi: number, duration: number, time: number, velocity: number) => void; releaseAll: () => void; dispose: () => void};
export function createVoice(track: Track, output: Tone.ToneAudioNode): Voice {
  if (track.kind === 'audio') return createAudioVoice(output);
  if (track.kind === 'drums') return track.drumKit === 'acoustic' ? createAcousticDrumKit(output) : createDrumKit(output);
  const instrument = normalizeInstrument(track.instrument);
  if (isSampledInstrument(instrument)) return createSampledVoice(instrument, output);
  const preset = SYNTH_INSTRUMENTS[instrument];
  const synth = new Tone.PolySynth(Tone.Synth, preset.options).connect(output);
  synth.volume.value = preset.trimDb;
  return {
    trigger(midi, duration, time, velocity) {synth.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), duration, time, velocity);},
    releaseAll() {synth.releaseAll();},
    dispose() {synth.dispose();},
  };
}
