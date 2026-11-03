import {tr} from './i18n';
export default function Waveform({ peaks, color = 'currentColor' }: {
    peaks: number[];
    color?: string;
}) {
    return <svg className="audio-waveform" viewBox="0 0 128 80" preserveAspectRatio="none" aria-label={tr("Forme d\u2019onde")}><path d="M0 40H128" stroke={color} opacity=".25"/>{peaks.map((peak, i) => <path key={i} d={`M${i} ${40 - Math.max(.5, peak * 37)}V${40 + Math.max(.5, peak * 37)}`} stroke={color} strokeWidth=".8"/>)}</svg>;
}
