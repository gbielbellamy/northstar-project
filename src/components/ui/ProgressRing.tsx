import { motion } from 'framer-motion';

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
      <motion.circle
        className="ring__value"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default ProgressRing;
