import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';
import { resolveSiteUrl } from './src/lib/site-url';

function readSiteUrlFromSettings() {
  try {
    const settingsPath = fileURLToPath(new URL('./src/data/site-settings.json', import.meta.url));
    const raw = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const entry = Array.isArray(raw) ? raw[0] : raw;
    return resolveSiteUrl(typeof entry?.siteUrl === 'string' ? entry.siteUrl : '');
  } catch {
    return resolveSiteUrl();
  }
}

export default defineConfig({
  // Lido em build-time de siteSettings.siteUrl. Cada cliente precisa ter a URL
  // real em src/data/site-settings.json (campo siteUrl no admin).
  site: readSiteUrlFromSettings(),
  output: 'static',
  integrations: [
    preact(),
    sitemap({
      filter: (page) => {
        try {
          return !new URL(page).pathname.includes('/admin');
        } catch {
          return !page.includes('/admin');
        }
      },
    }),
  ],
});
