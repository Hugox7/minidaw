import {tr} from './i18n';
import { useEffect, useState } from 'react';
import { getPlaybackSeconds } from './audio';
export function formatPlaybackTime(seconds: number) {
    const tenths = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) * 10 + 1e-7);
    return `${String(Math.floor(tenths / 600)).padStart(2, '0')}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')}.${tenths % 10}`;
}
export default function PlaybackTime({ active, totalSeconds, positionSeconds = 0, compact = false }: {
    active: boolean;
    totalSeconds: number;
    compact?: boolean;
    positionSeconds?: number;
}) {
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!active) {
            setElapsed(positionSeconds);
            return;
        }
        let frame = 0;
        const update = () => {
            // Read the audio clock rather than accumulating a browser timer's drift.
            setElapsed(Math.floor(getPlaybackSeconds() * 10) / 10);
            frame = requestAnimationFrame(update);
        };
        update();
        return () => cancelAnimationFrame(frame);
    }, [active, positionSeconds]);
    return <div className={`playback-time${compact ? ' compact' : ''}`} role="group" aria-label={tr("Temps du morceau")} title={tr("Dur\u00E9e musicale : mesures et tempo, hors d\u00E9compte et queue d\u2019effets.")}>
    <strong><span aria-label={tr("Temps \u00E9coul\u00E9")}>{formatPlaybackTime(Math.min(totalSeconds, active ? Math.max(positionSeconds, elapsed) : positionSeconds))}</span><span className="time-separator" aria-hidden="true"> / </span><span aria-label={tr("Dur\u00E9e totale")}>{formatPlaybackTime(totalSeconds)}</span></strong>
    {!compact && <small>{tr("TEMPS \u00C9COUL\u00C9 / DUR\u00C9E TOTALE")}</small>}
  </div>;
}
