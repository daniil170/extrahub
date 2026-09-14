import { describe, it, expect } from 'vitest';
import * as UI from '../../src/shared/ui/index.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Auth Redesign and Legal Pages Test Suite', () => {
  describe('Cookie Consent Banner', () => {
    it('exports CookieConsentBanner component from shared/ui', () => {
      expect(UI.CookieConsentBanner).toBeDefined();
      expect(typeof UI.CookieConsentBanner).toBe('function');
    });

    it('stores consent state in localStorage key and contains link to privacy policy', () => {
      const bannerPath = path.resolve(__dirname, '../../src/shared/ui/CookieConsentBanner.jsx');
      const content = fs.readFileSync(bannerPath, 'utf8');

      expect(content).toContain('extrahub_cookie_consent');
      expect(content).toContain('/privacy-policy');
      expect(content).toContain('Понятно');
    });
  });

  describe('Legal Documents (Privacy Policy & Terms of Use)', () => {
    it('PrivacyPolicyPage contains required legal clauses and draft disclaimer', () => {
      const policyPath = path.resolve(__dirname, '../../src/features/legal/PrivacyPolicyPage.jsx');
      const content = fs.readFileSync(policyPath, 'utf8');

      // Key required subjects
      expect(content).toContain('несовершеннолетни');
      expect(content).toContain('родител');
      expect(content).toContain('посещаемост');
      expect(content).toContain('платеж');
      expect(content).toContain('Least Privilege');
      expect(content).toContain('privacy@pifagorschool.kz');
    });

    it('TermsOfUsePage contains 24h booking rule and terms of service', () => {
      const termsPath = path.resolve(__dirname, '../../src/features/legal/TermsOfUsePage.jsx');
      const content = fs.readFileSync(termsPath, 'utf8');

      expect(content).toContain('24 часа');
      expect(content).toContain('Waitlist');
      expect(content).toContain('тенге');
      expect(content).toContain('support@pifagorschool.kz');
    });

    it('LegalDocumentLayout includes the mandatory prominent lawyer disclaimer', () => {
      const layoutPath = path.resolve(__dirname, '../../src/features/legal/LegalDocumentLayout.jsx');
      const content = fs.readFileSync(layoutPath, 'utf8');

      expect(content.replace(/\s+/g, ' ')).toContain(
        'Данный документ является черновиком и должен быть проверен юристом перед официальным использованием'
      );
    });

    it('registers /privacy-policy and /terms-of-use routes in router.jsx', () => {
      const routerPath = path.resolve(__dirname, '../../src/app/routes/router.jsx');
      const content = fs.readFileSync(routerPath, 'utf8');

      expect(content).toContain("path: 'privacy-policy'");
      expect(content).toContain("path: 'terms-of-use'");
    });
  });

  describe('Auth Redesign Flow & Consent Checkboxes', () => {
    it('RegisterPage has 2-step flow with progress stepper', () => {
      const registerPath = path.resolve(__dirname, '../../src/features/auth/RegisterPage.jsx');
      const content = fs.readFileSync(registerPath, 'utf8');

      // 2 steps
      expect(content).toContain('step === 1');
      expect(content).toContain('step === 2');
      expect(content).toContain('Шаг {step} из 2');
      expect(content).toContain('auth-stepper');

      // Step 1 fields
      expect(content).toContain('fullName');
      expect(content).toContain('className');
      expect(content).toContain('shift');

      // Step 2 fields and consent checkbox
      expect(content).toContain('termsAccepted');
      expect(content).toContain('/terms-of-use');
      expect(content).toContain('/privacy-policy');
      expect(content).toContain('disabled={loading || isInvalidDomain || !termsAccepted}');
    });

    it('LoginPage is visually paired with two-tab switcher and icon inputs', () => {
      const loginPath = path.resolve(__dirname, '../../src/features/auth/LoginPage.jsx');
      const content = fs.readFileSync(loginPath, 'utf8');

      expect(content).toContain('auth-tabs-nav');
      expect(content).toContain('to="/register"');
      expect(content).toContain('auth-input-icon');
      expect(content).toContain('auth-card');
    });

    it('StaffInvitePage requires legal terms agreement checkbox before submission', () => {
      const staffPath = path.resolve(__dirname, '../../src/features/invite/StaffInvitePage.jsx');
      const content = fs.readFileSync(staffPath, 'utf8');

      expect(content).toContain('termsAccepted');
      expect(content).toContain('/terms-of-use');
      expect(content).toContain('/privacy-policy');
      expect(content).toContain('disabled={submitting || !termsAccepted}');
    });

    it('ParentInvitePage includes links to privacy policy and terms of use in consent block', () => {
      const parentPath = path.resolve(__dirname, '../../src/features/invite/ParentInvitePage.jsx');
      const content = fs.readFileSync(parentPath, 'utf8');

      expect(content).toContain('/privacy-policy');
      expect(content).toContain('/terms-of-use');
      expect(content).toContain('законным представителем');
    });

    it('Footer includes copyright © ExtraHub 2026 and legal links', () => {
      const footerPath = path.resolve(__dirname, '../../src/shared/ui/Footer.jsx');
      const content = fs.readFileSync(footerPath, 'utf8');

      expect(content).toContain('© ExtraHub 2026');
      expect(content).toContain('Политика конфиденциальности');
      expect(content).toContain('Условия использования');
      expect(content).toContain('/privacy-policy');
      expect(content).toContain('/terms-of-use');
    });
  });

  describe('Auth Session Persistence & Demo Role Switcher Loading', () => {
    it('caches user profile in localStorage in AuthContext to eliminate reload flicker', () => {
      const authPath = path.resolve(__dirname, '../../src/features/auth/AuthContext.jsx');
      const content = fs.readFileSync(authPath, 'utf8');

      expect(content).toContain('extrahub_auth_cache');
      expect(content).toContain('localStorage.getItem(AUTH_CACHE_KEY)');
      expect(content).toContain('localStorage.setItem(AUTH_CACHE_KEY');
      expect(content).toContain('localStorage.removeItem(AUTH_CACHE_KEY)');
    });

    it('Navbar accepts loading prop and displays a loading state instead of public login buttons', () => {
      const navbarPath = path.resolve(__dirname, '../../src/shared/ui/Navbar.jsx');
      const content = fs.readFileSync(navbarPath, 'utf8');

      expect(content).toContain('loading = false');
      expect(content).toContain('aria-label="Загрузка профиля..."');
    });

    it('DemoRoleSwitcher renders a full-screen loading overlay during role switching', () => {
      const switcherPath = path.resolve(__dirname, '../../src/features/auth/DemoRoleSwitcher.jsx');
      const content = fs.readFileSync(switcherPath, 'utf8');

      expect(content).toContain('switchingRole &&');
      expect(content).toContain('Смена демо-роли...');
      expect(content).toContain('backdropFilter');
      expect(content).toContain('aria-busy="true"');
    });

    it('StudentDashboard completely omits awards and achievements', () => {
      const studentPath = path.resolve(__dirname, '../../src/features/dashboard/StudentDashboard.jsx');
      const content = fs.readFileSync(studentPath, 'utf8');

      expect(content).not.toContain('Награды и достижения');
      expect(content).not.toContain('mockAchievements');
      expect(content).not.toContain('ACHIEVEMENT_ICONS');
      expect(content).not.toContain('DEMO_ACHIEVEMENTS');
    });

    it('Navbar logo links to /about and header nav omits "О платформе"', () => {
      const navbarPath = path.resolve(__dirname, '../../src/shared/ui/Navbar.jsx');
      const content = fs.readFileSync(navbarPath, 'utf8');

      // Logo links to /about
      expect(content).toContain('to="/about"');
      // "О платформе" is no longer a separate nav item in desktop or mobile links
      expect(content).not.toContain('О платформе</NavLink>');
      expect(content).not.toContain('О платформе и команде</NavLink>');
    });
  });
});
