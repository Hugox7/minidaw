import type {Note} from './types';
export function measureHasNotes(notes: Note[], bar: number) {
  return notes.some(note => note.step < bar * 16 && note.step + note.duration > (bar - 1) * 16);
}
/** Empty exactly this musical interval, retaining the portions outside it. */
export function eraseMeasure(notes: Note[], bar: number, makeId: () => string): Note[] {
  if (!Number.isInteger(bar) || bar < 1 || bar > 1024) return notes;
  const start = (bar - 1) * 16, end = bar * 16;
  return notes.flatMap(note => {
    if (note.step >= end || note.step + note.duration <= start) return [note];
    const left = note.step < start ? [{...note, duration: start - note.step}] : [];
    const right = note.step + note.duration > end ? [{...note, id: left.length ? makeId() : note.id, step: end, duration: note.step + note.duration - end}] : [];
    return [...left, ...right];
  });
}
