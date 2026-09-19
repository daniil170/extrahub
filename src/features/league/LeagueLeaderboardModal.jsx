import { useState, useEffect } from 'react';
import {
  Trophy,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  Shield,
  User,
  Sparkles,
} from 'lucide-react';
import { Modal, Button, Badge, Spinner } from '../../shared/ui/index.js';
import { LEAGUE_CONFIG } from '../../entities/league/model.js';
import { subscribeDivisionLeaderboard } from './api.js';

/**
 * Full Division Standings & Leaderboard Modal
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.divisionId
 * @param {string} [props.divisionName]
 * @param {import('../../entities/league/model.js').LeagueRank} [props.rank]
 * @param {string} [props.currentUserId]
 */
export function LeagueLeaderboardModal({
  isOpen,
  onClose,
  divisionId,
  divisionName = 'Лига дивизиона',
  rank = 'bronze',
  currentUserId = '',
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const rankMeta = LEAGUE_CONFIG.RANKS[rank] || LEAGUE_CONFIG.RANKS.bronze;
  const nextRankMeta = LEAGUE_CONFIG.RANKS[rankMeta.nextRank] || rankMeta;
  const prevRankMeta = LEAGUE_CONFIG.RANKS[rankMeta.prevRank] || rankMeta;

  useEffect(() => {
    if (!isOpen || !divisionId) return;
    setLoading(true);

    const unsubscribe = subscribeDivisionLeaderboard(divisionId, (list) => {
      setMembers(list);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, divisionId]);

  const totalMembers = members.length;
  const topCutoff = Math.min(LEAGUE_CONFIG.PROMOTION_TOP_COUNT, totalMembers);
  const bottomCutoff = Math.max(0, totalMembers - LEAGUE_CONFIG.RELEGATION_BOTTOM_COUNT);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${rankMeta.icon} ${divisionName}`}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Promotion & Relegation Guide Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--success-light)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowUpCircle size={14} />
            <span>
              <strong>Топ-5:</strong> Повышение в {nextRankMeta.label}
            </span>
          </div>

          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <MinusCircle size={14} />
            <span>
              <strong>Места 6..{Math.max(6, bottomCutoff)}:</strong> Сохранение лиги
            </span>
          </div>

          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--danger-light)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowDownCircle size={14} />
            <span>
              <strong>Нижние 5:</strong> {rank === 'bronze' ? 'Остаются в Бронзе' : `Понижение в ${prevRankMeta.label}`}
            </span>
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spinner size="md" label="Загрузка таблицы дивизиона..." />
          </div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
            В дивизионе пока нет участников
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '440px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {members.map((member, index) => {
              const position = index + 1;
              const isSelf = currentUserId && member.userId === currentUserId;
              const isTop5 = position <= topCutoff;
              const isBottom5 = position > bottomCutoff && totalMembers > topCutoff;

              const displayName = member.useRealName
                ? member.fullName || (isSelf ? 'Вы' : `Ученик (${member.userId?.slice(0, 6)})`)
                : member.pseudonym || 'Инкогнито 🕶️';

              let rowBg = 'var(--bg-surface)';
              let borderCol = 'var(--border-color)';
              if (isSelf) {
                rowBg = 'rgba(59, 130, 246, 0.08)';
                borderCol = 'var(--primary)';
              } else if (isTop5) {
                rowBg = 'rgba(34, 197, 94, 0.04)';
              }

              return (
                <div
                  key={member.id || member.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: rowBg,
                    border: `1px solid ${borderCol}`,
                    boxShadow: isSelf ? '0 0 0 1px var(--primary)' : 'none',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Position Number & Icon */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        backgroundColor:
                          position === 1
                            ? 'rgba(234, 179, 8, 0.2)'
                            : position === 2
                              ? 'rgba(148, 163, 184, 0.2)'
                              : position === 3
                                ? 'rgba(205, 127, 50, 0.2)'
                                : 'var(--bg-subtle)',
                        color:
                          position === 1
                            ? '#b45309'
                            : position === 2
                              ? '#475569'
                              : position === 3
                                ? '#9a3412'
                                : 'var(--text-secondary)',
                      }}
                    >
                      {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position}
                    </div>

                    {/* Participant Name & Status */}
                    <div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: isSelf ? 700 : 600,
                          color: isSelf ? 'var(--primary)' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{displayName}</span>
                        {isSelf && <Badge variant="info">Вы</Badge>}
                        {!member.useRealName && (
                          <span title="Анонимный профиль" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            🕶️
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {isTop5 ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            ▲ Зона повышения
                          </span>
                        ) : isBottom5 ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                            ▼ Зона риска
                          </span>
                        ) : (
                          <span>Сохранение лиги</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* XP */}
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-heading)',
                        color: isTop5 ? 'var(--success)' : 'var(--text-primary)',
                      }}
                    >
                      {member.xpEarnedThisSeason || 0} XP
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>за сезон</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Modal>
  );
}
