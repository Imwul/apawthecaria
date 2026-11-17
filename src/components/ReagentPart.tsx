/** A reagent part (leaf, root, shell…) as a kraft label, with its preparation method beside it. */
export function ReagentPartLabel({ part, method }: { part: string; method?: string }) {
  return (
    <span className="part-label">
      <span className="part-chip">{part}</span>
      {method ? <span className="part-method">{method}</span> : null}
    </span>
  );
}

/**
 * Bag items are stored as "Reagent — Part · Method". Show the reagent name plainly and lift the
 * part and method into labels so they can be told apart at a glance.
 */
export function ReagentNameWithPart({ text }: { text: string }) {
  const [name, rest] = text.split(/\s+—\s+/, 2);
  if (!rest) return <>{text}</>;
  const [part, ...methods] = rest.split(/\s+·\s+/);
  return (
    <span className="reagent-name">
      <span className="reagent-name__base">{name}</span>
      <ReagentPartLabel part={part} method={methods.join(' · ') || undefined} />
    </span>
  );
}
