export const SAMPLED_INSTRUMENTS = {
  electricBass: {
    name: 'Basse électrique · enregistrée', description: 'Des notes de basse électrique enregistrées. Essaie Mi1 à Sol3 pour retrouver le registre grave.',
    folder: 'bass-electric', trimDb: -4, attack: .003, release: .18,
    samples: {'C#1':'Cs1.mp3', E1:'E1.mp3', G1:'G1.mp3', 'A#1':'As1.mp3', 'C#2':'Cs2.mp3', E2:'E2.mp3', G2:'G2.mp3', 'A#2':'As2.mp3', 'C#3':'Cs3.mp3', E3:'E3.mp3', G3:'G3.mp3', 'A#3':'As3.mp3', 'C#4':'Cs4.mp3', E4:'E4.mp3', G4:'G4.mp3', 'A#4':'As4.mp3'},
  },
  acousticGuitar: {
    name: 'Guitare acoustique · enregistrée', description: 'Des cordes pincées enregistrées. Les accords jouent leurs notes ensemble ; le jeu gratté viendra ensuite.',
    folder: 'guitar-acoustic', trimDb: -8, attack: .003, release: .5,
    samples: {E2:'E2.mp3', A2:'A2.mp3', C3:'C3.mp3', E3:'E3.mp3', G3:'G3.mp3', A3:'A3.mp3', C4:'C4.mp3', E4:'E4.mp3', G4:'G4.mp3', C5:'C5.mp3'},
  },
  trumpet: {
    name: 'Trompette · enregistrée', description: 'Un cuivre enregistré, pour les mélodies ou les accords. Commence autour du Do4.',
    folder: 'trumpet', trimDb: -10, attack: .01, release: .18,
    samples: {F3:'F3.mp3', A3:'A3.mp3', C4:'C4.mp3', 'D#4':'Ds4.mp3', F4:'F4.mp3', G4:'G4.mp3', 'A#4':'As4.mp3', D5:'D5.mp3', F5:'F5.mp3', A5:'A5.mp3', C6:'C6.mp3'},
  },
  trombone: {
    name: 'Trombone · enregistré', description: 'Un cuivre plus grave et rond, à essayer autour du Do3.',
    folder: 'trombone', trimDb: -8, attack: .012, release: .2,
    samples: {'A#1':'As1.mp3', 'C#2':'Cs2.mp3', 'D#2':'Ds2.mp3', F2:'F2.mp3', 'G#2':'Gs2.mp3', 'A#2':'As2.mp3', C3:'C3.mp3', D3:'D3.mp3', 'D#3':'Ds3.mp3', F3:'F3.mp3', 'G#3':'Gs3.mp3', 'A#3':'As3.mp3', C4:'C4.mp3', 'C#4':'Cs4.mp3', D4:'D4.mp3', 'D#4':'Ds4.mp3', F4:'F4.mp3'},
  },
} as const;
export type SampledInstrumentId = keyof typeof SAMPLED_INSTRUMENTS;
export function isSampledInstrument(value: string): value is SampledInstrumentId {
  return Object.prototype.hasOwnProperty.call(SAMPLED_INSTRUMENTS, value);
}
