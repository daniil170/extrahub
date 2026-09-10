/**
 * Minimalist Card container (1px sharp border, restrained radius, no default shadow)
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.title]
 * @param {import('react').ReactNode} [props.action]
 * @param {boolean} [props.interactive=false]
 * @param {string} [props.className='']
 * @param {import('react').CSSProperties} [props.style]
 */
export function Card({
  children,
  title,
  action,
  interactive = false,
  className = '',
  style = {},
  ...rest
}) {
  const cardStyle = {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    padding: '20px',
    boxShadow: 'none',
    ...style,
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  };

  const combinedClassName = `app-card ${interactive ? 'interactive-card' : ''} ${className}`.trim();

  return (
    <div style={cardStyle} className={combinedClassName} {...rest}>
      {(title || action) && (
        <div style={headerStyle}>
          {title && (
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, letterSpacing: '-0.01em' }}>
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
