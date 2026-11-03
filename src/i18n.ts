import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
export const LANGUAGES = ['fr', 'en', 'es'] as const;
export type Language = typeof LANGUAGES[number];
export const languageNames: Record<Language, string> = {fr: 'Français', en: 'English', es: 'Español'};
export const isLanguage = (value: unknown): value is Language => LANGUAGES.includes(value as Language);
export function currentLanguage(): Language {return isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'fr';}
export function languageFromPath(path: string): Language | undefined {const value = path.match(/^\/(fr|en|es)(?:\/|$)/)?.[1]; return isLanguage(value) ? value : undefined;}
function initialLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';
  const explicit = languageFromPath(window.location.pathname); if (explicit) return explicit;
  try {const saved = localStorage.getItem('mini-daw-language'); if (isLanguage(saved)) return saved;} catch {}
  return 'fr';
}
void i18n.use(initReactI18next).init({resources: {fr: {translation: fr}, en: {translation: en}, es: {translation: es}}, lng: initialLanguage(), fallbackLng: 'fr', supportedLngs: [...LANGUAGES], keySeparator: false, nsSeparator: false, interpolation: {escapeValue: false}, initAsync: false, returnNull: false});
const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
const dictionaries: Record<Language, Record<string, string>> = {fr, en, es};
const reverse = new Map<string, string>();
for (const language of LANGUAGES) for (const [key, value] of Object.entries(dictionaries[language])) reverse.set(normalize(value), key);
// Existing statuses and validation errors may outlive a language switch. Resolve
// their known message template without touching interpolated user data.
const patterns: {key: string; regex: RegExp; names: string[]}[] = [];
for (const language of LANGUAGES) for (const [key, value] of Object.entries(dictionaries[language])) {
  if (!value.includes('{{')) continue;
  const names: string[] = [], escaped = normalize(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = escaped.replace(/\\\{\\\{(\w+)\\\}\\\}/g, (_all, name: string) => {names.push(name); return '([\\s\\S]*?)';});
  patterns.push({key, regex: new RegExp(`^${expression}$`), names});
}
patterns.sort((a, b) => b.key.replace(/\{\{\w+\}\}/g, '').length - a.key.replace(/\{\{\w+\}\}/g, '').length);
export function tr(value: string, variables?: Record<string, unknown>): string {
  const text = normalize(value), prefix = /^\s/.test(value) ? ' ' : '', suffix = /\s$/.test(value) ? ' ' : '';
  let key = Object.prototype.hasOwnProperty.call(fr, text) ? text : reverse.get(text) ?? text, options = variables;
  if (!variables && !Object.prototype.hasOwnProperty.call(fr, key)) {
    for (const item of patterns) {const match = text.match(item.regex); if (match) {key = item.key; options = Object.fromEntries(item.names.map((name, index) => [name, match[index + 1]])); break;}}
  }
  return prefix + String(i18n.t(key, {...options, defaultValue: text})) + suffix;
}
export async function changeLanguage(language: Language, push = true) {
  try {localStorage.setItem('mini-daw-language', language);} catch {}
  if (push && typeof window !== 'undefined') {const url = new URL(window.location.href); url.pathname = `/${language}/`; window.history.pushState(window.history.state, '', url);}
  await i18n.changeLanguage(language);
}
export const guideHref = () => `/${currentLanguage()}/guide/`;
export const localeTag = () => ({fr: 'fr-FR', en: 'en-GB', es: 'es-ES'}[currentLanguage()]);
export default i18n;
