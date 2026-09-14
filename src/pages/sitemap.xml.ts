import type { APIRoute } from 'astro';
import { catalog } from '../lib/catalog.mjs';

export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/library/', '/favorites/', '/about/', '/extra/qi-wu-xuan-yi/', ...catalog.filter((item) => item.category !== 'extra').map((item) => `/learn/${item.slug}/`)];
  const urls = paths.map((pathname) => `<url><loc>${new URL(pathname, site).href}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
