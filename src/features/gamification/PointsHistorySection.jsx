import {
  Sparkles,
  Award,
  GraduationCap,
  Clock,
  Flame,
  Calendar,
} from 'lucide-react';
import { Card, Badge, CoinIcon } from '../../shared/ui/index.js';
import { formatDate } from '../../shared/utils/index.js';

function getSourceIcon(source) {
  switch (source) {
    case 'attendance':
      return <Calendar size={15} />;
    case 'teacher_reward':
      return <Award size={15} />;
    case 'exam_pass':
      return <GraduationCap size={15} />;
    case 'parent_quick_approval':
      return <Clock size={15} />;
    case 'streak_bonus':
      return <Flame size={15} />;
    default:
      return <Sparkles size={15} />;
  }
}

function getSourceBadge(source) {
  switch (source) {
    case 'attendance':
      return <Badge variant="info">Посещаемость</Badge>;
    case 'teacher_reward':
      return <Badge variant="warning">Особые успехи</Badge>;
    case 'exam_pass':
      return <Badge variant="success">Экзамен</Badge>;
    case 'parent_quick_approval':
      return <Badge variant="default">Быстрая запись</Badge>;
    case 'streak_bonus':
      return <Badge variant="danger">Бонус серии</Badge>;
    default:
      return <Badge variant="default">Начисление</Badge>;
  }
}

/**
 * Points History Timeline Section
 * @param {Object} props
 * @param {import('../../entities/gamification/model.js').PointsLedgerEntry[]} props.entries
 * @param {boolean} [props.loading]
 */
export function PointsHistorySection({ entries = [], loading = false }) {
  if (loading) {
    return (
      <Card style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Загрузка истории начислений...
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)' }}>
        <Sparkles size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
          История начислений пока пуста
        </div>
        <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
          Посещайте кружки вовремя и сдавайте вступительные испытания, чтобы накапливать XP и монеты!
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map((entry) => {
        const isXp = entry.currencyType === 'xp';
        const isCoin = entry.currencyType === 'coin';

        return (
          <div
            key={entry.id}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: isXp ? 'rgba(59, 130, 246, 0.12)' : 'rgba(234, 179, 8, 0.15)',
                  color: isXp ? '#2563eb' : '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getSourceIcon(entry.source)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  {getSourceBadge(entry.source)}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {entry.createdAt ? formatDate(entry.createdAt) : ''}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {entry.reason || 'Начисление бонуса'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: isXp ? 'var(--primary)' : '#b45309',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                +{entry.amount} {isXp ? 'XP' : <CoinIcon size={14} />}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
