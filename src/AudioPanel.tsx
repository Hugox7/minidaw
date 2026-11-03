import {recordingLimitSeconds} from './recordingLimits';
import {useEffect, useRef, useState} from 'react';
import Waveform from './Waveform';
import AudioClipEditor from './AudioClipEditor';
import {visiblePeaks} from './clipEditing';
import type {AudioClip, Track} from './types';
import type {CountInBars} from './countIn';
import type {InputChannel, InputSession} from './recording';

export const formatSeconds = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, '0')}`;
export {default as Waveform} from './Waveform';
function InputMeter({input}: {input: InputSession | null}) {
  const [level, setLevel] = useState(0), [peak, setPeak] = useState(false);
  useEffect(() => {
    if (!input) {setLevel(0); setPeak(false); return;}
    let raf = 0, count = 0; const data = new Float32Array(input.analyser.fftSize);
    const tick = () => {if (++count % 3 === 0) {input.analyser.getFloatTimeDomainData(data); let amplitude = 0; for (const sample of data) amplitude = Math.max(amplitude, Math.abs(sample)); setLevel(amplitude); setPeak(amplitude >= .98);} raf = requestAnimationFrame(tick);};
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [input]);
  const db = level > .00001 ? 20 * Math.log10(level) : -100;
  return <div className="input-meter" role="meter" aria-label="Niveau d’entrée" aria-valuemin={-60} aria-valuemax={0} aria-valuenow={Math.round(Math.max(-60, db))}><div className="meter-track"><span style={{width: `${Math.max(0, Math.min(100, (db + 60) / 60 * 100))}%`, background: peak ? '#f08b82' : '#76d5ac'}}/></div><small>{input ? db <= -60 ? 'Pas de signal' : `${db.toFixed(0)} dBFS` : 'Entrée inactive'}{peak ? ' · baisse le gain de ta carte son' : ''}</small></div>;
}
type Props = {
  track: Track; bpm: number; bars: number; playing: boolean; playhead: number; onClips: (clips: AudioClip[]) => void; input: InputSession | null; devices: MediaDeviceInfo[]; deviceId: string; channel: InputChannel; busy: boolean; latencyDisabled: boolean; connecting: boolean; recording: boolean; armed: boolean; latencyMs: number; countInBars: CountInBars; onCountIn: (value: CountInBars) => void;
  onDevice: (id: string) => void; onChannel: (channel: InputChannel) => void; onConnect: () => void; onDisconnect: () => void; onArm: () => void; onRecord: () => void; onRetake: () => void; onStop: () => void; onImport: (file: File) => void; onDelete: (clip: AudioClip) => void; onDownload: (clip: AudioClip) => void; onLatency: (value: number) => void;
};
export default function AudioPanel(props: Props) {
  const file = useRef<HTMLInputElement>(null);
  return <div className="audio-panel">
    <div className="audio-input-controls">
      <label>Entrée audio<select value={props.deviceId} disabled={props.busy || props.connecting} onChange={e => props.onDevice(e.target.value)}><option value="">Entrée par défaut</option>{props.devices.filter(d => d.deviceId !== 'default').map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Entrée ${i + 1}`}</option>)}</select></label>
      <label>Canal<select value={props.channel} disabled={props.busy || props.connecting} onChange={e => props.onChannel(e.target.value as InputChannel)}><option value="left">Entrée 1 · gauche (mono)</option><option value="right">Entrée 2 · droite (mono)</option><option value="stereo">Stéréo 1 + 2</option></select></label>
      <button disabled={props.busy || props.connecting} onClick={props.input ? props.onDisconnect : props.onConnect}>{props.connecting ? 'Connexion…' : props.input ? 'Couper l’entrée' : 'Activer l’entrée'}</button>
      <button className={props.armed ? 'armed' : ''} disabled={props.busy} aria-pressed={props.armed} onClick={props.onArm}>{props.armed ? '● Piste armée' : 'Armer la piste'}</button>
    </div>
    <InputMeter input={props.input}/>
    {props.input && <p className="audio-device-info">{props.input.deviceName} · {Math.round(props.input.sampleRate / 1000)} kHz{props.input.channelCount < 2 && props.channel === 'right' ? ' · Cette entrée annonce un seul canal : choisis Entrée 1.' : ''}</p>}
    <div className="count-in-setting"><label>Décompte avant la prise<select aria-label="Décompte avant l’enregistrement" value={props.countInBars} disabled={props.busy || props.connecting} onChange={e => props.onCountIn(Number(e.target.value) as CountInBars)}><option value={0}>Aucun</option><option value={1}>1 mesure · 4 temps</option><option value={2}>2 mesures · 8 temps</option></select></label><span>Les clics précèdent le morceau et ne sont pas inclus dans la prise.</span></div>
    <div className="audio-record-controls"><button className="record-button" disabled={!props.recording && (props.busy || props.connecting || !props.input || !props.armed)} onClick={props.recording ? props.onStop : props.onRecord}>{props.recording ? '■ Arrêter la prise' : '● Enregistrer avec l’accompagnement'}</button>{Boolean(props.track.clips?.length) && <button className="retake-button" disabled={props.busy || props.connecting || !props.input} onClick={props.onRetake}>Refaire la prise</button>}<button disabled={props.busy} onClick={() => file.current?.click()}>Importer un fichier audio</button><input ref={file} type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac" hidden onChange={e => {const selected = e.target.files?.[0]; if (selected) props.onImport(selected); e.target.value = '';}}/></div>
    <p className="audio-help">Branche l’instrument sur l’entrée instrument/Hi-Z de ta carte son. Après le décompte choisi, la prise commence au début du morceau et continue jusqu’à Arrêter la prise. Le morceau s’allonge automatiquement si tu dépasses sa dernière mesure ; les passages des autres pistes ne sont pas répétés. « Refaire la prise » conserve cette piste et ses effets ; sa nouvelle prise remplacera les clips de la piste uniquement après validation. Le bouton Enregistrer ajoute toujours une piste si celle-ci contient déjà des clips.</p>
    <p className="audio-help">Arrêt manuel · Limite de la prise : {props.input ? formatSeconds(recordingLimitSeconds(props.input.sampleRate, props.bpm)) : '5 minutes maximum'} · 64 Mo par prise, durée réduite à haute fréquence d’échantillonnage.</p>
    <p className="audio-help">Monitoring logiciel désactivé : utilise le monitoring direct de ta carte son pour t’entendre. Le niveau d’enregistrement se règle sur la carte son ; le volume de la piste règle la réécoute.</p>
    <details className="latency-controls"><summary>Décalage de la prise</summary><label>Avancer les prochaines prises de <input aria-label="Compensation de latence en millisecondes" type="number" min="0" max="500" step="5" value={props.latencyMs} disabled={props.latencyDisabled} onChange={e => props.onLatency(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}/> ms</label><p>Si ton instrument est systématiquement en retard, ce réglage compense le retard sur les prochaines prises en conservant leur durée : la capture se termine un peu après l’accompagnement. Tu peux le modifier pendant la comparaison, même en écoutant une prise. Il ne modifie ni l’ancienne ni la nouvelle prise déjà enregistrées.</p></details>
    <AudioClipEditor key={props.track.id} track={props.track} bpm={props.bpm} bars={props.bars} disabled={props.busy} playing={props.playing} playhead={props.playhead} onClips={props.onClips}/>
    <details className="audio-files"><summary>Fichiers et téléchargements · {props.track.clips?.length ?? 0} clips</summary><div className="audio-takes">{(props.track.clips ?? []).length === 0 ? <p>Aucune prise sur cette piste. Active l’entrée ou importe un fichier.</p> : (props.track.clips ?? []).map(clip => <article key={clip.id} className="audio-take"><div className="take-heading"><strong>{clip.name}</strong><span>Départ {formatSeconds(clip.startSeconds)} · durée {formatSeconds(clip.duration)}</span><button disabled={props.busy} onClick={() => props.onDownload(clip)}>Télécharger</button><button disabled={props.busy} onClick={() => props.onDelete(clip)}>Supprimer</button></div><Waveform peaks={visiblePeaks(clip)} color={props.track.color}/></article>)}</div></details>
    <p className="audio-help">Les fichiers importés sont ajoutés à la suite des prises de cette piste. Les prises et imports restent en secondes lorsque tu changes le tempo.</p>
  </div>;
}
