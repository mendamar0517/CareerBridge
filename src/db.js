// PostgreSQL холболт (Лаб 08: апп + өгөгдлийн сан Docker Compose-оор хамт ажиллах)
// DATABASE_URL тохируулаагүй үед DB-гүйгээр ажиллана (жишээ нь CI-ийн smoke test).
const { Pool } = require('pg');

function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) return null;
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 3000 });
  // Холболт тасарсан idle client процессыг унагахгүй
  pool.on('error', (err) => console.error('PostgreSQL pool алдаа:', err.message));

  return {
    // DB хариу өгч байгаа эсэх, схемийн хүснэгт/view-ийн тоо
    async check() {
      const { rows } = await pool.query(`
        SELECT current_setting('server_version') AS version,
               (SELECT count(*)::int FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS tables,
               (SELECT count(*)::int FROM information_schema.views
                 WHERE table_schema = 'public') AS views`);
      return rows[0];
    },
    close: () => pool.end(),
  };
}

module.exports = { createDb };
