import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Enterprise k6 High-Concurrency Stress & Chaos Load Test
 * Simulates peak match-transition traffic spike (up to 5,000 Virtual Users)
 */
export const options = {
  stages: [
    { duration: '10s', target: 50 },    // Warm-up ramp
    { duration: '30s', target: 500 },   // Normal peak live betting load
    { duration: '20s', target: 2000 },  // High-traffic match over transition
    { duration: '20s', target: 5000 },  // Extreme chaos spike (IPL / World Cup final ball)
    { duration: '15s', target: 500 },   // Recovery ramp down
    { duration: '10s', target: 0 },     // Wind down
  ],
  thresholds: {
    // 95% of requests must respond in under 150ms
    http_req_duration: ['p(95)<150', 'p(99)<300'],
    // Less than 0.1% failed HTTP requests
    http_req_failed: ['rate<0.001'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-Enterprise-LoadTest-VU/' + __VU,
    },
  };

  // 1. Health Probe Probe (Liveness & Database Latency)
  const healthRes = http.get(`${BASE_URL}/api/health`, params);
  check(healthRes, {
    'health probe status is 200': (r) => r.status === 200,
    'database is healthy': (r) => {
      try {
        return JSON.parse(r.body).services.database.status === 'HEALTHY';
      } catch {
        return false;
      }
    },
  });

  // 2. Fetch Live Sports Scoreboard & Odds Feed
  const liveRes = http.get(`${BASE_URL}/api/sports/live?sport=all`, params);
  check(liveRes, {
    'live scoreboard status is 200': (r) => r.status === 200,
    'matches loaded successfully': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && Array.isArray(body.matches);
      } catch {
        return false;
      }
    },
  });

  // 3. Simulate High-Throughput Wager Placement
  const wagerPayload = JSON.stringify({
    email: `load_user_${__VU % 100}@aurabet.io`,
    matchTitle: 'India vs Pakistan (Final)',
    selection: 'India',
    odds: 1.85,
    stake: 100,
    side: 'yes',
  });

  const wagerRes = http.post(`${BASE_URL}/api/sports/bet`, wagerPayload, params);
  check(wagerRes, {
    'wager response is valid HTTP code': (r) => [200, 400, 401, 429].includes(r.status),
  });

  // Realistic user pacing between 50ms - 200ms
  sleep(0.1);
}
