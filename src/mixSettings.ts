export type TrackMix = {
  pan: number;
  eq: {enabled: boolean; low: number; mid: number; high: number};
  compressor: {enabled: boolean; amount: number; threshold: number; ratio: number; attack: number; release: number; makeup: number};
  reverb: {enabled: boolean; wet: number};
};
const clamp = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export function normalizeMix(value?: Partial<TrackMix>): TrackMix {
  const eq = value?.eq, comp = value?.compressor, reverb = value?.reverb;
  return {
    pan: clamp(value?.pan, 0, -1, 1),
    eq: {enabled: eq?.enabled === true, low: clamp(eq?.low, 0, -12, 12), mid: clamp(eq?.mid, 0, -12, 12), high: clamp(eq?.high, 0, -12, 12)},
    compressor: {enabled: comp?.enabled === true, amount: clamp(comp?.amount, 35, 0, 100), threshold: clamp(comp?.threshold, -24, -60, 0), ratio: clamp(comp?.ratio, 3, 1, 12), attack: clamp(comp?.attack, 20, 1, 100), release: clamp(comp?.release, 150, 30, 800), makeup: clamp(comp?.makeup, 0, 0, 12)},
    reverb: {enabled: reverb?.enabled === true, wet: clamp(reverb?.wet, .15, 0, .5)},
  };
}
export function compressionAmount(amount: number): Pick<TrackMix['compressor'], 'amount' | 'threshold' | 'ratio'> {
  return {amount, threshold: -12 - amount * .32, ratio: 1 + amount * .06};
}
