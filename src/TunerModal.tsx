import {tr} from './i18n';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { detectPitch, PitchSmoother } from './tunerPitch';
import type { pitchNote } from './tunerPitch';
import type { InputChannel, InputSession } from './recording';
type Props = {
    input: InputSession | null;
    devices: MediaDeviceInfo[];
    deviceId: string;
    channel: InputChannel;
    connecting: boolean;
    error: string;
    onDevice: (id: string) => void;
    onChannel: (channel: InputChannel) => void;
    onConnect: () => void;
    onDisconnect: () => void;
    onClose: () => void;
};
export default function TunerModal(props: Props) {
    const dialog = useRef<HTMLDialogElement>(null), hadInput = useRef(Boolean(props.input)), latest = useRef(props);
    latest.current = props;
    const [reading, setReading] = useState<ReturnType<typeof pitchNote> | null>(null), [signal, setSignal] = useState(false), [analysisError, setAnalysisError] = useState('');
    useEffect(() => {
        const element = dialog.current!;
        element.showModal();
        return () => { element.close(); if (!hadInput.current || latest.current.connecting)
            latest.current.onDisconnect(); };
    }, []);
    useEffect(() => {
        setReading(null);
        setSignal(false);
        setAnalysisError('');
        if (!props.input)
            return;
        const { analyser, sampleRate } = props.input, previousSize = analyser.fftSize;
        let frame = 0, stopped = false, last = -Infinity, lastValid = -Infinity;
        const smoother = new PitchSmoother();
        try {
            analyser.fftSize = 16384;
        }
        catch {
            setAnalysisError(tr("Impossible de d\u00E9marrer l\u2019analyse. Coupe puis r\u00E9active l\u2019entr\u00E9e."));
            return;
        }
        const data = new Float32Array(analyser.fftSize);
        const tick = (time: number) => {
            if (stopped)
                return;
            if (time - last >= 100) {
                last = time;
                try {
                    analyser.getFloatTimeDomainData(data);
                    let mean = 0;
                    for (const value of data)
                        mean += value;
                    mean /= data.length;
                    let energy = 0;
                    for (const value of data)
                        energy += (value - mean) ** 2;
                    setSignal(Math.sqrt(energy / data.length) >= .002);
                    const pitch = detectPitch(data, sampleRate);
                    if (pitch) {
                        const next = smoother.push(pitch.frequency);
                        if (next) {
                            setReading(next);
                            lastValid = time;
                        }
                        else
                            setReading(null);
                    }
                    else {
                        smoother.reset();
                        if (time - lastValid > 250)
                            setReading(null);
                    }
                }
                catch {
                    setAnalysisError(tr("L\u2019analyse audio a \u00E9t\u00E9 interrompue. R\u00E9active l\u2019entr\u00E9e."));
                    setReading(null);
                    stopped = true;
                    return;
                }
            }
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => { stopped = true; cancelAnimationFrame(frame); analyser.fftSize = previousSize; };
    }, [props.input]);
    const cents = reading?.cents ?? 0, tuned = Boolean(reading && Math.abs(cents) <= 5);
    const instruction = !props.input ? tr("Active l\u2019entr\u00E9e pour commencer.") : reading ? tuned ? tr("Accord\u00E9") : cents < 0 ? tr("Trop grave \u00B7 tends l\u00E9g\u00E8rement la corde") : tr("Trop aigu \u00B7 d\u00E9tends l\u00E9g\u00E8rement la corde") : signal ? tr("Stabilisation\u2026 Joue une seule corde et laisse-la sonner.") : tr("Pas de signal \u00B7 joue une corde.");
    return <dialog ref={dialog} className="tuner-modal" aria-labelledby="tuner-title" onCancel={event => { event.preventDefault(); props.onClose(); }} onClick={event => { if (event.target === event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
            props.onClose();
    } }}>
    <div className="tuner-heading"><div><h2 id="tuner-title">{tr("Accordeur")}</h2><p>{tr("Chromatique \u00B7 La = 440 Hz \u00B7 Signal direct")}</p></div><button type="button" className="tuner-close" aria-label={tr("Fermer l\u2019accordeur")} onClick={props.onClose} autoFocus><X size={20}/></button></div>
    <div className="tuner-inputs"><label>{tr("Entr\u00E9e audio")}<select aria-label={tr("Entr\u00E9e audio de l\u2019accordeur")} value={props.deviceId} disabled={props.connecting} onChange={event => props.onDevice(event.target.value)}><option value="">{tr("Entr\u00E9e par d\u00E9faut")}</option>{props.devices.filter(device => device.deviceId !== 'default').map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || tr("Entr\u00E9e {{v0}}", { v0: index + 1 })}</option>)}</select></label>
      <label>{tr("Canal")}<select aria-label={tr("Canal de l\u2019accordeur")} value={props.channel} disabled={props.connecting} onChange={event => props.onChannel(event.target.value as InputChannel)}><option value="left">{tr("Entr\u00E9e 1 \u00B7 gauche (mono)")}</option><option value="right">{tr("Entr\u00E9e 2 \u00B7 droite (mono)")}</option><option value="stereo">{tr("St\u00E9r\u00E9o 1 + 2")}</option></select></label>
      <button disabled={props.connecting} onClick={props.input ? props.onDisconnect : props.onConnect}>{props.connecting ? tr("Connexion\u2026") : props.input ? tr("Couper l\u2019entr\u00E9e") : tr("Activer l\u2019entr\u00E9e")}</button>
    </div>
    {props.input && <p className="tuner-device">{props.input.deviceName}{props.input.channelCount < 2 && props.channel === 'right' ? tr(" \u00B7 Un seul canal disponible : choisis Entr\u00E9e 1.") : ''}</p>}
    {(props.error || analysisError) && <p className="project-error" role="alert">{tr(analysisError) || tr(props.error)}</p>}
    <div className={`tuner-display ${tuned ? 'in-tune' : ''}`}>
      <div className="tuner-note">{reading ? <>{tr(reading.name)}<sub>{reading.octave}</sub><small>{reading.letter}{reading.octave}</small></> : '—'}</div>
      <p className="tuner-frequency">{reading ? `${reading.frequency.toFixed(1)} Hz · ${cents >= 0 ? '+' : '−'}${Math.abs(cents).toFixed(1)} cents` : tr("Une corde \u00E0 la fois")}</p>
      <div className="tuner-gauge" role={reading ? 'meter' : undefined} aria-label={tr("\u00C9cart de justesse")} aria-valuemin={reading ? -50 : undefined} aria-valuemax={reading ? 50 : undefined} aria-valuenow={reading ? Math.round(cents) : undefined} aria-valuetext={reading ? `${Math.round(cents)} cents` : undefined}><div className="tuner-target"/><div className="tuner-center"/>{reading && <div className="tuner-needle" style={{ left: `${50 + Math.max(-50, Math.min(50, cents))}%` }}/>}</div>
      <div className="tuner-scale"><span>{tr("\u221250 \u00B7 Grave")}</span><span>{tr("Juste")}</span><span>{tr("Aigu \u00B7 +50")}</span></div>
      <p className="tuner-instruction" role="status">{tr(instruction)}</p>
    </div>
    <p className="tuner-help">{tr("Joue une seule note, puis ajuste doucement. Pour la basse, essaie l\u2019harmonique au-dessus de la 12e frette si le grave est difficile \u00E0 d\u00E9tecter. La note affich\u00E9e sera une octave plus haute.")}</p>
    <p className="tuner-help">{tr("Aucun son n\u2019est renvoy\u00E9 aux haut-parleurs et aucune prise n\u2019est enregistr\u00E9e. Une entr\u00E9e activ\u00E9e uniquement ici sera coup\u00E9e \u00E0 la fermeture ; une entr\u00E9e d\u00E9j\u00E0 active restera disponible pour enregistrer.")}</p>
  </dialog>;
}
