// YIN difference function and cumulative mean normalization (de Cheveigné & Kawahara, 2002).
export type Pitch = {frequency: number; confidence: number};
export function detectPitch(input: Float32Array, sampleRate: number): Pitch | null {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || input.length < 256) return null;
  const stride = Math.max(1, Math.round(sampleRate / 12000)), rate = sampleRate / stride;
  const size = Math.min(2048, Math.floor(input.length / stride)), data = new Float32Array(size);
  const origin = input.length - size * stride; let mean = 0;
  for (let i = 0; i < size; i++) {let sum = 0; for (let j = 0; j < stride; j++) sum += input[origin + i * stride + j]; data[i] = sum / stride; mean += data[i];}
  mean /= size; let energy = 0;
  for (let i = 0; i < size; i++) {data[i] -= mean; energy += data[i] * data[i];}
  if (!Number.isFinite(energy) || Math.sqrt(energy / size) < .002) return null;
  const window = Math.floor(size / 2), maxLag = Math.min(Math.ceil(rate / 28) + 1, size - window - 1), minLag = Math.max(2, Math.floor(rate / 1400));
  const difference = new Float32Array(maxLag + 1); let total = 0;
  difference[0] = 1;
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0; for (let i = 0; i < window; i++) {const delta = data[i] - data[i + lag]; sum += delta * delta;}
    total += sum; difference[lag] = total > 0 ? sum * lag / total : 1;
  }
  for (let lag = minLag; lag < maxLag; lag++) if (difference[lag] < .15) {
    while (lag + 1 < maxLag && difference[lag + 1] < difference[lag]) lag++;
    const left = difference[lag - 1], mid = difference[lag], right = difference[lag + 1], denominator = left - 2 * mid + right;
    const offset = denominator ? Math.max(-1, Math.min(1, .5 * (left - right) / denominator)) : 0;
    let frequency = rate / (lag + offset);
    // Refine at the original sample rate: decimation alone is too coarse for upper notes.
    const fullLag = Math.round(sampleRate / frequency), length = Math.min(4096, input.length - fullLag - 2);
    if (fullLag > 1 && length >= 128) {
      const start = input.length - length - fullLag - 1;
      const rawDifference = (shift: number) => {let sum = 0; for (let i = start; i < start + length; i++) {const delta = input[i] - input[i + shift]; sum += delta * delta;} return sum;};
      const a = rawDifference(fullLag - 1), b = rawDifference(fullLag), c = rawDifference(fullLag + 1), divisor = a - 2 * b + c;
      if (divisor > 0) frequency = sampleRate / (fullLag + Math.max(-1, Math.min(1, .5 * (a - c) / divisor)));
    }
    return frequency >= 28 && frequency <= 1400 ? {frequency, confidence: 1 - mid} : null;
  }
  return null;
}
const NAMES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
const LETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export function pitchNote(frequency: number) {
  const value = 69 + 12 * Math.log2(frequency / 440), midi = Math.round(value), index = ((midi % 12) + 12) % 12;
  return {midi, name: NAMES[index], letter: LETTERS[index], octave: Math.floor(midi / 12) - 1, cents: (value - midi) * 100, frequency};
}
/** Require three consistent readings; median smoothing rejects isolated octave jumps. */
export class PitchSmoother {
  private values: number[] = [];
  reset() {this.values = [];}
  push(frequency: number) {
    if (!Number.isFinite(frequency) || frequency <= 0) {this.reset(); return null;}
    const value = 69 + 12 * Math.log2(frequency / 440);
    if (this.values.length && Math.abs(value - this.values[this.values.length - 1]) > .4) this.values = [];
    this.values.push(value); this.values = this.values.slice(-5);
    if (this.values.length < 3) return null;
    const sorted = [...this.values].sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)];
    return pitchNote(440 * 2 ** ((median - 69) / 12));
  }
}
