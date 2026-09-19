/**
 * Gamification League Models (Firestore Collections: seasons, leagueDivisions, leagueMemberships)
 */

/**
 * @typedef {'bronze' | 'silver' | 'gold' | 'diamond'} LeagueRank
 */

/**
 * @typedef {'active' | 'completed'} SeasonStatus
 */

/**
 * @typedef {Object} Season
 * @property {string} id - Unique season identifier (e.g., 'season-2026-q3')
 * @property {string} name - Human-readable name (e.g., "Осенняя четверть 2026")
 * @property {string} startDate - Start date string (YYYY-MM-DD)
 * @property {string} endDate - End date string (YYYY-MM-DD)
 * @property {SeasonStatus} status - Status ('active' | 'completed')
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string|null} finalizedAt - ISO timestamp when finalized
 */

/**
 * @typedef {Object} LeagueDivision
 * @property {string} id - Unique division ID (e.g., 'season-2026-q3_gold_1')
 * @property {string} seasonId - Parent season ID
 * @property {LeagueRank} rank - Division rank tier ('bronze' | 'silver' | 'gold' | 'diamond')
 * @property {number} groupNumber - Subgroup index (1, 2, 3... up to 30 students each)
 * @property {string} name - Friendly division title (e.g. "Золотая лига • Группа 1")
 * @property {string} createdAt - ISO timestamp
 */

/**
 * @typedef {Object} LeagueMembership
 * @property {string} id - Unique membership ID (e.g., 'season-2026-q3_student-1')
 * @property {string} seasonId - Associated season ID
 * @property {string} divisionId - Assigned division ID
 * @property {LeagueRank} rank - Current rank tier
 * @property {number} groupNumber - Current group number
 * @property {string} userId - Student user ID
 * @property {number} xpEarnedThisSeason - Total XP earned exclusively during this season
 * @property {string} [pseudonym] - Custom anonymous nickname (if user disabled real name)
 * @property {boolean} useRealName - Whether to display real full name on leaderboard (default true)
 * @property {string} updatedAt - ISO timestamp
 */

export const LEAGUE_CONFIG = {
  MAX_GROUP_SIZE: 30,
  PROMOTION_TOP_COUNT: 5,
  RELEGATION_BOTTOM_COUNT: 5,
  RANKS: {
    bronze: {
      key: 'bronze',
      label: 'Бронзовая лига',
      icon: '🥉',
      badgeColor: '#cd7f32',
      bgLight: 'rgba(205, 127, 50, 0.12)',
      order: 1,
      nextRank: 'silver',
      prevRank: 'bronze',
    },
    silver: {
      key: 'silver',
      label: 'Серебряная лига',
      icon: '🥈',
      badgeColor: '#94a3b8',
      bgLight: 'rgba(148, 163, 184, 0.15)',
      order: 2,
      nextRank: 'gold',
      prevRank: 'bronze',
    },
    gold: {
      key: 'gold',
      label: 'Золотая лига',
      icon: '🥇',
      badgeColor: '#eab308',
      bgLight: 'rgba(234, 179, 8, 0.15)',
      order: 3,
      nextRank: 'diamond',
      prevRank: 'silver',
    },
    diamond: {
      key: 'diamond',
      label: 'Алмазная лига',
      icon: '💎',
      badgeColor: '#06b6d4',
      bgLight: 'rgba(6, 182, 212, 0.15)',
      order: 4,
      nextRank: 'diamond',
      prevRank: 'gold',
    },
  },
};

/**
 * Factory function to create a Season entity
 * @param {Partial<Season>} data
 * @returns {Season}
 */
export function createSeason(data = {}) {
  return {
    id: data.id || `season-${Date.now()}`,
    name: data.name || 'Текущий учебный сезон',
    startDate: data.startDate || new Date().toISOString().slice(0, 10),
    endDate: data.endDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    status: data.status || 'active',
    createdAt: data.createdAt || new Date().toISOString(),
    finalizedAt: data.finalizedAt || null,
  };
}

/**
 * Factory function to create a LeagueDivision entity
 * @param {Partial<LeagueDivision>} data
 * @returns {LeagueDivision}
 */
export function createLeagueDivision(data = {}) {
  const rank = data.rank || 'bronze';
  const groupNumber = data.groupNumber || 1;
  const rankMeta = LEAGUE_CONFIG.RANKS[rank] || LEAGUE_CONFIG.RANKS.bronze;

  return {
    id: data.id || `${data.seasonId || 'season'}_${rank}_group_${groupNumber}`,
    seasonId: data.seasonId || '',
    rank,
    groupNumber,
    name: data.name || `${rankMeta.label} • Группа ${groupNumber}`,
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

/**
 * Factory function to create a LeagueMembership entity
 * @param {Partial<LeagueMembership>} data
 * @returns {LeagueMembership}
 */
export function createLeagueMembership(data = {}) {
  return {
    id: data.id || `${data.seasonId || 'season'}_${data.userId || 'user'}`,
    seasonId: data.seasonId || '',
    divisionId: data.divisionId || '',
    rank: data.rank || 'bronze',
    groupNumber: data.groupNumber || 1,
    userId: data.userId || '',
    xpEarnedThisSeason: typeof data.xpEarnedThisSeason === 'number' ? data.xpEarnedThisSeason : 0,
    pseudonym: data.pseudonym || '',
    useRealName: data.useRealName !== undefined ? Boolean(data.useRealName) : true,
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}
