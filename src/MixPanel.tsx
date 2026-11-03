import {tr} from './i18n';
import type { Track } from './types';
import { compressionAmount, normalizeMix } from './mixSettings';
import type { TrackMix } from './mixSettings';
function Slider({ label, value, min, max, step = 1, text, onChange }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    text: string;
    onChange: (value: number) => void;
}) {
    return <label className="mix-slider"><span>{tr(label)}<output>{text}</output></span><input aria-label={tr(label)} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/></label>;
}
const db = (value: number) => `${value > 0 ? '+' : ''}${value} dB`;
export default function MixPanel({ track, onChange }: {
    track: Track;
    onChange: (mix: TrackMix) => void;
}) {
    const mix = normalizeMix(track.mix);
    const eq = (patch: Partial<TrackMix['eq']>) => onChange({ ...mix, eq: { ...mix.eq, ...patch } });
    const comp = (patch: Partial<TrackMix['compressor']>) => onChange({ ...mix, compressor: { ...mix.compressor, ...patch } });
    const reverb = (patch: Partial<TrackMix['reverb']>) => onChange({ ...mix, reverb: { ...mix.reverb, ...patch } });
    return <details className="mix-panel" open>
    <summary>{tr("Mixage et effets \u00B7 ")}{track.name}</summary>
    <p className="mix-help">{tr("\u00C9coute le morceau et ajuste les r\u00E9glages en direct. Les prises originales restent intactes.")}</p>
    <div className="mix-cards">
      <section className="mix-card"><h3>{tr("Placement")}</h3><Slider label={tr("Panoramique")} min={-1} max={1} step={.01} value={mix.pan} text={mix.pan === 0 ? tr("Centre") : `${mix.pan < 0 ? tr("Gauche") : tr("Droite")} ${Math.round(Math.abs(mix.pan) * 100)} %`} onChange={pan => onChange({ ...mix, pan })}/><button onClick={() => onChange({ ...mix, pan: 0 })}>{tr("Recentrer")}</button></section>
      <section className="mix-card"><h3>{tr("\u00C9galiseur ")}<label><input type="checkbox" checked={mix.eq.enabled} onChange={e => eq({ enabled: e.target.checked })}/>{tr(" Actif")}</label></h3><fieldset disabled={!mix.eq.enabled}>
        <Slider label={tr("Graves \u00B7 200 Hz")} min={-12} max={12} value={mix.eq.low} text={db(mix.eq.low)} onChange={low => eq({ low })}/>
        <Slider label={tr("M\u00E9diums \u00B7 1 kHz")} min={-12} max={12} value={mix.eq.mid} text={db(mix.eq.mid)} onChange={mid => eq({ mid })}/>
        <Slider label={tr("Aigus \u00B7 4 kHz")} min={-12} max={12} value={mix.eq.high} text={db(mix.eq.high)} onChange={high => eq({ high })}/>
        <button onClick={() => eq({ low: 0, mid: 0, high: 0 })}>{tr("Remettre \u00E0 plat")}</button></fieldset></section>
      <section className="mix-card"><h3>{tr("Compresseur ")}<label><input type="checkbox" checked={mix.compressor.enabled} onChange={e => comp({ enabled: e.target.checked })}/>{tr(" Actif")}</label></h3><fieldset disabled={!mix.compressor.enabled}>
        <Slider label={tr("Quantit\u00E9 de compression")} min={0} max={100} value={mix.compressor.amount} text={`${mix.compressor.amount} %`} onChange={value => comp(compressionAmount(value))}/>
        <p>{tr("R\u00E9gularise les \u00E9carts de niveau. Une attaque plus lente conserve davantage le claquant.")}</p>
        <details><summary>{tr("R\u00E9glages avanc\u00E9s")}</summary>
          <Slider label={tr("Seuil")} min={-60} max={0} value={mix.compressor.threshold} text={db(Number(mix.compressor.threshold.toFixed(1)))} onChange={threshold => comp({ threshold })}/>
          <Slider label={tr("Ratio")} min={1} max={12} step={.1} value={mix.compressor.ratio} text={`${mix.compressor.ratio.toFixed(1)}:1`} onChange={ratio => comp({ ratio })}/>
          <Slider label={tr("Attaque")} min={1} max={100} value={mix.compressor.attack} text={`${mix.compressor.attack} ms`} onChange={attack => comp({ attack })}/>
          <Slider label={tr("Rel\u00E2chement")} min={30} max={800} step={10} value={mix.compressor.release} text={`${mix.compressor.release} ms`} onChange={release => comp({ release })}/>
          <Slider label={tr("Gain de sortie du compresseur")} min={0} max={12} step={.5} value={mix.compressor.makeup} text={db(mix.compressor.makeup)} onChange={makeup => comp({ makeup })}/>
          <small>{tr("Quantit\u00E9 r\u00E8gle le seuil et le ratio. Les r\u00E9glages avanc\u00E9s permettent ensuite de les affiner.")}</small>
        </details></fieldset></section>
      <section className="mix-card"><h3>{tr("R\u00E9verb\u00E9ration ")}<label><input type="checkbox" checked={mix.reverb.enabled} onChange={e => reverb({ enabled: e.target.checked })}/>{tr(" Actif")}</label></h3><fieldset disabled={!mix.reverb.enabled}>
        <Slider label={tr("Quantit\u00E9 de r\u00E9verb\u00E9ration")} min={0} max={50} value={Math.round(mix.reverb.wet * 100)} text={`${Math.round(mix.reverb.wet * 100)} %`} onChange={wet => reverb({ wet: wet / 100 })}/><p>{tr("Pi\u00E8ce courte \u00B7 1,5 s. Quelques pourcents suffisent pour ajouter de l\u2019espace.")}</p></fieldset></section>
    </div>
    <button className="mix-reset" onClick={() => onChange(normalizeMix())}>{tr("R\u00E9initialiser le mixage de cette piste")}</button>
  </details>;
}
