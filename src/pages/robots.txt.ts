import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { resolveSiteUrl } from '../lib/site-url';

export const GET: APIRoute = async () => {
  const settings = await getEntry('siteSettings', 'default');
  const siteUrl = resolveSiteUrl(settings?.data.siteUrl);
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    '',
    `Sitemap: ${siteUrl}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};
