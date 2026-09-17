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

// 2. School Brand Colors (Optional override over ExtraHub design system)
// Pifagor brand colors: Deep Navy (#1E1B4B) + Energetic Green (#009639)
const SCHOOL_PRIMARY_COLOR = import.meta.env.VITE_SCHOOL_PRIMARY_COLOR || '#0e7c6b';
const SCHOOL_ACCENT_COLOR = import.meta.env.VITE_SCHOOL_ACCENT_COLOR || '#009639';
const SCHOOL_BRAND_NAVY = '#1e1b4b';

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
  pifagorGreen: '#009639',

  // Shifts
  shifts: parsedShifts,
  getShiftName: (shiftId) => {
    const found = parsedShifts.find((s) => s.id === Number(shiftId));
    return found ? found.name : `${shiftId} смена`;
  },

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
  applyBrandTheme: () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (SCHOOL_PRIMARY_COLOR && SCHOOL_PRIMARY_COLOR !== '#0e7c6b') {
      root.style.setProperty('--school-primary', SCHOOL_PRIMARY_COLOR);
    }
    if (SCHOOL_ACCENT_COLOR) {
      root.style.setProperty('--school-accent', SCHOOL_ACCENT_COLOR);
    }
    root.style.setProperty('--school-navy', SCHOOL_BRAND_NAVY);
    root.style.setProperty('--school-green', '#009639');
  },
};

export default schoolConfig;
