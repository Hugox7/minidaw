import {useEffect, useRef, useState} from 'react';
import {X} from 'lucide-react';
import {detectPitch, PitchSmoother} from './tunerPitch';
import type {pitchNote} from './tunerPitch';
import type {InputChannel, InputSession} from './recording';
type Props = {input: InputSession | null; devices: MediaDeviceInfo[]; deviceId: string; channel: InputChannel; connecting: boolean; error: string; onDevice: (id: string) => void; onChannel: (channel: InputChannel) => void; onConnect: () => void; onDisconnect: () => void; onClose: () => void};
export default function TunerModal(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null), hadInput = useRef(Boolean(props.input)), latest = useRef(props); latest.current = props;
  const [reading, setReading] = useState<ReturnType<typeof pitchNote> | null>(null), [signal, setSignal] = useState(false), [analysisError, setAnalysisError] = useState('');
  useEffect(() => {
    const element = dialog.current!; element.showModal();
    return () => {element.close(); if (!hadInput.current || latest.current.connecting) latest.current.onDisconnect();};
  }, []);
  useEffect(() => {
    setReading(null); setSignal(false); setAnalysisError('');
    if (!props.input) return;
    const {analyser, sampleRate} = props.input, previousSize = analyser.fftSize;
    let frame = 0, stopped = false, last = -Infinity, lastValid = -Infinity;
    const smoother = new PitchSmoother();
    try {analyser.fftSize = 16384;} catch {setAnalysisError('Impossible de démarrer l’analyse. Coupe puis réactive l’entrée.'); return;}
    const data = new Float32Array(analyser.fftSize);
    const tick = (time: number) => {
      if (stopped) return;
      if (time - last >= 100) {
        last = time;
        try {
          analyser.getFloatTimeDomainData(data);
          let mean = 0; for (const value of data) mean += value; mean /= data.length;
          let energy = 0; for (const value of data) energy += (value - mean) ** 2;
          setSignal(Math.sqrt(energy / data.length) >= .002);
          const pitch = detectPitch(data, sampleRate);
          if (pitch) {const next = smoother.push(pitch.frequency); if (next) {setReading(next); lastValid = time;} else setReading(null);}
          else {smoother.reset(); if (time - lastValid > 250) setReading(null);}
        } catch {setAnalysisError('L’analyse audio a été interrompue. Réactive l’entrée.'); setReading(null); stopped = true; return;}
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {stopped = true; cancelAnimationFrame(frame); analyser.fftSize = previousSize;};
  }, [props.input]);
  const cents = reading?.cents ?? 0, tuned = Boolean(reading && Math.abs(cents) <= 5);
  const instruction = !props.input ? 'Active l’entrée pour commencer.' : reading ? tuned ? 'Accordé' : cents < 0 ? 'Trop grave · tends légèrement la corde' : 'Trop aigu · détends légèrement la corde' : signal ? 'Stabilisation… Joue une seule corde et laisse-la sonner.' : 'Pas de signal · joue une corde.';
  return <dialog ref={dialog} className="tuner-modal" aria-labelledby="tuner-title" onCancel={event => {event.preventDefault(); props.onClose();}} onClick={event => {if (event.target === event.currentTarget) {const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) props.onClose();}}}>
    <div className="tuner-heading"><div><h2 id="tuner-title">Accordeur</h2><p>Chromatique · La = 440 Hz · Signal direct</p></div><button type="button" className="tuner-close" aria-label="Fermer l’accordeur" onClick={props.onClose} autoFocus><X size={20}/></button></div>
    <div className="tuner-inputs"><label>Entrée audio<select aria-label="Entrée audio de l’accordeur" value={props.deviceId} disabled={props.connecting} onChange={event => props.onDevice(event.target.value)}><option value="">Entrée par défaut</option>{props.devices.filter(device => device.deviceId !== 'default').map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Entrée ${index + 1}`}</option>)}</select></label>
      <label>Canal<select aria-label="Canal de l’accordeur" value={props.channel} disabled={props.connecting} onChange={event => props.onChannel(event.target.value as InputChannel)}><option value="left">Entrée 1 · gauche (mono)</option><option value="right">Entrée 2 · droite (mono)</option><option value="stereo">Stéréo 1 + 2</option></select></label>
      <button disabled={props.connecting} onClick={props.input ? props.onDisconnect : props.onConnect}>{props.connecting ? 'Connexion…' : props.input ? 'Couper l’entrée' : 'Activer l’entrée'}</button>
    </div>
    {props.input && <p className="tuner-device">{props.input.deviceName}{props.input.channelCount < 2 && props.channel === 'right' ? ' · Un seul canal disponible : choisis Entrée 1.' : ''}</p>}
    {(props.error || analysisError) && <p className="project-error" role="alert">{analysisError || props.error}</p>}
    <div className={`tuner-display ${tuned ? 'in-tune' : ''}`}>
      <div className="tuner-note">{reading ? <>{reading.name}<sub>{reading.octave}</sub><small>{reading.letter}{reading.octave}</small></> : '—'}</div>
      <p className="tuner-frequency">{reading ? `${reading.frequency.toFixed(1)} Hz · ${cents >= 0 ? '+' : '−'}${Math.abs(cents).toFixed(1)} cents` : 'Une corde à la fois'}</p>
      <div className="tuner-gauge" role={reading ? 'meter' : undefined} aria-label="Écart de justesse" aria-valuemin={reading ? -50 : undefined} aria-valuemax={reading ? 50 : undefined} aria-valuenow={reading ? Math.round(cents) : undefined} aria-valuetext={reading ? `${Math.round(cents)} cents` : undefined}><div className="tuner-target"/><div className="tuner-center"/>{reading && <div className="tuner-needle" style={{left: `${50 + Math.max(-50, Math.min(50, cents))}%`}}/>}</div>
      <div className="tuner-scale"><span>−50 · Grave</span><span>Juste</span><span>Aigu · +50</span></div>
      <p className="tuner-instruction" role="status">{instruction}</p>
    </div>
    <p className="tuner-help">Joue une seule note, puis ajuste doucement. Pour la basse, essaie l’harmonique au-dessus de la 12e frette si le grave est difficile à détecter. La note affichée sera une octave plus haute.</p>
    <p className="tuner-help">Aucun son n’est renvoyé aux haut-parleurs et aucune prise n’est enregistrée. Une entrée activée uniquement ici sera coupée à la fermeture ; une entrée déjà active restera disponible pour enregistrer.</p>
  </dialog>;
}
