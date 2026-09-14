import type { APIRoute } from 'astro';
import { loadCatalog, normalizeSearch } from '../lib/catalog.mjs';

export const GET: APIRoute = async () => {
  const items = await loadCatalog();
  return new Response(JSON.stringify(items.map((item) => ({
    id: item.id,
    text: normalizeSearch([
      item.title,
      item.description,
      item.type,
      ...item.tags,
      ...item.years,
      item.plainText,
    ].join(' ')),
  }))), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
