import { describe, it, expect } from 'vitest';
import { formatSpotsPlural } from '../../src/shared/utils/index.js';
import { CapacityBadge } from '../../src/shared/ui/CapacityBadge.jsx';

describe('CapacityBadge & formatSpotsPlural', () => {
  it('correctly pluralizes Russian noun "место" based on count', () => {
    expect(formatSpotsPlural(1)).toBe('1 место');
    expect(formatSpotsPlural(21)).toBe('21 место');

    expect(formatSpotsPlural(2)).toBe('2 места');
    expect(formatSpotsPlural(3)).toBe('3 места');
    expect(formatSpotsPlural(4)).toBe('4 места');
    expect(formatSpotsPlural(24)).toBe('24 места');

    expect(formatSpotsPlural(0)).toBe('0 мест');
    expect(formatSpotsPlural(5)).toBe('5 мест');
    expect(formatSpotsPlural(11)).toBe('11 мест');
    expect(formatSpotsPlural(12)).toBe('12 мест');
    expect(formatSpotsPlural(14)).toBe('14 мест');
    expect(formatSpotsPlural(20)).toBe('20 мест');
  });

  it('exports CapacityBadge as a React component function', () => {
    expect(typeof CapacityBadge).toBe('function');
  });
});
