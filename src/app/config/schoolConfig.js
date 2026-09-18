/**
 * ExtraHub — Multi-School Configuration Module
 *
 * Centralizes all school-specific configurations loaded from environment variables.
 * Allows ExtraHub to be deployed for different schools (e.g. Pifagor High School)
 * without codebase forks, ensuring 100% data and brand isolation.
 */

// 1. Basic School Identity
const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || 'Pifagor High School';
const SCHOOL_DOMAIN =
  import.meta.env.VITE_SCHOOL_DOMAIN ||
  import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ||
  'pifagorschool.kz';
const SCHOOL_LOGO_URL =
  import.meta.env.VITE_SCHOOL_LOGO_URL || '/schools/pifagor-logo.png';

// 2. ExtraHub & School Brand Colors (Partnership Co-Branding)
// Pifagor Primary: Emerald Green (#009639) + Deep Navy (#161A38)
const SCHOOL_PRIMARY_COLOR = import.meta.env.VITE_SCHOOL_PRIMARY_COLOR || '#009639';
const SCHOOL_ACCENT_COLOR = import.meta.env.VITE_SCHOOL_ACCENT_COLOR || '#161a38';
const SCHOOL_BRAND_NAVY = '#161a38';

const EXTRAHUB_LOGO_URL = import.meta.env.VITE_EXTRAHUB_LOGO_URL || '/assets/logo.png';
const EXTRAHUB_PRIMARY_COLOR = import.meta.env.VITE_EXTRAHUB_PRIMARY_COLOR || '#0e7c6b';

// 3. Shift Configuration
// Supports customizable shifts per school (e.g. 1 shift, 2 shifts, or customized time slots)
const DEFAULT_SHIFTS = [
  { id: 1, name: '1 смена', label: '1 смена (утро)', timeRange: '08:00 - 13:30' },
  { id: 2, name: '2 смена', label: '2 смена (день)', timeRange: '14:00 - 19:30' },
];

let parsedShifts = DEFAULT_SHIFTS;
try {
  const envShiftConfig = import.meta.env.VITE_SCHOOL_SHIFT_CONFIG;
  if (envShiftConfig) {
    const raw = typeof envShiftConfig === 'string' ? JSON.parse(envShiftConfig) : envShiftConfig;
    if (Array.isArray(raw) && raw.length > 0) {
      parsedShifts = raw.map((s) => ({
        id: Number(s.id),
        name: s.name || `${s.id} смена`,
        label: s.label || s.name || `${s.id} смена`,
        timeRange: s.timeRange || '',
      }));
    }
  }
} catch (e) {
  console.warn('Failed to parse VITE_SCHOOL_SHIFT_CONFIG, using default shifts:', e);
}

export const schoolConfig = {
  // Identity
  name: SCHOOL_NAME,
  domain: SCHOOL_DOMAIN,
  allowedEmailDomain: SCHOOL_DOMAIN,
  logoUrl: SCHOOL_LOGO_URL,

  // Branding & Colors
  primaryColor: SCHOOL_PRIMARY_COLOR,
  accentColor: SCHOOL_ACCENT_COLOR,
  pifagorNavy: SCHOOL_BRAND_NAVY,
  // ExtraHub Platform Branding
  extrahubLogoUrl: EXTRAHUB_LOGO_URL,
  extrahubPrimaryColor: EXTRAHUB_PRIMARY_COLOR,

  // Shifts
  shifts: parsedShifts,
  getShiftName: (shiftId) => {
    const found = parsedShifts.find((s) => s.id === Number(shiftId));
    return found ? found.name : `${shiftId} смена`;
  },

  // Feature Flags
  equipmentModuleEnabled:
    import.meta.env.VITE_EQUIPMENT_MODULE_ENABLED === 'true' ||
    import.meta.env.EQUIPMENT_MODULE_ENABLED === 'true' ||
    false,

  // Contact & Legal
  supportEmail: `support@${SCHOOL_DOMAIN}`,
  privacyEmail: `privacy@${SCHOOL_DOMAIN}`,
  coordinatorEmail: `coordinator@${SCHOOL_DOMAIN}`,

  // Document title helper
  getPageTitle: (pageName) => {
    if (!pageName) return `ExtraHub | ${SCHOOL_NAME}`;
    return `${pageName} — ExtraHub | ${SCHOOL_NAME}`;
  },

  // Apply custom CSS brand properties to document root if specified
  applyBrandTheme: (currentTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const isDark = currentTheme ? currentTheme === 'dark' : root.getAttribute('data-theme') === 'dark';

    // 1. School Specific Accent & Palette Vars
    root.style.setProperty('--school-primary', SCHOOL_PRIMARY_COLOR);
    root.style.setProperty('--school-accent', SCHOOL_ACCENT_COLOR);
    root.style.setProperty('--school-navy', SCHOOL_BRAND_NAVY);
    root.style.setProperty('--school-green', '#009639');
    root.style.setProperty('--eh-brand-primary', EXTRAHUB_PRIMARY_COLOR);

    // 2. Override platform primary color if configured
    if (SCHOOL_PRIMARY_COLOR) {
      if (SCHOOL_PRIMARY_COLOR === '#0047AB') {
        // Pifagor Sapphire Blue
        const primaryVal = isDark ? '#3b82f6' : '#0047ab';
        const hoverVal = isDark ? '#60a5fa' : '#003580';
        root.style.setProperty('--primary', primaryVal);
        root.style.setProperty('--primary-hover', hoverVal);
        root.style.setProperty('--primary-light', isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 71, 171, 0.08)');
        root.style.setProperty('--primary-border', isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(0, 71, 171, 0.35)');
        root.style.setProperty('--primary-glow', isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(0, 71, 171, 0.18)');
      } else if (SCHOOL_PRIMARY_COLOR === '#009639') {
        const primaryVal = isDark ? '#10b981' : '#009639';
        const hoverVal = isDark ? '#34d399' : '#007a2e';
        root.style.setProperty('--primary', primaryVal);
        root.style.setProperty('--primary-hover', hoverVal);
        root.style.setProperty('--primary-light', isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 150, 57, 0.08)');
        root.style.setProperty('--primary-border', isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 150, 57, 0.35)');
        root.style.setProperty('--primary-glow', isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 150, 57, 0.18)');
      } else {
        root.style.setProperty('--primary', SCHOOL_PRIMARY_COLOR);
        root.style.setProperty('--primary-hover', SCHOOL_PRIMARY_COLOR);
      }
    }
  },
};

export default schoolConfig;
