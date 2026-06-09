const { DEFAULT_EVENT_TIME_ZONE } = require('./dateMatching');

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

function buildActiveCheckInsUrl(apiBase, eventId, locationId, date, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  const range = getEventLocalDayRange(date, timeZone);
  if (!range) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }

  const params = new URLSearchParams({
    'where[event_id]': eventId,
    include: 'locations',
    'where[created_at][gte]': range.start.toISOString(),
    'where[created_at][lt]': range.end.toISOString()
  });

  return `${apiBase}/check_ins?${params.toString()}`;
}

module.exports = {
  getEventLocalDayRange,
  buildActiveCheckInsUrl
};
