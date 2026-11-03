import type {SynthOptions} from 'tone';
import {SAMPLED_INSTRUMENTS} from './sampledInstruments';

// Each preset controls both the oscillator and the way the note evolves.
// All presets are synthesized locally: no sample downloads are needed.
export const SYNTH_INSTRUMENTS = {
  soft: {
    name: 'Synthé doux', description: 'Le son triangle des premières versions, rond et simple.', trimDb: 0,
    options: {oscillator: {type: 'triangle'}, envelope: {attack: .015, decay: .12, sustain: .35, release: .3}},
  },
  keys: {
    name: 'Clavier FM', description: 'Une attaque brillante et une décroissance douce pour les accords.', trimDb: -5,
    options: {oscillator: {type: 'fmsine', harmonicity: 2, modulationIndex: 1.5, modulationType: 'sine'}, envelope: {attack: .008, decay: 1.1, sustain: .12, release: .65}},
  },
  bass: {
    name: 'Basse synthé', description: 'Un grave rond avec une attaque courte. Essaie les notes autour du Do3.', trimDb: -3,
    options: {oscillator: {type: 'triangle8'}, envelope: {attack: .005, decay: .2, sustain: .55, release: .12}},
  },
  pad: {
    name: 'Nappe', description: 'Un son ample qui monte progressivement, idéal pour les accords tenus.', trimDb: -8,
    options: {oscillator: {type: 'fattriangle', count: 3, spread: 18}, envelope: {attack: .45, decay: .5, sustain: .65, release: 1.2}},
  },
  pluck: {
    name: 'Pluck', description: 'Un son pincé qui décroît rapidement, même sur une note longue.', trimDb: -4,
    options: {oscillator: {type: 'sawtooth6'}, envelope: {attack: .003, decay: .4, sustain: 0, release: .16}},
  },
  lead: {
    name: 'Lead rétro', description: 'Un son carré et présent pour les mélodies.', trimDb: -10,
    options: {oscillator: {type: 'square6'}, envelope: {attack: .012, decay: .15, sustain: .45, release: .22}},
  },
} as const satisfies Record<string, {name: string; description: string; trimDb: number; options: {oscillator: Partial<SynthOptions['oscillator']>; envelope: Partial<SynthOptions['envelope']>}}>;
export const INSTRUMENTS = {...SYNTH_INSTRUMENTS, ...SAMPLED_INSTRUMENTS};
export type InstrumentId = keyof typeof INSTRUMENTS;
export const DEFAULT_INSTRUMENT: InstrumentId = 'soft';
export function normalizeInstrument(value: unknown): InstrumentId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(INSTRUMENTS, value) ? value as InstrumentId : DEFAULT_INSTRUMENT;
}
