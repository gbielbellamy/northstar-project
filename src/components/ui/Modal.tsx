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

  useEffect(() => {
    if (!open) return;

    // Remember where focus came from, so closing puts it back on the control
    // that opened the dialog rather than dumping it at the top of the page.
    returnTo.current = document.activeElement as HTMLElement | null;
    const first = dialog.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialog.current) return;
      // Keep Tab inside the dialog: a modal you can tab out of is a modal
      // screen-reader users get lost behind.
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
    // Stop the page behind the modal from scrolling.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      returnTo.current?.focus();
    };
  }, [open, onClose]);

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
