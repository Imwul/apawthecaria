export type ControlledPromptResolver = (value: string | null) => void;

export interface ControlledPromptResolverRef {
  current: ControlledPromptResolver | null;
}

export const settleControlledPromptResolver = (
  resolverRef: ControlledPromptResolverRef,
  value: string | null
) => {
  const resolve = resolverRef.current;
  resolverRef.current = null;
  resolve?.(value);
};
