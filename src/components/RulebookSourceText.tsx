import { useEffect, useState } from 'react';
import { loadRulebookSource } from '../rulebook/sourceLoader';
import type { RulebookSourcePage } from '../rulebook/types';

export default function RulebookSourceText({ page, endPage = page }: { page: number; endPage?: number }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; pages?: RulebookSourcePage[]; error?: boolean }>();
  const key = `${page}:${endPage}:${attempt}`;
  useEffect(() => {
    let cancelled = false;
    loadRulebookSource().then(payload => {
      if (!cancelled) setResult({ key, pages: payload.pages.filter(row => row.page >= page && row.page <= endPage) });
    }).catch(() => { if (!cancelled) setResult({ key, error: true }); });
    return () => { cancelled = true; };
  }, [page, endPage, key]);
  const current = result?.key === key ? result : undefined;
  return <details className="rulebook-source-text" aria-busy={!current}>
    <summary>원본 룰북 · p.{page}{endPage !== page ? `–${endPage}` : ''} 펼치기</summary>
    {!current ? <p role="status">원문 페이지를 불러오는 중…</p>
      : current.error ? <div className="rulebook-source-error" role="alert"><p>원문을 불러오지 못했습니다. 위 한국어 안내는 계속 볼 수 있습니다.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>다시 불러오기</button></div>
      : current.pages?.length ? current.pages.map(row => <section key={row.page}><h4>p.{row.page}</h4><pre lang="en">{row.text}</pre></section>)
      : <p>이 페이지의 원문이 없습니다.</p>}
  </details>;
}
