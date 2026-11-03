import type {Note} from './types';

export const DRUMS = [
  {midi: 36, name: 'Grosse caisse', short: 'Kick'},
  {midi: 38, name: 'Caisse claire', short: 'Snare'},
  {midi: 39, name: 'Clap', short: 'Clap'},
  {midi: 42, name: 'Charley fermé', short: 'HH fermé'},
  {midi: 46, name: 'Charley ouvert', short: 'HH ouvert'},
  {midi: 49, name: 'Cymbale crash', short: 'Crash'},
] as const;
export const RHYTHM_CATEGORIES = ['Rock & pop', 'Funk & disco', 'Électronique', 'Hip-hop', 'Reggae & ska', 'Breakbeats', 'Transitions'] as const;
type Rhythm = {name: string; category: typeof RHYTHM_CATEGORIES[number]; description: string; bpm: readonly [number, number]; hits: Partial<Record<number, readonly number[]>>; velocities?: Partial<Record<number, Readonly<Record<number, number>>>>};
const eighths = [0, 2, 4, 6, 8, 10, 12, 14] as const;
const sixteenths = Array.from({length: 16}, (_, i) => i);
export const RHYTHMS = {
  rock: {name: 'Rock simple', category: 'Rock & pop', description: 'Grosse caisse sur 1 et 3, caisse claire sur 2 et 4, charley en croches.', bpm: [80, 140], hits: {36: [0, 8], 38: [4, 12], 42: eighths}},
  rockDrive: {name: 'Rock soutenu', category: 'Rock & pop', description: 'Davantage de grosse caisse pour soutenir les riffs de basse et de guitare.', bpm: [100, 160], hits: {36: [0, 6, 8, 10], 38: [4, 12], 42: eighths}},
  rockOpen: {name: 'Rock · charley ouvert', category: 'Rock & pop', description: 'Un groove rock avec une ouverture de charley en fin de mesure.', bpm: [90, 145], hits: {36: [0, 8, 10], 38: [4, 12], 42: [0, 2, 4, 6, 8, 10, 12], 46: [14]}},
  pop: {name: 'Pop entraînante', category: 'Rock & pop', description: 'Une relance de grosse caisse avant le troisième temps.', bpm: [95, 135], hits: {36: [0, 7, 8, 10], 38: [4, 12], 42: eighths}},
  ballad: {name: 'Ballade légère', category: 'Rock & pop', description: 'Charley à la noire et attaques adoucies pour laisser de la place.', bpm: [60, 95], hits: {36: [0, 10], 38: [4, 12], 42: [0, 4, 8, 12]}, velocities: {36: {0: .65, 10: .55}, 38: {4: .55, 12: .6}, 42: {0: .4, 4: .35, 8: .4, 12: .35}}},
  funk: {name: 'Funk · notes fantômes', category: 'Funk & disco', description: 'Grosse caisse syncopée et petits coups de caisse claire entre les accents.', bpm: [85, 115], hits: {36: [0, 6, 10], 38: [4, 7, 12, 15], 42: eighths}, velocities: {38: {4: .8, 7: .25, 12: .85, 15: .3}}},
  funkBusy: {name: 'Funk syncopé', category: 'Funk & disco', description: 'Un motif plus chargé pour travailler les placements de basse.', bpm: [90, 120], hits: {36: [0, 3, 6, 8, 11, 14], 38: [4, 12, 15], 42: sixteenths}, velocities: {38: {4: .8, 12: .85, 15: .25}, 42: {1: .25, 3: .3, 5: .25, 7: .3, 9: .25, 11: .3, 13: .25, 15: .3}}},
  disco: {name: 'Disco', category: 'Funk & disco', description: 'Grosse caisse sur chaque temps et charley ouvert sur les contretemps.', bpm: [105, 130], hits: {36: [0, 4, 8, 12], 38: [4, 12], 42: [0, 4, 8, 12], 46: [2, 6, 10, 14]}},
  dance: {name: 'Dance', category: 'Électronique', description: 'Une pulsation régulière, clap sur 2 et 4 et ouverture finale.', bpm: [115, 135], hits: {36: [0, 4, 8, 12], 39: [4, 12], 42: [2, 6, 10], 46: [14]}},
  house: {name: 'House', category: 'Électronique', description: 'Pied régulier, clap et charley ouvert à chaque contretemps.', bpm: [118, 128], hits: {36: [0, 4, 8, 12], 39: [4, 12], 42: [0, 4, 8, 12], 46: [2, 6, 10, 14]}},
  electro: {name: 'Électro dynamique', category: 'Électronique', description: 'Une grosse caisse supplémentaire et une courte ouverture avant la reprise.', bpm: [110, 135], hits: {36: [0, 4, 6, 8, 12], 39: [4, 12], 42: eighths, 46: [15]}},
  hiphop: {name: 'Hip-hop droit', category: 'Hip-hop', description: 'Un beat posé en croches droites, avec des charleys discrets.', bpm: [75, 100], hits: {36: [0, 6, 10], 38: [4, 12], 42: eighths}, velocities: {42: {0: .5, 2: .3, 4: .45, 6: .3, 8: .5, 10: .3, 12: .45, 14: .3}}},
  halftime: {name: 'Mi-temps', category: 'Hip-hop', description: 'Caisse claire sur le troisième temps pour une sensation plus lente.', bpm: [80, 150], hits: {36: [0, 6, 10], 38: [8], 42: eighths}},
  trap: {name: 'Trap · doubles croches', category: 'Hip-hop', description: 'Caisse claire en mi-temps et charley en doubles croches, sans triolets.', bpm: [120, 160], hits: {36: [0, 7, 10, 14], 38: [8], 39: [8], 42: sixteenths}, velocities: {39: {8: .45}, 42: {1: .25, 3: .3, 5: .25, 7: .3, 9: .25, 11: .3, 13: .25, 15: .35}}},
  oneDrop: {name: 'Reggae · one drop', category: 'Reggae & ska', description: 'Premier temps sans grosse caisse ; grosse caisse et caisse claire sur le troisième.', bpm: [65, 95], hits: {36: [8], 38: [8], 42: [0, 2, 4, 6, 8, 10, 12], 46: [14]}, velocities: {38: {8: .6}, 46: {14: .5}}},
  reggae: {name: 'Reggae · contretemps', category: 'Reggae & ska', description: 'Un accompagnement simple avec charleys sur les contretemps.', bpm: [70, 105], hits: {36: [0, 8], 38: [4, 12], 42: [2, 6, 10, 14]}, velocities: {38: {4: .6, 12: .65}}},
  ska: {name: 'Ska rapide', category: 'Reggae & ska', description: 'Grosse caisse sur chaque temps et charley à contretemps, à jouer plus vite.', bpm: [130, 175], hits: {36: [0, 4, 8, 12], 38: [4, 12], 42: [2, 6, 10, 14]}},
  drumAndBass: {name: 'Drum & bass', category: 'Breakbeats', description: 'Pied décalé et caisse claire nerveuse ; le tempo apporte la vitesse.', bpm: [160, 180], hits: {36: [0, 10], 38: [4, 12, 15], 42: eighths}, velocities: {38: {4: .85, 12: .9, 15: .25}}},
  breakbeat: {name: 'Breakbeat syncopé', category: 'Breakbeats', description: 'Un motif cassé avec une note fantôme et une ouverture entre les temps.', bpm: [100, 140], hits: {36: [0, 6, 9], 38: [4, 12, 15], 42: [0, 2, 6, 8, 10, 14], 46: [7]}, velocities: {38: {4: .8, 12: .85, 15: .3}, 46: {7: .5}}},
  fillShort: {name: 'Relance · dernier temps', category: 'Transitions', description: 'Un groove rock qui termine par quatre coups de caisse claire.', bpm: [80, 145], hits: {36: [0, 8], 38: [4, 12, 13, 14, 15], 42: [0, 2, 4, 6, 8, 10]}, velocities: {38: {4: .8, 12: .5, 13: .6, 14: .7, 15: .85}}},
  fillBuild: {name: 'Relance · montée', category: 'Transitions', description: 'Une montée de caisse claire sur la seconde moitié de la mesure.', bpm: [80, 140], hits: {36: [0, 4], 38: [8, 10, 12, 13, 14, 15], 42: [0, 2, 4, 6]}, velocities: {38: {8: .35, 10: .45, 12: .55, 13: .65, 14: .75, 15: .9}}},
} as const satisfies Record<string, Rhythm>;
export type RhythmId = keyof typeof RHYTHMS;
export function addRhythm(existing: Note[], rhythm: RhythmId, bars: number, target: 'all' | number): Note[] {
  const pattern: Rhythm = RHYTHMS[rhythm];
  const notes = [...existing];
  const occupied = new Set(existing.map(n => `${n.midi}:${n.step}`));
  const measures = target === 'all' ? Array.from({length: bars}, (_, i) => i) : [target];
  for (const measure of measures) {
    if (!Number.isInteger(measure) || measure < 0 || measure >= bars) continue;
    for (const [pitch, offsets] of Object.entries(pattern.hits)) for (const offset of offsets ?? []) {
      const midi = Number(pitch), step = measure * 16 + offset;
      const key = `${midi}:${step}`;
      if (occupied.has(key)) continue;
      occupied.add(key);
      notes.push({id: crypto.randomUUID(), midi, step, duration: 1, velocity: pattern.velocities?.[midi]?.[offset] ?? (midi === 42 ? (offset % 4 === 0 ? .65 : .45) : .8)});
    }
  }
  return notes;
}
