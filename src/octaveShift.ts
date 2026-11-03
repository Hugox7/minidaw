import * as Tone from 'tone';

/** Two crossfaded delay ramps. d(delay)/dt = 1 - pitch ratio.
 * No feedback; independent voices preserve chords and the raw recording.
 */
export function createOctaveShift(direction: -1 | 1) {
  const window = .1, ratio = direction === -1 ? .5 : 2;
  const input = new Tone.Gain(1), output = new Tone.Gain(1);
  const a = new Tone.Delay({maxDelay: .2}), b = new Tone.Delay({maxDelay: .2});
  const frequency = Math.abs(1 - ratio) / window;
  const limits = direction === -1 ? {min: 0, max: window} : {min: window, max: 0};
  const rampA = new Tone.LFO({frequency, type: 'sawtooth', ...limits}).connect(a.delayTime);
  const rampB = new Tone.LFO({frequency, type: 'sawtooth', phase: 180, ...limits}).connect(b.delayTime);
  const blend = new Tone.CrossFade(.5);
  const fade = new Tone.LFO({frequency, type: 'triangle', phase: 90, min: 0, max: 1}).connect(blend.fade);
  input.fan(a, b); a.connect(blend.a); b.connect(blend.b); blend.connect(output);
  const time = Tone.now(); rampA.start(time); rampB.start(time); fade.start(time);
  return {input, output, dispose() {[rampA, rampB, fade, a, b, blend, input, output].forEach(node => node.dispose());}};
}
