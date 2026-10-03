export interface MissingEncounterInput { message: string; selector: string }

export default function EncounterReadiness({ id, missing }: { id: string; missing: Array<MissingEncounterInput | false> }) {
  const inputs = missing.filter((input): input is MissingEncounterInput => Boolean(input));
  if (!inputs.length) return null;
  return <section id={id} className="encounter-readiness" aria-label="판정 전에 필요한 입력" aria-live="polite">
    <strong>판정 전에 마칠 일 {inputs.length}개</strong>
    <ul>{inputs.map(input => <li key={input.selector}>
      <span>{input.message}</span>{' '}
      <button type="button" onClick={event => {
        const target = event.currentTarget.closest('.encounter-dialog')?.querySelector<HTMLElement>(input.selector);
        target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        target?.focus({ preventScroll: true });
      }}>입력으로 이동</button>
    </li>)}</ul>
  </section>;
}
