import { useId, type ReactNode } from 'react';
import { useDialogFocus } from './useDialogFocus';

export default function JournalPhotoDialog({ title, photoName, children, onClose }: {
  title: string;
  photoName: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return <div className="journal-photo-backdrop" onClick={onClose}>
    <section ref={dialogRef} tabIndex={-1} className="journal-photo-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={event => event.stopPropagation()}>
      <header>
        <div><h2 id={titleId}>{title}</h2><p>{photoName}</p></div>
        <button type="button" aria-label="확대 사진 닫기" onClick={onClose}>×</button>
      </header>
      <div className="journal-photo-dialog__image">{children}</div>
    </section>
  </div>;
}
