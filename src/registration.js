// US-01 – Ажил горилогчийн бүртгэл
// Лаб 11: ReDoS засвар. Домэйны эхний хэсэг цэггүй тул тааруулах хуваалт ганцхан
// → backtracking шугаман. Давхар quantifier ашиглаагүй (security/detect-unsafe-regex).
const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254; // RFC 5321-ийн хязгаар; урт оролтыг regex-ээс өмнө татгалзана
const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const value = email.trim();
  return value.length <= MAX_EMAIL_LENGTH && !value.includes('..') && EMAIL_REGEX.test(value);
}

function isValidPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

function validateRegistration({ fullName, email, password } = {}) {
  const errors = [];
  if (!fullName || fullName.trim().length === 0) errors.push('Нэр хоосон байна');
  if (!isValidEmail(email)) errors.push('Имэйл буруу байна');
  if (!isValidPassword(password)) errors.push('Нууц үг шаардлага хангахгүй байна');
  return { valid: errors.length === 0, errors };
}

module.exports = { isValidEmail, isValidPassword, validateRegistration, MIN_PASSWORD_LENGTH, MAX_EMAIL_LENGTH };
