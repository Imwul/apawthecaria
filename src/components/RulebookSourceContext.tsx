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
      <p className="manual-effect__intent"><strong>직접 판정은 구현 누락이 아닙니다.</strong> 원문이 선택, 서술 또는 후속 판단을 요구하므로 앱은 결론을 대신 만들지 않습니다.</p>
      {related.length > 0 && <dl>{related.map(entry => <div key={entry.id}><dt>{RULEBOOK_KIND_LABELS[entry.kind]}</dt><dd>{entry.title} · {RULEBOOK_STATUS_LABELS[entry.runtimeStatus]}</dd></div>)}</dl>}
      <h4>룰북 p.{page}</h4>
      <pre>{source?.text || '원문 페이지를 불러오는 중...'}</pre>
    </details>
  );
}
