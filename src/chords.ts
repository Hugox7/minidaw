import type {Note} from './types';

export const CHORDS = {
  major: {label: 'Majeur', symbol: '', intervals: [0, 4, 7], help: 'Fondamentale, tierce majeure, quinte'},
  minor: {label: 'Mineur', symbol: 'm', intervals: [0, 3, 7], help: 'Fondamentale, tierce mineure, quinte'},
  dominant7: {label: '7 · septième de dominante', symbol: '7', intervals: [0, 4, 7, 10], help: 'Accord majeur + septième mineure'},
  major7: {label: 'Maj7 · septième majeure', symbol: 'maj7', intervals: [0, 4, 7, 11], help: 'Accord majeur + septième majeure'},
  minor7: {label: 'm7 · septième mineure', symbol: 'm7', intervals: [0, 3, 7, 10], help: 'Accord mineur + septième mineure'},
  sus2: {label: 'Sus2', symbol: 'sus2', intervals: [0, 2, 7], help: 'La seconde remplace la tierce'},
  sus4: {label: 'Sus4', symbol: 'sus4', intervals: [0, 5, 7], help: 'La quarte remplace la tierce'},
  diminished: {label: 'Diminué', symbol: 'dim', intervals: [0, 3, 6], help: 'Fondamentale, tierce mineure, quinte diminuée'},
} as const;
export type ChordKind = keyof typeof CHORDS;
export const PITCH_NAMES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
export const midiName = (midi: number) => `${PITCH_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
export function chordPitches(root: number, octave: number, kind: ChordKind): number[] {
  return CHORDS[kind].intervals.map(interval => (octave + 1) * 12 + root + interval);
}
// Plan the complete insertion first: conflicts reject the whole chord.
export function planChord(existing: Note[], pitches: number[], step: number, duration: number, steps: number): {duration: number; error?: string} {
  if (!Number.isInteger(step) || step < 0 || step >= steps || !Number.isInteger(duration) || duration < 1 || pitches.length === 0 || pitches.some(p => !Number.isInteger(p) || p < 48 || p > 84)) {
    return {duration: 0, error: 'Cet accord dépasse la grille disponible.'};
  }
  const actualDuration = Math.min(duration, steps - step);
  const conflict = existing.some(n => pitches.includes(n.midi) && n.step < step + actualDuration && n.step + n.duration > step);
  return conflict ? {duration: actualDuration, error: 'Une note occupe déjà cet emplacement. Déplace ou efface cette note avant de poser l’accord.'} : {duration: actualDuration};
}
