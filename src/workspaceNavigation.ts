/** The play page shows one task panel at a time; these are the panels it can switch between, in play order. */
export const PLAY_TASK_PANELS = [
  { id: 'journey-start-panel', label: '새 여정' },
  { id: 'route-planning-panel', label: '이동 경로' },
  { id: 'travel-panel', label: '지금 이곳' },
  { id: 'patient-clinic-panel', label: '진료소' },
  { id: 'barrow-panel', label: '거수 고분' },
  { id: 'active-journey-panel', label: '여정 목표' },
  { id: 'journey-ending-panel', label: '여정 결말' },
  { id: 'pending-archive-panel', label: '진료 기록 마감' },
  { id: 'downtime-panel', label: '휴식기' },
  { id: 'play-journey-map', label: '지도' }
] as const;

/** Panels that live inside a task panel and should open their parent. */
export const PLAY_TASK_SUB_PANELS: Record<string, string> = {
  'patient-acquisition-panel': 'patient-clinic-panel',
  'treatment-workspace': 'patient-clinic-panel',
  'patient-scrounging-panel': 'patient-clinic-panel'
};

export const PLAY_TASK_FOCUS_EVENT = 'apawthecaria:play-task-focus';

const PLAY_TASK_IDS = new Set<string>(PLAY_TASK_PANELS.map(panel => panel.id));

export const playTaskPanelForId = (id: string | null | undefined): string | null => {
  if (!id) return null;
  if (PLAY_TASK_IDS.has(id)) return id;
  return PLAY_TASK_SUB_PANELS[id] || null;
};

/** If the element sits in a folded task panel, unfold that panel before revealing it. */
const showPlayTaskFor = (element: HTMLElement): void => {
  let node: HTMLElement | null = element;
  while (node && !(node.id && PLAY_TASK_IDS.has(node.id))) node = node.parentElement;
  if (!node) return;
  const work = document.getElementById('play-folio-work');
  if (!work || work.dataset.taskFocus === node.id) return;
  work.dataset.taskFocus = node.id;
  window.dispatchEvent(new CustomEvent(PLAY_TASK_FOCUS_EVENT, { detail: node.id }));
};

/** Reveal an existing workspace without restarting its saved procedure. */
export const revealWorkspaceTarget = (element: HTMLElement): void => {
  showPlayTaskFor(element);
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
