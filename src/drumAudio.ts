import * as Tone from 'tone';

// A synthesized kit: pitched membrane for the kick, shaped noise for the rest.
export function createDrumKit(output: Tone.ToneAudioNode) {
  const kick = new Tone.MembraneSynth({pitchDecay: .045, octaves: 5, envelope: {attack: .001, decay: .32, sustain: 0, release: .1}, volume: -4}).connect(output);
  const snareFilter = new Tone.Filter(1200, 'highpass').connect(output);
  const snare = new Tone.NoiseSynth({noise: {type: 'white'}, envelope: {attack: .001, decay: .16, sustain: 0, release: .04}, volume: -9}).connect(snareFilter);
  const snareBody = new Tone.MembraneSynth({pitchDecay: .015, octaves: .5, envelope: {attack: .001, decay: .1, sustain: 0, release: .03}, volume: -16}).connect(output);
  const clapFilter = new Tone.Filter(1400, 'bandpass', -12).connect(output);
  const clap = new Tone.NoiseSynth({noise: {type: 'white'}, envelope: {attack: .003, decay: .12, sustain: 0, release: .03}, volume: -4}).connect(clapFilter);
  const hatFilter = new Tone.Filter(7000, 'highpass').connect(output);
  const closed = new Tone.NoiseSynth({noise: {type: 'white'}, envelope: {attack: .001, decay: .035, sustain: 0, release: .015}, volume: -13}).connect(hatFilter);
  const open = new Tone.NoiseSynth({noise: {type: 'white'}, envelope: {attack: .001, decay: .28, sustain: 0, release: .06}, volume: -14}).connect(hatFilter);
  const crashFilter = new Tone.Filter(4500, 'highpass').connect(output);
  const crash = new Tone.NoiseSynth({noise: {type: 'white'}, envelope: {attack: .002, decay: .85, sustain: 0, release: .15}, volume: -13}).connect(crashFilter);
  return {
    trigger(midi: number, _duration: number, time: number, velocity: number) {
      switch (midi) {
        case 36: kick.triggerAttackRelease('C1', .08, time, velocity); break;
        case 38: snare.triggerAttackRelease(.06, time, velocity); snareBody.triggerAttackRelease('D3', .045, time, velocity); break;
        case 39: clap.triggerAttackRelease(.06, time, velocity); break;
        case 42: open.triggerRelease(time); closed.triggerAttackRelease(.025, time, velocity); break;
        case 46: open.triggerAttackRelease(.22, time, velocity); break;
        case 49: crash.triggerAttackRelease(.6, time, velocity); break;
      }
    },
    releaseAll() {const now = Tone.now(); [kick, snareBody].forEach(s => s.triggerRelease(now)); [snare, clap, closed, open, crash].forEach(s => s.triggerRelease(now));},
    dispose() {[kick, snare, snareBody, clap, closed, open, crash, snareFilter, clapFilter, hatFilter, crashFilter].forEach(node => node.dispose());},
  };
}
