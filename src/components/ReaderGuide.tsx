import { readerGuideForPage } from '../rulebook/readerGuide';

export default function ReaderGuide({ page }: { page: number }) {
  const guide = readerGuideForPage(page);
  if (!guide) return null;
  return <section className="reader-guide" aria-label="한국어 플레이 안내">
    <span className="document-kicker">한국어 플레이 안내 · p.{guide.pages[0]}–{guide.pages[1]}</span>
    <h3>{guide.title}</h3>
    <ol>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>
    <p className="reader-guide__exception"><strong>예외와 주의</strong><br />{guide.exception}</p>
  </section>;
}
