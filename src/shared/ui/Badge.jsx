/**
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {'default' | 'success' | 'warning' | 'danger' | 'info'} [props.variant='default']
 * @param {string} [props.className='']
 */
export function Badge({ children, variant = 'default', className = '', ...rest }) {
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1,
  };

  const variants = {
    default: { backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)' },
    success: { backgroundColor: 'var(--success-light)', color: 'var(--success)' },
    warning: { backgroundColor: 'var(--warning-light)', color: 'var(--warning)' },
    danger: { backgroundColor: 'var(--danger-light)', color: 'var(--danger)' },
    info: { backgroundColor: 'var(--info-light)', color: 'var(--info)' },
  };

  return (
    <span
      style={{ ...badgeStyle, ...variants[variant] }}
      className={`app-badge ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
