import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=process.cwd(),require=createRequire(path.join(root,'src/seo.ts')),exports={};
const compiled=ts.transpileModule(fs.readFileSync('src/seo.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
new Function('exports','require',compiled)(exports,require);
const {seoHead,renderSeo,renderLanguageLinks,SITE_ORIGIN}=exports,site=JSON.parse(fs.readFileSync('src/locales/site.json','utf8'));
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const template=fs.readFileSync('dist/index.html','utf8');
const languages=['fr','en','es'];
const replace=(html,language)=>html.replace(/<html lang="[^"]*"/,'<html lang="'+language+'"').replace(/<!--SEO_HEAD-->[\s\S]*?<!--\/SEO_HEAD-->/,seoHead(language)).replace(/<!--SEO_CONTENT-->[\s\S]*?<!--\/SEO_CONTENT-->/,renderSeo(language)).replace(/<!--LOADING-->[\s\S]*?<!--\/LOADING-->/,`<section class="static-loading"><h2>${escape(site[language].summary)}</h2><p>${escape(site[language].loading)}</p><a href="/${language}/guide/">${escape(site[language].guide)}</a></section>`);
for(const lang of languages){fs.mkdirSync('dist/'+lang,{recursive:true});fs.writeFileSync('dist/'+lang+'/index.html',replace(template,lang));}
fs.writeFileSync('dist/index.html',replace(template,'fr'));
// Guides are complete HTML documents; no JavaScript is required to read them.
const original=fs.readFileSync('public/guide.html','utf8'),style=original.match(/<style>([\s\S]*?)<\/style>/)[1];
for(const lang of languages){
 const content=lang==='fr'?original.match(/<main>([\s\S]*?)<\/main>/)[1]:fs.readFileSync(`content/guide.${lang}.html`,'utf8');
 const body=content.replace(/href="\.\/"/g,`href="/${lang}/"`);
 const html=`<!doctype html><html lang="${lang}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="icon" href="/favicon.svg" type="image/svg+xml"/>${seoHead(lang,true)}<style>${style}\n.guide-languages{display:flex;gap:10px;flex-wrap:wrap}.guide-languages nav a{margin-right:10px}</style></head><body><header><a class="brand" href="/${lang}/">mini<span>DAW</span></a><span>${escape(site[lang].guideHeading)}</span><div class="guide-languages">${renderLanguageLinks(lang,true)}</div></header><main>${body}</main><footer><a href="/${lang}/">${escape(site[lang].back)}</a> · <a href="https://trameworks.com/">Trameworks</a></footer></body></html>`;
 fs.mkdirSync(`dist/${lang}/guide`,{recursive:true});fs.writeFileSync(`dist/${lang}/guide/index.html`,html);
}
// Keep the old guide URL as a redirect rather than a duplicate physical page.
fs.rmSync('dist/guide.html', {force:true});
const urls=languages.flatMap(lang=>[`/${lang}/`,`/${lang}/guide/`]);
fs.writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.map(url=>`<url><loc>${SITE_ORIGIN}${url}</loc>${languages.map(lang=>`<xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_ORIGIN}/${lang}/${url.endsWith('guide/')?'guide/':''}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/${url.endsWith('guide/')?'fr/guide/':''}"/></url>`).join('')}</urlset>`);
fs.writeFileSync('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
console.log('SEO: generated 3 localized studios, 3 static guides, sitemap and robots.txt.');
