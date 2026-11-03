import {useEffect, useState} from 'react';
import {getPlaybackSeconds} from './audio';

export function formatPlaybackTime(seconds: number) {
  const tenths = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) * 10 + 1e-7);
  return `${String(Math.floor(tenths / 600)).padStart(2, '0')}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')}.${tenths % 10}`;
}

export default function PlaybackTime({active, totalSeconds, compact = false}: {active: boolean; totalSeconds: number; compact?: boolean}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) {setElapsed(0); return;}
    let frame = 0;
    const update = () => {
      // Read the audio clock rather than accumulating a browser timer's drift.
      setElapsed(Math.floor(getPlaybackSeconds() * 10) / 10);
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return <div className={`playback-time${compact ? ' compact' : ''}`} role="group" aria-label="Temps du morceau" title="Durée musicale : mesures et tempo, hors décompte et queue d’effets.">
    <strong><span aria-label="Temps écoulé">{formatPlaybackTime(Math.min(totalSeconds, active ? elapsed : 0))}</span><span className="time-separator" aria-hidden="true"> / </span><span aria-label="Durée totale">{formatPlaybackTime(totalSeconds)}</span></strong>
    {!compact && <small>TEMPS ÉCOULÉ / DURÉE TOTALE</small>}
  </div>;
}
