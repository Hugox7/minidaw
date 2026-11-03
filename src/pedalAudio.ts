import * as Tone from 'tone';
import {createOctaveShift} from './octaveShift';
import type {Track} from './types';
import {normalizeSource} from './ampSettings';
import {canUsePedals, normalizePedals, pedalCurve} from './pedalSettings';
import type {PedalType} from './pedalSettings';

/** Fixed order: octaver → saturation + linear dry blend → chorus → delay → amp. */
export function createPedals(track: Track) {
  const input = new Tone.Gain(1), output = new Tone.Gain(1);
  // MIDI and drums never need the instrument-pedal DSP graph.
  if (track.kind !== 'audio') {input.connect(output); return {input, output, update(_next: Track) {}, dispose() {input.dispose(); output.dispose();}};}
  const bypass = new Tone.Gain(1), effected = new Tone.Gain(0);
  input.chain(bypass, output);
  const octaveSum = new Tone.Gain(1), octaveDry = new Tone.Gain(1);
  input.chain(octaveDry, octaveSum);
  let octaveVoices: {shift: ReturnType<typeof createOctaveShift>; gain: Tone.Gain}[] = [];
  function prepareOctaves() {
    if (octaveVoices.length) return;
    octaveVoices = ([-1, 1] as const).map(direction => {
      const shift = createOctaveShift(direction);
      const gain = new Tone.Gain(0); input.connect(shift.input); shift.output.chain(gain, octaveSum); return {shift, gain};
    });
  }
  const lowCut = new Tone.Filter({type: 'highpass', frequency: 25, Q: .7});
  const drive = new Tone.Volume(0), clipped = new Tone.Gain(1);
  octaveSum.chain(lowCut, drive);
  const modes = (['overdrive', 'distortion', 'fuzz'] as PedalType[]).map(type => {
    const shape = new Tone.WaveShaper(x => pedalCurve(type, x), 8192); shape.oversample = '4x';
    const gain = new Tone.Gain(0); drive.chain(shape, gain, clipped); return {type, shape, gain};
  });
  const dc = new Tone.Filter({type: 'highpass', frequency: 20, Q: .7});
  const mids = new Tone.Filter({type: 'peaking', frequency: 750, Q: .7, gain: 0});
  const tone = new Tone.Filter({type: 'lowpass', frequency: 3500, Q: .7, rolloff: -24});
  const compensation = new Tone.Volume(-12), wet = new Tone.Gain(0), dry = new Tone.Gain(1), sum = new Tone.Gain(1), level = new Tone.Volume(0);
  octaveSum.chain(dry, sum); clipped.chain(dc, mids, tone, compensation, wet, sum); sum.connect(level);
  const chorus = new Tone.Chorus({frequency: .8, delayTime: 3.5, depth: .5, feedback: 0, spread: 180, wet: 0}).start(0);
  const delay = new Tone.FeedbackDelay({delayTime: .28, feedback: 0, maxDelay: 1, wet: 0});
  level.chain(chorus, delay, effected, output);
  function update(next: Track, initial = false) {
    const p = normalizePedals(next.pedals), s = p.saturation;
    const active = canUsePedals(next) && p.enabled, bass = normalizeSource(next.audioSource) === 'bass';
    const ramp = (param: {value: unknown; rampTo: (value: number, seconds: number) => unknown}, value: number) => {if (initial) param.value = value; else param.rampTo(value, .04);};
    const octaving = active && p.octaver.enabled;
    if (octaving) prepareOctaves();
    ramp(octaveDry.gain, octaving ? p.octaver.direct / 100 : 1);
    octaveVoices.forEach((voice, index) => ramp(voice.gain.gain, octaving ? (index === 0 ? p.octaver.down : p.octaver.up) / 100 : 0));
    ramp(bypass.gain, active ? 0 : 1); ramp(effected.gain, active ? 1 : 0);
    ramp(lowCut.frequency, bass ? 25 : 70); ramp(drive.volume, s.gain * (s.type === 'overdrive' ? .26 : .38));
    modes.forEach(mode => ramp(mode.gain.gain, mode.type === s.type ? 1 : 0));
    ramp(mids.frequency, bass ? 600 : 850); ramp(mids.gain, s.type === 'fuzz' ? -5 : s.type === 'overdrive' ? 2 : -1);
    ramp(tone.frequency, (bass ? 1100 : 1600) * Math.pow(bass ? 5 : 4.5, s.tone / 100));
    ramp(compensation.volume, s.type === 'fuzz' ? -16 : s.type === 'distortion' ? -14 : -12);
    const blend = s.enabled ? s.blend / 100 : 0;
    ramp(dry.gain, 1 - blend); ramp(wet.gain, blend); ramp(level.volume, s.enabled ? s.level : 0);
    ramp(chorus.frequency, p.chorus.rate); chorus.depth = p.chorus.depth / 100;
    ramp(chorus.wet, active && p.chorus.enabled ? p.chorus.mix / 100 : 0);
    ramp(delay.delayTime, p.delay.time / 1000); ramp(delay.feedback, active && p.delay.enabled ? p.delay.feedback / 100 : 0);
    ramp(delay.wet, active && p.delay.enabled ? p.delay.mix / 100 : 0);
  }
  update(track, true);
  return {input, output, update, dispose() {
    octaveVoices.forEach(({shift, gain}) => {shift.dispose(); gain.dispose();});
    octaveSum.dispose(); octaveDry.dispose();
    modes.forEach(({shape, gain}) => {shape.dispose(); gain.dispose();});
    [input, output, bypass, effected, lowCut, drive, clipped, dc, mids, tone, compensation, wet, dry, sum, level, chorus, delay].forEach(node => node.dispose());
  }};
}
