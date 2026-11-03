import {useEffect, useRef, useState} from 'react';
export default function LevelMeter({label, read}: {label: string; read: () => number[]}) {
  const [peaks, setPeaks] = useState([0, 0]), [clipped, setClipped] = useState(false);
  const reader = useRef(read); reader.current = read;
  useEffect(() => {
    let frame = 0, last = 0;
    const tick = (time: number) => {
      if (time - last >= 50) {last = time; const values = reader.current(); setPeaks(values); if (values.some(value => value >= 1)) setClipped(true);}
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, []);
  const peak = Math.max(...peaks), db = peak > .00001 ? 20 * Math.log10(peak) : -100;
  return <div className="level-meter" onClick={e => e.stopPropagation()}>
    <div className="level-bars" role="meter" aria-label={label} aria-valuemin={-60} aria-valuemax={6} aria-valuenow={Math.max(-60, Math.min(6, db))} aria-valuetext={db <= -60 ? 'Silence' : `${db.toFixed(1)} dBFS`}>
      {[0, 1].map(index => {const amplitude = peaks[index] ?? peaks[0] ?? 0; const level = amplitude > 0 ? 20 * Math.log10(amplitude) : -100; return <div key={index}><span style={{width: `${Math.max(0, Math.min(100, (level + 60) / 60 * 100))}%`}}/></div>;})}
    </div><span className="level-number">{db <= -60 ? '−∞' : db.toFixed(1)} dBFS</span>
    <button className={`clip-indicator ${clipped ? 'clipped' : ''}`} title="Crête à 0 dBFS ou plus : baisse le volume. Cliquer pour réinitialiser le témoin." aria-label={`Réinitialiser le témoin de saturation : ${label}`} aria-pressed={clipped} onClick={() => setClipped(false)}>CLIP</button>
  </div>;
}
