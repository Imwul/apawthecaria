import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from '../rules/data/encounters';
import { RULEBOOK_REFERENCE_BY_ID, RULEBOOK_REFERENCE_ENTRIES } from './referenceRegistry';
import { readableReference, referenceChoices, searchReadableReferences } from './readingPresentation';
import { READER_GUIDES, readerGuideForPage } from './readerGuide';
import { CATALOGUE_READING_KO } from './catalogueReadingKo';

describe('Korean in-app rulebook reading', () => {
  it('provides a sourced guide for every playable source page', () => {
    for (let page = 6; page <= 220; page++) expect(readerGuideForPage(page), `p.${page}`).toBeDefined();
    for (const guide of READER_GUIDES) {
      expect(guide.steps.length).toBeGreaterThan(0);
      expect(guide.exception).toMatch(/[가-힣]/);
    }
  });
  it('renders every encounter and every choice in Korean', () => {
    const missing: string[] = [];
    for (const encounter of ENCOUNTERS) {
      const entry = RULEBOOK_REFERENCE_BY_ID.get(`encounter:${encounter.id}`)!;
      const display = readableReference(entry);
      if (!/[가-힣]/.test(display.title)) missing.push(`${entry.id}:title:${display.title}`);
      if (!/[가-힣]/.test(display.summary)) missing.push(`${entry.id}:summary:${display.summary}`);
      const choices = referenceChoices(entry);
      expect(choices).toHaveLength(encounter.choices.length);
      choices.forEach((choice, index) => { if (!/[가-힣]/.test(choice)) missing.push(`${entry.id}:${index}:${choice}`); });
    }
    expect(missing).toEqual([]);
  });
  it('localizes reading without mutating rule IDs, numbers, or search filters', () => {
    const before = JSON.stringify(RULEBOOK_REFERENCE_ENTRIES);
    RULEBOOK_REFERENCE_ENTRIES.forEach(entry => {
      const shown = readableReference(entry);
      expect(shown.id).toBe(entry.id);
      expect(shown.ownerId).toBe(entry.ownerId);
      expect(shown.sourcePage).toBe(entry.sourcePage);
      for (const label of ['Potency', 'Weight', 'Uses', 'Timer', 'Base Rarity']) {
        expect(shown.details.find(row => row.label === label)?.value).toBe(entry.details.find(row => row.label === label)?.value);
      }
      expect(shown.details.some(row => /consumer|Canonical flow|Transaction/.test(row.label))).toBe(false);
    });
    expect(JSON.stringify(RULEBOOK_REFERENCE_ENTRIES)).toBe(before);
  });
  it('finds localized titles as well as canonical English names and page references', () => {
    expect(searchReadableReferences('댐 때문에').some(row => row.kind === 'encounter')).toBe(true);
    expect(searchReadableReferences('채집').some(row => row.kind === 'procedure')).toBe(true);
    expect(searchReadableReferences('Wingbreak').some(row => row.kind === 'ailment')).toBe(true);
    expect(searchReadableReferences('p.171').every(row => row.sourcePage <= 171 && (row.endPage || row.sourcePage) >= 171)).toBe(true);
  });
  it('covers every service, clinic, wagon, companion, upgrade and barrow with authored Korean guidance', () => {
    const entries = RULEBOOK_REFERENCE_ENTRIES.filter(row => ['service', 'clinic', 'wagon', 'companion', 'barrow'].includes(row.kind) || (row.kind === 'tool' && row.sourcePage === 66));
    expect(entries).toHaveLength(61);
    for (const entry of entries) {
      expect(CATALOGUE_READING_KO[entry.id], entry.id).toBeDefined();
      expect(readableReference(entry).summary).toMatch(/[가-힣]/);
      expect(readableReference(entry).details.some(row => row.value.startsWith('{'))).toBe(false);
    }
    expect(readableReference(RULEBOOK_REFERENCE_BY_ID.get('service:smithing')!).details.find(row => row.label === 'Unlock / Location')?.value).toContain('모든 도시');
    expect(searchReadableReferences('깊은 곳의 수확').map(row => row.id)).toContain('service:pick-of-the-deep');
  });
  it('calls out exceptional rules instead of presenting the summary as exhaustive automation', () => {
    expect(readerGuideForPage(33)?.steps.join(' ')).toContain('타이머를 줄이기 전에 치료');
    expect(readerGuideForPage(37)?.steps.join(' ')).toContain('모든 타이머가 0보다');
    expect(readerGuideForPage(48)?.exception).toContain('동시 편집');
    expect(readerGuideForPage(121)?.steps.join(' ')).toContain('증감 효과를 무시');
  });
});
