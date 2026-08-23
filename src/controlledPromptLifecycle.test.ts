import { describe, expect, it, vi } from 'vitest';
import { settleControlledPromptResolver, type ControlledPromptResolverRef } from './controlledPromptLifecycle';

describe('controlled prompt lifecycle', () => {
  it('settles the current Promise once and clears the resolver for campaign replacement', () => {
    const resolve = vi.fn();
    const resolverRef: ControlledPromptResolverRef = { current: resolve };

    settleControlledPromptResolver(resolverRef, null);
    settleControlledPromptResolver(resolverRef, 'late answer');

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve).toHaveBeenCalledWith(null);
    expect(resolverRef.current).toBeNull();
  });
});
