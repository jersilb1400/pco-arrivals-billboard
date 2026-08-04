const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}

function zonedMidnightToUtc(year, month, day, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
  let offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  let utcDate = new Date(utcGuess - offset);
  const adjustedOffset = getTimeZoneOffsetMs(utcDate, timeZone);

  if (adjustedOffset !== offset) {
    utcDate = new Date(utcGuess - adjustedOffset);
  }

  return utcDate;
}

/**
 * Inclusive-start / exclusive-end UTC bounds for a YYYY-MM-DD calendar day
 * in the event's local timezone (default America/Chicago).
 */
function getEventLocalDayRange(date, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));

  return {
    start: zonedMidnightToUtc(year, month, day, timeZone),
    end: zonedMidnightToUtc(
      nextDay.getUTCFullYear(),
      nextDay.getUTCMonth() + 1,
      nextDay.getUTCDate(),
      timeZone
    )
  };
}

function buildBillboardCheckInsUrl(apiBase, eventId, date, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  let url = `${apiBase}/events/${eventId}/check_ins?include=person,locations&per_page=100`;
  if (!date) {
    return url;
  }

  const range = getEventLocalDayRange(date, timeZone);
  if (!range) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }

  url += `&where[created_at][gte]=${encodeURIComponent(range.start.toISOString())}`;
  url += `&where[created_at][lt]=${encodeURIComponent(range.end.toISOString())}`;
  return url;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  getEventLocalDayRange,
  buildBillboardCheckInsUrl
};
