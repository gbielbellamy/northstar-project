import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useDelayedUnmount } from '../../lib/useDelayedUnmount';

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
};

/** Matches the closing animation in the stylesheet. */
const EXIT_MS = 150;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Modal({ open, title, subtitle, onClose, children, actions }: Props) {
  const { mounted, closing } = useDelayedUnmount(open, EXIT_MS);
  const dialog = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  // Held in a ref so the effects below depend on `open` alone. Callers pass an
  // inline arrow, which is a new function on every render of their page — and
  // an effect that depends on it would tear down and set up again on every
  // keystroke, moving focus out of whatever you were typing in.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;

    // Remember where focus came from, so closing can restore it.
    returnTo.current = document.activeElement as HTMLElement | null;
    const first = dialog.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog.current)?.focus();

    // Stop the page behind the modal from scrolling.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prev;
      returnTo.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog.current) return;
      // Trap Tab inside the dialog.
      const items = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={`modal-backdrop ${closing ? 'modal-backdrop--closing' : ''}`.trim()}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialog}
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <button className="modal__close" onClick={onClose} aria-label="Close">
          <X size={17} />
        </button>
        <div className="modal__head">
          <h2>{title}</h2>
          {subtitle && <p className="page__sub">{subtitle}</p>}
        </div>
        {children}
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}

export default Modal;
