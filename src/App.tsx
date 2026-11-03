import {tr, guideHref, localeTag} from './i18n';
import {useTranslation} from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { useEffect, useRef, useState } from 'react';
import TunerModal from './TunerModal';
import TrainingMenu from './TrainingMenu';
import PlaybackTime from './PlaybackTime';
import { recordingBarsAtStep, recordingLimitSeconds, snapRecordedDuration, barsForDuration } from './recordingLimits';
import { APP_RELEASE_LABEL, APP_VERSION } from './version';
import { Play, Square, Plus, Trash2, Volume2, VolumeX, Save, Music2, RotateCcw, Mic } from 'lucide-react';
import { startPlayback, stopPlayback, updateTrackMix, disposeAudio, disposeTrack, previewInstrument, getTrackPeaks } from './audio';
import type { AudioClip, Project, Track } from './types';
import ProjectPanel from './ProjectPanel';
import LevelMeter from './LevelMeter';
import VolumeControl from './VolumeControl';
import { MAX_TRACK_VOLUME_DB, normalizeTrackVolume } from './volumeSettings';
import { getMasterPeaks, setMasterVolume, normalizeVolume } from './outputBus';
import { TimelineProvider, TimelineControls, TimelineRuler, useTimelineView } from './TimelineNavigation';
import { normalizeClip, visiblePeaks } from './clipEditing';
import AmpPanel from './AmpPanel';
import { normalizeAmp, normalizeSource } from './ampSettings';
import { normalizePedals } from './pedalSettings';
import MixPanel from './MixPanel';
import { normalizeMix } from './mixSettings';
import RepeatNotesPanel from './RepeatNotesPanel';
import DrumClearButton from './DrumClearButton';
import PianoRoll from './PianoRoll';
import DrumRoll from './DrumRoll';
import AudioPanel, { Waveform } from './AudioPanel';
import { DRUMS } from './drums';
import { INSTRUMENTS, DEFAULT_INSTRUMENT, normalizeInstrument } from './instruments';
import { listAudioInputs, openAudioInput } from './recording';
import type { CountInBars } from './countIn';
import type { Capture, InputChannel, InputSession } from './recording';
import { getAudioBlob, saveAudioAsset } from './audioAssets';
const uid = () => crypto.randomUUID();
const colors = ['#6ca6ec', '#b59aff', '#64cbb2', '#efae6b', '#ed8d9e'];
const makeTrack = (index: number): Track => ({ id: uid(), kind: 'synth', name: tr("Synth\u00E9 {{v0}}", { v0: index + 1 }), color: colors[index % colors.length], volume: -8, muted: false, instrument: DEFAULT_INSTRUMENT, mix: normalizeMix(), notes: [] });
const makeAudioTrack = (index: number): Track => ({ ...makeTrack(index), kind: 'audio', audioSource: 'other', amp: normalizeAmp(), pedals: normalizePedals(), name: tr("Prise audio"), color: '#64cbb2', clips: [], volume: 0 });
const initial = (): Project => {
    try {
        const saved = localStorage.getItem('mini-daw-v01');
        if (saved) {
            const parsed = JSON.parse(saved) as Project;
            if (parsed.tracks?.length && parsed.bpm && parsed.bars)
                return { ...parsed, masterVolume: normalizeVolume(parsed.masterVolume), tracks: parsed.tracks.map(t => ({ ...t, volume: normalizeTrackVolume(t.volume, -8), mix: normalizeMix(t.mix), kind: t.kind === 'audio' ? 'audio' : t.kind === 'drums' ? 'drums' : 'synth', instrument: normalizeInstrument(t.instrument), ...(t.kind === 'audio' ? { clips: (t.clips ?? []).map(normalizeClip), audioSource: normalizeSource(t.audioSource), amp: normalizeAmp(t.amp), pedals: normalizePedals(t.pedals) } : {}) })) };
        }
    }
    catch { }
    const t = makeTrack(0);
    t.name = tr("D\u00E9mo \u00B7 accords");
    t.notes = [{ step: 0, midi: 60 }, { step: 0, midi: 64 }, { step: 0, midi: 67 }, { step: 16, midi: 57 }, { step: 16, midi: 60 }, { step: 16, midi: 64 }, { step: 32, midi: 65 }, { step: 32, midi: 69 }, { step: 32, midi: 72 }, { step: 48, midi: 67 }, { step: 48, midi: 71 }, { step: 48, midi: 74 }].map(n => ({ ...n, id: uid(), duration: 4, velocity: .6 }));
    return { name: tr("Mon premier morceau"), bpm: 100, bars: 4, masterVolume: 0, tracks: [t] };
};
type PendingTake = {
    blob: Blob;
    trackId: string;
    name: string;
    startSeconds: number;
    replace?: boolean;
    limitSeconds?: number;
    sampleRate?: number;
};
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function message(error: unknown) { return error instanceof Error ? error.message : String(error); }
export default function App() { useTranslation(); return <TimelineProvider><Studio /></TimelineProvider>; }
function Studio() {
    const [project, setProject] = useState<Project>(initial);
    const arrangementScroll = useRef<HTMLDivElement>(null);
    const [arrangementZoom, setArrangementZoom] = useState(100);
    const arrangementBeat = 64 * arrangementZoom / 100;
    useTimelineView('arrangement', arrangementScroll, arrangementBeat, project.bars);
    const [projectBusy, setProjectBusy] = useState(false);
    const [tunerOpen, setTunerOpen] = useState(false);
    const [selected, setSelected] = useState('');
    const [playing, setPlaying] = useState(false);
    const [playhead, setPlayhead] = useState(0);
    const [status, setStatus] = useState(tr("Pr\u00EAt"));
    const [problem, setProblem] = useState('');
    const [input, setInput] = useState<InputSession | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [deviceId, setDeviceId] = useState('');
    const [channel, setChannel] = useState<InputChannel>('left');
    const [armedId, setArmedId] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [phase, setPhase] = useState<'idle' | 'preparing' | 'countin' | 'recording' | 'saving'>('idle');
    const [countBeat, setCountBeat] = useState(0);
    const review = project.pendingRetake;
    const countInBars = project.countInBars ?? 1;
    const [pending, setPending] = useState<PendingTake | null>(null);
    const [latencyMs, setLatencyMs] = useState(0);
    const inputRef = useRef<InputSession | null>(null), captureRef = useRef<Capture | null>(null), connectRequest = useRef(0);
    const track = project.tracks.find(t => t.id === selected) ?? project.tracks[0];
    const busy = playing || phase !== 'idle' || projectBusy;
    const totalSteps = project.bars * 16, totalSeconds = project.bars * 4 * 60 / project.bpm;
    useEffect(() => { setMasterVolume(project.masterVolume ?? 0); }, [project.masterVolume]);
    useEffect(() => { try {
        localStorage.setItem('mini-daw-v01', JSON.stringify(project));
    }
    catch {
        setProblem(tr("La sauvegarde du projet est impossible. V\u00E9rifie l\u2019espace de stockage disponible dans le navigateur."));
    } }, [project]);
    useEffect(() => {
        const refresh = () => { void listAudioInputs().then(setDevices).catch(() => { }); };
        refresh();
        navigator.mediaDevices?.addEventListener('devicechange', refresh);
        return () => { navigator.mediaDevices?.removeEventListener('devicechange', refresh); connectRequest.current++; captureRef.current?.cancel(); inputRef.current?.close(); disposeAudio(); };
    }, []);
    useEffect(() => {
        const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
        if (phase !== 'idle' || pending || projectBusy)
            window.addEventListener('beforeunload', protect);
        return () => window.removeEventListener('beforeunload', protect);
    }, [phase, pending, projectBusy]);
    const changeTrack = (id: string, update: (t: Track) => Track) => setProject(p => ({ ...p, tracks: p.tracks.map(t => t.id === id ? update(t) : t) }));
    const add = (kind: Track['kind']) => {
        const t = kind === 'audio' ? makeAudioTrack(project.tracks.length) : kind === 'drums' ? { ...makeTrack(project.tracks.length), kind: 'drums' as const, drumKit: 'acoustic' as const, name: tr("Batterie"), color: '#efae6b' } : makeTrack(project.tracks.length);
        setProject(p => ({ ...p, tracks: [...p.tracks, t] }));
        setSelected(t.id);
        if (kind === 'audio')
            setArmedId(t.id);
    };
    function stop() { setCountBeat(0); stopPlayback(); captureRef.current?.stop(); setPlaying(false); setPlayhead(0); setStatus(captureRef.current ? tr("Finalisation de la prise\u2026") : tr("Arr\u00EAt\u00E9")); }
    async function toggle(auditionRetake = false) {
        if (playing || captureRef.current) {
            stop();
            return;
        }
        if (phase !== 'idle' || projectBusy)
            return;
        try {
            setProblem('');
            setPlaying(true);
            setStatus(tr("Pr\u00E9paration audio\u2026"));
            setPlayhead(0);
            const started = await startPlayback(auditionRetake && review ? project.tracks.map(t => t.id === review.trackId ? { ...t, clips: [review.clip] } : t) : project.tracks, project.bpm, totalSteps, setPlayhead, () => { setPlaying(false); setPlayhead(0); setStatus(tr("Termin\u00E9")); });
            if (started)
                setStatus(tr("Lecture"));
        }
        catch (error) {
            stopPlayback();
            setPlaying(false);
            setProblem(message(error));
            setStatus(tr("Erreur audio"));
        }
    }
    function disconnect() { connectRequest.current++; setConnecting(false); inputRef.current?.close(); inputRef.current = null; setInput(null); }
    async function connect() {
        const request = ++connectRequest.current;
        setConnecting(true);
        setProblem('');
        try {
            const opened = await openAudioInput(deviceId, channel, () => {
                stopPlayback();
                captureRef.current?.stop();
                setPlaying(false);
                setProblem(tr("L\u2019entr\u00E9e audio a \u00E9t\u00E9 d\u00E9connect\u00E9e. R\u00E9active-la pour la prochaine prise."));
                const close = () => { inputRef.current?.close(); inputRef.current = null; setInput(null); };
                if (captureRef.current)
                    void captureRef.current.done.then(close, close);
                else
                    close();
            });
            if (request !== connectRequest.current) {
                opened.close();
                return;
            }
            inputRef.current?.close();
            inputRef.current = opened;
            setInput(opened);
            setDevices(await listAudioInputs());
            setStatus(tr("Entr\u00E9e pr\u00EAte"));
        }
        catch (error) {
            setProblem(message(error));
        }
        finally {
            if (request === connectRequest.current)
                setConnecting(false);
        }
    }
    async function saveTake(take: PendingTake) {
        setPhase('saving');
        setStatus(tr("Sauvegarde de la prise\u2026"));
        setPending(take);
        try {
            const clip = { ...await saveAudioAsset(take.blob, take.name), startSeconds: take.startSeconds };
            if (take.sampleRate)
                clip.duration = snapRecordedDuration(clip.duration, project.bpm, take.sampleRate);
            setProject(p => take.replace ? { ...p, pendingRetake: { trackId: take.trackId, clip } } : { ...p, bars: Math.max(p.bars, barsForDuration(clip.startSeconds + clip.duration, p.bpm)), tracks: p.tracks.map(t => t.id === take.trackId ? { ...t, clips: [...(t.clips ?? []), clip] } : t) });
            setPending(null);
            setProblem('');
            setStatus(take.limitSeconds && clip.duration >= take.limitSeconds - .005 ? tr("Prise sauvegard\u00E9e \u00B7 limite de dur\u00E9e atteinte") : tr("Prise sauvegard\u00E9e"));
        }
        catch (error) {
            setProblem(tr("La prise reste disponible en m\u00E9moire : {{v0}} T\u00E9l\u00E9charge-la avant de fermer cet onglet.", { v0: message(error) }));
            setStatus(tr("Prise non sauvegard\u00E9e"));
        }
        finally {
            setPhase('idle');
        }
    }
    async function record(replace = false) {
        if (!inputRef.current || busy || pending || review || captureRef.current)
            return;
        let target = project.tracks.find(t => t.id === (replace ? track.id : armedId) && t.kind === 'audio');
        if (!target) {
            setProblem(tr("Arme une piste audio avant d\u2019enregistrer."));
            return;
        }
        if (replace)
            setArmedId(target.id);
        if (!replace && target.clips?.length) {
            target = { ...makeAudioTrack(project.tracks.length), name: tr("{{v0}} \u00B7 nouvelle prise", { v0: target.name }), audioSource: target.audioSource, amp: normalizeAmp(target.amp), pedals: normalizePedals(target.pedals) };
            const fresh = target;
            setProject(p => ({ ...p, tracks: [...p.tracks, fresh] }));
            setSelected(target.id);
            setArmedId(target.id);
        }
        setPhase('preparing');
        setPlaying(true);
        setProblem('');
        setStatus(tr("Pr\u00E9paration de l\u2019enregistrement\u2026"));
        let capture: Capture | undefined;
        try {
            const sampleRate = inputRef.current.sampleRate;
            const maximumSeconds = recordingLimitSeconds(sampleRate, project.bpm);
            capture = inputRef.current.createCapture(latencyMs);
            captureRef.current = capture;
            void capture.done.catch(() => { });
            const active = capture;
            const started = await startPlayback(replace ? project.tracks.map(t => t.id === target!.id ? { ...t, clips: [] } : t) : project.tracks, project.bpm, totalSteps, step => { setPlayhead(step); const bars = recordingBarsAtStep(step); setProject(p => bars > p.bars ? { ...p, bars } : p); }, () => { setPlaying(false); setPlayhead(0); setStatus(tr("Finalisation de la prise\u2026")); }, time => { active.start(time, time + maximumSeconds); setCountBeat(0); setPhase(countInBars ? 'countin' : 'preparing'); setStatus(countInBars ? tr("Pr\u00E9pare-toi\u2026") : tr("D\u00E9marrage\u2026")); }, { bars: countInBars, onCount: (beat, total) => { setCountBeat(beat); setStatus(tr("D\u00E9compte {{v0}} / {{v1}}", { v0: beat, v1: total })); }, onRecordingStart: () => { setCountBeat(0); setPhase('recording'); setStatus(tr("\u25CF Enregistrement")); } }, { durationSeconds: maximumSeconds });
            if (!started) {
                active.cancel();
                setPhase('idle');
                return;
            }
            const blob = await active.done;
            stopPlayback();
            setCountBeat(0);
            setPlaying(false);
            setPlayhead(0);
            captureRef.current = null;
            if (blob)
                await saveTake({ blob, trackId: target.id, name: `${target.name} ${new Date().toLocaleTimeString(localeTag()).replace(/:/g, '-')}.wav`, startSeconds: 0, replace, limitSeconds: maximumSeconds, sampleRate });
            else {
                setPhase('idle');
                setStatus(tr("Prise annul\u00E9e"));
            }
        }
        catch (error) {
            capture?.cancel();
            stopPlayback();
            setCountBeat(0);
            setPlaying(false);
            setPhase('idle');
            setProblem(message(error));
            setStatus(tr("Erreur d\u2019enregistrement"));
        }
        finally {
            if (captureRef.current === capture)
                captureRef.current = null;
        }
    }
    async function importFile(file: File) {
        if (track.kind !== 'audio' || busy || pending || review)
            return;
        const startSeconds = Math.max(0, ...(track.clips ?? []).map(c => c.startSeconds + c.duration));
        await saveTake({ blob: file, name: file.name, trackId: track.id, startSeconds });
    }
    function editClips(clips: AudioClip[]) {
        if (busy || pending || review)
            return;
        setProject(p => ({ ...p, bars: Math.max(p.bars, barsForDuration(Math.max(0, ...clips.map(c => c.startSeconds + c.duration)), p.bpm)), tracks: p.tracks.map(t => t.id === track.id ? { ...t, clips } : t) }));
    }
    function repeatPassage(passage: Pick<Track, 'notes' | 'repeatEndStep'>, bars?: number) {
        if (busy || pending || review || track.kind === 'audio')
            return;
        setProject(p => ({ ...p, bars: Math.max(p.bars, bars ?? p.bars), tracks: p.tracks.map(t => t.id === track.id ? { ...t, ...passage } : t) }));
    }
    function loadProject(next: Project) {
        localStorage.setItem('mini-daw-v01', JSON.stringify(next));
        stopPlayback();
        disconnect();
        disposeAudio();
        setProject(next);
        setSelected('');
        setArmedId('');
        setPlaying(false);
        setPlayhead(0);
        setCountBeat(0);
        setProblem('');
        setStatus(tr("Projet pr\u00EAt"));
        if (arrangementScroll.current)
            arrangementScroll.current.scrollLeft = 0;
    }
    function newProject() { loadProject({ name: tr("Nouveau morceau"), bpm: 100, bars: 4, masterVolume: 0, tracks: [makeTrack(0)] }); }
    async function downloadClip(clip: AudioClip) { try {
        download(await getAudioBlob(clip.assetId), clip.name);
    }
    catch (error) {
        setProblem(message(error));
    } }
    function deleteTrack(t: Track) {
        if (project.tracks.length === 1 || busy || review || pending?.trackId === t.id)
            return;
        if (t.kind === 'audio' && t.clips?.length && !confirm(tr("Supprimer cette piste et ses prises du projet ?")))
            return;
        disposeTrack(t.id);
        setProject(p => ({ ...p, tracks: p.tracks.filter(x => x.id !== t.id) }));
        if (armedId === t.id)
            setArmedId('');
    }
    function clear() { if (review)
        return; if (!confirm(track.kind === 'audio' ? tr("Retirer toutes les prises de cette piste ?") : tr("Effacer toutes les notes de cette piste ?")))
        return; changeTrack(track.id, t => ({ ...t, notes: [], repeatEndStep: undefined, ...(t.kind === 'audio' ? { clips: [] } : {}) })); }
    const barOptions = [...new Set([2, 4, 8, 16, 32, 64, project.bars])].sort((a, b) => a - b);
    const editorName = track.kind === 'audio' ? tr("Piste audio") : track.kind === 'drums' ? tr("S\u00E9quenceur de batterie") : tr("Piano roll");
    const soundName = (t: Track) => t.kind === 'audio' ? tr("Enregistrement / import") : t.kind === 'drums' ? t.drumKit === 'acoustic' ? tr("Acoustique \u00B7 Pearl") : tr("Batterie synth\u00E9tique") : INSTRUMENTS[t.instrument].name;
    return <div className="app">
    <header className="topbar"><div className="brand"><Music2 size={22}/><strong>{tr("mini")}<span>{tr("DAW")}</span></strong><small className="release-badge" title={tr("Version {{v0}}", { v0: APP_VERSION })}>{tr(APP_RELEASE_LABEL)}</small><small>{tr("audio + MIDI")}</small></div><nav className="topbar-links" aria-label={tr("Liens utiles")}><button className="guide-link" disabled={busy || connecting} onClick={() => { setProblem(''); stopPlayback(); setTunerOpen(true); }}>{tr("Accordeur")}</button><a className="guide-link" href={guideHref()} target="_blank" rel="noopener noreferrer" aria-label={tr("Guide d\u2019utilisation (nouvel onglet)")}>{tr("Guide \u2197")}</a><TrainingMenu /><LanguageSelector/></nav><span className="saved"><Save size={14}/>{tr(" Copie navigateur auto")}</span></header>
    <fieldset className="studio-workspace" disabled={projectBusy}>
    <ProjectPanel project={project} disabled={playing || phase !== 'idle' || Boolean(pending) || connecting} onName={name => setProject(p => ({ ...p, name }))} onLoad={loadProject} onNew={newProject} onWorking={setProjectBusy}/>
    <section className="transport">
      <div className="transport-controls"><button disabled={phase === 'saving' || projectBusy} className="icon-button primary" onClick={() => void toggle()} title={playing ? tr("Arr\u00EAter") : tr("Lecture")}>{playing ? <Square size={19} fill="currentColor"/> : <Play size={19} fill="currentColor"/>}</button><button className="icon-button record-transport" disabled={phase === 'saving' || projectBusy || (!captureRef.current && (playing || !input || !armedId || Boolean(pending) || Boolean(review)))} onClick={() => captureRef.current ? stop() : void record()} title={captureRef.current ? tr("Arr\u00EAter la prise") : tr("Enregistrer la piste arm\u00E9e")}><Mic size={18}/></button><button disabled={phase === 'saving' || projectBusy} className="icon-button" onClick={stop} title={tr("Retour au d\u00E9but")}><RotateCcw size={18}/></button></div>
      <div className="transport-field"><label>{tr("Tempo")}</label><div className="number-field"><input aria-label={tr("Tempo BPM")} type="number" min="40" max="240" value={project.bpm} disabled={busy} onChange={e => { const bpm = Math.max(40, Math.min(240, Number(e.target.value) || 40)); setProject(p => { const audioEnd = Math.max(0, ...p.tracks.flatMap(t => (t.clips ?? []).map(c => c.startSeconds + c.duration))); return { ...p, bpm, bars: Math.max(p.bars, Math.ceil(audioEnd / (4 * 60 / bpm))) }; }); }}/><span>{tr("BPM")}</span></div></div>
      <div className="transport-field"><label>{tr("Mesures")}</label><select disabled={busy} value={project.bars} onChange={e => setProject(p => ({ ...p, bars: Number(e.target.value) }))}>{barOptions.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
      <div className="master-strip"><strong>{tr("Sortie g\u00E9n\u00E9rale")}</strong><VolumeControl label={tr("Volume g\u00E9n\u00E9ral")} value={project.masterVolume ?? 0} onChange={masterVolume => { setMasterVolume(masterVolume); setProject(p => ({ ...p, masterVolume })); }}/><LevelMeter label={tr("Niveau de sortie g\u00E9n\u00E9rale")} read={getMasterPeaks}/></div>
      <PlaybackTime active={playing && (phase === 'idle' || phase === 'recording')} totalSeconds={totalSeconds}/><div className="transport-position"><strong>{Math.floor(playhead / 16) + 1}<span> : </span>{Math.floor(playhead % 16 / 4) + 1}<span> : </span>{playhead % 4 + 1}</strong><small>{tr("MESURE : TEMPS : DOUBLE")}</small></div><span className="status">● {tr(status)}</span>
    </section>
    <main>
      {review && <div className="retake-review" role="region" aria-label={tr("Comparer les prises")}><strong>{tr("Nouvelle prise \u00E0 valider \u00B7 ")}{project.tracks.find(t => t.id === review.trackId)?.name}</strong><p>{tr("L\u2019ancienne prise reste en place. \u00C9coute les deux versions avant de choisir.")}</p><div><button disabled={busy} onClick={() => void toggle(true)}>{tr("\u00C9couter la nouvelle")}</button><button disabled={busy} onClick={() => void toggle()}>{tr("\u00C9couter l\u2019ancienne")}</button><button disabled={busy} onClick={() => { setProject(p => ({ ...p, pendingRetake: undefined, bars: Math.max(p.bars, barsForDuration(review.clip.duration, p.bpm)), tracks: p.tracks.map(t => t.id === review.trackId ? { ...t, clips: [review.clip] } : t) })); setStatus(tr("Nouvelle prise conserv\u00E9e")); }}>{tr("Garder la nouvelle prise")}</button><button disabled={busy} onClick={() => { setProject(p => ({ ...p, pendingRetake: undefined })); setStatus(tr("Ancienne prise conserv\u00E9e")); }}>{tr("Garder l\u2019ancienne prise")}</button></div></div>}

      {tr(problem) && <div className="audio-problem" role="alert">{tr(problem)}</div>}
      {pending && phase !== 'saving' && <div className="unsaved-take"><strong>{tr(pending.name)}{tr(" \u00B7 sauvegarde \u00E0 terminer")}</strong><button disabled={busy} onClick={() => void saveTake(pending)}>{tr("R\u00E9essayer la sauvegarde")}</button><button onClick={() => download(pending.blob, pending.name)}>{tr("T\u00E9l\u00E9charger la prise")}</button><button disabled={busy} onClick={() => { if (confirm(tr("Abandonner cette prise non sauvegard\u00E9e ?"))) {
        setPending(null);
        setProblem('');
    } }}>{tr("Abandonner")}</button></div>}
      <section className="tracks"><div className="section-heading"><div><h2>{tr("Arrangement")}</h2><p>{tr("S\u00E9lectionne une piste pour l\u2019\u00E9diter")}</p></div><div className="track-add-actions"><button className="add-button audio-add" disabled={busy || Boolean(review)} onClick={() => add('audio')}><Mic size={16}/>{tr(" Piste audio")}</button><button className="add-button drum-add" disabled={busy || Boolean(review)} onClick={() => add('drums')}><Plus size={16}/>{tr(" Batterie")}</button><button className="add-button" disabled={busy || Boolean(review)} onClick={() => add('synth')}><Plus size={16}/>{tr(" Ajouter une piste")}</button></div></div>
        <div className="arrangement-navigation"><TimelineControls playing={playing} playhead={playhead}/><label>{tr("Zoom arrangement")}<select aria-label={tr("Zoom arrangement")} value={arrangementZoom} onChange={e => setArrangementZoom(Number(e.target.value))}>{[25, 50, 100, 200, 400].map(value => <option key={value} value={value}>{value} %</option>)}</select></label></div>
        <div className="arrangement arrangement-scroll" ref={arrangementScroll} data-timeline-head="240" aria-label={tr("Timeline de l\u2019arrangement")}><div className="arrangement-canvas" style={{ width: 240 + project.bars * 4 * arrangementBeat }}><TimelineRuler bars={project.bars} pixelsPerBeat={arrangementBeat} head={240} label={tr("PISTES")}/>
          {project.tracks.map(t => <div className={`track-row ${track.id === t.id ? 'active' : ''}`} key={t.id}>
            <div className="track-info" onClick={() => setSelected(t.id)}>
              <div className="track-title"><span className="track-dot" style={{ background: t.color }}/><input aria-label={tr("Nom de la piste")} value={t.name} onClick={e => e.stopPropagation()} onChange={e => changeTrack(t.id, old => ({ ...old, name: e.target.value }))}/></div>
              <div className="track-instrument">{t.kind === 'audio' ? <button className={armedId === t.id ? 'track-arm armed' : 'track-arm'} disabled={busy} aria-pressed={armedId === t.id} onClick={e => { e.stopPropagation(); setArmedId(armedId === t.id ? '' : t.id); setSelected(t.id); }}>● {armedId === t.id ? tr("Pr\u00EAte \u00E0 enregistrer") : tr("Armer")}</button> : <>
                {t.kind === 'drums' ? <select disabled={busy} aria-label={tr("Kit de {{v0}}", { v0: t.name })} value={t.drumKit === 'acoustic' ? 'acoustic' : 'synthetic'} onClick={e => e.stopPropagation()} onChange={e => { const drumKit = e.target.value === 'acoustic' ? 'acoustic' : 'synthetic'; disposeTrack(t.id); changeTrack(t.id, old => ({ ...old, drumKit })); }}><option value="acoustic">{tr("Acoustique \u00B7 Pearl")}</option><option value="synthetic">{tr("Synth\u00E9tique")}</option></select> : <select disabled={busy} aria-label={tr("Son de {{v0}}", { v0: t.name })} value={t.instrument} onClick={e => e.stopPropagation()} onChange={e => { const instrument = normalizeInstrument(e.target.value); disposeTrack(t.id); changeTrack(t.id, old => ({ ...old, instrument })); }}>{Object.entries(INSTRUMENTS).map(([id, preset]) => <option key={id} value={id}>{tr(preset.name)}</option>)}</select>}
                <button disabled={busy || t.muted} title={tr("\u00C9couter le son de {{v0}}", { v0: t.name })} aria-label={tr("\u00C9couter le son de {{v0}}", { v0: t.name })} onClick={e => { e.stopPropagation(); void previewInstrument(t).catch(error => setProblem(message(error))); }}><Play size={13}/></button>
              </>}</div>
              <div className="track-tools"><button title={t.muted ? tr("Activer") : tr("Muet")} className={t.muted ? 'muted' : ''} onClick={e => { e.stopPropagation(); const next = { ...t, muted: !t.muted }; changeTrack(t.id, () => next); updateTrackMix(next); }}>{t.muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}</button><VolumeControl label={tr("Volume de {{v0}}", { v0: t.name })} value={t.volume} max={MAX_TRACK_VOLUME_DB} onChange={volume => { const next = { ...t, volume }; changeTrack(t.id, () => next); updateTrackMix(next); }}/><button disabled={busy || Boolean(review) || project.tracks.length === 1 || pending?.trackId === t.id} title={tr("Supprimer la piste")} onClick={e => { e.stopPropagation(); deleteTrack(t); }}><Trash2 size={14}/></button></div><LevelMeter label={tr("Niveau de {{v0}}", { v0: t.name })} read={() => getTrackPeaks(t.id)}/>
            </div>
            <div className={`track-lane ${t.kind === 'audio' ? 'audio-lane' : ''}`} onClick={() => setSelected(t.id)} style={{ backgroundSize: `calc(100% / ${project.bars}) 100%` }}>
              {t.kind === 'audio' ? <>{(t.clips ?? []).filter(c => c.startSeconds < totalSeconds).map(c => <div className="audio-arrangement-clip" key={c.id} title={c.name} style={{ left: `${c.startSeconds / totalSeconds * 100}%`, width: `${Math.min(c.duration, totalSeconds - c.startSeconds) / totalSeconds * 100}%`, color: t.color, borderColor: t.color }}><small>{c.name}</small><Waveform peaks={visiblePeaks(c)} color={t.color}/></div>)}{captureRef.current && armedId === t.id && <div className="recording-strip">{tr("\u25CF Prise en cours\u2026")}</div>}</> : <div className="clip" style={{ background: `${t.color}23`, borderColor: t.color }}>{t.notes.map(n => <span key={n.id} className="clip-note" style={{ left: `${n.step / totalSteps * 100}%`, width: `${Math.max(n.duration / totalSteps * 100, .7)}%`, top: `${Math.max(3, Math.min(72, t.kind === 'drums' ? Math.max(0, DRUMS.findIndex(d => d.midi === n.midi)) / 6 * 68 : (84 - n.midi) / 61 * 68))}%`, background: t.color }}/>)}</div>}
              {playing && <div className="playline" style={{ left: `${playhead / totalSteps * 100}%` }}/>}
            </div>
          </div>)}
        </div></div>
      </section>
      <section className="editor"><div className="section-heading editor-heading"><div><h2>{tr(editorName)}</h2><p>{track.name} · {tr(soundName(track))}</p></div><div className="editor-actions"><PlaybackTime active={playing && (phase === 'idle' || phase === 'recording')} totalSeconds={totalSeconds} compact/>{phase === 'countin' && <span className="count-in-badge" aria-hidden="true">{countBeat ? (countBeat - 1) % 4 + 1 : '…'}<small>{tr("D\u00E9compte")}</small></span>}<button disabled={phase === 'saving' || projectBusy} className={`editor-play ${playing ? 'is-playing' : ''}`} onClick={() => void toggle()} aria-label={playing ? tr("Arr\u00EAter la lecture depuis l\u2019\u00E9diteur") : tr("Lancer la lecture depuis l\u2019\u00E9diteur")} aria-pressed={playing} title={playing ? tr("Arr\u00EAter la lecture") : tr("Lire le morceau")}>{playing ? <Square size={15} fill="currentColor"/> : <Play size={15} fill="currentColor"/>}{playing ? tr("Arr\u00EAter") : tr("Lecture")}</button>{track.kind !== 'audio' && <span className="grid-label">{tr("Grille 1/16")}</span>}{track.kind !== 'drums' && <button disabled={busy || Boolean(review)} onClick={clear}><Trash2 size={14}/>{tr(" Effacer")}</button>}</div></div>
        {phase === 'countin' && <div className="count-in-banner" role="status" aria-live="polite"><strong>{countBeat ? (countBeat - 1) % 4 + 1 : '…'}</strong><div><b>{tr("D\u00E9compte avant la prise")}</b><span>{countBeat ? tr("Mesure {{v0}} / {{v1}} \u00B7 {{v2}} BPM", { v0: Math.floor((countBeat - 1) / 4) + 1, v1: countInBars, v2: project.bpm }) : tr("Pr\u00E9pare-toi : la prise commence apr\u00E8s les clics.")}</span></div></div>}
        <AmpPanel key={`amp-${track.id}`} track={track} disabled={busy} onChange={next => { changeTrack(track.id, () => next); updateTrackMix(next); }}/>
        <MixPanel key={track.id} track={track} onChange={mix => { const next = { ...track, mix }; changeTrack(track.id, () => next); updateTrackMix(next); }}/>
        {track.kind === 'audio' ? <AudioPanel track={track} bpm={project.bpm} bars={project.bars} playing={playing} playhead={playhead} onClips={editClips} input={input} devices={devices} deviceId={deviceId} channel={channel} busy={busy || Boolean(pending) || Boolean(review)} connecting={connecting} recording={phase === 'preparing' || phase === 'countin' || phase === 'recording'} armed={armedId === track.id} latencyMs={latencyMs} latencyDisabled={phase !== 'idle' || projectBusy || Boolean(pending)} countInBars={countInBars} onCountIn={value => setProject(p => ({ ...p, countInBars: value as CountInBars }))} onDevice={id => { disconnect(); setDeviceId(id); }} onChannel={value => { disconnect(); setChannel(value); }} onConnect={() => void connect()} onDisconnect={disconnect} onArm={() => setArmedId(armedId === track.id ? '' : track.id)} onRecord={() => void record()} onRetake={() => void record(true)} onStop={stop} onImport={file => void importFile(file)} onDelete={clip => changeTrack(track.id, t => ({ ...t, clips: (t.clips ?? []).filter(c => c.id !== clip.id) }))} onDownload={clip => void downloadClip(clip)} onLatency={setLatencyMs}/> : <>
          <p className="instrument-hint">{track.kind === 'drums' ? track.drumKit === 'acoustic' ? tr("Un kit enregistr\u00E9, avec variations de caisse claire et de crash. Le clap reste synth\u00E9tique.") : tr("Construis ton rythme ou ajoute un rythme pr\u00E9d\u00E9fini.") : tr(INSTRUMENTS[track.instrument].description)}{track.muted ? tr(" Piste muette : r\u00E9active-la pour entendre les pr\u00E9\u00E9coutes.") : ''}</p>
          <RepeatNotesPanel key={`repeat-${track.id}`} track={track} bars={project.bars} disabled={busy || Boolean(pending) || Boolean(review)} onChange={repeatPassage}/>
          {track.kind === 'drums' ? <DrumRoll key={track.id} actions={<DrumClearButton key={`clear-${track.id}`} track={track} disabled={busy || Boolean(pending) || Boolean(review)} onChange={passage => changeTrack(track.id, t => ({ ...t, ...passage }))}/>} track={track} bars={project.bars} disabled={busy} playing={playing} playhead={playhead} onNotes={notes => changeTrack(track.id, t => ({ ...t, notes }))}/> : <PianoRoll key={track.id} track={track} bars={project.bars} disabled={busy} playing={playing} playhead={playhead} onNotes={notes => changeTrack(track.id, t => ({ ...t, notes }))}/>}
        </>}
      </section>
    </main></fieldset>
    {tunerOpen && <TunerModal input={input} devices={devices} deviceId={deviceId} channel={channel} connecting={connecting} error={tr(problem)} onDevice={id => { disconnect(); setDeviceId(id); }} onChannel={value => { disconnect(); setChannel(value); }} onConnect={() => void connect()} onDisconnect={disconnect} onClose={() => setTunerOpen(false)}/>}
    <footer>{tr("miniDAW ")}{tr(APP_RELEASE_LABEL)}{tr(" \u00B7 Audio + MIDI \u00B7 Projets .minidaw sur disque \u00B7 Copie de travail dans ce navigateur \u00B7 Enregistrement sur localhost ou HTTPS.")}</footer>
  </div>;
}
