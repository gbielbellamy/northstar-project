import type { CSSProperties } from 'react';

type Props = {
  value: number;
  color?: string;
  small?: boolean;
};

function ProgressBar({ value, color, small = false }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`bar ${small ? 'bar--sm' : ''}`.trim()}>
      <div
        className="bar__fill"
        style={
          {
            '--bar-width': `${pct}%`,
            ...(color ? { background: color } : null),
          } as CSSProperties
        }
      />
    </div>
  );
}

export default ProgressBar;
