import type { ReactNode } from 'react';
import { useDialogFocus } from './useDialogFocus';

export default function FocusDialog({ children, label, className, onEscape }: {
  children: ReactNode;
  label: string;
  className?: string;
  onEscape: () => void;
}) {
  const ref = useDialogFocus<HTMLDivElement>(onEscape);
  return <div className="encounter-dialog-backdrop">
    <div ref={ref} tabIndex={-1} className={`glass-panel encounter-dialog${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-label={label}>
      {children}
    </div>
  </div>;
}
