import * as Tone from 'tone';
import type {Track} from './types';
import {getOutputBus, analyserPeaks} from './outputBus';
import {createAmp} from './ampAudio';
import {createPedals} from './pedalAudio';
import {normalizeMix} from './mixSettings';

/** One stereo chain shared by audio clips, MIDI instruments and previews. */
export function createTrackMix(track: Track, output: Tone.ToneAudioNode = getOutputBus()) {
  const settings = normalizeMix(track.mix);
  const input = new Tone.Gain(1);
  const amp = createAmp(track);
  const pedals = createPedals(track);
  input.connect(pedals.input); pedals.output.connect(amp.input);
  const low = new Tone.Filter({type: 'lowshelf', frequency: 200, gain: settings.eq.low});
  const mid = new Tone.Filter({type: 'peaking', frequency: 1000, Q: .7, gain: settings.eq.mid});
  const high = new Tone.Filter({type: 'highshelf', frequency: 4000, gain: settings.eq.high});
  const eqBypass = new Tone.CrossFade(settings.eq.enabled ? 1 : 0);
  amp.output.connect(eqBypass.a); amp.output.chain(low, mid, high, eqBypass.b);
  const c = settings.compressor;
  const compressor = new Tone.Compressor({threshold: c.threshold, ratio: c.ratio, attack: c.attack / 1000, release: c.release / 1000, knee: 12});
  const makeup = new Tone.Volume(c.makeup);
  const compBypass = new Tone.CrossFade(c.enabled ? 1 : 0);
  eqBypass.connect(compBypass.a); eqBypass.chain(compressor, makeup, compBypass.b);
  // A fixed short room avoids regenerating an impulse response while playing.
  const reverb = new Tone.Reverb({decay: 1.5, preDelay: .015, wet: settings.reverb.enabled ? settings.reverb.wet : 0});
  const gain = new Tone.Volume(track.muted ? -Infinity : track.volume);
  const pan = new Tone.Panner(settings.pan);
  const analyser = new Tone.Analyser({type: 'waveform', size: 8192, channels: 2});
  compBypass.chain(reverb, gain, pan); pan.connect(analyser); pan.connect(output);
  function update(next: Track) {
    const m = normalizeMix(next.mix);
    amp.update(next);
    pedals.update(next);
    low.gain.rampTo(m.eq.low, .03); mid.gain.rampTo(m.eq.mid, .03); high.gain.rampTo(m.eq.high, .03);
    eqBypass.fade.rampTo(m.eq.enabled ? 1 : 0, .02);
    compressor.threshold.rampTo(m.compressor.threshold, .03); compressor.ratio.rampTo(m.compressor.ratio, .03);
    compressor.attack.rampTo(m.compressor.attack / 1000, .03); compressor.release.rampTo(m.compressor.release / 1000, .03);
    makeup.volume.rampTo(m.compressor.makeup, .03); compBypass.fade.rampTo(m.compressor.enabled ? 1 : 0, .02);
    reverb.wet.rampTo(m.reverb.enabled ? m.reverb.wet : 0, .03);
    gain.volume.rampTo(next.muted ? -Infinity : next.volume, .02); pan.pan.rampTo(m.pan, .03);
  }
  return {input, peaks: () => analyserPeaks(analyser), ready: reverb.ready, update, dispose() {
    [pedals, amp, input, low, mid, high, eqBypass, compressor, makeup, compBypass, reverb, gain, pan, analyser].forEach(node => node.dispose());
  }};
}
