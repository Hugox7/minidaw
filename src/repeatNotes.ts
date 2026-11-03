import type {Note, Track} from './types';
export type MeasureCopyMode = 'next' | 'fill';
export function measureNotes(track: Track, bar: number): Note[] {
  const start = (bar - 1) * 16, end = bar * 16;
  return track.notes.filter(note => note.step < end && note.step + note.duration > start).map(note => {
    const from = Math.max(start, note.step), to = Math.min(end, note.step + note.duration);
    return {...note, step: from - start, duration: to - from};
  });
}
export function measureTargets(bar: number, bars: number, mode: MeasureCopyMode): number[] {
  return mode === 'next' ? [bar + 1] : Array.from({length: bars}, (_, index) => index + 1).filter(value => value !== bar);
}
export function hasMeasureContent(track: Track, targets: number[]) {
  return track.notes.some(note => targets.some(bar => note.step < bar * 16 && note.step + note.duration > (bar - 1) * 16));
}
export function copyMeasure(track: Track, bar: number, bars: number, mode: MeasureCopyMode, makeId: () => string): {notes: Note[]; repeatEndStep?: number; bars: number; error?: string} {
  const unchanged = {notes: track.notes, repeatEndStep: track.repeatEndStep, bars};
  if (track.kind === 'audio' || !Number.isInteger(bar) || !Number.isInteger(bars) || bar < 1 || bar > bars || bars < 1 || bars > 1024 || (mode !== 'next' && mode !== 'fill')) return {...unchanged, error: 'Choisis une mesure source valide.'};
  if (mode === 'next' && bar >= 1024) return {...unchanged, error: 'Le morceau a atteint la limite de 1024 mesures.'};
  const pattern = measureNotes(track, bar), targets = measureTargets(bar, bars, mode);
  if (!pattern.length) return {...unchanged, error: 'Cette mesure est vide : choisis une mesure qui contient des notes ou des coups.'};
  if (!targets.length) return {...unchanged, error: 'Le morceau ne contient qu’une mesure. Copie-la à la mesure suivante pour l’allonger.'};
  // Subtract replaced intervals, preserving notes (and their audible fragments) outside them.
  const intervals = mode === 'next' ? [{start: bar * 16, end: (bar + 1) * 16}] : [{start: 0, end: (bar - 1) * 16}, {start: bar * 16, end: bars * 16}].filter(range => range.end > range.start);
  const kept: Note[] = [];
  for (const note of track.notes) {
    let fragments = [{from: note.step, to: note.step + note.duration}];
    for (const {start, end} of intervals) {
      fragments = fragments.flatMap(fragment => {
        if (fragment.to <= start || fragment.from >= end) return [fragment];
        return [...(fragment.from < start ? [{from: fragment.from, to: start}] : []), ...(fragment.to > end ? [{from: end, to: fragment.to}] : [])];
      });
    }
    fragments.forEach((fragment, index) => kept.push({...note, id: index === 0 ? note.id : makeId(), step: fragment.from, duration: fragment.to - fragment.from}));
  }
  if (kept.length + targets.length * pattern.length > 100000) return {...unchanged, error: 'Cette copie dépasserait la limite de 100 000 notes sur une piste.'};
  const copies = targets.flatMap(target => pattern.map(note => ({...note, id: makeId(), step: (target - 1) * 16 + note.step})));
  return {notes: [...kept, ...copies].sort((a, b) => a.step - b.step || a.midi - b.midi), repeatEndStep: undefined, bars: Math.max(bars, bar + (mode === 'next' ? 1 : 0))};
}
