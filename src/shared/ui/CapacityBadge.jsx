import { formatSpotsPlural } from '../utils/index.js';

/**
 * Modern Capacity Badge
 *
 * Replaces technical uppercase monospace tags with a clean, friendly status pill:
 * - Proper Russian grammar ("Осталось 4 места" instead of "ОСТАЛОСЬ 4 МЕСТ").
 * - Single-line display with whitespace: nowrap (no awkward wrapping).
 * - Semantic urgency:
 *   - 0: danger (red) "Мест нет"
 *   - 1..3: warning (amber) "Осталось X места"
 *   - 4+: success (teal) "Осталось X мест/места"
 * - Soft pill background with colored indicator dot.
 *
 * @param {Object} props
 * @param {number} props.remaining - Number of remaining spots
 * @param {number} [props.total] - Optional total capacity
 * @param {boolean} [props.isFull] - Whether the activity/group is full
 * @param {string} [props.className] - Additional class names
 * @param {import('react').CSSProperties} [props.style] - Inline style overrides
 */
export function CapacityBadge({
  remaining = 0,
  total,
  isFull: customIsFull,
  className = '',
  style = {},
  ...rest
}) {
  const isFull = typeof customIsFull === 'boolean' ? customIsFull : remaining <= 0;

  // Determine variant based on spots left
  let variant = 'success';
  if (isFull) {
    variant = 'danger';
  } else if (remaining <= 3) {
    variant = 'warning';
  }

  const stylesByVariant = {
    danger: {
      color: 'var(--danger, #dc2626)',
      backgroundColor: 'var(--danger-light, rgba(220, 38, 38, 0.08))',
      borderColor: 'rgba(220, 38, 38, 0.25)',
      dotColor: 'var(--danger, #dc2626)',
    },
    warning: {
      color: 'var(--warning, #d97706)',
      backgroundColor: 'var(--warning-light, rgba(217, 119, 6, 0.08))',
      borderColor: 'rgba(217, 119, 6, 0.25)',
      dotColor: 'var(--warning, #d97706)',
    },
    success: {
      color: 'var(--primary, #0e7c6b)',
      backgroundColor: 'var(--primary-light, rgba(14, 124, 107, 0.08))',
      borderColor: 'rgba(14, 124, 107, 0.22)',
      dotColor: 'var(--primary, #0e7c6b)',
    },
  };

  const currentTheme = stylesByVariant[variant];

  // Determine text
  let label;
  if (isFull) {
    label = 'Мест нет';
  } else if (total != null) {
    label = `Осталось ${remaining} из ${total} мест`;
  } else {
    label = `Осталось ${formatSpotsPlural(remaining)}`;
  }

  return (
    <span
      className={`capacity-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5.5px',
        padding: '3px 9px',
        borderRadius: '9999px',
        fontSize: '11.5px',
        fontWeight: 500,
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
        fontFamily: 'var(--font-sans)',
        color: currentTheme.color,
        backgroundColor: currentTheme.backgroundColor,
        border: `1px solid ${currentTheme.borderColor}`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        userSelect: 'none',
        ...style,
      }}
      {...rest}
    >
      {/* Indicator dot */}
      <span
        aria-hidden="true"
        style={{
          width: '5.5px',
          height: '5.5px',
          borderRadius: '50%',
          backgroundColor: currentTheme.dotColor,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </span>
  );
}
