import { useState, useEffect, useRef, useCallback } from 'react';
import pifagorLogo from '../../assets/pifagor-logo.png';
import { schoolConfig } from '../../app/config/schoolConfig.js';
import './IntroAnimation.css';

const SESSION_STORAGE_KEY = 'extrahub_intro_shown';

const SCHOOL_NAME = schoolConfig?.name || 'Pifagor High School';

const WORD_LETTERS = [
  { ch: 'E', part: 'extra' },
  { ch: 'x', part: 'extra' },
  { ch: 't', part: 'extra' },
  { ch: 'r', part: 'extra' },
  { ch: 'a', part: 'extra' },
  { ch: 'H', part: 'hub' },
  { ch: 'u', part: 'hub' },
  { ch: 'b', part: 'hub' },
  { ch: ' ', part: 'sep' },
  { ch: '×', part: 'sep' },
  { ch: ' ', part: 'sep' },
  ...Array.from(SCHOOL_NAME).map((ch) => ({ ch, part: 'school' })),
];

/**
 * IntroAnimation Component
 *
 * Fullscreen splash/loading intro animation for ExtraHub × Pifagor High School.
 */
export function IntroAnimation({
  forcePlay = false,
  holdDelay = 800,
  onComplete,
}) {
  const isDev = Boolean(import.meta.env.DEV);

  const shouldInitiallyRun = useCallback(() => {
    if (typeof window === 'undefined') return false;
    if (forcePlay) return true;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('intro') === 'replay' || urlParams.get('replayIntro') === '1') {
        return true;
      }
      return !sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return true;
    }
  }, [forcePlay]);

  const [isVisible, setIsVisible] = useState(() => shouldInitiallyRun());
  const [typedCount, setTypedCount] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const pathRef = useRef(null);
  const timeoutsRef = useRef([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const markSessionShown = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {
      // Ignore quota/security errors in restricted environments
    }
  }, []);

  const startAnimation = useCallback(() => {
    clearAllTimeouts();
    setTypedCount(0);
    setIsFadingOut(false);
    setIsVisible(true);
    markSessionShown();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setTypedCount(WORD_LETTERS.length);
      const timerId = setTimeout(() => {
        setIsFadingOut(true);
        const finishTimer = setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 300);
        timeoutsRef.current.push(finishTimer);
      }, 500);
      timeoutsRef.current.push(timerId);
      return;
    }

    // Step 1: Animate SVG contour path
    if (pathRef.current) {
      const path = pathRef.current;
      const len = path.getTotalLength ? path.getTotalLength() : 700;
      path.style.transition = 'none';
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      void path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 1.15s cubic-bezier(.65,0,.35,1)';
      requestAnimationFrame(() => {
        path.style.strokeDashoffset = '0';
      });
    }

    // Step 2 & 3: Typing letters interval (75ms per character)
    const typeStartTimer = setTimeout(() => {
      let index = 0;
      const typeNextLetter = () => {
        if (index < WORD_LETTERS.length) {
          index += 1;
          setTypedCount(index);
          const nextLetterTimer = setTimeout(typeNextLetter, 75);
          timeoutsRef.current.push(nextLetterTimer);
        } else {
          const fadeOutTimer = setTimeout(() => {
            setIsFadingOut(true);
            const completeTimer = setTimeout(() => {
              setIsVisible(false);
              onComplete?.();
            }, 500);
            timeoutsRef.current.push(completeTimer);
          }, holdDelay);
          timeoutsRef.current.push(fadeOutTimer);
        }
      };
      typeNextLetter();
    }, 1800);

    timeoutsRef.current.push(typeStartTimer);
  }, [clearAllTimeouts, holdDelay, markSessionShown, onComplete]);

  const replay = useCallback(() => {
    setPlayCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (isDev && typeof window !== 'undefined') {
      window.__replayIntro = replay;
      return () => {
        delete window.__replayIntro;
      };
    }
  }, [isDev, replay]);

  useEffect(() => {
    if (isVisible) {
      startAnimation();
    }
    return () => {
      clearAllTimeouts();
    };
  }, [playCount, isVisible, startAnimation, clearAllTimeouts]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`intro-overlay ${isFadingOut ? 'fade-out' : ''}`}
      aria-hidden="true"
      role="presentation"
    >
      <div className="intro-stage">
        {/* Co-Branding Logos Container: ExtraHub SVG + Pifagor PNG Logo */}
        <div className="intro-logos-container">
          <div className="intro-logo-wrap">
            <svg viewBox="0 0 220 220" id="logoSvg">
              <rect
                key={`sq1-${playCount}`}
                className="intro-accent orange"
                x="112"
                y="18"
                width="46"
                height="46"
                rx="6"
                style={{ animationDelay: '1.15s' }}
              />
              <rect
                key={`sq2-${playCount}`}
                className="intro-accent orange"
                x="70"
                y="88"
                width="42"
                height="42"
                rx="6"
                style={{ animationDelay: '1.30s' }}
              />
              <rect
                key={`sq3-${playCount}`}
                className="intro-accent mint"
                x="112"
                y="156"
                width="46"
                height="46"
                rx="6"
                style={{ animationDelay: '1.45s' }}
              />

              <path
                key={`path-${playCount}`}
                ref={pathRef}
                id="mainPath"
                className="intro-stroke-path"
                d="
                  M 32 24
                  H 112
                  V 64
                  H 72
                  M 32 24
                  V 196
                  M 32 196
                  H 112
                  V 156
                  H 72
                  M 32 110
                  H 150
                  M 150 110
                  L 178 90
                  M 150 110
                  L 178 130
                "
              />
            </svg>
          </div>

          <div className="intro-brand-x">×</div>

          <div className="intro-school-logo-wrap">
            <img
              src={pifagorLogo}
              alt={schoolConfig.name}
              className="intro-school-img"
            />
          </div>
        </div>

        {/* Wordmark: typed letter-by-letter */}
        <div className="intro-wordmark">
          <span>
            {WORD_LETTERS.slice(0, typedCount).map((letter, idx) => (
              <span
                key={`${idx}-${letter.ch}`}
                className={`intro-letter intro-letter-${letter.part}`}
              >
                {letter.ch === ' ' ? '\u00A0' : letter.ch}
              </span>
            ))}
          </span>
          <span className="intro-cursor" />
        </div>
      </div>
    </div>
  );
}
