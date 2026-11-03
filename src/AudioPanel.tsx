import {tr} from './i18n';
import { recordingLimitSeconds } from './recordingLimits';
import { useEffect, useRef, useState } from 'react';
import Waveform from './Waveform';
import AudioClipEditor from './AudioClipEditor';
import { visiblePeaks } from './clipEditing';
import type { AudioClip, Track } from './types';
import type { CountInBars } from './countIn';
import type { InputChannel, InputSession } from './recording';
export const formatSeconds = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, '0')}`;
export { default as Waveform } from './Waveform';
function InputMeter({ input }: {
    input: InputSession | null;
}) {
    const [level, setLevel] = useState(0), [peak, setPeak] = useState(false);
    useEffect(() => {
        if (!input) {
            setLevel(0);
            setPeak(false);
            return;
        }
        let raf = 0, count = 0;
        const data = new Float32Array(input.analyser.fftSize);
        const tick = () => { if (++count % 3 === 0) {
            input.analyser.getFloatTimeDomainData(data);
            let amplitude = 0;
            for (const sample of data)
                amplitude = Math.max(amplitude, Math.abs(sample));
            setLevel(amplitude);
            setPeak(amplitude >= .98);
        } raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [input]);
    const db = level > .00001 ? 20 * Math.log10(level) : -100;
    return <div className="input-meter" role="meter" aria-label={tr("Niveau d\u2019entr\u00E9e")} aria-valuemin={-60} aria-valuemax={0} aria-valuenow={Math.round(Math.max(-60, db))}><div className="meter-track"><span style={{ width: `${Math.max(0, Math.min(100, (db + 60) / 60 * 100))}%`, background: peak ? '#f08b82' : '#76d5ac' }}/></div><small>{input ? db <= -60 ? tr("Pas de signal") : `${db.toFixed(0)} dBFS` : tr("Entr\u00E9e inactive")}{peak ? tr(" \u00B7 baisse le gain de ta carte son") : ''}</small></div>;
}
type Props = {
    track: Track;
    bpm: number;
    bars: number;
    playing: boolean;
    playhead: number;
    onClips: (clips: AudioClip[]) => void;
    input: InputSession | null;
    devices: MediaDeviceInfo[];
    deviceId: string;
    channel: InputChannel;
    busy: boolean;
    latencyDisabled: boolean;
    connecting: boolean;
    recording: boolean;
    armed: boolean;
    latencyMs: number;
    countInBars: CountInBars;
    onCountIn: (value: CountInBars) => void;
    onDevice: (id: string) => void;
    onChannel: (channel: InputChannel) => void;
    onConnect: () => void;
    onDisconnect: () => void;
    onArm: () => void;
    onRecord: () => void;
    onRetake: () => void;
    onStop: () => void;
    onImport: (file: File) => void;
    onDelete: (clip: AudioClip) => void;
    onDownload: (clip: AudioClip) => void;
    onLatency: (value: number) => void;
};
export default function AudioPanel(props: Props) {
    const file = useRef<HTMLInputElement>(null);
    return <div className="audio-panel">
    <div className="audio-input-controls">
      <label>{tr("Entr\u00E9e audio")}<select value={props.deviceId} disabled={props.busy || props.connecting} onChange={e => props.onDevice(e.target.value)}><option value="">{tr("Entr\u00E9e par d\u00E9faut")}</option>{props.devices.filter(d => d.deviceId !== 'default').map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || tr("Entr\u00E9e {{v0}}", { v0: i + 1 })}</option>)}</select></label>
      <label>{tr("Canal")}<select value={props.channel} disabled={props.busy || props.connecting} onChange={e => props.onChannel(e.target.value as InputChannel)}><option value="left">{tr("Entr\u00E9e 1 \u00B7 gauche (mono)")}</option><option value="right">{tr("Entr\u00E9e 2 \u00B7 droite (mono)")}</option><option value="stereo">{tr("St\u00E9r\u00E9o 1 + 2")}</option></select></label>
      <button disabled={props.busy || props.connecting} onClick={props.input ? props.onDisconnect : props.onConnect}>{props.connecting ? tr("Connexion\u2026") : props.input ? tr("Couper l\u2019entr\u00E9e") : tr("Activer l\u2019entr\u00E9e")}</button>
      <button className={props.armed ? 'armed' : ''} disabled={props.busy} aria-pressed={props.armed} onClick={props.onArm}>{props.armed ? tr("\u25CF Piste arm\u00E9e") : tr("Armer la piste")}</button>
    </div>
    <InputMeter input={props.input}/>
    {props.input && <p className="audio-device-info">{props.input.deviceName} · {Math.round(props.input.sampleRate / 1000)}{tr(" kHz")}{props.input.channelCount < 2 && props.channel === 'right' ? tr(" \u00B7 Cette entr\u00E9e annonce un seul canal : choisis Entr\u00E9e 1.") : ''}</p>}
    <div className="count-in-setting"><label>{tr("D\u00E9compte avant la prise")}<select aria-label={tr("D\u00E9compte avant l\u2019enregistrement")} value={props.countInBars} disabled={props.busy || props.connecting} onChange={e => props.onCountIn(Number(e.target.value) as CountInBars)}><option value={0}>{tr("Aucun")}</option><option value={1}>{tr("1 mesure \u00B7 4 temps")}</option><option value={2}>{tr("2 mesures \u00B7 8 temps")}</option></select></label><span>{tr("Les clics pr\u00E9c\u00E8dent le morceau et ne sont pas inclus dans la prise.")}</span></div>
    <div className="audio-record-controls"><button className="record-button" disabled={!props.recording && (props.busy || props.connecting || !props.input || !props.armed)} onClick={props.recording ? props.onStop : props.onRecord}>{props.recording ? tr("\u25A0 Arr\u00EAter la prise") : tr("\u25CF Enregistrer avec l\u2019accompagnement")}</button>{Boolean(props.track.clips?.length) && <button className="retake-button" disabled={props.busy || props.connecting || !props.input} onClick={props.onRetake}>{tr("Refaire la prise")}</button>}<button disabled={props.busy} onClick={() => file.current?.click()}>{tr("Importer un fichier audio")}</button><input ref={file} type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac" hidden onChange={e => { const selected = e.target.files?.[0]; if (selected)
        props.onImport(selected); e.target.value = ''; }}/></div>
    <p className="audio-help">{tr("Branche l\u2019instrument sur l\u2019entr\u00E9e instrument/Hi-Z de ta carte son. Apr\u00E8s le d\u00E9compte choisi, la prise commence au d\u00E9but du morceau et continue jusqu\u2019\u00E0 Arr\u00EAter la prise. Le morceau s\u2019allonge automatiquement si tu d\u00E9passes sa derni\u00E8re mesure ; les passages des autres pistes ne sont pas r\u00E9p\u00E9t\u00E9s. \u00AB Refaire la prise \u00BB conserve cette piste et ses effets ; sa nouvelle prise remplacera les clips de la piste uniquement apr\u00E8s validation. Le bouton Enregistrer ajoute toujours une piste si celle-ci contient d\u00E9j\u00E0 des clips.")}</p>
    <p className="audio-help">{tr("Arr\u00EAt manuel \u00B7 Limite de la prise : ")}{props.input ? formatSeconds(recordingLimitSeconds(props.input.sampleRate, props.bpm)) : tr("5 minutes maximum")}{tr(" \u00B7 64 Mo par prise, dur\u00E9e r\u00E9duite \u00E0 haute fr\u00E9quence d\u2019\u00E9chantillonnage.")}</p>
    <p className="audio-help">{tr("Monitoring logiciel d\u00E9sactiv\u00E9 : utilise le monitoring direct de ta carte son pour t\u2019entendre. Le niveau d\u2019enregistrement se r\u00E8gle sur la carte son ; le volume de la piste r\u00E8gle la r\u00E9\u00E9coute.")}</p>
    <details className="latency-controls"><summary>{tr("D\u00E9calage de la prise")}</summary><label>{tr("Avancer les prochaines prises de ")}<input aria-label={tr("Compensation de latence en millisecondes")} type="number" min="0" max="500" step="5" value={props.latencyMs} disabled={props.latencyDisabled} onChange={e => props.onLatency(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}/>{tr(" ms")}</label><p>{tr("Si ton instrument est syst\u00E9matiquement en retard, ce r\u00E9glage compense le retard sur les prochaines prises en conservant leur dur\u00E9e : la capture se termine un peu apr\u00E8s l\u2019accompagnement. Tu peux le modifier pendant la comparaison, m\u00EAme en \u00E9coutant une prise. Il ne modifie ni l\u2019ancienne ni la nouvelle prise d\u00E9j\u00E0 enregistr\u00E9es.")}</p></details>
    <AudioClipEditor key={props.track.id} track={props.track} bpm={props.bpm} bars={props.bars} disabled={props.busy} playing={props.playing} playhead={props.playhead} onClips={props.onClips}/>
    <details className="audio-files"><summary>{tr("Fichiers et t\u00E9l\u00E9chargements \u00B7 ")}{props.track.clips?.length ?? 0}{tr(" clips")}</summary><div className="audio-takes">{(props.track.clips ?? []).length === 0 ? <p>{tr("Aucune prise sur cette piste. Active l\u2019entr\u00E9e ou importe un fichier.")}</p> : (props.track.clips ?? []).map(clip => <article key={clip.id} className="audio-take"><div className="take-heading"><strong>{clip.name}</strong><span>{tr("D\u00E9part ")}{formatSeconds(clip.startSeconds)}{tr(" \u00B7 dur\u00E9e ")}{formatSeconds(clip.duration)}</span><button disabled={props.busy} onClick={() => props.onDownload(clip)}>{tr("T\u00E9l\u00E9charger")}</button><button disabled={props.busy} onClick={() => props.onDelete(clip)}>{tr("Supprimer")}</button></div><Waveform peaks={visiblePeaks(clip)} color={props.track.color}/></article>)}</div></details>
    <p className="audio-help">{tr("Les fichiers import\u00E9s sont ajout\u00E9s \u00E0 la suite des prises de cette piste. Les prises et imports restent en secondes lorsque tu changes le tempo.")}</p>
  </div>;
}
