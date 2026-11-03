import {tr} from './i18n';
import { useEffect, useRef, useState } from 'react';
import type { Note } from './types';
import { eraseMeasure, measureHasNotes } from './measureEditing';
export function useMeasureErase(notes: Note[], disabled: boolean, onNotes: (notes: Note[]) => void) {
    const [undo, setUndo] = useState<{
        notes: Note[];
        bar: number;
    } | null>(null), [message, setMessage] = useState('');
    const signature = JSON.stringify(notes), expected = useRef(signature);
    useEffect(() => { if (expected.current !== signature) {
        setUndo(null);
        setMessage('');
        expected.current = signature;
    } }, [signature]);
    return {
        disabled, message, canUndo: Boolean(undo),
        canClear: (bar: number) => measureHasNotes(notes, bar),
        clear: (bar: number) => {
            if (disabled || !measureHasNotes(notes, bar))
                return;
            const next = eraseMeasure(notes, bar, () => crypto.randomUUID());
            setUndo({ notes, bar });
            expected.current = JSON.stringify(next);
            onNotes(next);
            setMessage(tr("Mesure {{v0}} vid\u00E9e sur cette piste.", { v0: bar }));
        },
        restore: () => {
            if (disabled || !undo)
                return;
            expected.current = JSON.stringify(undo.notes);
            onNotes(undo.notes);
            setMessage(tr("Contenu de la mesure {{v0}} restaur\u00E9.", { v0: undo.bar }));
            setUndo(null);
        },
    };
}
export function MeasureEraseNotice({ control }: {
    control: ReturnType<typeof useMeasureErase>;
}) {
    return <div className="measure-erase-notice"><span role="status">{tr(control.message) || tr("La poubelle \u00E0 c\u00F4t\u00E9 de chaque num\u00E9ro vide uniquement cette mesure de la piste.")}</span>{control.canUndo && <button disabled={control.disabled} onClick={control.restore}>{tr("Annuler le vidage de mesure")}</button>}</div>;
}
