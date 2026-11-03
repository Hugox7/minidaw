import type {Track} from './types';
import {AUDIO_SOURCES, normalizeSource} from './ampSettings';
import {canUsePedals, normalizePedals, pedalPresets, PEDAL_TYPES} from './pedalSettings';
import type {PedalSettings, PedalType} from './pedalSettings';
function Slider({label, value, min = 0, max = 100, step = 1, unit = '%', onChange}: {label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (value: number) => void}) {
  return <label className="mix-slider"><span>{label}<output>{value} {unit}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/></label>;
}
export default function PedalPanel({track, onChange}: {track: Track; onChange: (track: Track) => void}) {
  if (!canUsePedals(track)) return null;
  const source = normalizeSource(track.audioSource), p = normalizePedals(track.pedals);
  const update = (settings: PedalSettings) => onChange({...track, pedals: settings});
  const sat = (patch: Partial<PedalSettings['saturation']>) => update({...p, saturation: {...p.saturation, ...patch}});
  const chorus = (patch: Partial<PedalSettings['chorus']>) => update({...p, chorus: {...p.chorus, ...patch}});
  const delay = (patch: Partial<PedalSettings['delay']>) => update({...p, delay: {...p.delay, ...patch}});
  const presets = pedalPresets(source);
  const preset = presets.find(item => JSON.stringify(item.settings) === JSON.stringify(p))?.id ?? '';
  return <details className="mix-panel pedal-panel" open>
    <summary>Pédales · {AUDIO_SOURCES[source]}</summary>
    <div className="pedal-heading"><p>Saturation → Chorus → Delay → Ampli / baffle → Mixage</p><label><input aria-label="Activer les pédales" type="checkbox" checked={p.enabled} onChange={e => update({...p, enabled: e.target.checked})}/> Actif</label></div>
    <label className="pedal-preset">Son de départ<select aria-label="Preset de pédales" value={preset} onChange={e => {const selected = presets.find(item => item.id === e.target.value); if (selected) onChange({...track, pedals: selected.settings});}}><option value="" disabled>Personnalisé</option>{presets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <fieldset className="pedal-controls" disabled={!p.enabled}><div className="mix-cards">
      <section className="mix-card"><h3>Saturation <label><input aria-label="Activer la saturation" type="checkbox" checked={p.saturation.enabled} onChange={e => sat({enabled: e.target.checked})}/> Actif</label></h3><fieldset disabled={!p.saturation.enabled}>
        <label className="pedal-type">Pédale<select aria-label="Type de saturation" value={p.saturation.type} onChange={e => sat({type: e.target.value as PedalType})}>{Object.entries(PEDAL_TYPES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <Slider label="Gain de la pédale" value={p.saturation.gain} onChange={gain => sat({gain})}/>
        <Slider label="Tonalité de la pédale" value={p.saturation.tone} onChange={tone => sat({tone})}/>
        <Slider label="Volume de la pédale" value={p.saturation.level} min={-18} max={12} step={.5} unit="dB" onChange={level => sat({level})}/>
        <Slider label="Blend · son saturé" value={p.saturation.blend} onChange={blend => sat({blend})}/>
        <p>{source === 'bass' ? 'Le Blend conserve une part du son direct pour garder les graves et l’attaque. Essaie Fuzz épaisse pour un gros son grondant.' : '0 % : son direct · 100 % : saturation seule. Pour les grosses distos, essaie aussi le baffle dans la section Ampli.'}</p>
      </fieldset></section>
      <section className="mix-card"><h3>Chorus <label><input aria-label="Activer le chorus" type="checkbox" checked={p.chorus.enabled} onChange={e => chorus({enabled: e.target.checked})}/> Actif</label></h3><fieldset disabled={!p.chorus.enabled}>
        <Slider label="Quantité de chorus" value={p.chorus.mix} max={50} onChange={mix => chorus({mix})}/>
        <Slider label="Vitesse du chorus" value={p.chorus.rate} min={.1} max={5} step={.1} unit="Hz" onChange={rate => chorus({rate})}/>
        <Slider label="Profondeur du chorus" value={p.chorus.depth} onChange={depth => chorus({depth})}/><p>Élargit le son et ajoute une légère modulation.</p>
      </fieldset></section>
      <section className="mix-card"><h3>Delay <label><input aria-label="Activer le delay" type="checkbox" checked={p.delay.enabled} onChange={e => delay({enabled: e.target.checked})}/> Actif</label></h3><fieldset disabled={!p.delay.enabled}>
        <Slider label="Quantité de delay" value={p.delay.mix} max={40} onChange={mix => delay({mix})}/>
        <Slider label="Temps du delay" value={p.delay.time} min={60} max={600} step={10} unit="ms" onChange={time => delay({time})}/>
        <Slider label="Répétitions du delay" value={p.delay.feedback} max={50} onChange={feedback => delay({feedback})}/><p>Ajoute des échos. Le temps est fixe en millisecondes.</p>
      </fieldset></section>
    </div></fieldset>
    <p className="mix-help">Réglable à la réécoute et inclus dans le WAV du mix. Le fichier de ta prise reste intact. Les pédales sont indépendantes de l’ampli ; Actif permet de comparer avant/après. Fuzz inspirée des grosses pédales classiques, sans reproduire un modèle précis.</p>
    <button className="mix-reset" onClick={() => onChange({...track, pedals: normalizePedals()})}>Réinitialiser les pédales</button>
  </details>;
}
