export const PLACEHOLDER_SITE_URL = 'https://exemplo.com.br';

export function resolveSiteUrl(siteUrl?: string | null): string {
  const trimmed = typeof siteUrl === 'string' ? siteUrl.trim().replace(/\/+$/, '') : '';
  return trimmed || PLACEHOLDER_SITE_URL;
}

export function toAbsoluteUrl(path: string, siteUrl?: string | null): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = `${resolveSiteUrl(siteUrl)}/`;
  return new URL(path.startsWith('/') ? path.slice(1) : path, base).href;
}
