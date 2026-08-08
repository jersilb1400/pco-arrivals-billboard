/**
 * Helpers for /api/security-code-entry PCO lookup.
 *
 * PCO CheckIn query_by supports security_code/created_at/updated_at/account_center_person_id,
 * but NOT event_id. Org-wide /check_ins?where[event_id]=... is ignored by PCO, so callers must
 * use the event association endpoint and paginate (default per_page is only 25).
 */

function buildEventScopedSecurityCodeUrls(apiBase, eventId, securityCode) {
  const include = 'person,locations,checked_in_at';
  const base = `${apiBase}/events/${encodeURIComponent(eventId)}/check_ins`;
  const variants = [];
  const seen = new Set();

  for (const code of [securityCode, securityCode?.toLowerCase?.(), securityCode?.toUpperCase?.()]) {
    if (!code || seen.has(code)) continue;
    seen.add(code);
    variants.push(
      `${base}?where[security_code]=${encodeURIComponent(code)}&include=${include}&per_page=100&order=-created_at`
    );
  }

  return variants;
}

function buildEventCheckInsFallbackUrl(apiBase, eventId) {
  return `${apiBase}/events/${encodeURIComponent(eventId)}/check_ins?include=person,locations,checked_in_at&per_page=100&order=-created_at`;
}

function shouldFetchEventWideFallback(directCheckInCount) {
  return !directCheckInCount || directCheckInCount <= 0;
}

/**
 * Follow PCO links.next until exhausted. getPage(url) must resolve to the JSON:API body.
 */
async function fetchPaginatedCheckIns(startUrl, getPage) {
  let nextPage = startUrl;
  const data = [];
  const included = [];

  while (nextPage) {
    const body = await getPage(nextPage);
    for (const item of body?.data || []) {
      if (!data.some((existing) => existing.id === item.id)) {
        data.push(item);
      }
    }
    for (const item of body?.included || []) {
      if (!included.some((existing) => existing.id === item.id && existing.type === item.type)) {
        included.push(item);
      }
    }
    nextPage = body?.links?.next || null;
  }

  return { data, included };
}

module.exports = {
  buildEventScopedSecurityCodeUrls,
  buildEventCheckInsFallbackUrl,
  shouldFetchEventWideFallback,
  fetchPaginatedCheckIns
};
