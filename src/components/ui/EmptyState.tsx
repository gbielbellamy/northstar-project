import type { ReactNode } from 'react';

type Props = {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
};

function EmptyState({ icon, title, text, action }: Props) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <p className="empty__title">{title}</p>
      <p className="empty__text">{text}</p>
      {action}
    </div>
  );
}

export default EmptyState;
