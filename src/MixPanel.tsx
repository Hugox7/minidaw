import type {Track} from './types';
import {compressionAmount, normalizeMix} from './mixSettings';
import type {TrackMix} from './mixSettings';

function Slider({label, value, min, max, step = 1, text, onChange}: {label: string; value: number; min: number; max: number; step?: number; text: string; onChange: (value: number) => void}) {
  return <label className="mix-slider"><span>{label}<output>{text}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/></label>;
}
const db = (value: number) => `${value > 0 ? '+' : ''}${value} dB`;
export default function MixPanel({track, onChange}: {track: Track; onChange: (mix: TrackMix) => void}) {
  const mix = normalizeMix(track.mix);
  const eq = (patch: Partial<TrackMix['eq']>) => onChange({...mix, eq: {...mix.eq, ...patch}});
  const comp = (patch: Partial<TrackMix['compressor']>) => onChange({...mix, compressor: {...mix.compressor, ...patch}});
  const reverb = (patch: Partial<TrackMix['reverb']>) => onChange({...mix, reverb: {...mix.reverb, ...patch}});
  return <details className="mix-panel" open>
    <summary>Mixage et effets · {track.name}</summary>
    <p className="mix-help">Écoute le morceau et ajuste les réglages en direct. Les prises originales restent intactes.</p>
    <div className="mix-cards">
      <section className="mix-card"><h3>Placement</h3><Slider label="Panoramique" min={-1} max={1} step={.01} value={mix.pan} text={mix.pan === 0 ? 'Centre' : `${mix.pan < 0 ? 'Gauche' : 'Droite'} ${Math.round(Math.abs(mix.pan) * 100)} %`} onChange={pan => onChange({...mix, pan})}/><button onClick={() => onChange({...mix, pan: 0})}>Recentrer</button></section>
      <section className="mix-card"><h3>Égaliseur <label><input type="checkbox" checked={mix.eq.enabled} onChange={e => eq({enabled: e.target.checked})}/> Actif</label></h3><fieldset disabled={!mix.eq.enabled}>
        <Slider label="Graves · 200 Hz" min={-12} max={12} value={mix.eq.low} text={db(mix.eq.low)} onChange={low => eq({low})}/>
        <Slider label="Médiums · 1 kHz" min={-12} max={12} value={mix.eq.mid} text={db(mix.eq.mid)} onChange={mid => eq({mid})}/>
        <Slider label="Aigus · 4 kHz" min={-12} max={12} value={mix.eq.high} text={db(mix.eq.high)} onChange={high => eq({high})}/>
        <button onClick={() => eq({low: 0, mid: 0, high: 0})}>Remettre à plat</button></fieldset></section>
      <section className="mix-card"><h3>Compresseur <label><input type="checkbox" checked={mix.compressor.enabled} onChange={e => comp({enabled: e.target.checked})}/> Actif</label></h3><fieldset disabled={!mix.compressor.enabled}>
        <Slider label="Quantité de compression" min={0} max={100} value={mix.compressor.amount} text={`${mix.compressor.amount} %`} onChange={value => comp(compressionAmount(value))}/>
        <p>Régularise les écarts de niveau. Une attaque plus lente conserve davantage le claquant.</p>
        <details><summary>Réglages avancés</summary>
          <Slider label="Seuil" min={-60} max={0} value={mix.compressor.threshold} text={db(Number(mix.compressor.threshold.toFixed(1)))} onChange={threshold => comp({threshold})}/>
          <Slider label="Ratio" min={1} max={12} step={.1} value={mix.compressor.ratio} text={`${mix.compressor.ratio.toFixed(1)}:1`} onChange={ratio => comp({ratio})}/>
          <Slider label="Attaque" min={1} max={100} value={mix.compressor.attack} text={`${mix.compressor.attack} ms`} onChange={attack => comp({attack})}/>
          <Slider label="Relâchement" min={30} max={800} step={10} value={mix.compressor.release} text={`${mix.compressor.release} ms`} onChange={release => comp({release})}/>
          <Slider label="Gain de sortie du compresseur" min={0} max={12} step={.5} value={mix.compressor.makeup} text={db(mix.compressor.makeup)} onChange={makeup => comp({makeup})}/>
          <small>Quantité règle le seuil et le ratio. Les réglages avancés permettent ensuite de les affiner.</small>
        </details></fieldset></section>
      <section className="mix-card"><h3>Réverbération <label><input type="checkbox" checked={mix.reverb.enabled} onChange={e => reverb({enabled: e.target.checked})}/> Actif</label></h3><fieldset disabled={!mix.reverb.enabled}>
        <Slider label="Quantité de réverbération" min={0} max={50} value={Math.round(mix.reverb.wet * 100)} text={`${Math.round(mix.reverb.wet * 100)} %`} onChange={wet => reverb({wet: wet / 100})}/><p>Pièce courte · 1,5 s. Quelques pourcents suffisent pour ajouter de l’espace.</p></fieldset></section>
    </div>
    <button className="mix-reset" onClick={() => onChange(normalizeMix())}>Réinitialiser le mixage de cette piste</button>
  </details>;
}
