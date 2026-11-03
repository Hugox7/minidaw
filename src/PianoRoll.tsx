import {tr} from './i18n';
import { MeasureEraseNotice, useMeasureErase } from './MeasureErase';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { TimelineRuler, useTimelineView } from './TimelineNavigation';
import { previewChord, previewNote } from './audio';
import type { Note, Track } from './types';
import { CHORDS, PITCH_NAMES, midiName, chordPitches, planChord } from './chords';
import type { ChordKind } from './chords';
import { MIN_MIDI, MAX_MIDI, PIANO_ROWS } from './pianoRange';
import { isSampledInstrument } from './sampledInstruments';
import { cellAt, cellsBetween, moveNote, resizeNote } from './noteEditing';
const CELL = 25, ROW = 22, HEAD = 64;
const pitches = Array.from({ length: PIANO_ROWS }, (_, i) => MAX_MIDI - i);
const noteName = midiName;

type Cell = {
    step: number;
    midi: number;
};
type Gesture = {
    pointer: number;
    kind: 'draw' | 'erase' | 'move' | 'resize';
    start: Cell;
    last: Cell;
    original?: Note;
    visited: Set<string>;
};
type Props = {
    track: Track;
    bars: number;
    disabled: boolean;
    playing: boolean;
    playhead: number;
    onNotes: (notes: Note[]) => void;
};
export default function PianoRoll({ track, bars, disabled, playing, playhead, onNotes }: Props) {
    const [mode, setMode] = useState<'draw' | 'move' | 'chord'>('draw');
    const [duration, setDuration] = useState(4);
    const [root, setRoot] = useState(0);
    const [octave, setOctave] = useState(4);
    const [kind, setKind] = useState<ChordKind>('major');
    const [chordDuration, setChordDuration] = useState(16);
    const [hoverStep, setHoverStep] = useState<number | null>(null);
    const [feedback, setFeedback] = useState('');
    const measureErase = useMeasureErase(track.notes, disabled, onNotes);
    const scroll = useRef<HTMLDivElement>(null);
    useTimelineView(`editor-${track.id}`, scroll, CELL * 4, bars);
    const chord = chordPitches(root, octave, kind);
    const chordLabel = `${tr(PITCH_NAMES[root])}${CHORDS[kind].symbol}`;
    useEffect(() => {
        // Open at a useful register when a sound is selected.
        const midi = track.instrument === 'electricBass' ? 40 : track.instrument === 'bass' ? 45 : track.instrument === 'trombone' ? 55 : 67;
        if (scroll.current)
            scroll.current.scrollTop = Math.max(0, (MAX_MIDI - midi) * ROW - 100);
    }, [track.instrument]);
    const surface = useRef<HTMLDivElement>(null);
    const gesture = useRef<Gesture | null>(null);
    const current = useRef(track.notes);
    current.current = track.notes;
    const steps = bars * 16;
    function activateChords() {
        setMode('chord');
        setFeedback('');
        // Keep the configured chord visible when entering the stamp tool.
        if (scroll.current)
            scroll.current.scrollTop = Math.max(0, (84 - chord[chord.length - 1]) * ROW - 80);
    }
    function listenChord() {
        void previewChord(chord, track).catch(() => setFeedback(tr("Impossible de d\u00E9marrer l\u2019audio. R\u00E9essaie avec le bouton \u00C9couter.")));
    }
    function stamp(step: number) {
        const plan = planChord(current.current, chord, step, chordDuration, steps);
        if (plan.error) {
            setFeedback(plan.error);
            return;
        }
        const notes = chord.map(midi => ({ id: crypto.randomUUID(), midi, step, duration: plan.duration, velocity: .65 }));
        write([...current.current, ...notes]);
        setFeedback(tr("{{v0}} ajout\u00E9 \u00B7 mesure {{v1}}, temps {{v2}}{{v3}}.", { v0: chordLabel, v1: Math.floor(step / 16) + 1, v2: Math.floor(step % 16 / 4) + 1, v3: plan.duration < chordDuration ? tr(" \u00B7 dur\u00E9e raccourcie \u00E0 la fin du morceau") : '' }));
        listenChord();
    }
    function write(notes: Note[]) { current.current = notes; onNotes(notes); }
    function hit(cell: Cell) { return current.current.find(n => n.midi === cell.midi && cell.step >= n.step && cell.step < n.step + n.duration); }
    function position(event: ReactPointerEvent): Cell {
        const rect = surface.current!.getBoundingClientRect();
        return cellAt(event.clientX - rect.left, event.clientY - rect.top, steps);
    }
    function paint(cell: Cell, g: Gesture) {
        const key = `${cell.step}:${cell.midi}`;
        if (g.visited.has(key))
            return;
        g.visited.add(key);
        const existing = hit(cell);
        if (g.kind === 'erase') {
            if (existing)
                write(current.current.filter(n => n.id !== existing.id));
        }
        else if (!existing) {
            // Do not overlap another note of the same pitch.
            const next = current.current.filter(n => n.midi === cell.midi && n.step > cell.step).sort((a, b) => a.step - b.step)[0];
            write([...current.current, { id: crypto.randomUUID(), ...cell, duration: Math.min(duration, steps - cell.step, next ? next.step - cell.step : steps), velocity: .75 }]);
        }
    }
    function begin(event: ReactPointerEvent) {
        if (disabled || event.button !== 0 || !surface.current)
            return;
        event.preventDefault();
        const cell = position(event);
        const existing = hit(cell);
        const resize = (event.target as HTMLElement).closest('[data-resize]');
        if (mode === 'chord' && !resize && !event.altKey) {
            stamp(cell.step);
            return;
        }
        const kind = existing && resize ? 'resize' : event.altKey ? 'erase' : mode === 'move' ? 'move' : existing ? 'erase' : 'draw';
        if ((kind === 'move' || kind === 'resize') && !existing)
            return;
        const g: Gesture = { pointer: event.pointerId, kind, start: cell, last: cell, original: existing ? { ...existing } : undefined, visited: new Set() };
        gesture.current = g;
        surface.current.setPointerCapture(event.pointerId);
        if (kind === 'draw' || kind === 'erase')
            paint(cell, g);
        if (kind === 'draw')
            void previewNote(cell.midi, track).catch(() => { });
    }
    function drag(event: ReactPointerEvent) {
        if (mode === 'chord' && !disabled)
            setHoverStep(position(event).step);
        const g = gesture.current;
        if (!g || event.pointerId !== g.pointer)
            return;
        const cell = position(event);
        if (g.kind === 'draw' || g.kind === 'erase') {
            for (const point of cellsBetween(g.last, cell))
                paint(point, g);
        }
        else if (g.original) {
            const note = g.kind === 'resize' ? resizeNote(g.original, cell.step - g.start.step, steps) : moveNote(g.original, cell.step - g.start.step, cell.midi - g.start.midi, steps);
            const collision = current.current.some(n => n.id !== note.id && n.midi === note.midi && n.step < note.step + note.duration && n.step + n.duration > note.step);
            if (!collision)
                write(current.current.map(n => n.id === note.id ? note : n));
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
    return <>
    <div className="piano-toolbar" role="group" aria-label={tr("Outils du piano roll")}>
      <button disabled={disabled} className={mode === 'draw' ? 'chosen' : ''} aria-pressed={mode === 'draw'} onClick={() => setMode('draw')}>{tr("\u270E Dessiner / effacer")}</button>
      <button disabled={disabled} className={mode === 'move' ? 'chosen' : ''} aria-pressed={mode === 'move'} onClick={() => setMode('move')}>{tr("\u2194 D\u00E9placer")}</button>
      <button disabled={disabled} className={mode === 'chord' ? 'chosen' : ''} aria-pressed={mode === 'chord'} onClick={activateChords}>{tr("\u266B Accords")}</button>
      {mode !== 'chord' && <label>{tr("Dur\u00E9e des nouvelles notes ")}<select disabled={disabled} value={duration} onChange={e => setDuration(Number(e.target.value))}>
        <option value={1}>{tr("1/16 \u00B7 double croche")}</option><option value={2}>{tr("1/8 \u00B7 croche")}</option><option value={4}>{tr("1/4 \u00B7 noire")}</option><option value={8}>{tr("1/2 \u00B7 blanche")}</option><option value={16}>{tr("1 mesure")}</option>
      </select></label>}
      <span>{disabled ? tr("Arr\u00EAte la lecture pour modifier les notes.") : tr("Tire le bord droit pour allonger une note. Alt + glisser : effacer.")}</span>
    </div>
    {mode === 'chord' && <section className="chord-panel" aria-label={tr("Accords pr\u00E9d\u00E9finis")}>
      <div className="chord-fields">
        <label>{tr("Fondamentale")}<select disabled={disabled} value={root} onChange={e => { setRoot(Number(e.target.value)); setFeedback(''); }}>{PITCH_NAMES.map((name, i) => <option key={i} value={i}>{tr(name)}</option>)}</select></label>
        <label>{tr("Type d\u2019accord")}<select disabled={disabled} value={kind} onChange={e => { setKind(e.target.value as ChordKind); setFeedback(''); }}>{Object.entries(CHORDS).map(([key, value]) => <option key={key} value={key}>{tr(value.label)}</option>)}</select></label>
        <label>{tr("Octave de d\u00E9part")}<select disabled={disabled} value={octave} onChange={e => { setOctave(Number(e.target.value)); setFeedback(''); }}>{[3, 4].map(o => <option key={o} value={o}>{o}</option>)}</select></label>
        <label>{tr("Dur\u00E9e de l\u2019accord")}<select disabled={disabled} value={chordDuration} onChange={e => setChordDuration(Number(e.target.value))}><option value={1}>{tr("Double croche")}</option><option value={2}>{tr("Croche")}</option><option value={4}>{tr("Noire \u00B7 1 temps")}</option><option value={8}>{tr("Blanche \u00B7 2 temps")}</option><option value={16}>{tr("1 mesure")}</option><option value={32}>{tr("2 mesures")}</option></select></label>
        <button disabled={disabled} onClick={listenChord}>{tr("\u25B6 \u00C9couter")}</button>
      </div>
      <div className="chord-description"><strong>{chordLabel}</strong><span>{chord.map(midiName).join(' · ')}</span><small>{tr(CHORDS[kind].help)}</small></div>
      <p>{tr("Clique dans la grille \u00E0 l\u2019endroit o\u00F9 l\u2019accord doit commencer. La hauteur du clic ne compte pas : les notes sont celles affich\u00E9es ci-dessus.")}</p>
      <p className="chord-feedback" role="status" aria-live="polite">{tr(feedback) || tr("Un clic pose l\u2019accord entier. Change la fondamentale ou le type pour poser le suivant.")}</p>
    </section>}
    <MeasureEraseNotice control={measureErase}/>
    <div ref={scroll} className="piano-scroll" data-timeline-head={HEAD}><div className="piano piano-v02" style={{ width: HEAD + steps * CELL }}>
      <TimelineRuler bars={bars} pixelsPerBeat={CELL * 4} head={HEAD} onClearMeasure={measureErase.clear} canClearMeasure={measureErase.canClear} disabled={disabled} label="NOTES"/>
      <div className="piano-body">
        <div className="piano-keys">{pitches.map(midi => <button key={midi} className={`key ${[1, 3, 6, 8, 10].includes(midi % 12) ? 'black' : ''}`} onClick={() => void previewNote(midi, track).catch(() => { })}>{noteName(midi)}</button>)}</div>
        <div ref={surface} className={`note-surface mode-${mode} ${disabled ? 'locked' : ''}`} style={{ width: steps * CELL, height: pitches.length * ROW }} onPointerLeave={() => setHoverStep(null)} onPointerDown={begin} onPointerMove={drag} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { gesture.current = null; }} aria-label={tr("Grille des notes")}>
          {pitches.map(midi => <div key={midi} className={`grid-row ${midi % 12 === 0 ? 'octave' : ''} ${[1, 3, 6, 8, 10].includes(midi % 12) ? 'dark' : ''}`} style={{ top: (84 - midi) * ROW }}/>)}
          {track.notes.filter(n => n.step < steps && n.midi >= MIN_MIDI && n.midi <= MAX_MIDI).map(n => <div key={n.id} className="midi-note" title={`${noteName(n.midi)} · ${n.duration} double(s) croche(s)`} style={{ left: n.step * CELL + 1, top: (84 - n.midi) * ROW + 2, width: Math.min(n.duration, steps - n.step) * CELL - 2, height: ROW - 4, background: track.color }}><span>{noteName(n.midi)}</span><span className="resize-handle" data-resize="true" title={tr("Glisser pour changer la dur\u00E9e")}/></div>)}
          {mode === 'chord' && !disabled && hoverStep !== null && chord.map(midi => <div key={`ghost-${midi}`} className={`chord-ghost ${planChord(track.notes, chord, hoverStep, chordDuration, steps).error ? 'conflict' : ''}`} style={{ left: hoverStep * CELL + 1, top: (84 - midi) * ROW + 2, width: Math.min(chordDuration, steps - hoverStep) * CELL - 2, height: ROW - 4 }}/>)}
          {playing && <div className="playline" style={{ left: playhead * CELL }}/>}
        </div>
      </div>
    </div></div>
    {isSampledInstrument(track.instrument) && <p className="sample-credit">{tr("Instruments enregistr\u00E9s : Tonejs Instruments / Nicholaus P. Brosowsky \u00B7 ")}<a href="/samples/instruments/CREDITS.md" target="_blank" rel="noreferrer">{tr("Sources et licence CC BY 3.0")}</a></p>}
    <div className="editor-footer"><span>{tr("Plage : Do1 \u2192 Do6 \u00B7 Grille 1/16 \u00B7 Notes conserv\u00E9es hors des mesures affich\u00E9es")}</span><span>{track.notes.length}{tr(" notes sur la piste")}</span></div>
  </>;
}
