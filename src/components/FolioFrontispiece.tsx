import type { JournalTab } from '../sessionNavigation';

/** Decorative opening, using unchanged illustrations from the supplied rulebook. */
export default function FolioFrontispiece({ chapter = 'play' }: { chapter?: JournalTab }) {
  const art = chapter === 'map' || chapter === 'livingArchive'
    ? { src: '/art/rulebook-barrow.jpg', width: 1145 }
    : chapter === 'play'
      ? { src: '/art/rulebook-cover.jpg', width: 1195 }
      : { src: '/art/rulebook-workbench.jpg', width: 1195 };
  return <div className="folio-frontispiece" aria-hidden="true">
    <img className="folio-frontispiece__art" src={art.src} alt="" width={art.width} height="844" />
    <div className="folio-frontispiece__copy">
      <span className="folio-frontispiece__eyebrow">A FIELD JOURNAL FROM THE BRISTLEY WOODS</span>
      <p className="folio-frontispiece__title">숲의 작은 약제사에게</p>
      <p className="folio-frontispiece__note">길을 걷고, 약초를 찾고, 만난 이의 이야기를 남깁니다.</p>
    </div>
    <svg className="folio-frontispiece__seal" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth=".7" />
      <circle cx="60" cy="60" r="43" stroke="currentColor" strokeWidth=".7" strokeDasharray="1 6" />
      <path d="M65 29a26 26 0 1 0 21 36A25 25 0 0 1 65 29Z" fill="currentColor" opacity=".65" />
      <path d="m84 27 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="currentColor" />
      <path d="M60 95V79m0 10c-10 0-15-5-15-12 10 0 15 5 15 12Zm0-4c9 0 14-5 14-11-9 0-14 5-14 11Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  </div>;
}
