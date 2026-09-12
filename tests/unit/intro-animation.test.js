import { describe, it, expect } from 'vitest';
import * as UI from '../../src/shared/ui/index.js';
import fs from 'node:fs';
import path from 'node:path';

describe('IntroAnimation Component & Brand Tokens', () => {
  it('exports IntroAnimation component from shared/ui', () => {
    expect(UI.IntroAnimation).toBeDefined();
    expect(typeof UI.IntroAnimation).toBe('function');
  });

  it('declares all required ExtraHub brand color variables in variables.css', () => {
    const cssPath = path.resolve(__dirname, '../../src/shared/styles/variables.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent).toContain('--eh-navy: #1a345c;');
    expect(cssContent).toContain('--eh-navy-dark: #122442;');
    expect(cssContent).toContain('--eh-orange: #ff734f;');
    expect(cssContent).toContain('--eh-mint: #99d8b9;');
  });

  it('contains the reconstructed SVG contour and TODO comment in IntroAnimation.jsx', () => {
    const jsxPath = path.resolve(__dirname, '../../src/shared/ui/IntroAnimation.jsx');
    const jsxContent = fs.readFileSync(jsxPath, 'utf8');

    expect(jsxContent).toContain('TODO: Temporary reconstructed single-stroke SVG contour');
    expect(jsxContent).toContain('extrahub_intro_shown');
    expect(jsxContent).toContain('155'); // 155ms typing interval
    expect(jsxContent).toContain('2050'); // 2050ms initial typing delay
  });

  it('contains responsive and accessibility rules in IntroAnimation.css', () => {
    const cssPath = path.resolve(__dirname, '../../src/shared/ui/IntroAnimation.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent).toContain('intro-overlay');
    expect(cssContent).toContain('prefers-reduced-motion');
    expect(cssContent).toContain('@media (max-width: 640px)');
    expect(cssContent).toContain('introDriftBg');
  });
});
