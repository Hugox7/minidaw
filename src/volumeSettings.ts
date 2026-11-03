export const MIN_VOLUME_DB = -60;
export const MAX_MASTER_VOLUME_DB = 6;
export const MAX_TRACK_VOLUME_DB = 24;
export const normalizeVolume = (value: unknown, fallback = 0, max = MAX_MASTER_VOLUME_DB) => typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.max(MIN_VOLUME_DB, Math.min(max, value)) * 2) / 2 : fallback;
export const normalizeTrackVolume = (value: unknown, fallback = -8) => normalizeVolume(value, fallback, MAX_TRACK_VOLUME_DB);
