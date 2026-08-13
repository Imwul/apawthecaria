import type { RulebookSourcePage, RulebookSourcePayload } from './types';

let payloadPromise: Promise<RulebookSourcePayload> | null = null;
const SOURCE_VERSION = 'c8c39b80bce8d863';
const SOURCE_CACHE = `apawthecaria-rulebook-${SOURCE_VERSION}`;

const fetchRulebookSource = async (): Promise<RulebookSourcePayload> => {
  const url = new URL(`rulebook/reference-pages.json?v=${SOURCE_VERSION}`, document.baseURI).toString();
  if ('caches' in window) {
    const cache = await caches.open(SOURCE_CACHE);
    const cached = await cache.match(url);
    if (cached) return cached.json() as Promise<RulebookSourcePayload>;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Rulebook source load failed: ${response.status}`);
    await cache.put(url, response.clone());
    return response.json() as Promise<RulebookSourcePayload>;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Rulebook source load failed: ${response.status}`);
  return response.json() as Promise<RulebookSourcePayload>;
};

export const loadRulebookSource = (): Promise<RulebookSourcePayload> => {
  if (!payloadPromise) payloadPromise = fetchRulebookSource();
  return payloadPromise;
};

export const loadRulebookPage = async (page: number): Promise<RulebookSourcePage | null> => {
  const payload = await loadRulebookSource();
  return payload.pages.find(row => row.page === page) || null;
};

export const searchRulebookPages = async (query: string, limit = 40): Promise<RulebookSourcePage[]> => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const payload = await loadRulebookSource();
  const pageMatch = normalized.match(/^p(?:age)?\.?\s*(\d+)$/i);
  if (pageMatch) return payload.pages.filter(row => row.page === Number(pageMatch[1]));
  return payload.pages.filter(row => row.text.toLowerCase().includes(normalized)).slice(0, limit);
};
