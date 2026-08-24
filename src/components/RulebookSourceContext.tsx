import { useEffect, useMemo, useState } from 'react';
import { RULEBOOK_REFERENCE_ENTRIES } from '../rulebook/referenceRegistry';
import { loadRulebookPage } from '../rulebook/sourceLoader';
import type { RulebookSourcePage } from '../rulebook/types';
import { RULEBOOK_KIND_LABELS, RULEBOOK_STATUS_LABELS } from './rulebookPresentation';

export default function RulebookSourceContext({ ownerId, page }: { ownerId: string; page: number }) {
  const [source, setSource] = useState<RulebookSourcePage | null>(null);
  const related = useMemo(() => RULEBOOK_REFERENCE_ENTRIES.filter(entry => entry.ownerId === ownerId).slice(0, 4), [ownerId]);

  useEffect(() => {
    let cancelled = false;
    loadRulebookPage(page).then(row => { if (!cancelled) setSource(row); }).catch(() => { if (!cancelled) setSource(null); });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <details className="manual-effect__rulebook-context">
      <summary>원문 맥락과 해당 페이지 펼치기</summary>
      <p className="manual-effect__intent">이 페이지는 선택과 서술을 플레이어에게 맡깁니다. 앱은 원문 맥락을 참고용으로 보여 주고, 플레이어가 고른 결과만 기록합니다.</p>
      {related.length > 0 && <dl>{related.map(entry => <div key={entry.id}><dt>{RULEBOOK_KIND_LABELS[entry.kind]}</dt><dd>{entry.title} · {RULEBOOK_STATUS_LABELS[entry.runtimeStatus]}</dd></div>)}</dl>}
      <h4>룰북 p.{page}</h4>
      <pre>{source?.text || '원문 페이지를 불러오는 중...'}</pre>
    </details>
  );
}
