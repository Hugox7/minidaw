import {useEffect, useRef, useState} from 'react';
import type {PointerEvent} from 'react';
import type {AudioClip, Track} from './types';
import {duplicateClip, editClip, normalizeClip, visiblePeaks} from './clipEditing';
import {TimelineRuler, useTimelineView} from './TimelineNavigation';
import Waveform from './Waveform';
function SecondsField({label, value, onChange, disabled}: {label: string; value: number; onChange: (value: number) => void; disabled: boolean}) {
  const cancelEdit = useRef(false);
  const [draft, setDraft] = useState(value.toFixed(3)), [focused, setFocused] = useState(false);
  useEffect(() => {if (!focused) setDraft(value.toFixed(3));}, [value, focused]);
  return <label>{label}<span><input aria-label={label} type="number" min={0} step={.01} value={draft} disabled={disabled} onFocus={() => setFocused(true)} onChange={e => setDraft(e.target.value)} onKeyDown={e => {if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') {cancelEdit.current = true; setDraft(value.toFixed(3)); e.currentTarget.blur();}}} onBlur={() => {const number = Number(draft); if (!cancelEdit.current && draft !== '' && Number.isFinite(number)) onChange(number); cancelEdit.current = false; setFocused(false); setDraft(value.toFixed(3));}}/> s</span></label>;
}
export default function AudioClipEditor({track, bpm, bars, disabled, playing, playhead, onClips}: {track: Track; bpm: number; bars: number; disabled: boolean; playing: boolean; playhead: number; onClips: (clips: AudioClip[]) => void}) {
  const scroll = useRef<HTMLDivElement>(null);
  const clips = track.clips ?? [], [selected, setSelected] = useState(''), [zoom, setZoom] = useState(60), [snap, setSnap] = useState(true), [draft, setDraft] = useState<AudioClip | null>(null), [undo, setUndo] = useState<AudioClip[] | null>(null);
  useTimelineView(`editor-${track.id}`, scroll, zoom * 60 / bpm, bars);
  const reveal = useRef<string | null>(null);
  useEffect(() => {
    if (!reveal.current || !scroll.current) return;
    const clip = clips.find(c => c.id === reveal.current); reveal.current = null;
    if (clip) {const left = clip.startSeconds * zoom, right = (clip.startSeconds + clip.duration) * zoom; if (left < scroll.current.scrollLeft || right > scroll.current.scrollLeft + scroll.current.clientWidth) scroll.current.scrollLeft = Math.max(0, left - 24);}
  }, [clips, zoom]);
  const gesture = useRef<{clip: AudioClip; mode: 'move' | 'left' | 'right'; x: number; pointer: number} | null>(null), draftRef = useRef<AudioClip | null>(null);
  const signature = JSON.stringify(clips), expected = useRef(signature);
  useEffect(() => {if (expected.current !== signature) {setUndo(null); expected.current = signature;}}, [signature]);
  useEffect(() => {if (disabled) {gesture.current = null; draftRef.current = null; setDraft(null);}}, [disabled]);
  const current = clips.find(c => c.id === selected) ?? clips[0];
  function commit(next: AudioClip[]) {setUndo(clips); expected.current = JSON.stringify(next); onClips(next);}
  function replace(clip: AudioClip) {commit(clips.map(c => c.id === clip.id ? clip : c));}
  function down(e: PointerEvent<HTMLElement>, clip: AudioClip, mode: 'move' | 'left' | 'right') {
    if (disabled || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation(); setSelected(clip.id);
    gesture.current = {clip, mode, x: e.clientX, pointer: e.pointerId}; draftRef.current = clip; setDraft(clip); e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLElement>) {
    const g = gesture.current; if (!g || g.pointer !== e.pointerId || disabled) return;
    const next = editClip(g.clip, g.mode, (e.clientX - g.x) / zoom, bpm, snap); draftRef.current = next; setDraft(next);
  }
  function finish(e: PointerEvent<HTMLElement>) {
    if (!gesture.current || gesture.current.pointer !== e.pointerId) return;
    const next = draftRef.current; gesture.current = null; draftRef.current = null; setDraft(null);
    if (!disabled && next) replace(next);
  }
  function cancel() {gesture.current = null; draftRef.current = null; setDraft(null);}
  const duration = Math.max(bars * 4 * 60 / bpm, ...clips.map(c => c.startSeconds + c.duration), draft ? draft.startSeconds + draft.duration : 0) + 4 * 60 / bpm;
  const width = Math.max(700, duration * zoom), beat = 60 / bpm;
  return <section className="clip-editor" aria-label="Édition des prises audio">
    <div className="clip-editor-toolbar"><strong>Éditer les prises</strong><label><input aria-label="Aligner les prises sur les temps" type="checkbox" checked={snap} disabled={disabled} onChange={e => setSnap(e.target.checked)}/> Aligner sur les temps</label><label>Zoom<select aria-label="Zoom audio" value={zoom} disabled={Boolean(draft)} onChange={e => setZoom(Number(e.target.value))}>{[30, 60, 120, 240].map(value => <option key={value} value={value}>{Math.round(value / 60 * 100)} %</option>)}</select></label><button disabled={disabled || !undo} onClick={() => {if (undo) {expected.current = JSON.stringify(undo); onClips(undo); setUndo(null);}}}>Annuler la dernière édition</button></div>
    <p>Glisse le corps d’une prise pour la déplacer, ou ses poignées pour raccourcir et retrouver l’audio masqué. Dupliquer ajoute une copie à la fin, sur cette même ligne. Les bords servent à raccourcir ou restaurer le fichier, pas à le répéter.</p>
    <div ref={scroll} className="clip-editor-scroll" data-timeline-head="0"><div className="clip-editor-timeline" style={{width}}>
      <TimelineRuler bars={Math.ceil(duration / (4 * beat))} pixelsPerBeat={zoom * beat}/>
      <div className="clip-edit-lanes" style={{height: 108, backgroundSize: `${beat * zoom}px 100%`}}>
        {clips.map((original, index) => {const clip = draft?.id === original.id ? draft : original; return <div key={clip.id} className={`editable-audio-clip ${current?.id === clip.id ? 'selected' : ''} ${disabled ? 'locked' : ''}`} style={{left: clip.startSeconds * zoom, width: Math.max(3, clip.duration * zoom), top: 16, zIndex: current?.id === clip.id ? 3 : 1, color: track.color, borderColor: track.color}} tabIndex={0} role="group" aria-label={`Prise ${index + 1} : ${clip.name}`} onClick={() => setSelected(clip.id)} onFocus={() => setSelected(clip.id)} onPointerDown={e => down(e, original, 'move')} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel} onKeyDown={e => {if (e.key === 'Escape') cancel();}}>
          <button className="clip-edge left" aria-label={`Début de la prise ${index + 1}`} disabled={disabled} onPointerDown={e => down(e, original, 'left')} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}/><small>{clip.name}</small><Waveform peaks={visiblePeaks(clip)} color={track.color}/><button className="clip-edge right" aria-label={`Fin de la prise ${index + 1}`} disabled={disabled} onPointerDown={e => down(e, original, 'right')} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}/>
        </div>;})}
        {playing && <div className="playline" style={{left: playhead * beat / 4 * zoom}}/>}
      </div></div></div>
    {clips.some((clip, index) => clips.slice(index + 1).some(other => clip.startSeconds < other.startSeconds + other.duration && other.startSeconds < clip.startSeconds + clip.duration)) && <p>Certains clips se chevauchent et jouent ensemble. Le menu Clip permet de sélectionner chacun d’eux.</p>}
    {current && <div className="clip-selection"><label>Clip<select aria-label="Clip audio sélectionné" value={current.id} disabled={Boolean(draft)} onChange={e => setSelected(e.target.value)}>{clips.map((clip, index) => <option key={clip.id} value={clip.id}>{index + 1} · {clip.name}</option>)}</select></label><SecondsField label="Position de la prise" value={current.startSeconds} disabled={disabled} onChange={value => replace(editClip(current, 'move', value - current.startSeconds, bpm, snap))}/><SecondsField label="Début dans le fichier" value={current.sourceOffset ?? 0} disabled={disabled} onChange={value => replace(editClip(current, 'left', value - (current.sourceOffset ?? 0), bpm, snap))}/><SecondsField label="Durée de la prise" value={current.duration} disabled={disabled} onChange={value => replace(editClip(current, 'right', value - current.duration, bpm, snap))}/><button disabled={disabled} onClick={() => {const end = Math.max(0, ...clips.map(c => c.startSeconds + c.duration)); const copy = duplicateClip(current, bpm, false, crypto.randomUUID(), end); reveal.current = copy.id; commit([...clips, copy]); setSelected(copy.id);}}>Dupliquer la prise</button><button disabled={disabled} onClick={() => {const clip = normalizeClip(current); replace({...clip, sourceOffset: 0, duration: clip.sourceDuration!});}}>Restaurer l’audio complet</button></div>}
  </section>;
}
