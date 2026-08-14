import type { CSSProperties, ReactNode } from 'react';

type Props = { children: ReactNode; delay?: number; className?: string };

/** Fades and lifts its children in on mount. Staggered by `delay` in seconds. */
function AnimatedSection({ children, delay = 0, className }: Props) {
  return (
    <div
      className={`rise-in ${className ?? ''}`.trim()}
      style={delay ? ({ '--rise-delay': `${delay}s` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

export default AnimatedSection;
