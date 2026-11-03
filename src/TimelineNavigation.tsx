import {tr} from './i18n';
import { Trash2 } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
type View = {
    element: HTMLDivElement;
    pixelsPerBeat: number;
};
export function createTimelineNavigation() {
    const views = new Map<string, View>(), expected = new Map<string, number>();
    let linked = false, lastBeat = 0;
    function position(id: string, beat: number) {
        const view = views.get(id);
        if (!view)
            return;
        const left = Math.max(0, Math.min(beat * view.pixelsPerBeat, Math.max(0, view.element.scrollWidth - view.element.clientWidth)));
        if (Math.abs(view.element.scrollLeft - left) > .5) {
            expected.set(id, left);
            view.element.scrollLeft = left;
        }
    }
    return {
        register(id: string, view: View) {
            views.set(id, view);
            if (linked)
                position(id, lastBeat);
            let lastLeft = view.element.scrollLeft;
            const scroll = () => {
                if (Math.abs(view.element.scrollLeft - lastLeft) < .5)
                    return;
                lastLeft = view.element.scrollLeft;
                const pending = expected.get(id);
                if (pending !== undefined) {
                    expected.delete(id);
                    if (Math.abs(view.element.scrollLeft - pending) < 1)
                        return;
                }
                lastBeat = view.element.scrollLeft / view.pixelsPerBeat;
                if (linked)
                    for (const key of views.keys())
                        if (key !== id)
                            position(key, lastBeat);
            };
            view.element.addEventListener('scroll', scroll);
            return () => { view.element.removeEventListener('scroll', scroll); if (views.get(id) === view)
                views.delete(id); expected.delete(id); };
        },
        setLinked(value: boolean) { linked = value; if (linked)
            for (const id of views.keys())
                position(id, lastBeat); },
        goTo(beat: number) { lastBeat = beat; for (const id of views.keys())
            position(id, beat); },
        follow(beat: number) {
            for (const [id, view] of views) {
                const head = view.element.dataset.timelineHead ? Number(view.element.dataset.timelineHead) : 0;
                const visible = Math.max(1, view.element.clientWidth - head) / view.pixelsPerBeat;
                const left = view.element.scrollLeft / view.pixelsPerBeat;
                if (beat < left || beat >= left + visible - Math.min(1, visible * .15)) {
                    const target = Math.max(0, beat - visible * .2);
                    lastBeat = target;
                    if (linked) {
                        for (const key of views.keys())
                            position(key, target);
                        return;
                    }
                    position(id, target);
                }
            }
        },
        get linked() { return linked; }, get beat() { return lastBeat; },
    };
}
const TimelineContext = createContext<ReturnType<typeof createTimelineNavigation> | null>(null);
type CursorState = {step: number; disabled: boolean; seek: (step: number) => void};
const CursorContext = createContext<CursorState | null>(null);
export function TimelineCursorProvider({children, ...value}: CursorState & {children: ReactNode}) {
    return <CursorContext.Provider value={value}>{children}</CursorContext.Provider>;
}
export function TimelineProvider({ children }: {
    children: ReactNode;
}) {
    const [navigation] = useState(createTimelineNavigation);
    return <TimelineContext.Provider value={navigation}>{children}</TimelineContext.Provider>;
}
export function useTimelineView(id: string, ref: RefObject<HTMLDivElement>, pixelsPerBeat: number, extent?: number) {
    const navigation = useContext(TimelineContext), previous = useRef<{
        id: string;
        beat: number;
    }>();
    useEffect(() => {
        const element = ref.current;
        if (!element || !navigation)
            return;
        if (previous.current?.id === id)
            element.scrollLeft = previous.current.beat * pixelsPerBeat;
        const remember = () => { previous.current = { id, beat: element.scrollLeft / pixelsPerBeat }; };
        const unregister = navigation.register(id, { element, pixelsPerBeat });
        remember();
        element.addEventListener('scroll', remember);
        return () => { element.removeEventListener('scroll', remember); unregister(); };
    }, [id, navigation, pixelsPerBeat, ref, extent]);
}
export function TimelineControls({ playing, playhead }: {
    playing: boolean;
    playhead: number;
}) {
    const navigation = useContext(TimelineContext), [linked, setLinked] = useState(false), [follow, setFollow] = useState(false);
    useEffect(() => { if (playing && follow)
        navigation?.follow(playhead / 4); }, [playing, follow, playhead, navigation]);
    return <div className="timeline-controls"><label><input type="checkbox" checked={linked} onChange={e => { setLinked(e.target.checked); navigation?.setLinked(e.target.checked); }}/>{tr(" Lier les vues")}</label><label><input type="checkbox" checked={follow} onChange={e => setFollow(e.target.checked)}/>{tr(" Suivre la lecture")}</label><button onClick={() => navigation?.goTo(playhead / 4)}>{tr("Revenir au curseur")}</button></div>;
}
export function TimelineRuler({ bars, pixelsPerBeat, head = 0, label = '', onClearMeasure, canClearMeasure, disabled }: {
    bars: number;
    pixelsPerBeat: number;
    head?: number;
    label?: string;
    onClearMeasure?: (bar: number) => void;
    canClearMeasure?: (bar: number) => boolean;
    disabled?: boolean;
}) {
    const cursor = useContext(CursorContext);
    const seekable = !!cursor && !cursor.disabled;
    return <div className={`shared-timeline-ruler${seekable ? ' seekable' : ''}`} style={{ width: head + bars * 4 * pixelsPerBeat }}>{head > 0 && <span className="timeline-ruler-head" style={{ width: head }}>{tr(label)}</span>}<div className="timeline-measures" role={cursor ? 'group' : undefined} tabIndex={seekable ? 0 : undefined} aria-label={cursor ? tr("Position de départ") : undefined} data-cursor-step={cursor ? Math.min(cursor.step, bars * 16 - 1) : undefined} aria-disabled={cursor?.disabled} onKeyDown={e => {if (!seekable || e.target !== e.currentTarget) return; const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (delta || e.key === 'Home' || e.key === 'End') {e.preventDefault();cursor.seek(e.key === 'Home' ? 0 : e.key === 'End' ? bars * 16 - 1 : Math.max(0, Math.min(bars * 16 - 1, cursor.step + delta)));}}} onClick={e => {if (!seekable) return;const x = e.clientX - e.currentTarget.getBoundingClientRect().left;cursor.seek(Math.max(0, Math.min(bars * 16 - 1, Math.floor(x / pixelsPerBeat * 4))));}}>{cursor && <span className="timeline-start-marker" aria-hidden="true" style={{left: Math.min(cursor.step, bars * 16 - 1) / 4 * pixelsPerBeat}}/>}{Array.from({ length: bars }, (_, index) => <div key={index} style={{ width: pixelsPerBeat * 4 }}><strong className={onClearMeasure ? "timeline-measure-title" : undefined}>{tr("Mesure ")}{index + 1}{onClearMeasure && <button type="button" className="measure-trash" aria-label={tr("Vider la mesure {{v0}} de cette piste", { v0: index + 1 })} title={tr("Vider la mesure {{v0}} de cette piste", { v0: index + 1 })} disabled={disabled || canClearMeasure?.(index + 1) === false} onClick={event => { event.stopPropagation(); onClearMeasure(index + 1); }}><Trash2 size={12} aria-hidden="true"/></button>}</strong><div>{[1, 2, 3, 4].map(beat => <span key={beat} style={{ width: pixelsPerBeat }}>{beat}</span>)}</div></div>)}</div></div>;
}
