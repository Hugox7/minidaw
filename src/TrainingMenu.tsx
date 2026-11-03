import {tr} from './i18n';
import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
export default function TrainingMenu() {
    const menu = useRef<HTMLDetailsElement>(null);
    useEffect(() => {
        const outside = (event: PointerEvent) => { if (menu.current && !menu.current.contains(event.target as Node))
            menu.current.open = false; };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && menu.current?.open) {
                menu.current.open = false;
                menu.current.querySelector('summary')?.focus();
                event.preventDefault();
            }
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
    }, []);
    const close = () => { if (menu.current)
        menu.current.open = false; };
    return <details className="training-menu" ref={menu} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null))
        close(); }}>
    <summary className="guide-link">{tr("Entra\u00EEnement ")}<ChevronDown size={14} aria-hidden="true"/></summary>
    <div className="training-options">
      <a className="training-link" href="https://bass.trameworks.com/" target="_blank" rel="noopener noreferrer" aria-label={tr("Bass : entra\u00EEnement basse (nouvel onglet)")} onClick={close}>{tr("Bass ")}<span aria-hidden="true">↗</span></a>
      <a className="training-link" href="https://guitar.trameworks.com/" target="_blank" rel="noopener noreferrer" aria-label={tr("Guitar : entra\u00EEnement guitare (nouvel onglet)")} onClick={close}>{tr("Guitar ")}<span aria-hidden="true">↗</span></a>
    </div>
  </details>;
}
