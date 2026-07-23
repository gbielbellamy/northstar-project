import type { ReactNode } from 'react';

type Props = {
  title?: string;
  children: ReactNode;
  hover?: boolean;
  className?: string;
};

function Card({ title, children, hover = false, className = '' }: Props) {
  return (
    <div className={`card ${hover ? 'card--hover' : ''} ${className}`.trim()}>
      {title && <div className="card__title">{title}</div>}
      {children}
    </div>
  );
}

export default Card;
