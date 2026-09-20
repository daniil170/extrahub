import React from 'react';
import { Crown, Sparkles, Shield, Flame, Award, BookOpen } from 'lucide-react';
import './shopStyles.css';

/**
 * Extract 1 or 2 initials from a user's full name
 * @param {string} fullName
 * @returns {string}
 */
export function getInitials(fullName = '') {
  if (!fullName) return 'U';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

/**
 * Avatar with optional cosmetic frame effect
 * @param {Object} props
 * @param {string} [props.name] - Student full name for initials
 * @param {string} [props.photoUrl] - Optional avatar photo
 * @param {string} [props.frameEffectId] - CSS effect ID of equipped frame
 * @param {number} [props.size] - Pixel dimension (default 48)
 * @param {React.CSSProperties} [props.style]
 */
export function AvatarWithCosmetics({
  name = 'Ученик',
  photoUrl,
  frameEffectId,
  size = 48,
  style = {},
}) {
  const initials = getInitials(name);
  const frameClass = frameEffectId
    ? `cosmetic-frame-${frameEffectId}`
    : 'cosmetic-frame-none';

  return (
    <div
      className={`cosmetic-avatar-container ${frameClass}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        ...style,
      }}
    >
      <div className="cosmetic-avatar-inner" style={{ fontSize: `${Math.round(size * 0.38)}px` }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Student active title badge component
 * @param {Object} props
 * @param {string} props.titleName - Text of the title
 * @param {string} [props.titleEffectId] - CSS effect ID of the title
 * @param {string} [props.rarity] - Cosmetic rarity
 * @param {React.CSSProperties} [props.style]
 */
export function StudentTitleBadge({
  titleName,
  titleEffectId,
  rarity = 'common',
  style = {},
}) {
  if (!titleName) return null;

  const effectClass = titleEffectId
    ? `cosmetic-title-${titleEffectId}`
    : 'cosmetic-title-title-novice-explorer';

  const getTitleIcon = () => {
    if (titleEffectId?.includes('legend')) return <Crown size={12} color="#d97706" />;
    if (titleEffectId?.includes('streak')) return <Flame size={12} color="#ea580c" />;
    if (titleEffectId?.includes('math') || titleEffectId?.includes('wizard')) return <Sparkles size={12} color="#a855f7" />;
    if (titleEffectId?.includes('solver') || titleEffectId?.includes('problem')) return <Shield size={12} color="#0284c7" />;
    return <BookOpen size={12} color="#64748b" />;
  };

  return (
    <span className={`cosmetic-title-badge ${effectClass}`} style={style}>
      {getTitleIcon()}
      <span>{titleName}</span>
    </span>
  );
}

/**
 * Profile banner background header
 * @param {Object} props
 * @param {string} [props.bannerEffectId] - CSS effect ID for banner
 * @param {React.ReactNode} [props.children]
 * @param {React.CSSProperties} [props.style]
 */
export function ProfileBannerBackground({ bannerEffectId, children, style = {} }) {
  const effectClass = bannerEffectId
    ? `cosmetic-banner-${bannerEffectId}`
    : 'cosmetic-banner-banner-minimalist-slate';

  return (
    <div className={`cosmetic-banner ${effectClass}`} style={style}>
      {children}
    </div>
  );
}

/**
 * Live visual miniature preview rendered inside shop catalog cards
 * @param {Object} props
 * @param {import('../../entities/shop/model.js').ShopItem} props.item
 */
export function CosmeticItemPreview({ item }) {
  if (item.category === 'avatar_frame') {
    return (
      <div className="shop-preview-box">
        <AvatarWithCosmetics
          name="Pifagor Student"
          frameEffectId={item.cssEffectId}
          size={64}
        />
      </div>
    );
  }

  if (item.category === 'profile_banner') {
    return (
      <div className="shop-preview-box" style={{ padding: 0 }}>
        <div
          className={`cosmetic-banner cosmetic-banner-${item.cssEffectId}`}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100%',
            borderRadius: 'var(--radius-md, 12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {item.name}
          </div>
        </div>
      </div>
    );
  }

  if (item.category === 'title') {
    return (
      <div className="shop-preview-box" style={{ flexDirection: 'column', gap: '8px' }}>
        <StudentTitleBadge
          titleName={item.name}
          titleEffectId={item.cssEffectId}
          rarity={item.rarity}
          style={{ fontSize: '13px', padding: '6px 14px' }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Превью бейджа в профиле
        </span>
      </div>
    );
  }

  return (
    <div className="shop-preview-box">
      <Sparkles size={32} color="var(--primary)" />
    </div>
  );
}
