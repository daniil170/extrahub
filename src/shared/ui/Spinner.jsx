/**
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {string} [props.label]
 */
export function Spinner({ size = 'md', label = 'Загрузка...' }) {
  const sizePixels = { sm: 16, md: 24, lg: 36 }[size] || 24;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-secondary)',
      }}
    >
      <div
        style={{
          width: `${sizePixels}px`,
          height: `${sizePixels}px`,
          border: '2px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {label && <span style={{ fontSize: '14px' }}>{label}</span>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
