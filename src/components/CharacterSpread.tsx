import { useId, useState, type ReactNode } from 'react';

/**
 * Character creation as a card spread on the table: six cards lie face down in two rows
 * (the apothecary and the familiar). Turning a card writes its result underneath it, and
 * each person's name tag sits at the head of their row. No steps, no tabs.
 */

import { SPREAD_SUITS, SPREAD_VALUES, isRedSuit, rankLabel, type SpreadPlayingCard } from './characterSpreadCards';

type Panel = 'none' | 'physical' | 'choose';

export function SpreadCard({
  topic,
  page,
  card,
  chosen,
  faceSrc,
  title,
  detail,
  chooser,
  onTurn,
  onPhysical
}: {
  topic: string;
  page: string;
  card: SpreadPlayingCard | null;
  /** The table result counts as decided (drawn, entered, or picked by hand). */
  chosen: boolean;
  faceSrc?: string;
  title?: ReactNode;
  detail?: ReactNode;
  /** The by-hand picker (a select), shown when the player wants to choose instead of draw. */
  chooser: ReactNode;
  onTurn: () => void;
  onPhysical: (card: SpreadPlayingCard) => void;
}) {
  const [panel, setPanel] = useState<Panel>('none');
  const [suit, setSuit] = useState<string>(card?.suit || '♥');
  const [value, setValue] = useState<number>(card?.value || 1);
  const captionId = useId();
  const toggle = (next: Panel) => setPanel(current => current === next ? 'none' : next);
  const cardName = card ? `${card.suit}${rankLabel(card.value)}` : '';

  return (
    <div className="spread-slot" data-state={chosen ? 'up' : 'down'}>
      <button
        type="button"
        className="spread-card"
        onClick={() => { if (!chosen) onTurn(); }}
        aria-disabled={chosen}
        aria-describedby={captionId}
        aria-label={chosen ? `${topic} 카드 ${cardName || '직접 고름'}` : `${topic} 카드 뒤집기`}
      >
        <span className="spread-card__inner">
          <span className="spread-card__back" aria-hidden="true" />
          <span className="spread-card__face" aria-hidden="true">
            {card && faceSrc
              ? <img src={faceSrc} alt="" />
              : <span className="spread-card__by-hand">직접<br />골랐어요</span>}
          </span>
        </span>
      </button>

      <div className="spread-slot__caption" id={captionId}>
        <p className="spread-slot__topic">
          {topic}
          {card && <span className={`spread-slot__pip${isRedSuit(card.suit) ? ' is-red' : ''}`}>{cardName}</span>}
          <span className="spread-slot__page">{page}</span>
        </p>
        {chosen ? (
          <>
            <strong className="spread-slot__title">{title}</strong>
            {detail && <p className="spread-slot__detail">{detail}</p>}
          </>
        ) : (
          <p className="spread-slot__hint">카드를 눌러 뒤집어요</p>
        )}
        <div className="spread-slot__links">
          <button type="button" aria-expanded={panel === 'physical'} onClick={() => toggle('physical')}>실물 카드 적기</button>
          <button type="button" aria-expanded={panel === 'choose'} onClick={() => toggle('choose')}>표에서 고르기</button>
        </div>
        {panel === 'physical' && (
          <div className="spread-slot__panel">
            <div className="spread-picker" role="group" aria-label="무늬">
              {SPREAD_SUITS.map(option => (
                <button key={option} type="button" aria-pressed={suit === option} className={isRedSuit(option) ? 'is-red' : ''} onClick={() => setSuit(option)}>{option}</button>
              ))}
            </div>
            <div className="spread-picker spread-picker--values" role="group" aria-label="숫자">
              {SPREAD_VALUES.map(([v, label]) => (
                <button key={v} type="button" aria-pressed={value === v} onClick={() => setValue(v)}>{label}</button>
              ))}
            </div>
            <button type="button" className="spread-slot__place" onClick={() => { onPhysical({ suit, value }); setPanel('none'); }}>
              {suit}{rankLabel(value)} 내려놓기
            </button>
          </div>
        )}
        {panel === 'choose' && <div className="spread-slot__panel">{chooser}</div>}
      </div>
    </div>
  );
}

/** The luggage tag at the head of a row: who this is. */
export function SpreadTag({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <div className="spread-tag">
      <p className="spread-tag__kicker">{kicker}</p>
      {children}
    </div>
  );
}
