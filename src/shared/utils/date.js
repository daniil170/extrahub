/**
 * Format ISO string or Date to readable format (DD.MM.YYYY)
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format day of week numbers (1-7) to Russian short strings
 * @param {number[]} days
 * @returns {string}
 */
export function formatDaysOfWeek(days = []) {
  const dayNames = {
    1: 'Пн',
    2: 'Вт',
    3: 'Ср',
    4: 'Чт',
    5: 'Пт',
    6: 'Сб',
    7: 'Вс',
  };
  return days.map((d) => dayNames[d] || d).join(', ');
}

/**
 * Format currency amount in Kazakhstani Tenge (₸) by default
 * @param {number} amount
 * @param {string} [currency='₸']
 * @returns {string}
 */
export function formatCurrency(amount = 0, currency = '₸') {
  return `${amount.toLocaleString('ru-RU')} ${currency}`;
}

/**
 * Format Russian noun "место" based on count (1 место, 2-4 места, 5+ мест)
 * @param {number} count
 * @returns {string}
 */
export function formatSpotsPlural(count = 0) {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod100 >= 11 && mod100 <= 19) {
    return `${count} мест`;
  }
  if (mod10 === 1) {
    return `${count} место`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} места`;
  }
  return `${count} мест`;
}

