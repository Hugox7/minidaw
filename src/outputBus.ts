import * as Tone from 'tone';
import {normalizeVolume} from './volumeSettings';
export {normalizeVolume} from './volumeSettings';
let output: {volume: Tone.Volume; analyser: Tone.Analyser} | undefined;
let volumeDb = 0;
export function getOutputBus() {
  if (!output) {
    const volume = new Tone.Volume(volumeDb);
    const analyser = new Tone.Analyser({type: 'waveform', size: 8192, channels: 2});
    volume.chain(analyser, Tone.getDestination()); output = {volume, analyser};
  }
  return output.volume;
}
export function setMasterVolume(value: number) {volumeDb = normalizeVolume(value); output?.volume.volume.rampTo(volumeDb, .02);}
export function analyserPeaks(analyser?: Tone.Analyser): number[] {
  if (!analyser) return [0, 0];
  const data = analyser.getValue();
  const channels = Array.isArray(data) ? data : [data];
  return channels.map(channel => {let peak = 0; for (const sample of channel) peak = Math.max(peak, Math.abs(sample)); return peak;});
}
export const getMasterPeaks = () => analyserPeaks(output?.analyser);
export function disposeOutputBus() {output?.volume.dispose(); output?.analyser.dispose(); output = undefined;}
