import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
};

export const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex wa-lift w-full min-h-[44px] items-center justify-center rounded-[var(--wa-radii-md)] font-medium tracking-[0.01em] transition-[transform,box-shadow,background-color,border-color,color] wa-motion-ui focus-visible:wa-focus disabled:cursor-not-allowed disabled:opacity-50';

  const variants = {
    primary: 'border border-ai bg-ai text-kinari hover:bg-ai/92 active:bg-ai/85',
    secondary: 'border border-nezumi bg-nezumi text-white hover:bg-nezumi/90 active:bg-nezumi/82',
    outline: 'border border-[var(--border)] bg-[color:color-mix(in_oklab,var(--surface)_92%,white)] text-sumi hover:bg-kinari active:bg-kinari/80',
    ghost: 'bg-transparent text-nezumi hover:bg-[color:color-mix(in_oklab,var(--surface-muted)_82%,white)] active:bg-[color:color-mix(in_oklab,var(--surface-muted)_72%,white)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const finalClass = baseStyles + ' ' + variants[variant] + ' ' + sizes[size] + ' ' + className;

  return (
    <button
      className={finalClass}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      ) : null}
      {children}
    </button>
  );
};
