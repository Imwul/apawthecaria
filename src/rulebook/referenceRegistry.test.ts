import { describe, expect, it } from 'vitest';
// @ts-expect-error Vitest runs this source audit in Node; the app build intentionally exposes browser types only.
import { readFileSync } from 'node:fs';
import { AILMENTS, GUILD_SERVICES, PRINTED_EFFECT_REGISTRY, REAGENTS, TOOLS, TOOL_UPGRADES, classifyPrintedEffect } from '../rules';
import {
  RULEBOOK_COVERAGE,
  RULEBOOK_KIND_COUNTS,
  RULEBOOK_REFERENCE_BY_ID,
  RULEBOOK_REFERENCE_ENTRIES,
  searchReferenceEntries,
  validateRulebookReferenceDrift
} from './referenceRegistry';

describe('personal rulebook transplant registry', () => {
  it('keeps every canonical catalogue at its certified count', () => {
    expect(RULEBOOK_COVERAGE).toMatchObject({
      travel: 103,
      foraging: 144,
      social: 66,
      ailments: 45,
      printedEffects: 358,
      remedies: 189,
      ingredients: 83,
      tags: 22,
      tools: 30,
      services: 17,
      clinic: 10,
      wagon: 10,
      companions: 9,
      barrows: 8,
      regions: 7,
      seasons: 4
    });
  });

  it('has no reference/runtime drift', () => {
    expect(validateRulebookReferenceDrift()).toEqual([]);
    expect(RULEBOOK_COVERAGE.sourceLinkage).toBe(RULEBOOK_REFERENCE_ENTRIES.length);
    expect(RULEBOOK_REFERENCE_ENTRIES).toHaveLength(1201);
    expect(RULEBOOK_KIND_COUNTS.encounter).toBe(313);
    expect(RULEBOOK_KIND_COUNTS.example).toBe(12);
    expect(RULEBOOK_KIND_COUNTS.downtime).toBe(1);
  });

  it('supports entity, rule ID and printed page searches', () => {
    expect(searchReferenceEntries('Wingbreak').some(row => row.id.includes('wingbreak'))).toBe(true);
    expect(searchReferenceEntries('SERVICE-005').some(row => row.kind === 'service')).toBe(true);
    const pageRows = searchReferenceEntries('p.171');
    expect(pageRows.length).toBeGreaterThan(0);
    expect(pageRows.every(row => row.sourcePage <= 171 && (row.endPage || row.sourcePage) >= 171)).toBe(true);
  });

  it('renders canonical numbers and manual semantics directly from runtime data', () => {
    const detailsFor = (id: string) => Object.fromEntries((RULEBOOK_REFERENCE_BY_ID.get(id)?.details || []).map(row => [row.label, row.value]));
    AILMENTS.forEach(ailment => {
      const entry = RULEBOOK_REFERENCE_BY_ID.get(`ailment:${ailment.id}`);
      expect(entry?.sourcePage).toBe(ailment.sourcePage);
      expect(detailsFor(`ailment:${ailment.id}`).Severity).toBe(ailment.severity);
      expect(detailsFor(`ailment:${ailment.id}`).Timer).toBe(String(ailment.timer));
      expect(entry?.relatedIds).toContain('procedure:treatment');
    });
    REAGENTS.forEach(reagent => reagent.preparations.forEach(preparation => {
      const detail = detailsFor(`remedy:${preparation.id}`);
      expect(detail.Weight).toBe(String(preparation.weight));
      expect(detail.Uses).toBe(String(preparation.uses));
      expect(detail.Potency).toBe(preparation.tags.map(tag => `${tag.tag} ${tag.value}`).join(' / ') || '원문 특수');
      expect(RULEBOOK_REFERENCE_BY_ID.get(`remedy:${preparation.id}`)?.relatedIds).toContain('procedure:treatment');
    }));
    TOOLS.forEach(tool => {
      const detail = detailsFor(`tool:${tool.id}`);
      expect(detail.Weight).toBe(String(tool.weight));
      expect(detail.Cost).toBe(String(tool.cost ?? 'Not sold'));
    });
    TOOL_UPGRADES.forEach(upgrade => expect(detailsFor(`tool:${upgrade.id}`).Effect).toBe(upgrade.effect));
    GUILD_SERVICES.forEach(service => expect(detailsFor(`service:${service.id}`).Duration).toBe(service.duration));

    const manual = PRINTED_EFFECT_REGISTRY.filter(effect => effect.status !== 'implemented');
    expect(manual).toHaveLength(347);
    manual.forEach(effect => {
      const entry = RULEBOOK_REFERENCE_BY_ID.get(`printed-effect:${effect.id}`);
      const detail = detailsFor(`printed-effect:${effect.id}`);
      expect(entry?.sourcePage).toBe(effect.sourcePage);
      expect(entry?.runtimeStatus).toBe(classifyPrintedEffect(effect) === 'ambiguous' ? 'ambiguous' : 'manual');
      expect(detail['필요한 결정']).toBe(effect.manualResolution?.decision);
      expect(detail['선택']).toBe(effect.manualResolution?.choices.join(' / ') || '없음');
      expect(detail['후속']).toBe(effect.manualResolution?.followUpRequirements.join(' / ') || effect.followUpState || '없음');
      expect(detail.Transaction).toBe(effect.executor);
    });
  });

  it('ships all 220 source pages outside the JavaScript bundle', () => {
    const payload = JSON.parse(readFileSync('public/rulebook/reference-pages.json', 'utf8'));
    const loaderSource = readFileSync('src/rulebook/sourceLoader.ts', 'utf8');
    expect(payload.pageCount).toBe(220);
    expect(payload.sha256).toBe('c8c39b80bce8d863a1e978d4dd1079588252d9988e2e9ae94d4bc0d4900ff7a4');
    expect(loaderSource).toContain(payload.sha256.slice(0, 16));
    expect(loaderSource).toContain("'caches' in window");
    expect(payload.pages).toHaveLength(220);
    expect(payload.pages.find((row: { page: number }) => row.page === 24)?.text).toContain('How To Move');
    expect(payload.pages.find((row: { page: number }) => row.page === 154)?.text).toContain('Mind Yerself');
  });

  it('keeps the lazy contextual drawer keyboard and mobile accessible', () => {
    const appSource = readFileSync('src/App.tsx', 'utf8');
    const almanackSource = readFileSync('src/components/AlmanackPanel.tsx', 'utf8');
    const drawerSource = readFileSync('src/components/RulebookReferenceDrawer.tsx', 'utf8');
    const cssSource = readFileSync('src/index.css', 'utf8');
    expect(appSource).toContain("lazy(() => import('./components/RulebookReferenceDrawer'))");
    expect(drawerSource).toContain('aria-modal="true"');
    expect(drawerSource).toContain("event.key === 'Escape'");
    expect(drawerSource).toContain("event.key !== 'Tab'");
    expect(almanackSource).toContain("querySelector('#rulebook-reference-detail > header')");
    expect(almanackSource).toContain("behavior: 'instant', block: 'center'");
    expect(almanackSource).toContain('}, [pageResults.length, selectedId]);');
    expect(almanackSource).toContain('개인 참고 기록 정말 비우기');
    expect(cssSource).toMatch(/@media \(max-width: 820px\)[\s\S]*?\.rulebook-drawer\s*\{[\s\S]*?width:\s*100vw/);
    expect(cssSource).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
