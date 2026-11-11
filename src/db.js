// PostgreSQL холболт (Лаб 08: апп + өгөгдлийн сан Docker Compose-оор хамт ажиллах)
// DATABASE_URL тохируулаагүй үед DB-гүйгээр ажиллана (жишээ нь CI-ийн smoke test).
const { Pool } = require('pg');

// NUMERIC (score, pass_score) болон BIGINT (id, count)-ийг JS тоо болгон уншина.
// Энэ төслийн утгууд Number.MAX_SAFE_INTEGER-ээс хамаагүй бага.
const { types } = require('pg');
types.setTypeParser(20, (v) => Number(v)); // int8
types.setTypeParser(1700, (v) => Number(v)); // numeric
types.setTypeParser(1082, (v) => v); // date → 'YYYY-MM-DD' мөр (цагийн бүсийн шилжилтгүй)

function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) return null;
  const pool = new Pool({ connectionString, max: 10, connectionTimeoutMillis: 3000 });
  // Холболт тасарсан idle client процессыг унагахгүй
  pool.on('error', (err) => console.error('PostgreSQL pool алдаа:', err.message));

  const query = (text, params) => pool.query(text, params);

  return {
    query,
    // Нэг transaction дотор хэд хэдэн query ажиллуулна. Алдаа гарвал ROLLBACK.
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn((text, params) => client.query(text, params));
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    // DB хариу өгч байгаа эсэх, схемийн хүснэгт/view-ийн тоо
    async check() {
      const { rows } = await query(`
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
