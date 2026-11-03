import { SITIO } from '@/lib/config';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
