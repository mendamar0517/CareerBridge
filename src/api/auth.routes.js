// US-01 бүртгэл/нэвтрэлт, US-11 байгууллагын бүртгэл (ажил олгогч бүртгүүлэхэд хамт үүснэ)
const express = require('express');
const bcrypt = require('bcryptjs');
const { validateRegistration } = require('../registration');
const { authenticate, ERRORS } = require('../auth');
const { HttpError, badRequest, conflict } = require('../http');
const { requireAuth } = require('../tokens');

const LOGIN_STATUS = { [ERRORS.INVALID_INPUT]: 400, [ERRORS.INVALID_CREDENTIALS]: 401, [ERRORS.ACCOUNT_DISABLED]: 403 };
const LOGIN_MESSAGE = {
  [ERRORS.INVALID_INPUT]: 'Имэйл болон нууц үгээ оруулна уу',
  [ERRORS.INVALID_CREDENTIALS]: 'Имэйл эсвэл нууц үг буруу байна',
  [ERRORS.ACCOUNT_DISABLED]: 'Таны бүртгэл идэвхгүй болсон байна',
};

function authRouter({ db, tokens, bcryptCost }) {
  const r = express.Router();

  async function userProfile(user) {
    if (user.role === 'SEEKER') {
      const { rows } = await db.query('SELECT full_name AS "fullName" FROM seeker_profiles WHERE user_id = $1', [user.id]);
      return { ...user, name: rows[0]?.fullName ?? user.email };
    }
    const { rows } = await db.query('SELECT id, name FROM companies WHERE owner_user_id = $1', [user.id]);
    return { ...user, name: rows[0]?.name ?? user.email, companyId: rows[0]?.id ?? null };
  }

  r.post('/register', async (req, res) => {
    const body = req.body ?? {};
    const role = body.role === 'EMPLOYER' ? 'EMPLOYER' : 'SEEKER';
    const displayName = role === 'EMPLOYER' ? body.companyName : body.fullName;
    // US-01 validation (src/registration.js)-ийг дахин ашиглана
    const check = validateRegistration({ fullName: typeof displayName === 'string' ? displayName : '', email: body.email, password: body.password });
    if (!check.valid) {
      const errors = check.errors.map((m) => (role === 'EMPLOYER' && m === 'Нэр хоосон байна' ? 'Байгууллагын нэр хоосон байна' : m));
      throw badRequest(errors[0], { errors: errors.map((message) => ({ message })) });
    }
    if (displayName.trim().length > 150) throw badRequest('Нэр 150 тэмдэгтээс ихгүй байна');

    const email = body.email.trim().toLowerCase();
    const hash = await bcrypt.hash(body.password, bcryptCost);
    try {
      const user = await db.tx(async (q) => {
        const { rows } = await q('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role', [email, hash, role]);
        const u = rows[0];
        if (role === 'SEEKER') {
          await q('INSERT INTO seeker_profiles (user_id, full_name) VALUES ($1, $2)', [u.id, displayName.trim()]);
        } else {
          await q('INSERT INTO companies (owner_user_id, name) VALUES ($1, $2)', [u.id, displayName.trim()]);
        }
        return u;
      });
      const profile = await userProfile(user);
      res.status(201).json({ token: tokens.sign(user), user: profile });
    } catch (err) {
      if (err.code === '23505') throw conflict('Энэ имэйлээр бүртгэл үүссэн байна');
      throw err;
    }
  });

  r.post('/login', async (req, res) => {
    const userRepo = {
      async findByEmail(email) {
        const { rows } = await db.query(
          'SELECT id, email, role, password_hash AS "passwordHash", is_active AS "isActive" FROM users WHERE lower(email) = $1', [email]);
        return rows[0] ?? null;
      },
    };
    // US-01 нэвтрэлтийн логик (src/auth.js, Лаб 12)
    const result = await authenticate(req.body, userRepo, bcrypt);
    if (!result.ok) throw new HttpError(LOGIN_STATUS[result.error], LOGIN_MESSAGE[result.error], { code: result.error });
    res.json({ token: tokens.sign(result.user), user: await userProfile(result.user) });
  });

  r.get('/me', requireAuth, async (req, res) => {
    res.json({ user: await userProfile({ id: req.user.id, email: req.user.email, role: req.user.role }) });
  });

  return r;
}

module.exports = { authRouter };
