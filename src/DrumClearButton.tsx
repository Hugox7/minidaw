import {tr} from './i18n';
import { useEffect, useRef, useState } from 'react';
import type { Track } from './types';
type Passage = Pick<Track, 'notes' | 'repeatEndStep'>;
export default function DrumClearButton({ track, disabled, onChange }: {
    track: Track;
    disabled: boolean;
    onChange: (passage: Passage) => void;
}) {
    const [undo, setUndo] = useState<Passage | null>(null);
    const signature = JSON.stringify([track.notes, track.repeatEndStep]), expected = useRef(signature);
    useEffect(() => { if (expected.current !== signature) {
        setUndo(null);
        expected.current = signature;
    } }, [signature]);
    return <>
    <button disabled={disabled || !track.notes.length} onClick={() => {
            if (disabled)
                return;
            setUndo({ notes: track.notes, repeatEndStep: track.repeatEndStep });
            expected.current = JSON.stringify([[], undefined]);
            onChange({ notes: [], repeatEndStep: undefined });
        }}>{tr("Vider la batterie")}</button>
    {undo && <button disabled={disabled} onClick={() => {
                if (disabled || !undo)
                    return;
                expected.current = JSON.stringify([undo.notes, undo.repeatEndStep]);
                onChange(undo);
                setUndo(null);
            }}>{tr("Annuler le vidage")}</button>}
  </>;
}
