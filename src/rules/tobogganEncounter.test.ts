import { describe, expect, it } from 'vitest';
import { validateTobogganMovement, type TobogganMapNode } from './tobogganEncounter';

const graph: Record<string, TobogganMapNode> = {
  peak: { id: 'peak', region: 'Mountain', neighbors: ['forest', 'ridge'] },
  forest: { id: 'forest', region: 'Forest', neighbors: ['peak'] },
  ridge: { id: 'ridge', region: 'Mountain', neighbors: ['peak'] },
  bog: { id: 'bog', region: 'Bog', neighbors: [] }
};

describe('Tobogganing movement (p.93)', () => {
  it('accepts an adjacent non-Mountain Location', () => {
    expect(validateTobogganMovement(graph, 'peak', 'forest')).toEqual({
      status: 'valid', originId: 'peak', targetId: 'forest'
    });
  });

  it('rejects a Mountain, non-adjacent, same, or unknown destination', () => {
    expect(validateTobogganMovement(graph, 'peak', 'ridge').status).toBe('invalid');
    expect(validateTobogganMovement(graph, 'peak', 'bog').status).toBe('invalid');
    expect(validateTobogganMovement(graph, 'peak', 'peak').status).toBe('invalid');
    expect(validateTobogganMovement(graph, 'missing', 'forest').status).toBe('invalid');
  });
});
