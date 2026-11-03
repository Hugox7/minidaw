import {useEffect, useRef, useState} from 'react';
import type {Note} from './types';
import {eraseMeasure, measureHasNotes} from './measureEditing';
export function useMeasureErase(notes: Note[], disabled: boolean, onNotes: (notes: Note[]) => void) {
  const [undo, setUndo] = useState<{notes: Note[]; bar: number} | null>(null), [message, setMessage] = useState('');
  const signature = JSON.stringify(notes), expected = useRef(signature);
  useEffect(() => {if (expected.current !== signature) {setUndo(null); setMessage(''); expected.current = signature;}}, [signature]);
  return {
    disabled, message, canUndo: Boolean(undo),
    canClear: (bar: number) => measureHasNotes(notes, bar),
    clear: (bar: number) => {
      if (disabled || !measureHasNotes(notes, bar)) return;
      const next = eraseMeasure(notes, bar, () => crypto.randomUUID());
      setUndo({notes, bar}); expected.current = JSON.stringify(next); onNotes(next); setMessage(`Mesure ${bar} vidée sur cette piste.`);
    },
    restore: () => {
      if (disabled || !undo) return;
      expected.current = JSON.stringify(undo.notes); onNotes(undo.notes); setMessage(`Contenu de la mesure ${undo.bar} restauré.`); setUndo(null);
    },
  };
}
export function MeasureEraseNotice({control}: {control: ReturnType<typeof useMeasureErase>}) {
  return <div className="measure-erase-notice"><span role="status">{control.message || 'La poubelle à côté de chaque numéro vide uniquement cette mesure de la piste.'}</span>{control.canUndo && <button disabled={control.disabled} onClick={control.restore}>Annuler le vidage de mesure</button>}</div>;
}
