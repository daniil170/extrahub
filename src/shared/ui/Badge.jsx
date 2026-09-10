/**
 * Minimalist monospace status tag (Linear/Vercel style, zero rounded pills)
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'critical'} [props.variant='default']
 * @param {boolean} [props.showDot=false]
 * @param {string} [props.className='']
 * @param {import('react').CSSProperties} [props.style]
 */
export function Badge({
  children,
  variant = 'default',
  showDot = false,
  className = '',
  style = {},
  ...rest
}) {
  const variants = {
    default: {
      color: 'var(--text-secondary)',
      borderColor: 'var(--border-color)',
      backgroundColor: 'transparent',
      dotColor: 'var(--text-muted)',
    },
    primary: {
      color: 'var(--primary)',
      borderColor: 'var(--primary-border)',
      backgroundColor: 'var(--primary-light)',
      dotColor: 'var(--primary)',
    },
    success: {
      color: 'var(--success)',
      borderColor: 'rgba(14, 124, 107, 0.3)',
      backgroundColor: 'var(--success-light)',
      dotColor: 'var(--success)',
    },
    warning: {
      color: 'var(--warning)',
      borderColor: 'rgba(217, 119, 6, 0.3)',
      backgroundColor: 'var(--warning-light)',
      dotColor: 'var(--warning)',
    },
    danger: {
      color: 'var(--danger)',
      borderColor: 'rgba(220, 38, 38, 0.3)',
      backgroundColor: 'var(--danger-light)',
      dotColor: 'var(--danger)',
    },
    critical: {
      color: 'var(--danger)',
      borderColor: 'var(--danger)',
      backgroundColor: 'var(--danger-light)',
      dotColor: 'var(--danger)',
    },
    info: {
      color: 'var(--text-secondary)',
      borderColor: 'var(--border-color)',
      backgroundColor: 'transparent',
      dotColor: 'var(--text-muted)',
    },
  };

  const v = variants[variant] || variants.default;

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    lineHeight: 1.2,
    padding: '2px 6px',
    borderRadius: 'var(--radius-xs)',
    border: `1px solid ${v.borderColor}`,
    backgroundColor: v.backgroundColor,
    color: v.color,
    ...style,
  };

  return (
    <span style={baseStyle} className={`app-badge status-tag ${className}`} {...rest}>
      {showDot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: v.dotColor,
            marginRight: 5,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
