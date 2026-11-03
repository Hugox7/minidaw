import {useTranslation} from 'react-i18next';
import {changeLanguage, currentLanguage, isLanguage, languageNames, LANGUAGES, tr} from './i18n';
export default function LanguageSelector() {
  useTranslation();
  return <label className="language-selector"><span>{tr('Langue')}</span><select aria-label={tr('Langue de l’interface')} value={currentLanguage()} onChange={event => {if (isLanguage(event.target.value)) void changeLanguage(event.target.value);}}>{LANGUAGES.map(language => <option key={language} value={language} lang={language}>{languageNames[language]}</option>)}</select></label>;
}
