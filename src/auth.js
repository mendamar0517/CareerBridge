'use strict';

/**
 * CareerBridge — нэвтрэлтийн (login) логик.
 * Гадаад сан импортлохгүй: userRepo, hasher-ийг дуудагч тал дамжуулна.
 * Buffer нь Node.js-ийн глобал объект тул require хэрэггүй.
 */

const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_BYTES = 1;
const MAX_PASSWORD_BYTES = 72; // bcrypt 72 byte-аас хойшхийг хасдаг тул татгалзана

/**
 * Хэрэглэгч олдоогүй үед hasher.compare-д өгөх dummy hash.
 * АНХААР: Энэ нь зөвхөн хэлбэрийн хувьд зөв placeholder.
 * Production-д жинхэнэ bcrypt hash-аар соль. Түүний cost factor (энд 12)
 * бодит хэрэглэгчдийн hash-тай ИЖИЛ байх ёстой. Эс бөгөөс хугацааны зөрүү үүснэ.
 *   node -e "require('bcrypt').hash(require('crypto').randomBytes(32).toString('hex'), 12).then(console.log)"
 */
const DUMMY_PASSWORD_HASH =
  '$2b$12$CareerBridgeDummySaltxTimingAttackMitigationPlacehold';

const ERRORS = Object.freeze({
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
});

function fail(code) {
  return { ok: false, error: code };
}

/**
 * Итгэж болохгүй оролтыг шалгаж, хэвшүүлнэ.
 * @returns {{ email: string, password: string } | null} буруу бол null
 */
function normalizeCredentials(credentials) {
  if (credentials === null || typeof credentials !== 'object') {
    return null;
  }

  const { email, password } = credentials;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length === 0 || normalizedEmail.length > MAX_EMAIL_LENGTH) {
    return null;
  }

  // Нууц үгийг trim хийхгүй: хоосон зай нь нууц үгийн нэг хэсэг байж болно.
  const passwordBytes = Buffer.byteLength(password, 'utf8');
  if (passwordBytes < MIN_PASSWORD_BYTES || passwordBytes > MAX_PASSWORD_BYTES) {
    return null;
  }

  return { email: normalizedEmail, password };
}

/**
 * @param {{ email: unknown, password: unknown }} credentials HTTP body (итгэхгүй)
 * @param {{ findByEmail(email: string): Promise<object|null> }} userRepo
 * @param {{ compare(plain: string, hash: string): Promise<boolean> }} hasher
 * @returns {Promise<{ ok: true, user: { id, email, role } } | { ok: false, error: string }>}
 */
async function authenticate(credentials, userRepo, hasher) {
  const input = normalizeCredentials(credentials);
  if (input === null) {
    return fail(ERRORS.INVALID_INPUT);
  }

  // Repository/hasher-ийн алдааг зориуд барихгүй: дээш дамжина (шаардлага 6).
  const user = await userRepo.findByEmail(input.email);

  // Хэрэглэгч олдсон эсэхээс үл хамааран compare-ийг яг нэг удаа дуудна (шаардлага 3).
  const hashToCheck = user ? user.passwordHash : DUMMY_PASSWORD_HASH;
  const passwordMatches = (await hasher.compare(input.password, hashToCheck)) === true;

  // `!user` шалгалт нь dummy hash санамсаргүй таарсан ч нэвтрүүлэхгүй.
  if (!user || !passwordMatches) {
    return fail(ERRORS.INVALID_CREDENTIALS);
  }

  // Нууц үг зөв гэдэг нь батлагдсаны дараа л идэвхгүй төлөвийг мэдэгдэнэ (шаардлага 4).
  if (user.isActive === false) {
    return fail(ERRORS.ACCOUNT_DISABLED);
  }

  // Зөвшөөрөгдсөн талбаруудыг тодорхой жагсааж буцаана. passwordHash буцахгүй (шаардлага 5).
  return {
    ok: true,
    user: { id: user.id, email: user.email, role: user.role },
  };
}

module.exports = {
  authenticate,
  ERRORS,
  DUMMY_PASSWORD_HASH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_BYTES,
};
