import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

function calculateTimeLeft(expiresAt) {
  if (!expiresAt) {
    return { hours: 24, minutes: 0, seconds: 0, formatted: '24:00:00', isExpired: false };
  }
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', isExpired: true };
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const formatted = [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');

  return { hours, minutes, seconds, formatted, isExpired: false };
}

/**
 * @param {Object} props
 * @param {string|Date} props.expiresAt
 * @param {'block'|'inline'|'badge'} [props.variant='block']
 */
export function CountdownTimer({ expiresAt, variant = 'block' }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (variant === 'inline') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: timeLeft.isExpired ? 'var(--danger)' : 'var(--accent-coral)',
        }}
      >
        <Clock size={13} strokeWidth={2} />
        {timeLeft.formatted}
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-coral-light)',
          color: 'var(--accent-coral)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
        }}
      >
        <Clock size={12} strokeWidth={2} />
        {timeLeft.formatted}
      </span>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--accent-coral-light)',
        border: '1px solid var(--accent-coral)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        textAlign: 'center',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--accent-coral)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Осталось времени на подтверждение
      </div>
      <div
        style={{
          fontSize: '34px',
          fontWeight: 800,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          color: timeLeft.isExpired ? 'var(--danger)' : 'var(--accent-coral)',
          margin: '8px 0',
          letterSpacing: '2px',
        }}
      >
        {timeLeft.formatted}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        {timeLeft.isExpired
          ? 'Срок действия брони истёк'
          : 'По истечении таймера место автоматически перейдет следующему в очереди'}
      </div>
    </div>
  );
}
