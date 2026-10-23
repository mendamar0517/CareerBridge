// CareerBridge API — серверийг асаах цэг (npm start)
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const server = createApp().listen(PORT, () => {
  console.log(`CareerBridge API http://localhost:${PORT} дээр ажиллаж байна`);
});

// Docker/Render контейнерийг зогсооход (SIGTERM) идэвхтэй хүсэлтүүдийг дуусгаад хаана
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} хүлээн авлаа, сервер зогсож байна…`);
    server.close(() => process.exit(0));
  });
}
