import {MeasureEraseNotice, useMeasureErase} from './MeasureErase';
import {useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent, ReactNode} from 'react';
import type {Note, Track} from './types';
import {DRUMS, RHYTHMS, RHYTHM_CATEGORIES, addRhythm} from './drums';
import type {RhythmId} from './drums';
import {cellsBetween} from './noteEditing';
import {TimelineRuler, useTimelineView} from './TimelineNavigation';
import {previewNote} from './audio';

type Props = {actions?: ReactNode; track: Track; bars: number; disabled: boolean; playing: boolean; playhead: number; onNotes: (notes: Note[]) => void};
type Cell = {step: number; midi: number};
const CELL = 27, ROW = 48, HEAD = 155;
export default function DrumRoll({actions, track, bars, disabled, playing, playhead, onNotes}: Props) {
  const measureErase = useMeasureErase(track.notes, disabled, onNotes);
  const scroll = useRef<HTMLDivElement>(null);
  useTimelineView(`editor-${track.id}`, scroll, CELL * 4, bars);
  const [rhythm, setRhythm] = useState<RhythmId>('rock');
  const [target, setTarget] = useState('all');
  const [velocity, setVelocity] = useState(.75);
  const [message, setMessage] = useState('');
  const surface = useRef<HTMLDivElement>(null);
  const notes = useRef(track.notes); notes.current = track.notes;
  const gesture = useRef<{pointer: number; erase: boolean; last: Cell; visited: Set<string>} | null>(null);
  const steps = bars * 16;
  function write(next: Note[]) {notes.current = next; onNotes(next);}
  function position(event: ReactPointerEvent): Cell {
    const rect = surface.current!.getBoundingClientRect();
    return {step: Math.max(0, Math.min(steps - 1, Math.floor((event.clientX - rect.left) / CELL))), midi: Math.max(0, Math.min(DRUMS.length - 1, Math.floor((event.clientY - rect.top) / ROW)))};
  }
  function paint(cell: Cell, erase: boolean) {
    const midi = DRUMS[cell.midi].midi;
    const existing = notes.current.find(n => n.midi === midi && n.step === cell.step);
    if (erase) {if (existing) write(notes.current.filter(n => n.id !== existing.id));}
    else if (!existing) write([...notes.current, {id: crypto.randomUUID(), midi, step: cell.step, duration: 1, velocity}]);
  }
  function begin(event: ReactPointerEvent) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    const cell = position(event);
    const erase = event.altKey || notes.current.some(n => n.midi === DRUMS[cell.midi].midi && n.step === cell.step);
    gesture.current = {pointer: event.pointerId, erase, last: cell, visited: new Set([`${cell.step}:${cell.midi}`])};
    surface.current!.setPointerCapture(event.pointerId);
    paint(cell, erase);
    if (!erase) void previewNote(DRUMS[cell.midi].midi, track).catch(() => setMessage('La préécoute audio n’a pas démarré.'));
  }
  function drag(event: ReactPointerEvent) {
    const g = gesture.current;
    if (!g || g.pointer !== event.pointerId) return;
    const cell = position(event);
    for (const c of cellsBetween(g.last, cell)) {
      const key = `${c.step}:${c.midi}`;
      if (!g.visited.has(key)) {g.visited.add(key); paint(c, g.erase);}
    }
    g.last = cell;
  }
  function end(event: ReactPointerEvent) {
    if (gesture.current?.pointer !== event.pointerId) return;
    gesture.current = null;
    if (surface.current?.hasPointerCapture(event.pointerId)) surface.current.releasePointerCapture(event.pointerId);
  }
  function fill() {
    const chosen = target === 'all' ? 'all' : Math.min(Number(target), bars - 1);
    const next = addRhythm(notes.current, rhythm, bars, chosen);
    setMessage(`${next.length - notes.current.length} coups ajoutés · ${RHYTHMS[rhythm].name}. Les coups existants sont conservés.`);
    write(next);
  }
  return <>
    <div className="drum-toolbar">
      <label>Rythme<select aria-label="Rythme de batterie" disabled={disabled} value={rhythm} onChange={e => setRhythm(e.target.value as RhythmId)}>{RHYTHM_CATEGORIES.map(category => <optgroup key={category} label={category}>{Object.entries(RHYTHMS).filter(([, pattern]) => pattern.category === category).map(([id, pattern]) => <option key={id} value={id}>{pattern.name}</option>)}</optgroup>)}</select></label>
      <label>Sur<select disabled={disabled} value={target === 'all' ? 'all' : String(Math.min(Number(target), bars - 1))} onChange={e => setTarget(e.target.value)}><option value="all">Tout le morceau</option>{Array.from({length: bars}, (_, i) => <option key={i} value={i}>Mesure {i + 1}</option>)}</select></label>
      <button disabled={disabled} onClick={fill}>+ Ajouter le rythme</button>
      <label>Force des nouveaux coups<select disabled={disabled} value={velocity} onChange={e => setVelocity(Number(e.target.value))}><option value={.45}>Doux</option><option value={.75}>Normal</option><option value={1}>Accentué</option></select></label>
    </div>
    <p className="rhythm-description"><strong>{RHYTHMS[rhythm].name}</strong> · {RHYTHMS[rhythm].description} <span>Tempo indicatif : {RHYTHMS[rhythm].bpm[0]}–{RHYTHMS[rhythm].bpm[1]} BPM · 1 mesure en 4/4</span></p>
    <p className="drum-help">Clique pour ajouter ou retirer un coup. Maintiens le clic pour remplir ou effacer en balayant. Les rythmes s’ajoutent sans effacer tes coups.</p>
    <p className="drum-message" role="status" aria-live="polite">{disabled ? 'Arrête la lecture pour modifier la batterie.' : message}</p>
    {actions && <div className="drum-toolbar drum-edit-actions" role="group" aria-label="Actions de la batterie">{actions}</div>}
    <MeasureEraseNotice control={measureErase}/>
    <div ref={scroll} className="drum-scroll" data-timeline-head={HEAD}><div className="drum-content" style={{width: HEAD + steps * CELL}}>
      <TimelineRuler bars={bars} pixelsPerBeat={CELL * 4} head={HEAD} onClearMeasure={measureErase.clear} canClearMeasure={measureErase.canClear} disabled={disabled} label="BATTERIE"/>
      <div className="drum-body"><div className="drum-labels" style={{width: HEAD}}>{DRUMS.map(drum => <button key={drum.midi} disabled={disabled || track.muted} onClick={() => void previewNote(drum.midi, track).catch(() => setMessage('La préécoute audio n’a pas démarré.'))} title={`Écouter : ${drum.name}`}>{drum.name}<small>▶ {drum.short}</small></button>)}</div>
        <div ref={surface} className="drum-grid" style={{width: steps * CELL}} onPointerDown={begin} onPointerMove={drag} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => {gesture.current = null;}}>
          {DRUMS.map((drum, row) => <div className="drum-row" key={drum.midi}>{Array.from({length: steps}, (_, step) => {
            const hit = track.notes.find(n => n.midi === drum.midi && n.step === step);
            return <button key={step} disabled={disabled} aria-pressed={Boolean(hit)} aria-label={`${drum.name}, mesure ${Math.floor(step / 16) + 1}, pas ${step % 16 + 1}`} className={`drum-step ${step % 16 === 0 ? 'bar-start' : step % 4 === 0 ? 'beat-start' : ''} ${hit ? 'hit' : ''} ${playing && playhead === step ? 'current' : ''}`} style={hit ? {background: track.color, opacity: .45 + hit.velocity * .55} : undefined} onClick={e => {if (e.detail === 0 && !disabled) {paint({step, midi: row}, Boolean(hit)); if (!hit) void previewNote(drum.midi, track).catch(() => {});}}}>{hit ? '●' : step % 4 === 0 ? step % 16 / 4 + 1 : '·'}</button>;
          })}</div>)}
        </div>
      </div>
    </div></div>
    {track.drumKit === 'acoustic' && <p className="sample-credit">Samples : Pearl Master Studio Pack 1 par enoe · <a href="samples/pearl/CREDITS.md" target="_blank" rel="noreferrer">Crédits et licence CC BY 3.0</a></p>}
    <div className="editor-footer"><span>6 percussions · 16 pas par mesure · {track.drumKit === 'acoustic' ? 'Kit acoustique Pearl · clap synthétique' : 'Batterie synthétique'}</span><span>{track.notes.length} coups sur la piste</span></div>
  </>;
}
