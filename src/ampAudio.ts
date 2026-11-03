import * as Tone from 'tone';
import type {Track} from './types';
import {ampParameters, canUseAmp, normalizeAmp, normalizeSource} from './ampSettings';
/** Light amp-style coloration. Always bypassed for non-instrument audio and MIDI. */
export function createAmp(track: Track) {
  const input = new Tone.Gain(1), bypass = new Tone.CrossFade(0);
  const highpass = new Tone.Filter({type: 'highpass', frequency: 28, Q: .7});
  const drive = new Tone.Volume(0);
  const shape = new Tone.WaveShaper(x => Math.tanh(2 * x) / Math.tanh(2), 4096);
  shape.oversample = '4x';
  const compensation = new Tone.Volume(0);
  const mids = new Tone.Filter({type: 'peaking', frequency: 650, Q: .7, gain: 0});
  const tone = new Tone.Filter({type: 'lowpass', frequency: 4000, Q: .7, rolloff: -24});
  const clean = new Tone.Gain(0), colored = new Tone.Gain(1), sum = new Tone.Gain(1), output = new Tone.Volume(0);
  input.connect(bypass.a); input.chain(highpass, drive, shape, compensation, mids, tone, colored, sum);
  input.chain(clean, sum); sum.chain(output, bypass.b);
  // Optional speaker-style filtering after the amp; old projects keep it bypassed.
  const cabinet = new Tone.CrossFade(0);
  const cabLow = new Tone.Filter({type: 'highpass', frequency: 75, Q: .7});
  const cabBody = new Tone.Filter({type: 'peaking', frequency: 120, Q: .8, gain: 2});
  const cabMid = new Tone.Filter({type: 'peaking', frequency: 800, Q: .8, gain: -2});
  const cabHigh = new Tone.Filter({type: 'lowpass', frequency: 4800, Q: .7, rolloff: -48});
  bypass.connect(cabinet.a); bypass.chain(cabLow, cabBody, cabMid, cabHigh, cabinet.b);
  function update(next: Track, initial = false) {
    const settings = normalizeAmp(next.amp), params = ampParameters(normalizeSource(next.audioSource), settings);
    const ramp = (param: {value: unknown; rampTo: (value: number, seconds: number) => unknown}, value: number) => {if (initial) param.value = value; else param.rampTo(value, .04);};
    ramp(highpass.frequency, params.lowCut); ramp(drive.volume, params.driveDb);
    ramp(compensation.volume, params.compensationDb); ramp(mids.frequency, params.midFrequency); ramp(mids.gain, params.midGain);
    ramp(tone.frequency, params.highCut); ramp(clean.gain, params.cleanBlend); ramp(colored.gain, 1 - params.cleanBlend);
    ramp(output.volume, settings.level); ramp(bypass.fade, canUseAmp(next) && settings.enabled ? 1 : 0);
    const bass = normalizeSource(next.audioSource) === 'bass';
    ramp(cabLow.frequency, bass ? 30 : 75); ramp(cabBody.frequency, bass ? 85 : 120);
    ramp(cabMid.frequency, bass ? 450 : 800); ramp(cabHigh.frequency, bass ? 5500 : 4800);
    ramp(cabinet.fade, canUseAmp(next) && settings.cabinet ? 1 : 0);
  }
  update(track, true);
  return {input, output: cabinet, update, dispose() {[input, bypass, highpass, drive, shape, compensation, mids, tone, clean, colored, sum, output, cabinet, cabLow, cabBody, cabMid, cabHigh].forEach(node => node.dispose());}};
}
