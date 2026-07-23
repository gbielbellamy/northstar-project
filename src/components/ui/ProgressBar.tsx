import { motion } from 'framer-motion';

type Props = {
  value: number;
  color?: string;
  small?: boolean;
};

function ProgressBar({ value, color, small = false }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`bar ${small ? 'bar--sm' : ''}`.trim()}>
      <motion.div
        className="bar__fill"
        style={color ? { background: color } : undefined}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

export default ProgressBar;
