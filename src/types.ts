import type {AudioSource, AmpSettings} from './ampSettings';
import type {PedalSettings} from './pedalSettings';
import type {TrackMix} from './mixSettings';
import type {InstrumentId} from './instruments';
export type Note = {id: string; step: number; midi: number; duration: number; velocity: number};
export type AudioClip = {id: string; assetId: string; name: string; startSeconds: number; duration: number; sourceOffset?: number; sourceDuration?: number; peaks: number[]};
export type Track = {id: string; kind: 'synth' | 'drums' | 'audio'; audioSource?: AudioSource; amp?: AmpSettings; pedals?: PedalSettings; drumKit?: 'synthetic' | 'acoustic'; name: string; color: string; volume: number; muted: boolean; instrument: InstrumentId; notes: Note[]; repeatEndStep?: number; mix?: TrackMix; clips?: AudioClip[]};
export type Project = {name: string; bpm: number; bars: number; countInBars?: 0 | 1 | 2; masterVolume?: number; pendingRetake?: {trackId: string; clip: AudioClip}; tracks: Track[]};
