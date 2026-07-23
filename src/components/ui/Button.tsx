import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm' | 'icon';
  children?: ReactNode;
};

function Button({ variant = 'secondary', size = 'md', children, className = '', ...rest }: Props) {
  const sizeClass = size === 'sm' ? 'btn--sm' : size === 'icon' ? 'btn--icon' : '';
  return (
    <button className={`btn btn--${variant} ${sizeClass} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export default Button;
