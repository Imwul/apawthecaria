import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FolioFrontispiece from './FolioFrontispiece';
import JournalPhotoDialog from './JournalPhotoDialog';
import AlmanackPanel from './AlmanackPanel';

describe('working journal editorial hierarchy', () => {
  it('retains the full illustrated welcome for a new campaign', () => {
    const html = renderToStaticMarkup(<FolioFrontispiece opening />);
    expect(html).toContain('/art/rulebook-cover.jpg');
    expect(html).toContain('숲의 작은 약제사에게');
    expect(html).not.toContain('folio-frontispiece__seal');
  });

  it('preserves the chapter artwork without repeating promotional copy over reference tasks', () => {
    const html = renderToStaticMarkup(<FolioFrontispiece chapter="map" />);
    expect(html).toContain('/art/rulebook-barrow.jpg');
    expect(html).not.toContain('숲의 작은 약제사에게');
    expect(html).not.toContain('folio-frontispiece__seal');
  });

  it('puts rule lookup before contextual browsing while keeping context and return controls', () => {
    const html = renderToStaticMarkup(<AlmanackPanel gameplayContext={{currentLocationName:'Odoak',currentRegion:'Forest',currentSeason:'Spring',requirements:[]}} onReturnToGameplay={()=>{}} />);
    expect(html.indexOf('almanack__controls')).toBeLessThan(html.indexOf('rulebook-context-shelf'));
    expect(html).toContain('색인 검색');
    expect(html).toContain('현재 지역·계절');
    expect(html).toContain('펼쳐둔 배낭');
    expect(html).toContain('오늘의 플레이로 돌아가기');
  });

  it('exposes a named modal with an explicit close control while retaining the actual media', () => {
    const html = renderToStaticMarkup(<JournalPhotoDialog title="가을의 기억" photoName="field.png" onClose={()=>{}}><img src="/field.png" alt="수첩에 남긴 풍경" /></JournalPhotoDialog>);
    const titleId = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(titleId).toBeTruthy();
    expect(html).toContain(`id="${titleId}"`);
    expect(html).toContain('aria-label="확대 사진 닫기"');
    expect(html).toContain('alt="수첩에 남긴 풍경"');
  });
});
