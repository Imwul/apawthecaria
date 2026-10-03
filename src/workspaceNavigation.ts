/** Reveal an existing workspace without restarting its saved procedure. */
export const revealWorkspaceTarget = (element: HTMLElement): void => {
  let ancestor: HTMLElement | null = element;
  while (ancestor) {
    if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
    ancestor = ancestor.parentElement;
  }
  if (!element.matches('button,input,select,textarea,a[href],[tabindex]')) element.tabIndex = -1;
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  element.focus({ preventScroll: true });
};

export const focusCurrentWorkspace = (targetId: string, actionId?: string): void => {
  const currentDialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
  if (currentDialog) {
    revealWorkspaceTarget(currentDialog);
    return;
  }
  const action = actionId
    ? document.querySelector<HTMLButtonElement>(`#action-hub [data-play-action-id="${CSS.escape(actionId)}"]:not(:disabled)`)
    : null;
  action?.click();
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    const dialog = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
    const target = dialog || document.getElementById(targetId) || document.getElementById('field-main');
    if (target) revealWorkspaceTarget(target);
  }));
};
