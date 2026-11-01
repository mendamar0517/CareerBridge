// CareerBridge API — серверийг асаах цэг (npm start)
const { createApp } = require('./app');
const { createDb } = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const db = createDb();
const server = createApp({ db }).listen(PORT, () => {
  console.log(`CareerBridge API http://localhost:${PORT} дээр ажиллаж байна`);
  console.log(db ? 'PostgreSQL: DATABASE_URL тохируулсан' : 'PostgreSQL: DATABASE_URL байхгүй (DB-гүй горим)');
});

// Docker/Render контейнерийг зогсооход (SIGTERM) идэвхтэй хүсэлтүүдийг дуусгаад хаана
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} хүлээн авлаа, сервер зогсож байна…`);
    server.close(async () => {
      if (db) await db.close();
      process.exit(0);
    });
  });
}
