import {tr} from './i18n';
import { useEffect, useRef, useState } from 'react';
import type { Track } from './types';
import { copyMeasure, hasMeasureContent, measureNotes, measureTargets } from './repeatNotes';
import type { MeasureCopyMode } from './repeatNotes';
type Passage = Pick<Track, 'notes' | 'repeatEndStep'>;
export default function RepeatNotesPanel({ track, bars, disabled, onChange }: {
    track: Track;
    bars: number;
    disabled: boolean;
    onChange: (passage: Passage, bars?: number) => void;
}) {
    const [source, setSource] = useState(1), [feedback, setFeedback] = useState(''), [undo, setUndo] = useState<{
        passage: Passage;
        source: number;
    } | null>(null);
    const bar = Math.min(source, bars), empty = measureNotes(track, bar).length === 0;
    const signature = JSON.stringify([track.notes, track.repeatEndStep]), expected = useRef(signature);
    useEffect(() => { if (expected.current !== signature) {
        setUndo(null);
        setFeedback('');
        expected.current = signature;
    } }, [signature]);
    function copy(mode: MeasureCopyMode) {
        if (disabled)
            return;
        const result = copyMeasure(track, bar, bars, mode, () => crypto.randomUUID());
        if (result.error) {
            setFeedback(result.error);
            return;
        }
        const occupied = hasMeasureContent(track, measureTargets(bar, bars, mode));
        if (occupied && !confirm(mode === 'next' ? tr("Remplacer le contenu de la mesure {{v0}} de cette piste par la mesure {{v1}} ? Tu pourras annuler.", { v0: bar + 1, v1: bar }) : tr("R\u00E9p\u00E9ter la mesure {{v0}} sur tout le morceau ? Le contenu des autres mesures de cette piste sera remplac\u00E9. Tu pourras annuler.", { v0: bar })))
            return;
        const next = { notes: result.notes, repeatEndStep: result.repeatEndStep };
        setUndo({ passage: { notes: track.notes, repeatEndStep: track.repeatEndStep }, source: bar });
        expected.current = JSON.stringify([next.notes, next.repeatEndStep]);
        onChange(next, result.bars);
        if (mode === 'next') {
            setSource(bar + 1);
            setFeedback(tr("Mesure {{v0}} copi\u00E9e en mesure {{v1}}. Un nouveau clic copiera la mesure {{v2}} en {{v3}}.", { v0: bar, v1: bar + 1, v2: bar + 1, v3: bar + 2 }));
        }
        else
            setFeedback(tr("Mesure {{v0}} r\u00E9p\u00E9t\u00E9e sur les {{v1}} mesures du morceau, sur cette piste.", { v0: bar, v1: bars }));
    }
    return <section className="repeat-notes-panel" aria-label={tr("Copier une mesure")}>
    <div className="repeat-notes-controls"><strong>{tr("Copier une mesure")}</strong>
      <label>{tr("Mesure source")}<select aria-label={tr("Mesure source \u00E0 copier")} value={bar} disabled={disabled} onChange={e => { setSource(Number(e.target.value)); setFeedback(''); }}>{Array.from({ length: bars }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
      <button disabled={disabled || empty || bar >= 1024} onClick={() => copy('next')}>{tr("Copier \u00E0 la mesure suivante")}</button>
      <button disabled={disabled || empty || bars < 2} onClick={() => copy('fill')}>{tr("Remplir le morceau")}</button>
      <button disabled={disabled || !undo} onClick={() => { if (disabled || !undo)
        return; expected.current = JSON.stringify([undo.passage.notes, undo.passage.repeatEndStep]); onChange(undo.passage); setSource(undo.source); setUndo(null); setFeedback(tr("Derni\u00E8re copie annul\u00E9e. La dur\u00E9e du morceau est conserv\u00E9e.")); }}>{tr("Annuler la copie")}</button>
    </div>
    <p>{empty ? tr("La mesure {{v0}} est vide. Choisis une mesure contenant des notes ou des coups.", { v0: bar }) : tr("Copier : mesure {{v0}} \u2192 mesure {{v1}}{{v2}}. Remplir : r\u00E9p\u00E9ter la mesure {{v3}} sur les {{v4}} mesures actuelles.", { v0: bar, v1: bar + 1, v2: bar === bars ? tr(" (une mesure sera ajout\u00E9e)") : '', v3: bar, v4: bars })}{tr(" Les autres pistes restent inchang\u00E9es.")}</p>
    {tr(feedback) && <p className="repeat-feedback" role="status">{tr(feedback)}</p>}
  </section>;
}
