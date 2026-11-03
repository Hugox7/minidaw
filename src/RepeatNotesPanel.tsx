import {useEffect, useRef, useState} from 'react';
import type {Track} from './types';
import {copyMeasure, hasMeasureContent, measureNotes, measureTargets} from './repeatNotes';
import type {MeasureCopyMode} from './repeatNotes';
type Passage = Pick<Track, 'notes' | 'repeatEndStep'>;
export default function RepeatNotesPanel({track, bars, disabled, onChange}: {track: Track; bars: number; disabled: boolean; onChange: (passage: Passage, bars?: number) => void}) {
  const [source, setSource] = useState(1), [feedback, setFeedback] = useState(''), [undo, setUndo] = useState<{passage: Passage; source: number} | null>(null);
  const bar = Math.min(source, bars), empty = measureNotes(track, bar).length === 0;
  const signature = JSON.stringify([track.notes, track.repeatEndStep]), expected = useRef(signature);
  useEffect(() => {if (expected.current !== signature) {setUndo(null); setFeedback(''); expected.current = signature;}}, [signature]);
  function copy(mode: MeasureCopyMode) {
    if (disabled) return;
    const result = copyMeasure(track, bar, bars, mode, () => crypto.randomUUID());
    if (result.error) {setFeedback(result.error); return;}
    const occupied = hasMeasureContent(track, measureTargets(bar, bars, mode));
    if (occupied && !confirm(mode === 'next' ? `Remplacer le contenu de la mesure ${bar + 1} de cette piste par la mesure ${bar} ? Tu pourras annuler.` : `Répéter la mesure ${bar} sur tout le morceau ? Le contenu des autres mesures de cette piste sera remplacé. Tu pourras annuler.`)) return;
    const next = {notes: result.notes, repeatEndStep: result.repeatEndStep};
    setUndo({passage: {notes: track.notes, repeatEndStep: track.repeatEndStep}, source: bar}); expected.current = JSON.stringify([next.notes, next.repeatEndStep]);
    onChange(next, result.bars);
    if (mode === 'next') {setSource(bar + 1); setFeedback(`Mesure ${bar} copiée en mesure ${bar + 1}. Un nouveau clic copiera la mesure ${bar + 1} en ${bar + 2}.`);}
    else setFeedback(`Mesure ${bar} répétée sur les ${bars} mesures du morceau, sur cette piste.`);
  }
  return <section className="repeat-notes-panel" aria-label="Copier une mesure">
    <div className="repeat-notes-controls"><strong>Copier une mesure</strong>
      <label>Mesure source<select aria-label="Mesure source à copier" value={bar} disabled={disabled} onChange={e => {setSource(Number(e.target.value)); setFeedback('');}}>{Array.from({length: bars}, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
      <button disabled={disabled || empty || bar >= 1024} onClick={() => copy('next')}>Copier à la mesure suivante</button>
      <button disabled={disabled || empty || bars < 2} onClick={() => copy('fill')}>Remplir le morceau</button>
      <button disabled={disabled || !undo} onClick={() => {if (disabled || !undo) return; expected.current = JSON.stringify([undo.passage.notes, undo.passage.repeatEndStep]); onChange(undo.passage); setSource(undo.source); setUndo(null); setFeedback('Dernière copie annulée. La durée du morceau est conservée.');}}>Annuler la copie</button>
    </div>
    <p>{empty ? `La mesure ${bar} est vide. Choisis une mesure contenant des notes ou des coups.` : `Copier : mesure ${bar} → mesure ${bar + 1}${bar === bars ? ' (une mesure sera ajoutée)' : ''}. Remplir : répéter la mesure ${bar} sur les ${bars} mesures actuelles.`} Les autres pistes restent inchangées.</p>
    {feedback && <p className="repeat-feedback" role="status">{feedback}</p>}
  </section>;
}
