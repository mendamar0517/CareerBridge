// Хиймэл ачаалал үүсгэх (Лаб 13). Нэмэлт сан шаардахгүй (Node 18+ fetch).
//   node scripts/load-test.js                      # 10 req/s, 60 секунд
//   node scripts/load-test.js --rps 20 --duration 120 --url http://localhost:3000
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []));
const BASE = args.url || 'http://localhost:3000';
const RPS = Number(args.rps || 10);
const DURATION = Number(args.duration || 60);

// Бодит хэрэглээг дуурайсан холимог урсгал: 200, 400, 404 хариу
const SCENARIOS = [
  { weight: 6, method: 'GET', path: '/health' },
  { weight: 2, method: 'POST', path: '/api/v1/registrations/validate',
    body: { fullName: 'Бат', email: 'bat@example.com', password: 'secret123' } },
  { weight: 1, method: 'POST', path: '/api/v1/registrations/validate', body: { fullName: '', email: 'x', password: '1' } },
  { weight: 1, method: 'GET', path: '/jobs/unknown' },
];
const bag = SCENARIOS.flatMap((s) => Array(s.weight).fill(s));

const statuses = {};
const latencies = [];
let errors = 0;

async function hit() {
  const s = bag[Math.floor(Math.random() * bag.length)]; // eslint-disable-line sonarjs/pseudo-random -- ачааллын хуваарилалт, аюулгүй байдалд хамаагүй
  const start = performance.now();
  try {
    const res = await fetch(BASE + s.path, {
      method: s.method,
      headers: s.body ? { 'Content-Type': 'application/json' } : undefined,
      body: s.body ? JSON.stringify(s.body) : undefined,
    });
    await res.arrayBuffer();
    statuses[res.status] = (statuses[res.status] || 0) + 1;
    latencies.push(performance.now() - start);
  } catch {
    errors += 1;
  }
}

const pct = (arr, p) => arr.length ? [...arr].sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0;

console.log(`Ачаалал: ${BASE}, ${RPS} req/s, ${DURATION} с`);
const tick = () => { for (let i = 0; i < RPS; i += 1) hit(); };
tick(); // эхний багцыг шууд илгээнэ
const timer = setInterval(tick, 1000);
const progress = setInterval(() => process.stdout.write('.'), 5000);
setTimeout(async () => {
  clearInterval(timer);
  clearInterval(progress);
  await new Promise((r) => setTimeout(r, 1000));
  const total = latencies.length;
  console.log(`\nНийт: ${total} хүсэлт, холболтын алдаа: ${errors}`);
  console.log('Status:', JSON.stringify(statuses));
  console.log(`Хугацаа: p50 ${pct(latencies, 0.5).toFixed(1)} ms, p95 ${pct(latencies, 0.95).toFixed(1)} ms`);
  process.exitCode = errors > 0 ? 1 : 0;
}, DURATION * 1000);
