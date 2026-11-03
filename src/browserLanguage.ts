import i18n, {changeLanguage, currentLanguage, isLanguage, languageFromPath} from './i18n';
import {updateSeo} from './seo';
/** URL and metadata updates deliberately preserve the mounted audio session. */
export function startLanguageNavigation() {
  updateSeo(currentLanguage());
  if (window.location.pathname === '/') {
    const url = new URL(window.location.href); url.pathname = `/${currentLanguage()}/`;
    window.history.replaceState(window.history.state, '', url);
  }
  const changed = (language: string) => {if (isLanguage(language)) updateSeo(language);};
  const popped = () => {void changeLanguage(languageFromPath(window.location.pathname) ?? 'fr', false);};
  const clicked = (event: MouseEvent) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-language]') : null;
    const language = link?.dataset.language;
    if (isLanguage(language)) {event.preventDefault(); void changeLanguage(language);}
  };
  i18n.on('languageChanged', changed); window.addEventListener('popstate', popped); document.addEventListener('click', clicked);
  return () => {i18n.off('languageChanged', changed); window.removeEventListener('popstate', popped); document.removeEventListener('click', clicked);};
}
