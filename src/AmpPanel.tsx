import type {Track} from './types';
import {AMP_CHARACTERS, AUDIO_SOURCES, canUseAmp, normalizeAmp, normalizeSource} from './ampSettings';
import type {AmpSettings} from './ampSettings';
import PedalPanel from './PedalPanel';
import {normalizePedals} from './pedalSettings';
export default function AmpPanel({track, onChange, disabled}: {track: Track; onChange: (track: Track) => void; disabled: boolean}) {
  if (track.kind !== 'audio') return null;
  const source = normalizeSource(track.audioSource), amp = normalizeAmp(track.amp);
  const update = (patch: Partial<AmpSettings>) => onChange({...track, amp: {...amp, ...patch}});
  return <div className="instrument-source">
    <label>Source de cette piste<select aria-label="Source de cette piste" value={source} disabled={disabled} onChange={e => onChange({...track, audioSource: normalizeSource(e.target.value), amp: {...amp, enabled: false, cabinet: false}, pedals: {...normalizePedals(track.pedals), enabled: false}})}>{Object.entries(AUDIO_SOURCES).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
    <span>Décrit le son enregistré ; l’entrée de la carte son se choisit plus bas.</span>
    <PedalPanel key={`pedals-${track.id}-${source}`} track={track} onChange={onChange}/>
    {canUseAmp(track) && <details className="mix-panel amp-panel" open><summary>Ampli · {AUDIO_SOURCES[source]}</summary>
      <div className="amp-heading"><p>Ajoute de la couleur à la réécoute, sans modifier ta prise originale.</p><label><input type="checkbox" aria-label="Activer l’ampli" checked={amp.enabled} onChange={e => update({enabled: e.target.checked})}/> Actif</label></div>
      <fieldset disabled={!amp.enabled} className="amp-controls"><label>Caractère<select aria-label="Caractère de l’ampli" value={amp.character} onChange={e => update({character: e.target.value as AmpSettings['character']})}>{Object.entries(AMP_CHARACTERS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
        <label className="mix-slider"><span>Gain<output>{amp.drive} %</output></span><input aria-label="Gain de l’ampli" type="range" min={0} max={100} value={amp.drive} onChange={e => update({drive: Number(e.target.value)})}/></label>
        <label className="mix-slider"><span>Tonalité<output>{amp.tone} %</output></span><input aria-label="Tonalité de l’ampli" type="range" min={0} max={100} value={amp.tone} onChange={e => update({tone: Number(e.target.value)})}/><small>Sombre ↔ Brillante</small></label>
        <label className="mix-slider"><span>Niveau de sortie<output>{amp.level > 0 ? '+' : ''}{amp.level} dB</output></span><input aria-label="Niveau de sortie de l’ampli" type="range" min={-18} max={6} step={.5} value={amp.level} onChange={e => update({level: Number(e.target.value)})}/></label>
      </fieldset><p className="mix-help">{source === 'bass' ? 'Une part du son direct est conservée pour garder l’assise de la basse.' : 'Coloration dédiée à la guitare électrique, du son clair au grain rock.'} Utilise Actif pour comparer avant/après.</p>
      <label className="cabinet-toggle"><input type="checkbox" aria-label="Activer le baffle" checked={amp.cabinet === true} onChange={e => update({cabinet: e.target.checked})}/> Baffle · {source === 'bass' ? 'assise et aigus adoucis' : 'arrondir les grosses distorsions'}</label><p className="mix-help">Filtrage de type baffle, activable même avec l’ampli éteint. Simulation légère, sans réponse impulsionnelle de baffle réel.</p>
    </details>}
  </div>;
}
