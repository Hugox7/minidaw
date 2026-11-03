import {tr} from './i18n';
import { useEffect, useState } from 'react';
import { MAX_MASTER_VOLUME_DB, MIN_VOLUME_DB, normalizeVolume } from './volumeSettings';
export default function VolumeControl({ label, value, max = MAX_MASTER_VOLUME_DB, onChange }: {
    label: string;
    value: number;
    max?: number;
    onChange: (value: number) => void;
}) {
    const [draft, setDraft] = useState(String(value)), [focused, setFocused] = useState(false);
    useEffect(() => { if (!focused)
        setDraft(String(value)); }, [value, focused]);
    return <div className="volume-control" onClick={e => e.stopPropagation()}><input aria-label={tr(label)} type="range" min={MIN_VOLUME_DB} max={max} step={.5} value={value} onChange={e => onChange(normalizeVolume(Number(e.target.value), value, max))}/><label><input aria-label={tr("{{v0}} en dB", { v0: label })} type="number" min={MIN_VOLUME_DB} max={max} step={.5} value={draft} onFocus={() => setFocused(true)} onChange={e => { setDraft(e.target.value); const number = Number(e.target.value); if (e.target.value !== '' && Number.isFinite(number) && number >= MIN_VOLUME_DB && number <= max)
        onChange(normalizeVolume(number, value, max)); }} onBlur={() => { const number = draft === '' ? value : Number(draft); onChange(normalizeVolume(number, value, max)); setFocused(false); setDraft(String(normalizeVolume(number, value, max))); }} onKeyDown={e => { if (e.key === 'Enter')
        e.currentTarget.blur(); }}/><span>{tr("dB")}</span></label></div>;
}
