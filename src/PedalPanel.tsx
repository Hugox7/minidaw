import {tr} from './i18n';
import type { Track } from './types';
import { AUDIO_SOURCES, normalizeSource } from './ampSettings';
import { canUsePedals, normalizePedals, pedalPresets, PEDAL_TYPES } from './pedalSettings';
import type { PedalSettings, PedalType } from './pedalSettings';
function Slider({ label, value, min = 0, max = 100, step = 1, unit = '%', onChange }: {
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
}) {
    return <label className="mix-slider"><span>{tr(label)}<output>{value} {unit}</output></span><input aria-label={tr(label)} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/></label>;
}
export default function PedalPanel({ track, onChange }: {
    track: Track;
    onChange: (track: Track) => void;
}) {
    if (!canUsePedals(track))
        return null;
    const source = normalizeSource(track.audioSource), p = normalizePedals(track.pedals);
    const update = (settings: PedalSettings) => onChange({ ...track, pedals: settings });
    const sat = (patch: Partial<PedalSettings['saturation']>) => update({ ...p, saturation: { ...p.saturation, ...patch } });
    const chorus = (patch: Partial<PedalSettings['chorus']>) => update({ ...p, chorus: { ...p.chorus, ...patch } });
    const delay = (patch: Partial<PedalSettings['delay']>) => update({ ...p, delay: { ...p.delay, ...patch } });
    const presets = pedalPresets(source);
    const preset = presets.find(item => JSON.stringify(normalizePedals(item.settings)) === JSON.stringify(p))?.id ?? '';
    return <details className="mix-panel pedal-panel" open>
    <summary>{tr("P\u00E9dales \u00B7 ")}{tr(AUDIO_SOURCES[source])}</summary>
    <div className="pedal-heading"><p>{tr("Saturation \u2192 Chorus \u2192 Delay \u2192 Ampli / baffle \u2192 Mixage")}</p><label><input aria-label={tr("Activer les p\u00E9dales")} type="checkbox" checked={p.enabled} onChange={e => update({ ...p, enabled: e.target.checked })}/>{tr(" Actif")}</label></div>
    <label className="pedal-preset">{tr("Son de d\u00E9part")}<select aria-label={tr("Preset de p\u00E9dales")} value={preset} onChange={e => { const selected = presets.find(item => item.id === e.target.value); if (selected)
        onChange({ ...track, pedals: selected.settings }); }}><option value="" disabled>{tr("Personnalis\u00E9")}</option>{presets.map(item => <option key={item.id} value={item.id}>{tr(item.name)}</option>)}</select></label>
    <fieldset className="pedal-controls" disabled={!p.enabled}><div className="mix-cards">
      <section className="mix-card"><h3>{tr("Saturation ")}<label><input aria-label={tr("Activer la saturation")} type="checkbox" checked={p.saturation.enabled} onChange={e => sat({ enabled: e.target.checked })}/>{tr(" Actif")}</label></h3><fieldset disabled={!p.saturation.enabled}>
        <label className="pedal-type">{tr("P\u00E9dale")}<select aria-label={tr("Type de saturation")} value={p.saturation.type} onChange={e => sat({ type: e.target.value as PedalType })}>{Object.entries(PEDAL_TYPES).map(([id, name]) => <option key={id} value={id}>{tr(name)}</option>)}</select></label>
        <Slider label={tr("Gain de la p\u00E9dale")} value={p.saturation.gain} onChange={gain => sat({ gain })}/>
        <Slider label={tr("Tonalit\u00E9 de la p\u00E9dale")} value={p.saturation.tone} onChange={tone => sat({ tone })}/>
        <Slider label={tr("Volume de la p\u00E9dale")} value={p.saturation.level} min={-18} max={12} step={.5} unit="dB" onChange={level => sat({ level })}/>
        <Slider label={tr("Blend \u00B7 son satur\u00E9")} value={p.saturation.blend} onChange={blend => sat({ blend })}/>
        <p>{source === 'bass' ? tr("Le Blend conserve une part du son direct pour garder les graves et l\u2019attaque. Essaie Fuzz \u00E9paisse pour un gros son grondant.") : tr("0 % : son direct \u00B7 100 % : saturation seule. Pour les grosses distos, essaie aussi le baffle dans la section Ampli.")}</p>
      </fieldset></section>
      <section className="mix-card"><h3>{tr("Chorus ")}<label><input aria-label={tr("Activer le chorus")} type="checkbox" checked={p.chorus.enabled} onChange={e => chorus({ enabled: e.target.checked })}/>{tr(" Actif")}</label></h3><fieldset disabled={!p.chorus.enabled}>
        <Slider label={tr("Quantit\u00E9 de chorus")} value={p.chorus.mix} max={50} onChange={mix => chorus({ mix })}/>
        <Slider label={tr("Vitesse du chorus")} value={p.chorus.rate} min={.1} max={5} step={.1} unit="Hz" onChange={rate => chorus({ rate })}/>
        <Slider label={tr("Profondeur du chorus")} value={p.chorus.depth} onChange={depth => chorus({ depth })}/><p>{tr("\u00C9largit le son et ajoute une l\u00E9g\u00E8re modulation.")}</p>
      </fieldset></section>
      <section className="mix-card"><h3>{tr("Delay ")}<label><input aria-label={tr("Activer le delay")} type="checkbox" checked={p.delay.enabled} onChange={e => delay({ enabled: e.target.checked })}/>{tr(" Actif")}</label></h3><fieldset disabled={!p.delay.enabled}>
        <Slider label={tr("Quantit\u00E9 de delay")} value={p.delay.mix} max={40} onChange={mix => delay({ mix })}/>
        <Slider label={tr("Temps du delay")} value={p.delay.time} min={60} max={600} step={10} unit="ms" onChange={time => delay({ time })}/>
        <Slider label={tr("R\u00E9p\u00E9titions du delay")} value={p.delay.feedback} max={50} onChange={feedback => delay({ feedback })}/><p>{tr("Ajoute des \u00E9chos. Le temps est fixe en millisecondes.")}</p>
      </fieldset></section>
    </div></fieldset>
    <p className="mix-help">{tr("R\u00E9glable \u00E0 la r\u00E9\u00E9coute et inclus dans le WAV du mix. Le fichier de ta prise reste intact. Les p\u00E9dales sont ind\u00E9pendantes de l\u2019ampli ; Actif permet de comparer avant/apr\u00E8s. Fuzz inspir\u00E9e des grosses p\u00E9dales classiques, sans reproduire un mod\u00E8le pr\u00E9cis.")}</p>
    <button className="mix-reset" onClick={() => onChange({ ...track, pedals: normalizePedals() })}>{tr("R\u00E9initialiser les p\u00E9dales")}</button>
  </details>;
}
