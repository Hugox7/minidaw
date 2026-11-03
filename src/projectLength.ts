import type {Project} from './types';

/** Whole bars occupied by clips/notes inside the current arrangement.
 * Never analyzes recorded samples or removes gaps within the song.
 */
export function contentBars(project: Project, audibleOnly = false): number {
  const secondsPerBar = 240 / project.bpm;
  const limit = project.bars * secondsPerBar;
  let end = 0;
  for (const track of project.tracks) {
    if (audibleOnly && track.muted) continue;
    if (track.kind === 'audio') {
      for (const clip of track.clips ?? []) {
        if (clip.startSeconds < limit && clip.duration > 0)
          end = Math.max(end, Math.min(limit, clip.startSeconds + clip.duration));
      }
    } else {
      for (const note of track.notes) {
        const start = note.step / 16 * secondsPerBar;
        if (start < limit && note.duration > 0)
          end = Math.max(end, Math.min(limit, (note.step + note.duration) / 16 * secondsPerBar));
      }
    }
  }
  // Tolerate floating point error at exact bar boundaries.
  return Math.max(1, Math.min(project.bars, Math.ceil(end / secondsPerBar - 1e-9)));
}
