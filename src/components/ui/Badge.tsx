import type { ReactNode } from 'react';
import type { BadgeVariant } from '../../lib/ui';

type Props = {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
};

function Badge({ variant = 'neutral', children, dot = false }: Props) {
  return (
    <span className={`badge badge--${variant}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}

export default Badge;
