import {tr} from './i18n';
import { MeasureEraseNotice, useMeasureErase } from './MeasureErase';
import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { Note, Track } from './types';
import { DRUMS, RHYTHMS, RHYTHM_CATEGORIES, addRhythm } from './drums';
import type { RhythmId } from './drums';
import { cellsBetween } from './noteEditing';
import { TimelineRuler, useTimelineView } from './TimelineNavigation';
import { previewNote } from './audio';
type Props = {
    actions?: ReactNode;
    track: Track;
    bars: number;
    disabled: boolean;
    playing: boolean;
    playhead: number;
    onNotes: (notes: Note[]) => void;
};
type Cell = {
    step: number;
    midi: number;
};
const CELL = 27, ROW = 48, HEAD = 155;
export default function DrumRoll({ actions, track, bars, disabled, playing, playhead, onNotes }: Props) {
    const measureErase = useMeasureErase(track.notes, disabled, onNotes);
    const scroll = useRef<HTMLDivElement>(null);
    useTimelineView(`editor-${track.id}`, scroll, CELL * 4, bars);
    const [rhythm, setRhythm] = useState<RhythmId>('rock');
    const [target, setTarget] = useState('all');
    const [velocity, setVelocity] = useState(.75);
    const [message, setMessage] = useState('');
    const surface = useRef<HTMLDivElement>(null);
    const notes = useRef(track.notes);
    notes.current = track.notes;
    const gesture = useRef<{
        pointer: number;
        erase: boolean;
        last: Cell;
        visited: Set<string>;
    } | null>(null);
    const steps = bars * 16;
    function write(next: Note[]) { notes.current = next; onNotes(next); }
    function position(event: ReactPointerEvent): Cell {
        const rect = surface.current!.getBoundingClientRect();
        return { step: Math.max(0, Math.min(steps - 1, Math.floor((event.clientX - rect.left) / CELL))), midi: Math.max(0, Math.min(DRUMS.length - 1, Math.floor((event.clientY - rect.top) / ROW))) };
    }
    function paint(cell: Cell, erase: boolean) {
        const midi = DRUMS[cell.midi].midi;
        const existing = notes.current.find(n => n.midi === midi && n.step === cell.step);
        if (erase) {
            if (existing)
                write(notes.current.filter(n => n.id !== existing.id));
        }
        else if (!existing)
            write([...notes.current, { id: crypto.randomUUID(), midi, step: cell.step, duration: 1, velocity }]);
    }
    function begin(event: ReactPointerEvent) {
        if (disabled || event.button !== 0)
            return;
        event.preventDefault();
        const cell = position(event);
        const erase = event.altKey || notes.current.some(n => n.midi === DRUMS[cell.midi].midi && n.step === cell.step);
        gesture.current = { pointer: event.pointerId, erase, last: cell, visited: new Set([`${cell.step}:${cell.midi}`]) };
        surface.current!.setPointerCapture(event.pointerId);
        paint(cell, erase);
        if (!erase)
            void previewNote(DRUMS[cell.midi].midi, track).catch(() => setMessage(tr("La pr\u00E9\u00E9coute audio n\u2019a pas d\u00E9marr\u00E9.")));
    }
    function drag(event: ReactPointerEvent) {
        const g = gesture.current;
        if (!g || g.pointer !== event.pointerId)
            return;
        const cell = position(event);
        for (const c of cellsBetween(g.last, cell)) {
            const key = `${c.step}:${c.midi}`;
            if (!g.visited.has(key)) {
                g.visited.add(key);
                paint(c, g.erase);
            }
        }
        g.last = cell;
    }
    function end(event: ReactPointerEvent) {
        if (gesture.current?.pointer !== event.pointerId)
            return;
        gesture.current = null;
        if (surface.current?.hasPointerCapture(event.pointerId))
            surface.current.releasePointerCapture(event.pointerId);
    }
    function fill() {
        const chosen = target === 'all' ? 'all' : Math.min(Number(target), bars - 1);
        const next = addRhythm(notes.current, rhythm, bars, chosen);
        setMessage(tr("{{v0}} coups ajout\u00E9s \u00B7 {{v1}}. Les coups existants sont conserv\u00E9s.", { v0: next.length - notes.current.length, v1: tr(RHYTHMS[rhythm].name) }));
        write(next);
    }
    return <>
    <div className="drum-toolbar">
      <label>{tr("Rythme")}<select aria-label={tr("Rythme de batterie")} disabled={disabled} value={rhythm} onChange={e => setRhythm(e.target.value as RhythmId)}>{RHYTHM_CATEGORIES.map(category => <optgroup key={category} label={tr(category)}>{Object.entries(RHYTHMS).filter(([, pattern]) => pattern.category === category).map(([id, pattern]) => <option key={id} value={id}>{tr(pattern.name)}</option>)}</optgroup>)}</select></label>
      <label>{tr("Sur")}<select disabled={disabled} value={target === 'all' ? 'all' : String(Math.min(Number(target), bars - 1))} onChange={e => setTarget(e.target.value)}><option value="all">{tr("Tout le morceau")}</option>{Array.from({ length: bars }, (_, i) => <option key={i} value={i}>{tr("Mesure ")}{i + 1}</option>)}</select></label>
      <button disabled={disabled} onClick={fill}>{tr("+ Ajouter le rythme")}</button>
      <label>{tr("Force des nouveaux coups")}<select disabled={disabled} value={velocity} onChange={e => setVelocity(Number(e.target.value))}><option value={.45}>{tr("Doux")}</option><option value={.75}>{tr("Normal")}</option><option value={1}>{tr("Accentu\u00E9")}</option></select></label>
    </div>
    <p className="rhythm-description"><strong>{tr(RHYTHMS[rhythm].name)}</strong> · {tr(RHYTHMS[rhythm].description)} <span>{tr("Tempo indicatif : ")}{RHYTHMS[rhythm].bpm[0]}–{RHYTHMS[rhythm].bpm[1]}{tr(" BPM \u00B7 1 mesure en 4/4")}</span></p>
    <p className="drum-help">{tr("Clique pour ajouter ou retirer un coup. Maintiens le clic pour remplir ou effacer en balayant. Les rythmes s\u2019ajoutent sans effacer tes coups.")}</p>
    <p className="drum-message" role="status" aria-live="polite">{disabled ? tr("Arr\u00EAte la lecture pour modifier la batterie.") : tr(message)}</p>
    {actions && <div className="drum-toolbar drum-edit-actions" role="group" aria-label={tr("Actions de la batterie")}>{actions}</div>}
    <MeasureEraseNotice control={measureErase}/>
    <div ref={scroll} className="drum-scroll" data-timeline-head={HEAD}><div className="drum-content" style={{ width: HEAD + steps * CELL }}>
      <TimelineRuler bars={bars} pixelsPerBeat={CELL * 4} head={HEAD} onClearMeasure={measureErase.clear} canClearMeasure={measureErase.canClear} disabled={disabled} label="BATTERIE"/>
      <div className="drum-body"><div className="drum-labels" style={{ width: HEAD }}>{DRUMS.map(drum => <button key={drum.midi} disabled={disabled || track.muted} onClick={() => void previewNote(drum.midi, track).catch(() => setMessage(tr("La pr\u00E9\u00E9coute audio n\u2019a pas d\u00E9marr\u00E9.")))} title={tr("\u00C9couter : {{v0}}", { v0: drum.name })}>{tr(drum.name)}<small>▶ {tr(drum.short)}</small></button>)}</div>
        <div ref={surface} className="drum-grid" style={{ width: steps * CELL }} onPointerDown={begin} onPointerMove={drag} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { gesture.current = null; }}>
          {DRUMS.map((drum, row) => <div className="drum-row" key={drum.midi}>{Array.from({ length: steps }, (_, step) => {
                const hit = track.notes.find(n => n.midi === drum.midi && n.step === step);
                return <button key={step} disabled={disabled} aria-pressed={Boolean(hit)} aria-label={`${drum.name}, mesure ${Math.floor(step / 16) + 1}, pas ${step % 16 + 1}`} className={`drum-step ${step % 16 === 0 ? 'bar-start' : step % 4 === 0 ? 'beat-start' : ''} ${hit ? 'hit' : ''} ${playing && playhead === step ? 'current' : ''}`} style={hit ? { background: track.color, opacity: .45 + hit.velocity * .55 } : undefined} onClick={e => { if (e.detail === 0 && !disabled) {
                    paint({ step, midi: row }, Boolean(hit));
                    if (!hit)
                        void previewNote(drum.midi, track).catch(() => { });
                } }}>{hit ? '●' : step % 4 === 0 ? step % 16 / 4 + 1 : '·'}</button>;
            })}</div>)}
        </div>
      </div>
    </div></div>
    {track.drumKit === 'acoustic' && <p className="sample-credit">{tr("Samples : Pearl Master Studio Pack 1 par enoe \u00B7 ")}<a href="/samples/pearl/CREDITS.md" target="_blank" rel="noreferrer">{tr("Cr\u00E9dits et licence CC BY 3.0")}</a></p>}
    <div className="editor-footer"><span>{tr("6 percussions \u00B7 16 pas par mesure \u00B7 ")}{track.drumKit === 'acoustic' ? tr("Kit acoustique Pearl \u00B7 clap synth\u00E9tique") : tr("Batterie synth\u00E9tique")}</span><span>{track.notes.length}{tr(" coups sur la piste")}</span></div>
  </>;
}
