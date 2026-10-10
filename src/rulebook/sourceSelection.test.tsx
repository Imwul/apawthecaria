import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { selectRulebookSource } from './sourceSelection';
import { RULEBOOK_REFERENCE_BY_ID } from './referenceRegistry';
import RulebookReferenceDrawer from '../components/RulebookReferenceDrawer';

describe('contextual rulebook source page and reading history', () => {
  it.each([
    { entryId: 'procedure:diagnosis', page: 29, endPage: 31 },
    { entryId: 'procedure:foraging', page: 33, endPage: 33 },
    { entryId: 'procedure:bartering', page: 35, endPage: 35 }
  ])('opens the requested page $page inside $entryId instead of its chapter start', ({ entryId, page, endPage }) => {
    const entry = RULEBOOK_REFERENCE_BY_ID.get(entryId)!;
    expect(selectRulebookSource(entry, page, 0)).toEqual({ page, endPage });
    const html = renderToStaticMarkup(<RulebookReferenceDrawer request={{ entryId, page }} onClose={() => {}} />);
    expect(html).toContain(`원본 룰북 · p.${page}${page === endPage ? '' : `–${endPage}`} 펼치기`);
  });

  it('does not carry an old shortcut page into related entries, even if it fits their range', () => {
    const foraging = RULEBOOK_REFERENCE_BY_ID.get('procedure:foraging')!;
    expect(selectRulebookSource(foraging, 33, 1)).toEqual({ page: 32, endPage: 33 });
    const diagnosis = RULEBOOK_REFERENCE_BY_ID.get('procedure:diagnosis')!;
    expect(selectRulebookSource(diagnosis, 29, 2)).toEqual({ page: 26, endPage: 31 });
  });

  it('restores the exact opening page with back while forward uses the related entry start', () => {
    const diagnosis = RULEBOOK_REFERENCE_BY_ID.get('procedure:diagnosis')!;
    const treatment = RULEBOOK_REFERENCE_BY_ID.get('procedure:treatment')!;
    const trail = [diagnosis, treatment, diagnosis];
    const pages = [0, 1, 2, 1, 0, 1].map(index => selectRulebookSource(trail[index], 29, index).page);
    expect(pages).toEqual([29, 27, 26, 27, 29, 27]);
  });

  it.each([25, 32, 0, 221, 29.5, Number.NaN, undefined])('rejects invalid or out-of-range requested page %s', requestedPage => {
    const entry = RULEBOOK_REFERENCE_BY_ID.get('procedure:diagnosis')!;
    expect(selectRulebookSource(entry, requestedPage, 0)).toEqual({ page: 26, endPage: 31 });
  });

  it('uses a valid direct page without an entry and otherwise preserves the reading fallback', () => {
    expect(selectRulebookSource(null, 33, -1)).toEqual({ page: 33 });
    expect(selectRulebookSource(null, 33, 0)).toEqual({ page: 33 });
    expect(selectRulebookSource(null, 33, 1)).toEqual({ page: 6 });
    expect(selectRulebookSource(null, 0, 0)).toEqual({ page: 6 });
    expect(selectRulebookSource(null, undefined, 0)).toEqual({ page: 6 });
  });

  it('does not invent a range for a single-page reference or change its source metadata', () => {
    const entry = RULEBOOK_REFERENCE_BY_ID.get('example:rarity')!;
    const original = structuredClone(entry);
    expect(selectRulebookSource(entry, 30, 0)).toEqual({ page: 30, endPage: undefined });
    expect(selectRulebookSource(entry, 29, 0).page).toBe(30);
    expect(entry).toEqual(original);
  });
});
