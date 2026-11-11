// CareerBridge API — серверийг асаах цэг (npm start)
const { createApp } = require('./app');
const path = require('path');
const { createDb } = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const db = createDb();
const server = createApp({ db, staticDir: process.env.STATIC_DIR || path.join(__dirname, '..', 'web', 'dist') }).listen(PORT, () => {
  console.log(`CareerBridge API http://localhost:${PORT} дээр ажиллаж байна`);
  console.log(db ? 'PostgreSQL: DATABASE_URL тохируулсан' : 'PostgreSQL: DATABASE_URL байхгүй (DB-гүй горим)');
});

// Docker/Render контейнерийг зогсооход (SIGTERM) идэвхтэй хүсэлтүүдийг дуусгаад хаана
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} хүлээн авлаа, сервер зогсож байна…`);
    // process.exit() биш: холболтууд хаагдсаны дараа процесс өөрөө хэвийн дуусна
    server.close(async () => {
      if (db) await db.close();
      process.exitCode = 0;
    });
  });
}
