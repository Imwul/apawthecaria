import type { RulebookSourcePage, RulebookSourcePayload } from './types';

let payloadPromise: Promise<RulebookSourcePayload> | null = null;
const SOURCE_VERSION = 'c8c39b80bce8d863';
const SOURCE_CACHE = `apawthecaria-rulebook-${SOURCE_VERSION}`;

const readPayload = async (response: Response): Promise<RulebookSourcePayload> => {
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.pages) || payload.pages.length === 0
    || payload.pages.some((row: RulebookSourcePage) => !row || !Number.isInteger(row.page) || row.page < 1 || typeof row.text !== 'string')) {
    throw new Error('Invalid rulebook source pages.');
  }
  return payload as RulebookSourcePayload;
};

const fetchRulebookSource = async (): Promise<RulebookSourcePayload> => {
  const url = new URL(`rulebook/reference-pages.json?v=${SOURCE_VERSION}`, document.baseURI).toString();
  if ('caches' in window) {
    try {
      const cached = await (await caches.open(SOURCE_CACHE)).match(url);
      if (cached) return await readPayload(cached);
    } catch {
      // Private browsing, quota limits, and corrupt caches must not hide the book.
    }
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Rulebook source load failed: ${response.status}`);
  const payload = await readPayload(response.clone());
  if ('caches' in window) {
    // Caching is optional: never delay or reject a successfully loaded page.
    void caches.open(SOURCE_CACHE).then(cache => cache.put(url, response)).catch(() => {});
  }
  return payload;
};

export const loadRulebookSource = (): Promise<RulebookSourcePayload> => {
  if (!payloadPromise) payloadPromise = fetchRulebookSource().catch(error => {
    payloadPromise = null;
    throw error;
  });
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
