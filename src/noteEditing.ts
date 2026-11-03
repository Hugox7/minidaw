import {MIN_MIDI, MAX_MIDI, PIANO_ROWS} from './pianoRange';
import type {Note} from './types';
type Cell = {step: number; midi: number};
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function cellAt(x: number, y: number, steps: number): Cell {
  return {step: clamp(Math.floor(x / 25), 0, steps - 1), midi: MAX_MIDI - clamp(Math.floor(y / 22), 0, PIANO_ROWS - 1)};
}
// Interpolate fast pointer movements so that painting never skips cells.
export function cellsBetween(a: Cell, b: Cell): Cell[] {
  const distance = Math.max(Math.abs(b.step - a.step), Math.abs(b.midi - a.midi));
  if (!distance) return [b];
  return Array.from({length: distance + 1}, (_, i) => ({step: Math.round(a.step + (b.step - a.step) * i / distance), midi: Math.round(a.midi + (b.midi - a.midi) * i / distance)}));
}
export function moveNote(note: Note, deltaStep: number, deltaMidi: number, steps: number): Note {
  const duration = Math.min(note.duration, steps);
  return {...note, duration, step: clamp(note.step + deltaStep, 0, steps - duration), midi: clamp(note.midi + deltaMidi, MIN_MIDI, MAX_MIDI)};
}
export function resizeNote(note: Note, delta: number, steps: number): Note {
  return {...note, duration: clamp(note.duration + delta, 1, steps - note.step)};
}
