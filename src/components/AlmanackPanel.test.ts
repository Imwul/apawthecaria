import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AlmanackPanel from './AlmanackPanel';

vi.mock('../rulebook/referenceRegistry', () => {
  const entries = [
    { id: 'chapter:overview', kind: 'chapter', title: 'Overview', summary: '전체 흐름', sourcePage: 8, runtimeStatus: 'reference-only', details: [], relatedIds: [] },
    { id: 'ailment:first', ownerId: 'first', kind: 'ailment', title: '첫 질환', summary: '질환 기록', sourcePage: 200, runtimeStatus: 'canonical', details: [], relatedIds: [] }
  ];
  return {
    RULEBOOK_REFERENCE_BY_ID: new Map(entries.map(entry => [entry.id, entry])),
    referenceSearchReason: () => '',
    searchReferenceEntries: () => entries
  };
});

const renderCatalogue = (activeAilmentId?: string) => renderToStaticMarkup(createElement(AlmanackPanel, {
  gameplayContext: { currentLocationName: 'Odoak', currentRegion: 'Forest', currentSeason: 'Spring', requirements: [], activeAilmentId },
  onReturnToGameplay: () => {}
}));

describe('reference catalogue patient context', () => {
  it('does not label unrelated chapters as the current ailment when there is no diagnosis', () => {
    const html = renderCatalogue();
    expect(html).toContain('플레이 흐름');
    expect(html).not.toContain('현재 질환');
    expect(html).toContain('진료 중인 환자 없음');
  });

  it('marks only the actual diagnosed ailment and ignores unknown ids', () => {
    expect(renderCatalogue('first').match(/현재 질환/g)).toHaveLength(1);
    expect(renderCatalogue('unknown')).not.toContain('현재 질환');
  });
});
