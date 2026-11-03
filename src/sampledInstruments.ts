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
  acousticPiano: {
    name: 'Piano acoustique · enregistré', description: 'Un piano acoustique enregistré, pour les accords et les mélodies. Essaie Do2 à Do7.',
    folder: 'piano', trimDb: -8, attack: .003, release: .8,
    samples: {A1:'A1.mp3', C2:'C2.mp3', 'D#2':'Ds2.mp3', 'F#2':'Fs2.mp3', A2:'A2.mp3', C3:'C3.mp3', 'D#3':'Ds3.mp3', 'F#3':'Fs3.mp3', A3:'A3.mp3', C4:'C4.mp3', 'D#4':'Ds4.mp3', 'F#4':'Fs4.mp3', A4:'A4.mp3', C5:'C5.mp3', 'D#5':'Ds5.mp3', 'F#5':'Fs5.mp3', A5:'A5.mp3', C6:'C6.mp3', 'D#6':'Ds6.mp3', 'F#6':'Fs6.mp3', A6:'A6.mp3', C7:'C7.mp3'},
  },
  violin: {
    name: 'Violon · archet', description: 'Un violon enregistré à l’archet. Tiens les notes pour les mélodies et les accords ; registre conseillé : Sol3 à Mi6.',
    folder: 'violin', trimDb: -7, attack: .035, release: .3, sustain: true,
    samples: {A3:'A3.wav', C4:'C4.wav', E4:'E4.wav', G4:'G4.wav', A4:'A4.wav', C5:'C5.wav', E5:'E5.wav', G5:'G5.wav', A5:'A5.wav', C6:'C6.wav', E6:'E6.wav', G6:'G6.wav', A6:'A6.wav'},
  },
  cello: {
    name: 'Violoncelle · archet', description: 'Des cordes graves et chaleureuses à l’archet. Registre conseillé : Do2 à Do5. Les notes longues sont tenues.',
    folder: 'cello', trimDb: -13, attack: .04, release: .35, sustain: true,
    samples: {C2:'C2.wav', 'D#2':'Ds2.wav', G2:'G2.wav', 'A#2':'As2.wav', C3:'C3.wav', 'D#3':'Ds3.wav', 'F#3':'Fs3.wav', G3:'G3.wav', 'A#3':'As3.wav', C4:'C4.wav', 'D#4':'Ds4.wav', G4:'G4.wav', C5:'C5.wav'},
  },
  contrabassPizz: {
    name: 'Contrebasse · pizzicato', description: 'Une vraie contrebasse pincée aux doigts, pour les lignes jazz et les basses acoustiques. Essaie Mi1 à Sol3.',
    folder: 'contrabass-pizz', trimDb: -5, attack: .003, release: .25,
    samples: {E1:'E1.mp3', 'F#1':'Fs1.mp3', G1:'G1.mp3', 'A#1':'As1.mp3', C2:'C2.mp3', D2:'D2.mp3', E2:'E2.mp3', 'F#2':'Fs2.mp3', 'G#2':'Gs2.mp3', A2:'A2.mp3', 'C#3':'Cs3.mp3', E3:'E3.mp3', 'G#3':'Gs3.mp3', B3:'B3.mp3'},
  },
  contrabassArco: {
    name: 'Contrebasse · archet', description: 'Une contrebasse jouée à l’archet, ample et tenue pour les notes longues. Essaie Mi1 à Sol3.',
    folder: 'contrabass-arco', trimDb: -10, attack: .06, release: .4, sustain: true,
    samples: {'F#1':'Fs1.wav', G1:'G1.wav', 'A#1':'As1.wav', C2:'C2.wav', D2:'D2.wav', E2:'E2.wav', 'F#2':'Fs2.wav', 'G#2':'Gs2.wav', A2:'A2.wav', 'C#3':'Cs3.wav', E3:'E3.wav', 'G#3':'Gs3.wav', B3:'B3.wav'},
  },
} as const;
export type SampledInstrumentId = keyof typeof SAMPLED_INSTRUMENTS;
export function isSampledInstrument(value: string): value is SampledInstrumentId {
  return Object.prototype.hasOwnProperty.call(SAMPLED_INSTRUMENTS, value);
}
