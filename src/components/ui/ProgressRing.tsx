import type { CSSProperties } from 'react';

type Props = {
  value: number;
  size?: number;
  stroke?: number;
};

function ProgressRing({ value, size = 104, stroke = 9 }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg className="ring" width={size} height={size} aria-hidden="true">
      <circle
        className="ring__track"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
      />
      {/* Sweeps from empty to `value`: the animation reads both custom
          properties, so the arc lands where the dash offset says it should. */}
      <circle
        className="ring__value"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct / 100)}
        style={
          {
            '--ring-length': circumference,
            '--ring-offset': circumference * (1 - pct / 100),
          } as CSSProperties
        }
      />
    </svg>
  );
}

export default ProgressRing;
