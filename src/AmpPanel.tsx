import {tr} from './i18n';
import type { Track } from './types';
import { AMP_CHARACTERS, AUDIO_SOURCES, canUseAmp, normalizeAmp, normalizeSource } from './ampSettings';
import type { AmpSettings } from './ampSettings';
import PedalPanel from './PedalPanel';
import { normalizePedals } from './pedalSettings';
export default function AmpPanel({ track, onChange, disabled }: {
    track: Track;
    onChange: (track: Track) => void;
    disabled: boolean;
}) {
    if (track.kind !== 'audio')
        return null;
    const source = normalizeSource(track.audioSource), amp = normalizeAmp(track.amp);
    const update = (patch: Partial<AmpSettings>) => onChange({ ...track, amp: { ...amp, ...patch } });
    return <div className="instrument-source">
    <label>{tr("Source de cette piste")}<select aria-label={tr("Source de cette piste")} value={source} disabled={disabled} onChange={e => onChange({ ...track, audioSource: normalizeSource(e.target.value), amp: { ...amp, enabled: false, cabinet: false }, pedals: { ...normalizePedals(track.pedals), enabled: false } })}>{Object.entries(AUDIO_SOURCES).map(([key, name]) => <option key={key} value={key}>{tr(name)}</option>)}</select></label>
    <span>{tr("D\u00E9crit le son enregistr\u00E9 ; l\u2019entr\u00E9e de la carte son se choisit plus bas.")}</span>
    <PedalPanel key={`pedals-${track.id}-${source}`} track={track} onChange={onChange}/>
    {canUseAmp(track) && <details className="mix-panel amp-panel" open><summary>{tr("Ampli \u00B7 ")}{tr(AUDIO_SOURCES[source])}</summary>
      <div className="amp-heading"><p>{tr("Ajoute de la couleur \u00E0 la r\u00E9\u00E9coute, sans modifier ta prise originale.")}</p><label><input type="checkbox" aria-label={tr("Activer l\u2019ampli")} checked={amp.enabled} onChange={e => update({ enabled: e.target.checked })}/>{tr(" Actif")}</label></div>
      <fieldset disabled={!amp.enabled} className="amp-controls"><label>{tr("Caract\u00E8re")}<select aria-label={tr("Caract\u00E8re de l\u2019ampli")} value={amp.character} onChange={e => update({ character: e.target.value as AmpSettings['character'] })}>{Object.entries(AMP_CHARACTERS).map(([key, name]) => <option key={key} value={key}>{tr(name)}</option>)}</select></label>
        <label className="mix-slider"><span>{tr("Gain")}<output>{amp.drive} %</output></span><input aria-label={tr("Gain de l\u2019ampli")} type="range" min={0} max={100} value={amp.drive} onChange={e => update({ drive: Number(e.target.value) })}/></label>
        <label className="mix-slider"><span>{tr("Tonalit\u00E9")}<output>{amp.tone} %</output></span><input aria-label={tr("Tonalit\u00E9 de l\u2019ampli")} type="range" min={0} max={100} value={amp.tone} onChange={e => update({ tone: Number(e.target.value) })}/><small>{tr("Sombre \u2194 Brillante")}</small></label>
        <label className="mix-slider"><span>{tr("Niveau de sortie")}<output>{amp.level > 0 ? '+' : ''}{amp.level}{tr(" dB")}</output></span><input aria-label={tr("Niveau de sortie de l\u2019ampli")} type="range" min={-18} max={6} step={.5} value={amp.level} onChange={e => update({ level: Number(e.target.value) })}/></label>
      </fieldset><p className="mix-help">{source === 'bass' ? tr("Une part du son direct est conserv\u00E9e pour garder l\u2019assise de la basse.") : tr("Coloration d\u00E9di\u00E9e \u00E0 la guitare \u00E9lectrique, du son clair au grain rock.")}{tr(" Utilise Actif pour comparer avant/apr\u00E8s.")}</p>
      <label className="cabinet-toggle"><input type="checkbox" aria-label={tr("Activer le baffle")} checked={amp.cabinet === true} onChange={e => update({ cabinet: e.target.checked })}/>{tr(" Baffle \u00B7 ")}{source === 'bass' ? tr("assise et aigus adoucis") : tr("arrondir les grosses distorsions")}</label><p className="mix-help">{tr("Filtrage de type baffle, activable m\u00EAme avec l\u2019ampli \u00E9teint. Simulation l\u00E9g\u00E8re, sans r\u00E9ponse impulsionnelle de baffle r\u00E9el.")}</p>
    </details>}
  </div>;
}
