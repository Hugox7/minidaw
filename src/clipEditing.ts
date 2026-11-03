import type {AudioClip} from './types';
export const MIN_CLIP_SECONDS = .05;
const finite = (n: number | undefined, fallback: number) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
const round = (n: number) => Math.round(n * 1000000) / 1000000;
export function normalizeClip(clip: AudioClip): AudioClip {
  const duration = Math.max(MIN_CLIP_SECONDS, finite(clip.duration, MIN_CLIP_SECONDS));
  const offset = Math.max(0, finite(clip.sourceOffset, 0));
  const sourceDuration = Math.max(duration + offset, finite(clip.sourceDuration, duration + offset));
  return {...clip, startSeconds: Math.max(0, finite(clip.startSeconds, 0)), duration, sourceOffset: offset, sourceDuration};
}
export function editClip(original: AudioClip, mode: 'move' | 'left' | 'right', delta: number, bpm: number, snap: boolean): AudioClip {
  const clip = normalizeClip(original), step = 60 / bpm;
  const align = (time: number) => snap ? Math.round(time / step) * step : time;
  if (mode === 'move') return {...clip, startSeconds: round(Math.max(0, align(clip.startSeconds + delta)))};
  if (mode === 'left') {
    const change = Math.max(-Math.min(clip.sourceOffset!, clip.startSeconds), Math.min(clip.duration - MIN_CLIP_SECONDS, align(clip.startSeconds + delta) - clip.startSeconds));
    return {...clip, startSeconds: round(clip.startSeconds + change), sourceOffset: round(clip.sourceOffset! + change), duration: round(clip.duration - change)};
  }
  const end = Math.max(clip.startSeconds + MIN_CLIP_SECONDS, Math.min(clip.startSeconds + clip.sourceDuration! - clip.sourceOffset!, align(clip.startSeconds + clip.duration + delta)));
  return {...clip, duration: round(end - clip.startSeconds)};
}
export function duplicateClip(original: AudioClip, bpm: number, snap: boolean, id: string, afterSeconds = 0): AudioClip {
  const clip = normalizeClip(original), end = Math.max(clip.startSeconds + clip.duration, afterSeconds), step = 60 / bpm;
  return {...clip, id, startSeconds: round(snap ? Math.ceil(end / step - 1e-8) * step : end)};
}
export function visiblePeaks(original: AudioClip): number[] {
  const clip = normalizeClip(original), peaks = clip.peaks;
  if (!peaks.length) return [];
  return Array.from({length: 128}, (_, i) => {
    const from = Math.floor((clip.sourceOffset! + i / 128 * clip.duration) / clip.sourceDuration! * peaks.length);
    const to = Math.ceil((clip.sourceOffset! + (i + 1) / 128 * clip.duration) / clip.sourceDuration! * peaks.length);
    let peak = 0; for (let j = from; j < Math.max(from + 1, to); j++) peak = Math.max(peak, peaks[Math.min(peaks.length - 1, j)] ?? 0);
    return peak;
  });
}
