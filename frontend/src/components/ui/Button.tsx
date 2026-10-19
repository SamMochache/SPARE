import React from "react";
import { Loader2Icon, BoxIcon } from "lucide-react";
type ButtonVariant = 'primary' | 'secondary' | 'navy' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: BoxIcon;
  loading?: boolean;
}
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-navy-950 font-semibold hover:bg-accent-hover',
  secondary: 'bg-white text-ink font-medium border border-line hover:bg-canvas hover:border-line-strong',
  navy: 'bg-navy text-white font-medium hover:bg-navy-800',
  ghost: 'text-ink-muted font-medium hover:text-ink hover:bg-canvas',
  danger: 'bg-danger text-white font-medium hover:bg-danger-hover'
};
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]'
};
const iconSizes: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-[18px] h-[18px]'
};
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string {
  return `inline-flex items-center justify-center gap-2 rounded-lg whitespace-nowrap transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]}`;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}, ref) {
  return <button ref={ref} type={type} disabled={disabled || loading} className={`${buttonClass(variant, size)} ${className}`} {...rest}>
      {loading ? <Loader2Icon className={`${iconSizes[size]} animate-spin`} aria-hidden="true" /> : Icon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      {children}
    </button>;
});