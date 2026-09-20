import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  Shield,
  History,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  User,
} from 'lucide-react';
import { Card, Badge, Button, Modal, Spinner, CoinIcon } from '../../shared/ui/index.js';
import { useStreakFreezeCall } from './api.js';

/**
 * Gamification Balance & Streak Card for Student Dashboard
 * @param {Object} props
 * @param {import('../../entities/gamification/model.js').UserBalance} props.balance
 * @param {boolean} [props.loading]
 * @param {() => void} [props.onToggleHistory]
 * @param {boolean} [props.historyOpen]
 */
export function GamificationBalanceCard({
  balance,
  loading = false,
  onToggleHistory,
  historyOpen = false,
}) {
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [isActivatingFreeze, setIsActivatingFreeze] = useState(false);
  const [freezeSuccessMsg, setFreezeSuccessMsg] = useState('');
  const [freezeError, setFreezeError] = useState('');

  const xp = balance?.xpPoints || 0;
  const coins = balance?.coins || 0;
  const streak = balance?.currentStreak || 0;
  const longestStreak = balance?.longestStreak || 0;
  const multiplier = balance?.xpMultiplier || 1.0;
  const isFreezeActive = Boolean(balance?.streakFreezeActive);
  const availableFreezes = balance?.streakFreezeCount ?? 1;

  const handleActivateFreeze = async () => {
    if (!balance?.userId) return;
    setIsActivatingFreeze(true);
    setFreezeError('');
    try {
      await useStreakFreezeCall({ studentId: balance.userId });
      setFreezeSuccessMsg('Заморозка стрика успешно активирована! Ваша серия защищена на следующее пропущенное занятие.');
      setTimeout(() => {
        setFreezeModalOpen(false);
        setFreezeSuccessMsg('');
      }, 2000);
    } catch (err) {
      setFreezeError(err.message || 'Ошибка активации заморозки');
    } finally {
      setIsActivatingFreeze(false);
    }
  };

  return (
    <Card
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-primary) 100%)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        padding: '20px 24px',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(234, 88, 12, 0.12)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-primary)',
              }}
            >
              Игровой прогресс и баланс
            </h2>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Зарабатывайте XP за посещаемость и обменивайте монеты
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isFreezeActive ? (
            <Badge variant="info">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={13} />
                Заморозка стрика активна
              </span>
            </Badge>
          ) : availableFreezes > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFreezeModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Shield size={14} color="var(--primary)" />
              <span>Заморозить стрик (1 в четв.)</span>
            </Button>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Заморозка использована в этой четверти
            </span>
          )}

          <NavLink to="/student/shop" style={{ textDecoration: 'none' }}>
            <Button
              size="sm"
              variant="primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShoppingBag size={14} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                В магазин <CoinIcon size={14} />
              </span>
            </Button>
          </NavLink>

          <NavLink to="/student/profile" style={{ textDecoration: 'none' }}>
            <Button
              size="sm"
              variant="outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <User size={14} />
              <span>Профиль 🎨</span>
            </Button>
          </NavLink>

          {onToggleHistory && (
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleHistory}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <History size={14} />
              <span>{historyOpen ? 'Скрыть историю' : 'История'}</span>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spinner size="md" label="Загрузка баланса..." />
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {/* XP Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Опыт (XP)
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{xp.toLocaleString('ru-RU')} XP</span>
                {multiplier > 1.0 && (
                  <Badge variant="success">
                    <span>x{multiplier} бонус</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Coins Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CoinIcon size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Монеты школы
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {coins.toLocaleString('ru-RU')} <CoinIcon size={20} />
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor:
                streak > 0 ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface)',
              border:
                streak > 0
                  ? '1px solid rgba(249, 115, 22, 0.3)'
                  : '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: streak > 0 ? 'rgba(234, 88, 12, 0.18)' : 'rgba(156, 163, 175, 0.15)',
                color: streak > 0 ? '#ea580c' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: streak > 0 ? '0 0 12px rgba(234, 88, 12, 0.35)' : 'none',
              }}
            >
              <Flame size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Серия посещений
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: streak > 0 ? '#ea580c' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>
                  {streak} {streak === 1 ? 'неделя' : streak < 5 ? 'недели' : 'недель'}
                </span>
                {streak > 0 && <span style={{ fontSize: '18px' }}>🔥</span>}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Рекорд: {longestStreak} нед.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streak Freeze Confirmation Modal */}
      <Modal
        isOpen={freezeModalOpen}
        onClose={() => setFreezeModalOpen(false)}
        title="Заморозка серии посещений (Streak Freeze)"
        maxWidth="480px"
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              marginBottom: '16px',
            }}
          >
            <Shield size={24} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13.5px', lineHeight: 1.4 }}>
              Заморозка позволяет сохранить серию непрерывных посещений при уважительном пропуске занятия.
            </span>
          </div>

          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
            Правила использования:
          </p>
          <ul
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              paddingLeft: '20px',
              margin: '0 0 20px',
              lineHeight: 1.5,
            }}
          >
            <li>Доступна <strong>1 раз за учебную четверть</strong>.</li>
            <li>Активируется родителем заранее перед пропуском.</li>
            <li>При пропуске со статусом «Уважительная» стрик не сгорает.</li>
          </ul>

          {freezeSuccessMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                backgroundColor: 'var(--success-light)',
                color: 'var(--success)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{freezeSuccessMsg}</span>
            </div>
          )}

          {freezeError && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={16} />
              <span>{freezeError}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              variant="outline"
              onClick={() => setFreezeModalOpen(false)}
              disabled={isActivatingFreeze}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleActivateFreeze}
              disabled={isActivatingFreeze || Boolean(freezeSuccessMsg)}
            >
              {isActivatingFreeze ? 'Активация...' : 'Активировать заморозку'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
