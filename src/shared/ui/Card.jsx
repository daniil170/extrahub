import React from 'react';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.title]
 * @param {React.ReactNode} [props.action]
 * @param {string} [props.className='']
 * @param {React.CSSProperties} [props.style]
 */
export function Card({ children, title, action, className = '', style = {}, ...rest }) {
  const cardStyle = {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)',
    padding: '20px',
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

  return (
    <div style={cardStyle} className={`app-card ${className}`} {...rest}>
      {(title || action) && (
        <div style={headerStyle}>
          {title && <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
