import { useState, useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Trophy,
  Award,
  Crown,
  Sparkles,
  Flame,
  FlameKindling,
  ShoppingBag,
  Check,
  CheckCircle2,
  ChevronRight,
  Star,
  Layers,
  Edit3,
  Shield,
  Loader2,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth.js';
import { PageHeader, Button, Card, Badge, Modal, CoinIcon } from '../../shared/ui/index.js';
import {
  AvatarWithCosmetics,
  StudentTitleBadge,
  ProfileBannerBackground,
  CosmeticItemPreview,
} from './ShopCosmetics.jsx';
import {
  subscribeShopItems,
  subscribeUserInventory,
  equipShopItemCall,
} from './api.js';
import { subscribeUserBalance } from '../gamification/api.js';
import { subscribeStudentLeagueMembership, subscribeActiveSeason } from '../league/api.js';
import { LEAGUE_CONFIG } from '../../entities/league/model.js';
import { STARTER_SHOP_ITEMS } from '../../entities/shop/model.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../app/config/firebase.js';
import { COLLECTIONS } from '../../shared/api/firebaseUtils.js';
import {
  AttendanceHeatmap,
  subscribeClubEvents,
  subscribeStudentEventResponses,
} from '../calendar/index.js';

const SHOWCASE_STORAGE_KEY = 'extrahub_showcase_achievements_';

export function StudentProfilePage() {
  const { user } = useAuth();
  const { studentId: routeStudentId } = useParams();
  const targetStudentId = routeStudentId || user?.id;

  const [inventory, setInventory] = useState([]);
  const [shopItems, setShopItems] = useState(STARTER_SHOP_ITEMS);
  const [balance, setBalance] = useState({ coins: 0, xpPoints: 0, currentStreak: 0 });
  const [leagueMembership, setLeagueMembership] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [showcaseIds, setShowcaseIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`${SHOWCASE_STORAGE_KEY}${targetStudentId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isEditingShowcase, setIsEditingShowcase] = useState(false);
  const [tempShowcaseIds, setTempShowcaseIds] = useState([]);
  const [equippingItemId, setEquippingItemId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [eventResponses, setEventResponses] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // Subscriptions
  useEffect(() => {
    if (!targetStudentId) return;

    const unsubInventory = subscribeUserInventory(targetStudentId, (inv) => {
      setInventory(inv || []);
    });

    const unsubShop = subscribeShopItems((items) => {
      setShopItems(items || STARTER_SHOP_ITEMS);
    });

    const unsubBalance = subscribeUserBalance(targetStudentId, (bal) => {
      setBalance(bal || { coins: 0, xpPoints: 0, currentStreak: 0 });
    });

    const unsubLeague = subscribeStudentLeagueMembership(targetStudentId, (mem) => {
      setLeagueMembership(mem);
    });

    const unsubSeason = subscribeActiveSeason((season) => {
      setActiveSeason(season);
    });

    // Subscribe to student's achievements
    const achQuery = query(
      collection(db, COLLECTIONS.ACHIEVEMENTS),
      where('studentId', '==', targetStudentId)
    );
    const unsubAch = onSnapshot(
      achQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (list.length === 0) {
          // Fallback realistic demo achievements
          setAchievements([
            {
              id: 'ach-demo-1',
              title: 'Первые шаги к вершине',
              description: 'Посетил 5 занятий подряд без пропусков',
              badgeIcon: '🔥',
              createdAt: '2026-09-10',
            },
            {
              id: 'ach-demo-2',
              title: 'Олимпийский призёр',
              description: 'Успешно сдал квалификационный олимпиадный экзамен',
              badgeIcon: '🏆',
              createdAt: '2026-09-15',
            },
            {
              id: 'ach-demo-3',
              title: 'Эрудит Pifagor',
              description: 'Набрал более 500 сезонных очков XP в лиге',
              badgeIcon: '⭐',
              createdAt: '2026-09-18',
            },
            {
              id: 'ach-demo-4',
              title: 'Знаток робототехники',
              description: 'Собрал и запрограммировал автономного робота',
              badgeIcon: '🤖',
              createdAt: '2026-09-12',
            },
          ]);
        } else {
          setAchievements(list);
        }
      },
      () => {
        // Fallback demo achievements
        setAchievements([
          {
            id: 'ach-demo-1',
            title: 'Первые шаги к вершине',
            description: 'Посетил 5 занятий подряд без пропусков',
            badgeIcon: '🔥',
            createdAt: '2026-09-10',
          },
          {
            id: 'ach-demo-2',
            title: 'Олимпийский призёр',
            description: 'Успешно сдал квалификационный олимпиадный экзамен',
            badgeIcon: '🏆',
            createdAt: '2026-09-15',
          },
          {
            id: 'ach-demo-3',
            title: 'Эрудит Pifagor',
            description: 'Набрал более 500 сезонных очков XP в лиге',
            badgeIcon: '⭐',
            createdAt: '2026-09-18',
          },
        ]);
      }
    );

    // Calendar events & responses
    const unsubEvents = subscribeClubEvents((evs) => {
      setClubEvents(evs || []);
    });

    const unsubResponses = subscribeStudentEventResponses(targetStudentId, (resps) => {
      setEventResponses(resps || []);
    });

    // Attendance records
    const attQuery = query(
      collection(db, COLLECTIONS.ATTENDANCE),
      where('studentId', '==', targetStudentId)
    );
    const unsubAtt = onSnapshot(
      attQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (list.length === 0) {
          // Fallback demo attendance for preview
          const now = new Date();
          const demoAtt = [];
          for (let i = 1; i <= 24; i += 3) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            demoAtt.push({
              id: `demo-att-${i}`,
              date: d.toISOString().substring(0, 10),
              status: 'attended',
              attended: true,
              activityName: 'Робототехника',
              xpEarned: 50,
              coinsEarned: 10,
            });
          }
          setAttendanceHistory(demoAtt);
        } else {
          setAttendanceHistory(list);
        }
      },
      () => {
        setAttendanceHistory([]);
      }
    );

    return () => {
      unsubInventory();
      unsubShop();
      unsubBalance();
      unsubLeague();
      unsubSeason();
      unsubAch();
      unsubEvents();
      unsubResponses();
      unsubAtt();
    };
  }, [targetStudentId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Find equipped items
  const equippedFrameInv = inventory.find((i) => i.itemCategory === 'avatar_frame' && i.isEquipped);
  const equippedBannerInv = inventory.find((i) => i.itemCategory === 'profile_banner' && i.isEquipped);
  const equippedTitleInv = inventory.find((i) => i.itemCategory === 'title' && i.isEquipped);

  const equippedFrameItem = shopItems.find((i) => i.id === equippedFrameInv?.itemId);
  const equippedBannerItem = shopItems.find((i) => i.id === equippedBannerInv?.itemId);
  const equippedTitleItem = shopItems.find((i) => i.id === equippedTitleInv?.itemId);

  const leagueRankConfig =
    LEAGUE_CONFIG.RANKS[leagueMembership?.rank] || LEAGUE_CONFIG.RANKS.bronze;

  // Showcase achievements: pick student's 3 chosen achievements, or top 3 by default
  const displayedShowcaseAchievements = (() => {
    if (showcaseIds.length > 0) {
      const selected = showcaseIds
        .map((id) => achievements.find((a) => a.id === id))
        .filter(Boolean);
      if (selected.length > 0) return selected.slice(0, 3);
    }
    return achievements.slice(0, 3);
  })();

  const handleOpenEditShowcase = () => {
    setTempShowcaseIds(displayedShowcaseAchievements.map((a) => a.id));
    setIsEditingShowcase(true);
  };

  const handleToggleShowcaseItem = (achId) => {
    if (tempShowcaseIds.includes(achId)) {
      setTempShowcaseIds(tempShowcaseIds.filter((id) => id !== achId));
    } else {
      if (tempShowcaseIds.length < 3) {
        setTempShowcaseIds([...tempShowcaseIds, achId]);
      }
    }
  };

  const handleSaveShowcase = () => {
    setShowcaseIds(tempShowcaseIds);
    try {
      localStorage.setItem(
        `${SHOWCASE_STORAGE_KEY}${targetStudentId}`,
        JSON.stringify(tempShowcaseIds)
      );
    } catch {
      // ignore
    }
    setIsEditingShowcase(false);
    showToast('Витрина достижений успешно обновлена!');
  };

  const handleEquipToggle = async (item, isCurrentlyEquipped) => {
    try {
      setEquippingItemId(item.id);
      await equipShopItemCall({
        itemId: item.id,
        category: item.category,
        unequip: isCurrentlyEquipped,
      });
      showToast(
        isCurrentlyEquipped ? `Предмет «${item.name}» снят` : `«${item.name}» экипирован!`
      );
    } catch (err) {
      showToast(err.message || 'Ошибка изменения экипировки');
    } finally {
      setEquippingItemId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            backgroundColor: 'var(--success-light, #ecfdf5)',
            color: 'var(--success, #10b981)',
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--success, #10b981)',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Profile Header Card with Equipped Banner */}
      <div
        style={{
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-color, #e2e8f0)',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          overflow: 'hidden',
          marginBottom: '28px',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Banner Section */}
        <ProfileBannerBackground
          bannerEffectId={equippedBannerItem?.cssEffectId}
          style={{ height: '160px', position: 'relative' }}
        >
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <NavLink to="/student/shop" style={{ textDecoration: 'none' }}>
              <Button
                size="sm"
                variant="outline"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(6px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                }}
              >
                <ShoppingBag size={14} />
                <span>Магазин</span>
              </Button>
            </NavLink>
          </div>
        </ProfileBannerBackground>

        {/* Profile Info Row (Avatar + Details + Stats) */}
        <div
          style={{
            padding: '0 28px 28px',
            marginTop: '-50px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            position: 'relative',
          }}
        >
          {/* Left: Avatar & Name & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <AvatarWithCosmetics
              name={user?.fullName || 'Ученик'}
              frameEffectId={equippedFrameItem?.cssEffectId}
              size={100}
              style={{
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                backgroundColor: 'var(--bg-surface, #ffffff)',
              }}
            />
            <div style={{ paddingTop: '40px' }}>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  margin: '0 0 6px 0',
                  color: 'var(--text-primary, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{user?.fullName || 'Алихан Сейткали'}</span>
              </h2>

              {/* Title Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <StudentTitleBadge
                  titleName={equippedTitleItem?.name || 'Искатель знаний'}
                  titleEffectId={equippedTitleItem?.cssEffectId || 'title-novice-explorer'}
                  rarity={equippedTitleItem?.rarity || 'common'}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  • 8 «А» класс
                </span>
              </div>
            </div>
          </div>

          {/* Right: Gamification Badges Bar */}
          <div
            style={{
              paddingTop: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* League Rank */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md, 12px)',
                backgroundColor: leagueRankConfig.bgLight,
                border: `1px solid ${leagueRankConfig.badgeColor}40`,
              }}
            >
              <span style={{ fontSize: '20px' }}>{leagueRankConfig.icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Дивизионная лига
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: leagueRankConfig.badgeColor }}>
                  {leagueRankConfig.label}
                </div>
              </div>
            </div>

            {/* Streak */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md, 12px)',
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
              }}
            >
              <Flame size={20} color="#ea580c" />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Серия
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#c2410c' }}>
                  {balance.currentStreak || 0} нед. подряд
                </div>
              </div>
            </div>

            {/* Coins */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md, 12px)',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <CoinIcon size={20} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Монеты
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {(balance.coins || 0).toLocaleString('ru-RU')} <CoinIcon size={13} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance & Boss-Events Activity Heatmap */}
      <AttendanceHeatmap
        attendanceHistory={attendanceHistory}
        eventResponses={eventResponses}
        events={clubEvents}
        currentStreak={balance.currentStreak || 0}
        studentName={user?.fullName || 'Ученик'}
      />

      {/* Grid: Achievement Showcase (3 slots) & Wardrobe */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
          gap: '24px',
        }}
      >
        {/* 1. ACHIEVEMENT SHOWCASE (Витрина лучших 3 достижений) */}
        <Card style={{ borderRadius: 'var(--radius-lg, 16px)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="#f59e0b" />
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Витрина достижений
              </h3>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenEditShowcase}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={13} />
              <span>Выбрать 3 лучших</span>
            </Button>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Закрепите до 3 ваших самых ценных наград, чтобы другие ученики и преподаватели видели их на вашей странице.
          </p>

          {/* 3 Showcase Slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[0, 1, 2].map((index) => {
              const ach = displayedShowcaseAchievements[index];

              if (!ach) {
                return (
                  <div
                    key={index}
                    onClick={handleOpenEditShowcase}
                    style={{
                      border: '2px dashed var(--border-color, #e2e8f0)',
                      borderRadius: 'var(--radius-md, 12px)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Plus size={16} />
                    <span>Слот #{index + 1}: Нажмите, чтобы добавить достижение</span>
                  </div>
                );
              }

              return (
                <div
                  key={ach.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md, 12px)',
                    backgroundColor: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                    }}
                  >
                    {ach.badgeIcon || '🏆'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ach.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {ach.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                    }}
                  >
                    {ach.createdAt ? new Date(ach.createdAt).toLocaleDateString('ru-RU') : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 2. MY WARDROBE (Гардероб экипировки) */}
        <Card style={{ borderRadius: 'var(--radius-lg, 16px)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--primary, #4f46e5)" />
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Мой гардероб ({inventory.length} предметов)
              </h3>
            </div>

            <NavLink to="/student/shop" style={{ textDecoration: 'none' }}>
              <Button size="sm" variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={13} />
                <span>В магазин</span>
              </Button>
            </NavLink>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            Все приобретенные вами рамки, фоны и титулы. Переключайте экипировку в один клик.
          </p>

          {inventory.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px dashed var(--border-color, #e2e8f0)',
              }}
            >
              <Sparkles size={32} color="var(--text-secondary)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                Ваш гардероб пока пуст
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
                Загляните в магазин кастомизации и выберите свою первую рамку аватара или титул!
              </p>
              <NavLink to="/student/shop" style={{ textDecoration: 'none' }}>
                <Button size="sm" variant="primary">
                  Перейти в магазин
                </Button>
              </NavLink>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {inventory.map((inv) => {
                const item = shopItems.find((i) => i.id === inv.itemId) || {
                  id: inv.itemId,
                  name: inv.itemId,
                  category: inv.itemCategory,
                  rarity: 'common',
                  cssEffectId: inv.itemId,
                };
                const isEquipped = inv.isEquipped;
                const isProcessing = equippingItemId === item.id;

                return (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md, 12px)',
                      backgroundColor: isEquipped ? 'var(--primary-light, #eef2ff)' : 'var(--bg-subtle, #f8fafc)',
                      border: isEquipped ? '1px solid var(--primary, #4f46e5)' : '1px solid var(--border-color, #e2e8f0)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.category === 'avatar_frame' && (
                        <AvatarWithCosmetics name="У" frameEffectId={item.cssEffectId} size={36} />
                      )}
                      {item.category === 'profile_banner' && (
                        <div
                          className={`cosmetic-banner-${item.cssEffectId}`}
                          style={{ width: '36px', height: '36px', borderRadius: '8px' }}
                        />
                      )}
                      {item.category === 'title' && (
                        <Crown size={20} color="#f59e0b" />
                      )}

                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {item.category === 'avatar_frame' ? 'Рамка' : item.category === 'profile_banner' ? 'Фон' : 'Титул'}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isEquipped ? 'outline' : 'primary'}
                      onClick={() => handleEquipToggle(item, isEquipped)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : isEquipped ? (
                        'Снять'
                      ) : (
                        'Надеть'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Edit Showcase Modal */}
      {isEditingShowcase && (
        <Modal
          isOpen={isEditingShowcase}
          onClose={() => setIsEditingShowcase(false)}
          title="Настройка витрины достижений"
        >
          <div style={{ padding: '8px 0' }}>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Выберите до <strong>3</strong> достижений для показа в профиле (выбрано {tempShowcaseIds.length} из 3):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
              {achievements.map((ach) => {
                const isSelected = tempShowcaseIds.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    onClick={() => handleToggleShowcaseItem(ach.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md, 12px)',
                      border: isSelected
                        ? '2px solid var(--primary, #4f46e5)'
                        : '1px solid var(--border-color, #e2e8f0)',
                      backgroundColor: isSelected ? 'var(--primary-light, #eef2ff)' : 'var(--bg-surface, #ffffff)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '24px' }}>{ach.badgeIcon || '🏆'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ach.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {ach.description}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={20} color="var(--primary, #4f46e5)" />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Button variant="outline" onClick={() => setIsEditingShowcase(false)}>
                Отмена
              </Button>
              <Button variant="primary" onClick={handleSaveShowcase}>
                Сохранить витрину
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
