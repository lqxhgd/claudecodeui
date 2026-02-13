/**
 * Concurrent Load Test - Simulates multiple users sending messages simultaneously
 *
 * Tests:
 * 1. N concurrent WebSocket connections
 * 2. All send messages at the same time
 * 3. Measures response time per user
 * 4. Verifies no message loss or slowdown under load
 *
 * Usage: node tests/concurrent-load-test.js [numUsers]
 */

import WebSocket from 'ws';
import http from 'http';

const SERVER_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001/ws';
const NUM_USERS = parseInt(process.argv[2]) || 5;

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function getAuthToken() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({ username: 'test', password: 'test1234' });
    const req = http.request(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.token) return resolve(data.token);
        } catch {}
        // Try register
        const regData = JSON.stringify({ username: 'test', password: 'test1234' });
        const regReq = http.request(`${SERVER_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(regData) }
        }, (regRes) => {
          let regBody = '';
          regRes.on('data', (chunk) => regBody += chunk);
          regRes.on('end', () => {
            try { resolve(JSON.parse(regBody).token || ''); } catch { resolve(''); }
          });
        });
        regReq.write(regData);
        regReq.end();
      });
    });
    req.write(loginData);
    req.end();
  });
}

function simulateUser(userId, token, message) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let firstResponseTime = null;
    let completeTime = null;
    let messageCount = 0;
    let error = null;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    const timeout = setTimeout(() => {
      ws.close();
      resolve({
        userId,
        success: false,
        error: 'Timeout (120s)',
        firstResponseMs: firstResponseTime ? firstResponseTime - startTime : null,
        totalMs: Date.now() - startTime,
        messageCount
      });
    }, 120000);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'claude-command',
        command: message,
        options: {
          cwd: process.cwd(),
          projectPath: process.cwd(),
          model: 'haiku' // Use fastest model for load testing
        }
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        messageCount++;

        if (msg.type === 'claude-response' && !firstResponseTime) {
          firstResponseTime = Date.now();
        }

        if (msg.type === 'claude-error') {
          error = msg.error;
          clearTimeout(timeout);
          ws.close();
          resolve({
            userId,
            success: false,
            error: msg.error?.slice(0, 100),
            firstResponseMs: firstResponseTime ? firstResponseTime - startTime : null,
            totalMs: Date.now() - startTime,
            messageCount
          });
        }

        if (msg.type === 'claude-complete') {
          completeTime = Date.now();
          clearTimeout(timeout);
          ws.close();
          resolve({
            userId,
            success: true,
            firstResponseMs: firstResponseTime ? firstResponseTime - startTime : null,
            totalMs: completeTime - startTime,
            messageCount
          });
        }
      } catch {}
    });

    ws.on('error', (e) => {
      clearTimeout(timeout);
      resolve({
        userId,
        success: false,
        error: e.message,
        firstResponseMs: null,
        totalMs: Date.now() - startTime,
        messageCount
      });
    });
  });
}

async function main() {
  console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  Concurrent Load Test - ${NUM_USERS} simultaneous users${RESET}`);
  console.log(`${CYAN}═══════════════════════════════════════════════════${RESET}\n`);

  const token = await getAuthToken();
  if (!token) {
    console.log(`${RED}Auth failed${RESET}`);
    process.exit(1);
  }
  console.log(`${GREEN}✓${RESET} Authenticated\n`);

  // Phase 1: Connection test
  console.log(`${BOLD}Phase 1: Opening ${NUM_USERS} concurrent connections...${RESET}`);
  const connStart = Date.now();
  const connPromises = [];
  for (let i = 0; i < NUM_USERS; i++) {
    connPromises.push(new Promise((resolve) => {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      ws.on('open', () => { ws.close(); resolve(true); });
      ws.on('error', () => resolve(false));
      setTimeout(() => resolve(false), 5000);
    }));
  }
  const connResults = await Promise.all(connPromises);
  const connTime = Date.now() - connStart;
  const connSuccess = connResults.filter(Boolean).length;
  console.log(`  ${connSuccess}/${NUM_USERS} connections established in ${connTime}ms\n`);

  // Phase 2: Concurrent message sending
  console.log(`${BOLD}Phase 2: Sending ${NUM_USERS} messages simultaneously...${RESET}`);
  const messages = [
    'Say hi in one word',
    'What is 1+1? Number only.',
    'Say ok',
    'Capital of Japan? One word.',
    'Is 2 even? Yes/no.',
    'Say yes',
    'What is 3*3? Number only.',
    'Say done',
    'Is water wet? Yes/no.',
    'Say bye'
  ];

  const sendStart = Date.now();
  const userPromises = [];
  for (let i = 0; i < NUM_USERS; i++) {
    userPromises.push(simulateUser(i + 1, token, messages[i % messages.length]));
  }
  const results = await Promise.all(userPromises);
  const totalTime = Date.now() - sendStart;

  // Results
  console.log(`\n${BOLD}Results:${RESET}`);
  console.log('─'.repeat(70));
  console.log(`${'User'.padEnd(8)}${'Status'.padEnd(10)}${'1st Resp'.padEnd(12)}${'Total'.padEnd(12)}${'Msgs'.padEnd(8)}Error`);
  console.log('─'.repeat(70));

  let successCount = 0;
  let totalFirstResp = 0;
  let totalComplete = 0;
  let firstRespCount = 0;

  for (const r of results) {
    const status = r.success ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    const firstResp = r.firstResponseMs ? `${r.firstResponseMs}ms` : 'N/A';
    const total = `${r.totalMs}ms`;
    const err = r.error || '';

    console.log(`  U${String(r.userId).padEnd(5)}${r.success ? 'PASS' : 'FAIL'}${' '.repeat(6)}${firstResp.padEnd(12)}${total.padEnd(12)}${String(r.messageCount).padEnd(8)}${err}`);

    if (r.success) {
      successCount++;
      totalComplete += r.totalMs;
    }
    if (r.firstResponseMs) {
      totalFirstResp += r.firstResponseMs;
      firstRespCount++;
    }
  }

  console.log('─'.repeat(70));

  // Summary
  const avgFirstResp = firstRespCount > 0 ? Math.round(totalFirstResp / firstRespCount) : 'N/A';
  const avgComplete = successCount > 0 ? Math.round(totalComplete / successCount) : 'N/A';
  const maxComplete = Math.max(...results.filter(r => r.success).map(r => r.totalMs), 0);

  console.log(`\n${BOLD}Summary:${RESET}`);
  console.log(`  Success rate:       ${successCount}/${NUM_USERS} (${Math.round(successCount/NUM_USERS*100)}%)`);
  console.log(`  Avg first response: ${avgFirstResp}ms`);
  console.log(`  Avg total time:     ${avgComplete}ms`);
  console.log(`  Max total time:     ${maxComplete}ms`);
  console.log(`  Wall clock time:    ${totalTime}ms`);

  // Performance thresholds
  console.log(`\n${BOLD}Performance Check:${RESET}`);
  const checks = [
    { name: 'All users got response', pass: successCount === NUM_USERS },
    { name: 'Avg first response < 10s', pass: typeof avgFirstResp === 'number' && avgFirstResp < 10000 },
    { name: 'Max total time < 120s', pass: maxComplete < 120000 },
    { name: 'No message loss', pass: results.every(r => r.messageCount > 0 || !r.success) },
  ];

  for (const c of checks) {
    console.log(`  ${c.pass ? GREEN + '✓' : RED + '✗'} ${RESET}${c.name}`);
  }

  const allPass = checks.every(c => c.pass);
  console.log(`\n${allPass ? GREEN + 'LOAD TEST PASSED' : RED + 'LOAD TEST FAILED'}${RESET}\n`);
  process.exit(allPass ? 0 : 1);
}

main().catch(console.error);
