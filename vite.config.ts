import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import {seoHead, renderLanguageLinks} from './src/seo';
import type {SiteLanguage} from './src/seo';
export default defineConfig({plugins: [react(), {
  name: 'localized-dev-guides',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const match = req.url?.split('?')[0].match(/^\/(fr|en|es)\/guide\/?$/);
      if (!match) {next(); return;}
      const language = match[1] as SiteLanguage, original = fs.readFileSync('public/guide.html', 'utf8');
      const style = original.match(/<style>([\s\S]*?)<\/style>/)![1];
      const content = language === 'fr' ? original.match(/<main>([\s\S]*?)<\/main>/)![1] : fs.readFileSync(`content/guide.${language}.html`, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><html lang="${language}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="icon" href="/favicon.svg"/>${seoHead(language, true)}<style>${style}</style></head><body><header><a href="/${language}/">miniDAW</a>${renderLanguageLinks(language, true)}</header><main>${content}</main></body></html>`);
    });
  },
}]});
