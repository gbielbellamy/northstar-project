import type { ReactNode } from 'react';

type Props = {
  label: string;
  hint?: string;
  full?: boolean;
  children: ReactNode;
};

function Field({ label, hint, full = false, children }: Props) {
  return (
    <label className={`field ${full ? 'full' : ''}`.trim()}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

export default Field;
