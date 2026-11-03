import {canUseAmp} from './ampSettings';
import type {AudioSource} from './ampSettings';
export const canUsePedals = canUseAmp;
export const PEDAL_TYPES = {overdrive: 'Overdrive', distortion: 'Distorsion', fuzz: 'Fuzz'} as const;
export type PedalType = keyof typeof PEDAL_TYPES;
export type PedalSettings = {
  enabled: boolean;
  saturation: {enabled: boolean; type: PedalType; gain: number; tone: number; level: number; blend: number};
  chorus: {enabled: boolean; rate: number; depth: number; mix: number};
  delay: {enabled: boolean; time: number; feedback: number; mix: number};
};
const obj = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const clamp = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export function normalizePedals(value?: unknown): PedalSettings {
  const p = obj(value), s = obj(p.saturation), c = obj(p.chorus), d = obj(p.delay);
  return {enabled: p.enabled === true,
    saturation: {enabled: s.enabled === true, type: s.type === 'distortion' || s.type === 'fuzz' ? s.type : 'overdrive', gain: clamp(s.gain, 45, 0, 100), tone: clamp(s.tone, 50, 0, 100), level: clamp(s.level, 0, -18, 12), blend: clamp(s.blend, 65, 0, 100)},
    chorus: {enabled: c.enabled === true, rate: clamp(c.rate, .8, .1, 5), depth: clamp(c.depth, 50, 0, 100), mix: clamp(c.mix, 20, 0, 50)},
    delay: {enabled: d.enabled === true, time: clamp(d.time, 280, 60, 600), feedback: clamp(d.feedback, 25, 0, 50), mix: clamp(d.mix, 18, 0, 40)}};
}
type Preset = {id: string; name: string; settings: PedalSettings};
export function pedalPresets(source: AudioSource): Preset[] {
  const preset = (id: string, name: string, type: PedalType, gain: number, tone: number, blend: number, level = 0): Preset => {
    const settings = normalizePedals(); settings.enabled = true;
    settings.saturation = {enabled: true, type, gain, tone, blend, level};
    return {id, name, settings};
  };
  const clean = {id: 'clean', name: 'Clean · sans pédales', settings: normalizePedals()};
  if (source === 'bass') return [clean, preset('grain', 'Grain léger', 'overdrive', 25, 45, 45), preset('bass-rock', 'Basse rock', 'distortion', 60, 45, 60, -2), preset('bass-fuzz', 'Fuzz épaisse', 'fuzz', 80, 35, 65, -2)];
  return [clean, preset('crunch', 'Crunch', 'overdrive', 30, 55, 100), preset('rock', 'Gros rock', 'distortion', 65, 45, 100, -2), preset('metal', 'Metal', 'distortion', 95, 55, 100, -3), preset('fuzz', 'Fuzz vintage', 'fuzz', 75, 40, 100, -3)];
}

/** Three different clipping curves; odd symmetry avoids a DC offset. */
export function pedalCurve(type: PedalType, x: number) {
  if (type === 'fuzz') return Math.tanh(12 * x) / Math.tanh(12);
  if (type === 'distortion') return Math.max(-.65, Math.min(.65, x * 3)) / .65;
  return Math.tanh(1.7 * x) / Math.tanh(1.7);
}
