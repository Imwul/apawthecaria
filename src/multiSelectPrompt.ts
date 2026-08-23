export type MultiSelectPromptQuantities = Record<string, number>;

const normalizedQuantity = (value: unknown): number => {
  const quantity = Math.floor(Number(value));
  return Number.isFinite(quantity) ? Math.max(0, Math.min(99, quantity)) : 0;
};

export const decodeMultiSelectPromptValue = (
  value: string,
  allowedValues: readonly string[]
): MultiSelectPromptQuantities => {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const allowed = new Set(allowedValues);
    return Object.entries(parsed || {}).reduce<MultiSelectPromptQuantities>((result, [key, rawQuantity]) => {
      const quantity = normalizedQuantity(rawQuantity);
      if (allowed.has(key) && quantity > 0) result[key] = quantity;
      return result;
    }, {});
  } catch {
    return {};
  }
};

export const encodeMultiSelectPromptValue = (quantities: MultiSelectPromptQuantities): string =>
  JSON.stringify(quantities);

export const totalMultiSelectPromptQuantity = (quantities: MultiSelectPromptQuantities): number =>
  Object.values(quantities).reduce((sum, quantity) => sum + normalizedQuantity(quantity), 0);

export const toggleMultiSelectPromptOption = (
  quantities: MultiSelectPromptQuantities,
  optionValue: string,
  maxTotal?: number
): MultiSelectPromptQuantities => {
  if ((quantities[optionValue] || 0) > 0) {
    const next = { ...quantities };
    delete next[optionValue];
    return next;
  }
  if (maxTotal === 1) return { [optionValue]: 1 };
  return { ...quantities, [optionValue]: 1 };
};

export const changeMultiSelectPromptQuantity = (
  quantities: MultiSelectPromptQuantities,
  optionValue: string,
  delta: number,
  maxTotal?: number
): MultiSelectPromptQuantities => {
  const current = quantities[optionValue] || 0;
  const total = totalMultiSelectPromptQuantity(quantities);
  const available = typeof maxTotal === 'number' ? Math.max(0, maxTotal - (total - current)) : 99;
  const nextQuantity = Math.max(0, Math.min(available, current + delta));
  const next = { ...quantities };
  if (nextQuantity > 0) next[optionValue] = nextQuantity;
  else delete next[optionValue];
  return next;
};
