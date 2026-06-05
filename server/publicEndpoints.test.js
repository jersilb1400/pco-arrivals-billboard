const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const test = require('node:test');

const PORT = 3101;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProcess;

async function waitForServer() {
  const deadline = Date.now() + 10000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth-status`);
      if (response.status < 500) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw lastError || new Error('Server did not start');
}

test.before(async () => {
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(PORT),
      API_SECRET: 'test-secret',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/pco-arrivals-test',
      PCO_ACCESS_TOKEN: 'test-token',
      PCO_ACCESS_SECRET: 'test-secret',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', chunk => process.stdout.write(chunk));
  serverProcess.stderr.on('data', chunk => process.stderr.write(chunk));

  await waitForServer();
});

test.after(() => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});

test('public pickup display endpoints do not require admin API credentials', async () => {
  const globalBillboardResponse = await fetch(`${BASE_URL}/api/global-billboard`);
  assert.equal(globalBillboardResponse.status, 200);

  const activeNotificationsResponse = await fetch(`${BASE_URL}/api/active-notifications`);
  assert.equal(activeNotificationsResponse.status, 200);

  const billboardUpdatesResponse = await fetch(`${BASE_URL}/api/billboard-updates`);
  assert.equal(billboardUpdatesResponse.status, 200);

  const locationStatusResponse = await fetch(`${BASE_URL}/api/location-status`);
  assert.equal(locationStatusResponse.status, 400);

  const securityCodeEntryResponse = await fetch(`${BASE_URL}/api/security-code-entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(securityCodeEntryResponse.status, 400);
});

test('admin mutation endpoints still require API credentials', async () => {
  const response = await fetch(`${BASE_URL}/api/set-global-billboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(response.status, 401);
});
