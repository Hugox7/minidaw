export type AudioSource = 'bass' | 'electricGuitar' | 'voice' | 'other';
export type AmpSettings = {enabled: boolean; character: 'clean' | 'warm' | 'rock'; drive: number; tone: number; level: number; cabinet?: boolean};
export const AUDIO_SOURCES: Record<AudioSource, string> = {bass: 'Basse', electricGuitar: 'Guitare électrique', voice: 'Voix', other: 'Autre'};
export const AMP_CHARACTERS = {clean: 'Clair', warm: 'Chaleureux', rock: 'Rock'} as const;
export const normalizeSource = (value: unknown): AudioSource => value === 'bass' || value === 'electricGuitar' || value === 'voice' ? value : 'other';
const clamp = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export function normalizeAmp(value?: Partial<AmpSettings>): AmpSettings {
  return {enabled: value?.enabled === true, character: value?.character === 'warm' || value?.character === 'rock' ? value.character : 'clean', drive: clamp(value?.drive, 30, 0, 100), tone: clamp(value?.tone, 50, 0, 100), level: clamp(value?.level, 0, -18, 6), cabinet: value?.cabinet === true};
}
export const canUseAmp = (track: {kind: string; audioSource?: AudioSource}) => track.kind === 'audio' && (track.audioSource === 'bass' || track.audioSource === 'electricGuitar');
export function ampParameters(source: AudioSource, settings: AmpSettings) {
  const bass = source === 'bass', amount = settings.drive / 100;
  const base = {clean: 0, warm: 6, rock: 12}[settings.character];
  const boost = base + amount * {clean: 8, warm: 16, rock: 24}[settings.character];
  return {driveDb: boost, compensationDb: -boost * .55, cleanBlend: bass ? .35 : 0,
    lowCut: bass ? 28 : 75, highCut: (bass ? 1800 : 2200) * Math.pow(bass ? 4 : 3.5, settings.tone / 100),
    midFrequency: bass ? 650 : 1200, midGain: {clean: 0, warm: 1, rock: 3}[settings.character]};
}
