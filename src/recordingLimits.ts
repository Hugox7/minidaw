export const MAX_RECORDING_SECONDS = 300;
export const MAX_RECORDING_BYTES = 64 * 1024 * 1024;
/** Whole-bar ceiling keeps recordings within both project assets and WAV export limits. */
export function recordingLimitSeconds(sampleRate: number, bpm: number) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || !Number.isFinite(bpm) || bpm < 40 || bpm > 240) throw new Error('Configuration audio invalide pour enregistrer.');
  const bar = 4 * 60 / bpm, limit = Math.min(MAX_RECORDING_SECONDS, (MAX_RECORDING_BYTES - 44) / (4 * sampleRate));
  return Math.floor((limit + 1e-9) / bar) * bar;
}
export function recordingBarsAtStep(step: number) {return Math.max(1, Math.min(1024, Math.floor(step / 16) + 1));}
/** Frame rounding may put an exact musical endpoint a fraction of a sample past a bar. */
export function snapRecordedDuration(duration: number, bpm: number, sampleRate: number) {
  const bar = 240 / bpm, boundary = Math.round(duration / bar) * bar;
  return boundary > 0 && duration >= boundary && duration - boundary <= 1 / sampleRate + 1e-9 ? boundary : duration;
}

export function barsForDuration(seconds: number, bpm: number) {return Math.max(1, Math.ceil(seconds / (240 / bpm) - 1e-9));}
