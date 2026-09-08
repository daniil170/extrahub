/**
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {'primary' | 'secondary' | 'outline' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.disabled=false]
 * @param {() => void} [props.onClick]
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {string} [props.className='']
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...rest
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.15s ease-in-out',
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '13px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: 'var(--border-color)',
      color: 'var(--text-primary)',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: 'var(--border-color)',
      color: 'var(--text-primary)',
    },
    danger: {
      backgroundColor: 'var(--danger)',
      color: '#ffffff',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...baseStyle, ...sizeStyles[size], ...variantStyles[variant] }}
      className={`app-button ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
