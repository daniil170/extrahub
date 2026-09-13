export function Alert({ variant = 'info', children, style = {} }) {
  const styles = {
    danger: {
      backgroundColor: 'var(--danger-light, #fee2e2)',
      color: 'var(--danger, #dc2626)',
      border: '1px solid rgba(220, 38, 38, 0.25)',
    },
    success: {
      backgroundColor: 'var(--success-light, #dcfce7)',
      color: 'var(--success, #16a34a)',
      border: '1px solid rgba(22, 163, 74, 0.25)',
    },
    warning: {
      backgroundColor: 'var(--warning-light, #fef3c7)',
      color: 'var(--warning, #d97706)',
      border: '1px solid rgba(217, 119, 6, 0.25)',
    },
    info: {
      backgroundColor: 'var(--primary-light, #e6f7f5)',
      color: 'var(--primary, #0e7c6b)',
      border: '1px solid rgba(14, 124, 107, 0.25)',
    },
  };

  const currentStyle = styles[variant] || styles.info;

  return (
    <div
      role="alert"
      style={{
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm, 6px)',
        fontSize: '13.5px',
        lineHeight: 1.4,
        ...currentStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
