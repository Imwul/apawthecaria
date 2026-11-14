import type { JournalTab } from '../sessionNavigation';

/** Decorative opening, using unchanged illustrations from the supplied rulebook. */
export default function FolioFrontispiece({ chapter = 'play', opening = false }: { chapter?: JournalTab; opening?: boolean }) {
  const art = chapter === 'map' || chapter === 'livingArchive'
    ? { src: '/art/rulebook-barrow.jpg', width: 1145 }
    : chapter === 'play'
      ? { src: '/art/rulebook-cover.jpg', width: 1195 }
      : { src: '/art/rulebook-workbench.jpg', width: 1195 };
  return <div className={`folio-frontispiece${opening ? '' : ' folio-frontispiece--chapter'}`} aria-hidden="true">
    <img className="folio-frontispiece__art" src={art.src} alt="" width={art.width} height="844" />
    {opening && <><div className="folio-frontispiece__copy">
      <p className="folio-frontispiece__title">숲의 작은 약제사에게</p>
      <p className="folio-frontispiece__note">길을 걷고, 약초를 찾고, 만난 이의 이야기를 남깁니다.</p>
    </div></>}
  </div>;
}
