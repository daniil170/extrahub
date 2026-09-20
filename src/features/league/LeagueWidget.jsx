import { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  EyeOff,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '../../shared/ui/index.js';
import { LEAGUE_CONFIG } from '../../entities/league/model.js';
import {
  subscribeActiveSeason,
  subscribeStudentLeagueMembership,
  subscribeDivisionLeaderboard,
} from './api.js';
import { LeagueLeaderboardModal } from './LeagueLeaderboardModal.jsx';
import { LeaguePrivacyModal } from './LeaguePrivacyModal.jsx';

/**
 * Competitive League Division Widget for Student Dashboard
 * @param {Object} props
 * @param {string} props.userId
 */
export function LeagueWidget({ userId }) {
  const [season, setSeason] = useState(null);
  const [membership, setMembership] = useState(null);
  const [divisionMembers, setDivisionMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const unsubSeason = subscribeActiveSeason((s) => setSeason(s));
    const unsubMembership = subscribeStudentLeagueMembership(userId, (m) => {
      setMembership(m);
      setLoading(false);
    });

    return () => {
      if (unsubSeason) unsubSeason();
      if (unsubMembership) unsubMembership();
    };
  }, [userId]);

  useEffect(() => {
    if (!membership?.divisionId) return;
    const unsubDivision = subscribeDivisionLeaderboard(membership.divisionId, (list) => {
      setDivisionMembers(list);
    });
    return () => {
      if (unsubDivision) unsubDivision();
    };
  }, [membership?.divisionId]);

  const currentRank = membership?.rank || 'bronze';
  const rankMeta = LEAGUE_CONFIG.RANKS[currentRank] || LEAGUE_CONFIG.RANKS.bronze;
  const nextRankMeta = LEAGUE_CONFIG.RANKS[rankMeta.nextRank] || rankMeta;
  const prevRankMeta = LEAGUE_CONFIG.RANKS[rankMeta.prevRank] || rankMeta;

  // Calculate position in division leaderboard
  const memberIndex = divisionMembers.findIndex((m) => m.userId === userId);
  const position = memberIndex !== -1 ? memberIndex + 1 : 1;
  const totalInDivision = Math.max(divisionMembers.length, 1);
  const topCutoff = Math.min(LEAGUE_CONFIG.PROMOTION_TOP_COUNT, totalInDivision);
  const bottomCutoff = Math.max(0, totalInDivision - LEAGUE_CONFIG.RELEGATION_BOTTOM_COUNT);

  const isTop5 = position <= topCutoff;
  const isBottom5 = position > bottomCutoff && totalInDivision > topCutoff;

  return (
    <Card
      style={{
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${rankMeta.badgeColor}40`,
        background: `linear-gradient(135deg, ${rankMeta.bgLight} 0%, var(--bg-surface) 100%)`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        padding: '20px 24px',
        marginBottom: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '14px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: rankMeta.bgLight,
              border: `1px solid ${rankMeta.badgeColor}60`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}
          >
            {rankMeta.icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-primary)',
                }}
              >
                {rankMeta.label} • Группа {membership?.groupNumber || 1}
              </h2>
              {!membership?.useRealName && (
                <Badge variant="default">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <EyeOff size={11} />
                    Инкогнито
                  </span>
                </Badge>
              )}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {season?.name || 'Текущий сезон'} • Топ-5 переходят в {nextRankMeta.label}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPrivacyOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Shield size={13} />
            <span>Приватность</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setLeaderboardOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trophy size={14} />
            <span>Рейтинг группы</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spinner size="md" label="Загрузка дивизиона..." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            {/* Position */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Место в группе
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: isTop5 ? 'var(--success)' : isBottom5 ? 'var(--danger)' : 'var(--text-primary)',
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{position} место</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                  из {totalInDivision}
                </span>
              </div>
            </div>

            {/* Season XP */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Очки за этот сезон
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--primary)',
                  marginTop: '2px',
                }}
              >
                {membership?.xpEarnedThisSeason || 0} XP
              </div>
            </div>

            {/* Zone Status */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isTop5
                  ? 'var(--success-light)'
                  : isBottom5
                    ? 'var(--danger-light)'
                    : 'var(--bg-surface)',
                border: isTop5
                  ? '1px solid var(--success)'
                  : isBottom5
                    ? '1px solid var(--danger)'
                    : '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: '11.5px',
                  color: isTop5 ? 'var(--success)' : isBottom5 ? 'var(--danger)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Статус дивизиона
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: isTop5 ? 'var(--success)' : isBottom5 ? 'var(--danger)' : 'var(--text-primary)',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isTop5 ? (
                  <>
                    <ArrowUpCircle size={16} />
                    <span>Зона повышения</span>
                  </>
                ) : isBottom5 ? (
                  <>
                    <ArrowDownCircle size={16} />
                    <span>{currentRank === 'bronze' ? 'Бронзовая лига' : 'Зона риска вылета'}</span>
                  </>
                ) : (
                  <span>Сохранение лиги</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {membership && (
        <LeagueLeaderboardModal
          isOpen={leaderboardOpen}
          onClose={() => setLeaderboardOpen(false)}
          divisionId={membership.divisionId}
          divisionName={`${rankMeta.label} • Группа ${membership.groupNumber}`}
          rank={membership.rank}
          currentUserId={userId}
        />
      )}

      {/* Privacy Modal */}
      {membership && (
        <LeaguePrivacyModal
          isOpen={privacyOpen}
          onClose={() => setPrivacyOpen(false)}
          membership={membership}
        />
      )}
    </Card>
  );
}
