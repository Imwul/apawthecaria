import { describe, expect, it } from 'vitest';
import {
  changeMultiSelectPromptQuantity,
  decodeMultiSelectPromptValue,
  encodeMultiSelectPromptValue,
  toggleMultiSelectPromptOption,
  totalMultiSelectPromptQuantity
} from './multiSelectPrompt';

describe('multi-select prompt state', () => {
  it('keeps only positive quantities for options shown in the prompt', () => {
    expect(decodeMultiSelectPromptValue('{"leaf":2,"bark":0,"stale":4}', ['leaf', 'bark']))
      .toEqual({ leaf: 2 });
    expect(decodeMultiSelectPromptValue('not-json', ['leaf'])).toEqual({});
  });

  it('selects and deselects a row with the same toggle action', () => {
    const selected = toggleMultiSelectPromptOption({}, 'leaf');
    expect(selected).toEqual({ leaf: 1 });
    expect(toggleMultiSelectPromptOption(selected, 'leaf')).toEqual({});
  });

  it('supports several parts and repeated quantities', () => {
    const selected = toggleMultiSelectPromptOption({ leaf: 1 }, 'bark');
    const repeated = changeMultiSelectPromptQuantity(selected, 'leaf', 1);
    expect(repeated).toEqual({ leaf: 2, bark: 1 });
    expect(totalMultiSelectPromptQuantity(repeated)).toBe(3);
    expect(decodeMultiSelectPromptValue(encodeMultiSelectPromptValue(repeated), ['leaf', 'bark']))
      .toEqual(repeated);
  });

  it('respects a one-part special acquisition limit', () => {
    expect(toggleMultiSelectPromptOption({ leaf: 1 }, 'bark', 1)).toEqual({ bark: 1 });
    expect(changeMultiSelectPromptQuantity({ bark: 1 }, 'bark', 1, 1)).toEqual({ bark: 1 });
  });
});
