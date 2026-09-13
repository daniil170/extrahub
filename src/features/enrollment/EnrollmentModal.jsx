import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  Copy,
  Send,
  MessageSquare,
  Share2,
  QrCode,
  Clock,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Modal, Button, Badge, CapacityBadge } from '../../shared/ui/index.js';
import { formatDaysOfWeek, formatCurrency } from '../../shared/utils/index.js';
import { MOCK_STUDENTS } from './useEnrollment.js';

function calculateTimeLeft(expiresAt) {
  if (!expiresAt) {
    return { formatted: '24:00:00', isExpired: false };
  }
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) {
    return { formatted: '00:00:00', isExpired: true };
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const formatted = [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');

  return { formatted, isExpired: false };
}

function CountdownTimer({ expiresAt }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

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
          color: 'var(--accent-coral)',
          letterSpacing: '2px',
          margin: '6px 0 2px',
        }}
      >
        {timeLeft.formatted}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        {timeLeft.isExpired
          ? 'Бронь истекла'
          : 'до автоматической передачи места следующему в очереди'}
      </div>
    </div>
  );
}

export function EnrollmentModal({
  isOpen,
  onClose,
  activity,
  selectedGroupId,
  setSelectedGroupId,
  selectedStudentId,
  setSelectedStudentId,
  isSubmitting,
  enrollmentResult,
  conflictError,
  generalError,
  onSubmit,
  userRole,
}) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!activity) return null;

  const groups = activity.groups || [];
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const isGroupFull =
    selectedGroup &&
    (Number(selectedGroup.enrolledCount) || 0) >= (Number(selectedGroup.capacity) || 0);

  const inviteUrl = enrollmentResult?.inviteToken
    ? `${window.location.origin}/invite/${enrollmentResult.inviteToken}`
    : '';

  const shareText = `Привет! Я записался в кружок "${activity.title}", подтверди, пожалуйста, запись по ссылке: ${inviteUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = inviteUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Запись в кружок: ${activity.title}`,
          text: shareText,
          url: inviteUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
  };

  // 0. Success state for entrance exam application
  if (enrollmentResult?.isExamApplication) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Заявка на экзамен принята"
        maxWidth="500px"
      >
        <div style={{ textAlign: 'center', padding: '12px 8px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Check size={28} />
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              margin: '0 0 8px',
              color: 'var(--text-primary)',
            }}
          >
            {activity.title}
          </h3>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '0 0 20px',
            }}
          >
            Ваша заявка успешно направлена координатору школы. Координатор проверит заявку и внесёт результат сдачи вступительного испытания. Статус отображается в личном кабинете ученика.
          </p>

          <Button
            variant="primary"
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Понятно
          </Button>
        </div>
      </Modal>
    );
  }

  // 1. Success state: Spot held for 24 hours (pending_parent_approval)
  if (enrollmentResult && !enrollmentResult.waitlisted) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Место забронировано на 24 часа"
        maxWidth="540px"
      >
        <div>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {activity.title}
            </div>
            {selectedGroup && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {formatDaysOfWeek(selectedGroup.daysOfWeek)} {selectedGroup.startTime}–
                {selectedGroup.endTime}
              </div>
            )}
          </div>

          <CountdownTimer expiresAt={enrollmentResult.holdExpiresAt} />

          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              backgroundColor: 'var(--bg-subtle)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              margin: '14px 0',
              borderLeft: '3px solid var(--accent-mint)',
            }}
          >
            Для подтверждения записи родителю необходимо перейти по ссылке и подтвердить участие.
            Место зарезервировано. Если родитель не подтвердит запись в течение 24 часов, бронь
            аннулируется, и место перейдёт следующему в очереди.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
            <Button
              variant="primary"
              onClick={handleCopyLink}
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {copied ? (
                <>
                  <Check size={16} /> Ссылка скопирована!
                </>
              ) : (
                <>
                  <Copy size={16} /> Скопировать ссылку для родителя
                </>
              )}
            </Button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <MessageSquare size={15} /> WhatsApp
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(`Привет! Я записался в кружок "${activity.title}", подтверди, пожалуйста, запись:`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 12px',
                  backgroundColor: '#229ED9',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <Send size={15} /> Telegram
              </a>
            </div>

            {typeof navigator !== 'undefined' && navigator.share && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNativeShare}
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Share2 size={14} /> Поделиться через телефон
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowQr((prev) => !prev)}
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <QrCode size={14} />
              {showQr ? 'Скрыть QR-код' : 'Показать QR-код для родителя'}
            </Button>

            {showQr && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <QRCodeSVG value={inviteUrl} size={150} level="M" />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Наведите камеру смартфона родителя для мгновенного перехода
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Button variant="outline" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // 2. Waitlist state
  if (enrollmentResult && enrollmentResult.waitlisted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Вы в листе ожидания" maxWidth="480px">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--warning-light)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Clock size={28} />
          </div>

          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', margin: '0 0 6px', color: 'var(--text-primary)' }}>
            {activity.title}
          </h4>

          <div
            style={{
              display: 'inline-block',
              margin: '12px auto',
              padding: '4px 12px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            POSITION IN QUEUE: #{enrollmentResult.position || 1}
          </div>

          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: '16px 0 24px',
              backgroundColor: 'var(--bg-subtle)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            Как только освободится место, вам придёт уведомление, и у вас будет 24 часа на
            подтверждение записи.
          </p>

          <Button
            variant="primary"
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Понятно
          </Button>
        </div>
      </Modal>
    );
  }

  // 3. Initial Form state: Select Group & Student + Conflict Alert if any
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        activity.requiresExam
          ? 'Подача заявки на экзамен'
          : isGroupFull
            ? 'Встать в лист ожидания'
            : 'Запись в кружок'
      }
      maxWidth="520px"
    >
      <div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            {activity.title}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
            <Badge variant="info">{activity.category}</Badge>
            <Badge variant="default">{activity.ageGroup}</Badge>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--primary)',
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {activity.price === 0 ? 'Бесплатно' : formatCurrency(activity.price)}
            </span>
          </div>
        </div>

        {/* Schedule Conflict Alert */}
        {conflictError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertTriangle size={18} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--danger)', fontSize: '14px' }}>
                  Конфликт расписания!
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    marginTop: '4px',
                    lineHeight: 1.4,
                  }}
                >
                  {conflictError}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Пожалуйста, выберите другую группу или другое время занятий.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Error Alert */}
        {generalError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--warning-light)',
              border: '1px solid var(--warning)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: 'var(--warning)',
            }}
          >
            {generalError}
          </div>
        )}

        {/* Group Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '8px',
            }}
          >
            Выберите группу и расписание:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map((group) => {
              const enrolled = Number(group.enrolledCount) || 0;
              const cap = Number(group.capacity) || 0;
              const isFull = enrolled >= cap;
              const isSelected = group.id === selectedGroupId;

              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: isSelected ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div>
                    <div
                      style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {group.name || 'Основная группа'}
                    </div>
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Calendar size={13} style={{ flexShrink: 0 }} />
                      <span>
                        {formatDaysOfWeek(group.daysOfWeek)} &bull; {group.startTime}–{group.endTime}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <CapacityBadge
                      remaining={Math.max(0, cap - enrolled)}
                      total={cap}
                      isFull={isFull}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Student Selection (if parent or coordinator) */}
        {(userRole === 'parent' || userRole === 'coordinator' || userRole === 'admin') && (
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              Ученик:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            >
              {MOCK_STUDENTS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.className})
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            variant={isGroupFull ? 'secondary' : 'primary'}
            onClick={onSubmit}
            disabled={isSubmitting || !selectedGroupId}
          >
            {isSubmitting
              ? 'Обработка...'
              : activity.requiresExam
                ? 'Подать заявку на экзамен'
                : isGroupFull
                  ? 'Встать в лист ожидания'
                  : 'Забронировать место'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
