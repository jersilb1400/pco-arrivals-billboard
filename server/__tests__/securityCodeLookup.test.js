const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildEventScopedSecurityCodeUrls,
  buildEventCheckInsFallbackUrl,
  shouldFetchEventWideFallback,
  fetchPaginatedCheckIns
} = require('../utils/securityCodeLookup');

test('buildEventScopedSecurityCodeUrls uses event association and paginates newest-first', () => {
  const urls = buildEventScopedSecurityCodeUrls(
    'https://api.planningcenteronline.com/check-ins/v2',
    'event-9',
    'Ab12'
  );

  assert.equal(urls.length, 3);
  for (const url of urls) {
    assert.match(url, /\/events\/event-9\/check_ins\?/);
    assert.match(url, /per_page=100/);
    assert.match(url, /order=-created_at/);
    assert.match(url, /where\[security_code\]=/);
    assert.doesNotMatch(url, /where\[event_id\]/);
    assert.doesNotMatch(url, /check-ins\/v2\/check_ins\?/);
  }
  assert.ok(urls.some((url) => url.includes('where[security_code]=Ab12')));
  assert.ok(urls.some((url) => url.includes('where[security_code]=ab12')));
  assert.ok(urls.some((url) => url.includes('where[security_code]=AB12')));
});

test('buildEventCheckInsFallbackUrl stays event-scoped and paginated', () => {
  const url = buildEventCheckInsFallbackUrl(
    'https://api.planningcenteronline.com/check-ins/v2',
    'event-9'
  );
  assert.equal(
    url,
    'https://api.planningcenteronline.com/check-ins/v2/events/event-9/check_ins?include=person,locations,checked_in_at&per_page=100&order=-created_at'
  );
});

test('shouldFetchEventWideFallback only when direct queries returned nothing', () => {
  assert.equal(shouldFetchEventWideFallback(0), true);
  assert.equal(shouldFetchEventWideFallback(1), false);
  assert.equal(shouldFetchEventWideFallback(25), false);
});

test('fetchPaginatedCheckIns follows links.next and dedupes', async () => {
  const pages = {
    'page-1': {
      data: [{ id: '1' }, { id: '2' }],
      included: [{ type: 'Person', id: 'p1' }],
      links: { next: 'page-2' }
    },
    'page-2': {
      data: [{ id: '2' }, { id: '3' }],
      included: [{ type: 'Person', id: 'p1' }, { type: 'Location', id: 'l1' }],
      links: {}
    }
  };

  const result = await fetchPaginatedCheckIns('page-1', async (url) => pages[url]);
  assert.deepEqual(result.data.map((item) => item.id), ['1', '2', '3']);
  assert.deepEqual(
    result.included.map((item) => `${item.type}:${item.id}`),
    ['Person:p1', 'Location:l1']
  );
});

test('security-code-entry route no longer uses org-wide where[event_id] lookup', () => {
  const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(serverSrc, /require\('\.\/utils\/securityCodeLookup'\)/);

  const entryStart = serverSrc.indexOf("app.post('/api/security-code-entry'");
  assert.ok(entryStart >= 0);
  const entryEnd = serverSrc.indexOf("app.get('/api/active-notifications'", entryStart);
  const entrySrc = serverSrc.slice(entryStart, entryEnd);

  assert.match(entrySrc, /buildEventScopedSecurityCodeUrls/);
  assert.match(entrySrc, /fetchPaginatedCheckIns/);
  assert.match(entrySrc, /shouldFetchEventWideFallback/);
  assert.doesNotMatch(entrySrc, /where\[event_id\]=\$\{eventId\}/);
  assert.doesNotMatch(entrySrc, /\$\{PCO_API_BASE\}\/check_ins\?where\[security_code\]/);
});
