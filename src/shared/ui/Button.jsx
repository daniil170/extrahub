/**
 * Minimalist Button component
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.disabled=false]
 * @param {() => void} [props.onClick]
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {string} [props.className='']
 * @param {import('react').CSSProperties} [props.style]
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  ...rest
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
    fontWeight: 500,
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    boxShadow: 'none',
  };

  const sizeStyles = {
    sm: { padding: '5px 10px', fontSize: '12.5px', gap: '6px' },
    md: { padding: '7px 14px', fontSize: '13.5px', gap: '8px' },
    lg: { padding: '10px 20px', fontSize: '15px', gap: '10px' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: '#ffffff',
      border: '1px solid var(--primary)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: 'transparent',
      color: 'var(--danger)',
      border: '1px solid rgba(220, 38, 38, 0.35)',
    },
  };

  const selectedVariant = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...selectedVariant,
        ...style,
      }}
      className={`app-button ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
