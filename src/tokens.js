// US-01: JWT access token ба үүргээр (SEEKER / EMPLOYER) эрх хязгаарлах middleware
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { HttpError } = require('./http');

const TOKEN_TTL = '7d';

function createTokenService(secret = process.env.JWT_SECRET) {
  let key = secret;
  if (!key) {
    // Нууц түлхүүр өгөөгүй бол санамсаргүй үүсгэнэ: сервер дахин асахад token хүчингүй болно.
    key = crypto.randomBytes(32).toString('hex');
    if (process.env.NODE_ENV !== 'test') {
      console.warn('JWT_SECRET тохируулаагүй — түр түлхүүр ашиглаж байна (production-д заавал тохируул)');
    }
  }

  const sign = (user) => jwt.sign({ role: user.role, email: user.email }, key, {
    subject: String(user.id),
    expiresIn: TOKEN_TTL,
    algorithm: 'HS256',
  });

  // Authorization: Bearer <token> байвал req.user-д онооно. Буруу token бол 401.
  function authenticate(req, _res, next) {
    const header = req.get('authorization');
    if (!header) return next();
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Нэвтрэх шаардлагатай'));
    try {
      const payload = jwt.verify(token, key, { algorithms: ['HS256'] });
      req.user = { id: Number(payload.sub), role: payload.role, email: payload.email };
      return next();
    } catch {
      return next(new HttpError(401, 'Нэвтрэлтийн хугацаа дууссан. Дахин нэвтэрнэ үү'));
    }
  }

  return { sign, authenticate };
}

function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Нэвтрэх шаардлагатай'));
  return next();
}

const requireRole = (role) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Нэвтрэх шаардлагатай'));
  if (req.user.role !== role) return next(new HttpError(403, 'Энэ хэсэг зөвхөн ' + (role === 'SEEKER' ? 'ажил горилогчид' : 'ажил олгогчид') + ' зориулагдсан'));
  return next();
};

module.exports = { createTokenService, requireAuth, requireRole };
