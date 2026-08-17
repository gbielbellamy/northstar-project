import { useEffect, useRef, useState } from 'react';
import { ChevronUp, Download, LogOut, Trash2, Upload, User } from 'lucide-react';

type Props = {
  email: string;
  isGuest: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
};

/**
 * The account row at the foot of the sidebar, and the menu it opens.
 *
 * Bottom-left is where people look for who they are signed in as, so the
 * things that belong to the account live there rather than buried in a card
 * halfway down the dashboard.
 */
function AccountMenu({ email, isGuest, onExport, onImport, onSignOut, onDeleteAccount }: Props) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="account" ref={wrap}>
      {open && (
        <div className="account__menu" role="menu">
          {/* Backups belong to an account you keep. A demo is deleted when you
              leave it, so saving one and restoring into it are both pointless. */}
          {!isGuest && (
            <>
              <button role="menuitem" onClick={() => choose(onExport)}>
                <Download size={14} /> Export backup
              </button>
              <button role="menuitem" onClick={() => choose(() => fileRef.current?.click())}>
                <Upload size={14} /> Restore backup
              </button>
              <div className="account__sep" />
            </>
          )}
          <button role="menuitem" onClick={() => choose(onSignOut)}>
            <LogOut size={14} /> {isGuest ? 'Leave the demo' : 'Sign out'}
          </button>
          {!isGuest && (
            <button
              role="menuitem"
              className="account__danger"
              onClick={() =>
                choose(() => {
                  if (
                    confirm(
                      'Delete your account? Every application, company and contact in it goes too. This cannot be undone.',
                    )
                  ) {
                    onDeleteAccount();
                  }
                })
              }
            >
              <Trash2 size={14} /> Delete account
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        className="account__row"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="account__avatar">
          <User size={14} />
        </span>
        <span className="account__who">
          <span className="account__name" title={email}>
            {isGuest ? 'Demo account' : email}
          </span>
          <span className="account__sub">
            {isGuest ? 'Deleted when you leave' : 'Signed in'}
          </span>
        </span>
        <ChevronUp size={14} className={open ? 'account__chev account__chev--open' : 'account__chev'} />
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImport(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default AccountMenu;
