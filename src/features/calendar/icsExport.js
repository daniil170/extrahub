/**
 * RFC 5545 iCalendar (.ics) format generator for ExtraHub schedule and events.
 * Fully compatible with Apple Calendar, Google Calendar, and Microsoft Outlook.
 */

/**
 * Format a Date to UTC iCal string: YYYYMMDDTHHMMSSZ
 * @param {Date|string} dateInput
 * @returns {string}
 */
export function formatIcsDate(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return fallback.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escape text for iCalendar properties (RFC 5545 §3.3.11)
 * @param {string} text
 * @returns {string}
 */
export function escapeIcsText(text = '') {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generates an iCalendar (RFC 5545) formatted string from an array of calendar events.
 * @param {Array<Object>} events - Array of ClubEvent objects
 * @param {string} [calendarName='ExtraHub Расписание']
 * @returns {string}
 */
export function generateIcsContent(events = [], calendarName = 'ExtraHub Расписание') {
  const nowStamp = formatIcsDate(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ExtraHub//ExtraHub Gamification Calendar//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const ev of events) {
    if (!ev || !ev.startTime) continue;

    const uid = `${ev.id || Math.random().toString(36).substring(2)}@extrahub.school`;
    const dtStart = formatIcsDate(ev.startTime);
    const dtEnd = formatIcsDate(ev.endTime || ev.startTime);
    
    let summaryPrefix = '';
    if (ev.isBossEvent) {
      summaryPrefix = '⚔️ [БОСС-СОБЫТИЕ] ';
    } else if (ev.type === 'exam') {
      summaryPrefix = '📝 [ЭКЗАМЕН] ';
    } else if (ev.type === 'competition') {
      summaryPrefix = '🏆 [ТУРНИР] ';
    } else if (ev.type === 'deadline') {
      summaryPrefix = '⏰ [ДЕДЛАЙН] ';
    }

    const summary = `${summaryPrefix}${ev.title || 'Событие ExtraHub'}`;
    
    let desc = ev.description || '';
    if (ev.xpReward) {
      desc += `\\nНаграда: +${ev.xpReward} XP`;
      if (ev.coinsReward) {
        desc += ` +${ev.coinsReward} монет`;
      }
    }
    if (ev.teacherName) {
      desc += `\\nПреподаватель: ${ev.teacherName}`;
    }
    if (ev.groupName) {
      desc += `\\nГруппа: ${ev.groupName}`;
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
    lines.push(`LOCATION:${escapeIcsText(ev.location || 'ExtraHub')}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser file download of the generated .ics file
 * @param {Array<Object>} events
 * @param {string} [filename='extrahub-calendar.ics']
 * @param {string} [calendarName='ExtraHub Расписание']
 */
export function downloadIcsFile(events = [], filename = 'extrahub-calendar.ics', calendarName = 'ExtraHub Расписание') {
  const icsString = generateIcsContent(events, calendarName);
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
