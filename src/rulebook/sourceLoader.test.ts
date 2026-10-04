import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const payload = { pages: [{ page: 24, text: 'How To Move' }], pageCount: 1 };
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('window', {});
  vi.stubGlobal('document', { baseURI: 'https://example.test/apaw/' });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));
});
afterEach(() => vi.unstubAllGlobals());

describe('rulebook source resilience', () => {
  it('loads without Cache Storage', async () => {
    const { loadRulebookPage } = await import('./sourceLoader');
    expect(await loadRulebookPage(24)).toEqual(payload.pages[0]);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/apaw/rulebook/reference-pages.json'));
  });
  it('loads when cache access is denied', async () => {
    const cache = { open: vi.fn().mockRejectedValue(new Error('SecurityError')) };
    vi.stubGlobal('window', { caches: cache });
    vi.stubGlobal('caches', cache);
    const { loadRulebookPage } = await import('./sourceLoader');
    expect(await loadRulebookPage(24)).toEqual(payload.pages[0]);
  });
  it('does not lose downloaded text when caching exceeds quota', async () => {
    const cache = { open: vi.fn().mockResolvedValue({ match: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockRejectedValue(new Error('QuotaExceededError')) }) };
    vi.stubGlobal('window', { caches: cache });
    vi.stubGlobal('caches', cache);
    const { loadRulebookSource } = await import('./sourceLoader');
    expect(await loadRulebookSource()).toEqual(payload);
  });
  it('retries after a network failure instead of caching the rejection', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    const { loadRulebookSource } = await import('./sourceLoader');
    await expect(loadRulebookSource()).rejects.toThrow('offline');
    expect(await loadRulebookSource()).toEqual(payload);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('shares an in-flight request', async () => {
    const { loadRulebookSource } = await import('./sourceLoader');
    const [a, b] = await Promise.all([loadRulebookSource(), loadRulebookSource()]);
    expect(a).toEqual(b);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('replaces a syntactically valid but malformed cache', async () => {
    const put = vi.fn().mockResolvedValue(undefined);
    const cache = { open: vi.fn().mockResolvedValue({ match: vi.fn().mockResolvedValue(new Response('{"pages":{}}')), put }) };
    vi.stubGlobal('window', { caches: cache });
    vi.stubGlobal('caches', cache);
    const { loadRulebookPage } = await import('./sourceLoader');
    expect(await loadRulebookPage(24)).toEqual(payload.pages[0]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(1);
  });
  it('does not memoize malformed network pages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"pages":[{"page":24}]}'));
    const { loadRulebookSource } = await import('./sourceLoader');
    await expect(loadRulebookSource()).rejects.toThrow('Invalid rulebook source pages');
    expect(await loadRulebookSource()).toEqual(payload);
  });
});
