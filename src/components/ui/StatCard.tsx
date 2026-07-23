import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Props = {
  label: string;
  value: string | number;
  desc?: string;
  icon: ReactNode;
  color?: string;
  index?: number;
};

function StatCard({ label, value, desc, icon, color = 'var(--accent)', index = 0 }: Props) {
  return (
    <motion.div
      className="card card--hover stat"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
    >
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        <span className="stat__icon" style={{ background: `${color}1f`, color }}>
          {icon}
        </span>
      </div>
      <div className="stat__value">{value}</div>
      {desc && <div className="stat__desc">{desc}</div>}
    </motion.div>
  );
}

export default StatCard;
