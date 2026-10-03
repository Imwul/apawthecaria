import { useLayoutEffect, useRef, useState } from 'react';

const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])';
const inertOwners = new WeakMap<HTMLElement, { count: number; previous: boolean }>();
const modalStack: HTMLElement[] = [];
const lastModalFocus = new WeakMap<HTMLElement, HTMLElement>();

/** Shared focus handling for a modal, including nested prompt/notice dialogs. */
export function useDialogFocus<T extends HTMLElement>(onEscape?: () => void) {
  const ref = useRef<T>(null);
  const [returnFocus] = useState(() => typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const escapeRef = useRef(onEscape);
  useLayoutEffect(() => { escapeRef.current = onEscape; }, [onEscape]);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const document = dialog.ownerDocument;
    const previousFocus = returnFocus;
    modalStack.push(dialog);
    const background: HTMLElement[] = [];
    // Inert siblings at every level; never make an ancestor of this modal inert.
    let branch: HTMLElement = dialog;
    while (branch.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling === branch || !(sibling instanceof HTMLElement)) continue;
        // A later overlay must be able to open above this modal.
        if (sibling.querySelector('[aria-modal="true"]')) continue;
        const owner = inertOwners.get(sibling) || { count: 0, previous: sibling.inert };
        owner.count += 1;
        inertOwners.set(sibling, owner);
        sibling.inert = true;
        background.push(sibling);
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
    if (!dialog.contains(document.activeElement)) dialog.focus({ preventScroll: true });
    const isTopModal = () => {
      // A nested prompt can render before its parent encounter in the DOM.
      // Mount order tracks which dialog the player opened most recently.
      const modals = modalStack.filter(node => node.isConnected && !node.closest('[inert]') && node.getClientRects().length > 0);
      return modals.at(-1) === dialog;
    };
    const rememberFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && dialog.contains(event.target) && isTopModal()) {
        lastModalFocus.set(dialog, event.target);
      }
    };
    const keydown = (event: KeyboardEvent) => {
      if (!isTopModal() || event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        escapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(node => node.tabIndex >= 0 && !node.matches('[disabled], [aria-disabled="true"]')
          && node.getClientRects().length > 0 && !node.closest('[inert]'));
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (active === last || active === dialog || !dialog.contains(active))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('focusin', rememberFocus, true);
    return () => {
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('focusin', rememberFocus, true);
      const stackIndex = modalStack.indexOf(dialog);
      if (stackIndex >= 0) modalStack.splice(stackIndex, 1);
      for (const node of background) {
        const owner = inertOwners.get(node);
        if (!owner) continue;
        owner.count -= 1;
        if (owner.count === 0) { node.inert = owner.previous; inertOwners.delete(node); }
      }
      const parentDialog = modalStack.filter(node => node.isConnected && !node.closest('[inert]') && node.getClientRects().length > 0).at(-1);
      const parentFocus = parentDialog && lastModalFocus.get(parentDialog);
      const parentTarget = parentFocus?.isConnected && parentDialog?.contains(parentFocus)
        && parentFocus.getClientRects().length > 0 && !parentFocus.matches('[disabled], [aria-disabled="true"]') && !parentFocus.closest('[inert]') ? parentFocus : parentDialog;
      const returnTarget = previousFocus?.isConnected && previousFocus.getClientRects().length > 0
        && !previousFocus.matches('[disabled], [aria-disabled="true"]') && !previousFocus.closest('[inert]')
        ? previousFocus : parentTarget || document.querySelector<HTMLElement>('#field-main');
      returnTarget?.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  return ref;
}
