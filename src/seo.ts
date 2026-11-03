import site from './locales/site.json';
export type SiteLanguage = keyof typeof site;
export const SITE_ORIGIN = 'https://minidaw.trameworks.com';
const languages: SiteLanguage[] = ['fr', 'en', 'es'];
const labels = {fr: 'Français', en: 'English', es: 'Español'};
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]!));
export function renderLanguageLinks(language: SiteLanguage, guide = false) {
  return `<nav aria-label="${escape(site[language].language)}">${languages.map(lang => `<a data-language="${lang}" href="/${lang}/${guide ? 'guide/' : ''}" lang="${lang}" hreflang="${lang}"${lang === language ? ' aria-current="page"' : ''}>${labels[lang]}</a>`).join(' · ')}</nav>`;
}
export function renderSeo(language: SiteLanguage) {
  const s = site[language];
  return `<details class="seo-about"><summary>${escape(s.summary)}</summary><article><h1>${escape(s.heading)}</h1><p>${escape(s.intro)}</p><h2>${escape(s.featuresTitle)}</h2><ul>${s.features.map(value => `<li>${escape(value)}</li>`).join('')}</ul><h2>${escape(s.startTitle)}</h2><ol>${s.steps.map(value => `<li>${escape(value)}</li>`).join('')}</ol><h2>${escape(s.faqTitle)}</h2>${s.faq.map(([q, a]) => `<section><h3>${escape(q)}</h3><p>${escape(a)}</p></section>`).join('')}<p><a href="/${language}/guide/">${escape(s.guide)}</a></p><p>${escape(s.practice)} : <a href="https://bass.trameworks.com/" target="_blank" rel="noopener noreferrer">Bass ↗</a> · <a href="https://guitar.trameworks.com/" target="_blank" rel="noopener noreferrer">Guitar ↗</a></p><p><a href="https://trameworks.com/">${escape(s.by)}</a></p></article></details>${renderLanguageLinks(language)}`;
}
export function seoHead(language: SiteLanguage, guide = false) {
  const s = site[language], title = guide ? s.guideTitle : s.title, description = guide ? s.guideDescription : s.description;
  const url = `${SITE_ORIGIN}/${language}/${guide ? 'guide/' : ''}`;
  const json = JSON.stringify({'@context': 'https://schema.org', '@type': 'WebApplication', '@id': `${SITE_ORIGIN}/#app`, name: 'miniDAW', url, description, applicationCategory: 'MultimediaApplication', operatingSystem: 'Web browser', inLanguage: ['fr', 'en', 'es'], isAccessibleForFree: true, offers: {'@type': 'Offer', price: '0', priceCurrency: 'EUR'}, featureList: s.features}).replace(/</g, '\\u003c');
  return `<title>${escape(title)}</title><meta name="description" content="${escape(description)}"/><meta name="robots" content="index,follow"/><link rel="canonical" href="${url}"/>${languages.map(lang => `<link rel="alternate" hreflang="${lang}" href="${SITE_ORIGIN}/${lang}/${guide ? 'guide/' : ''}"/>`).join('')}<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/${guide ? 'fr/guide/' : ''}"/><meta property="og:type" content="website"/><meta property="og:site_name" content="miniDAW"/><meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:url" content="${url}"/><meta property="og:locale" content="${{fr: 'fr_FR', en: 'en_GB', es: 'es_ES'}[language]}"/><meta name="twitter:card" content="summary"/><meta name="twitter:title" content="${escape(title)}"/><meta name="twitter:description" content="${escape(description)}"/>${guide ? '' : `<script type="application/ld+json" id="app-schema">${json}</script>`}`;
}
export function updateSeo(language: SiteLanguage) {
  document.documentElement.lang = language;
  const parsed = new DOMParser().parseFromString(`<html><head>${seoHead(language)}</head></html>`, 'text/html');
  document.title = parsed.title;
  for (const name of ['description', 'robots', 'twitter:card', 'twitter:title', 'twitter:description']) {
    const value = parsed.head.querySelector(`meta[name="${name}"]`); let target = document.head.querySelector(`meta[name="${name}"]`);
    if (!target && value) {target = value.cloneNode() as Element; document.head.appendChild(target);} if (value && target) target.setAttribute('content', value.getAttribute('content') ?? '');
  }
  for (const name of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:locale']) {
    const value = parsed.head.querySelector(`meta[property="${name}"]`); let target = document.head.querySelector(`meta[property="${name}"]`);
    if (!target && value) {target = value.cloneNode() as Element; document.head.appendChild(target);} if (value && target) target.setAttribute('content', value.getAttribute('content') ?? '');
  }
  document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang], #app-schema').forEach(node => node.remove());
  parsed.head.querySelectorAll('link, #app-schema').forEach(node => document.head.appendChild(node.cloneNode(true)));
  const content = document.getElementById('seo-content'); if (content) content.innerHTML = renderSeo(language);
}
