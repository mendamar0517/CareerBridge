// US-01 – Ажил горилогчийн бүртгэл
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function isValidPassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function validateRegistration({ fullName, email, password } = {}) {
  const errors = [];
  if (!fullName || fullName.trim().length === 0) errors.push('Нэр хоосон байна');
  if (!isValidEmail(email)) errors.push('Имэйл буруу байна');
  if (!isValidPassword(password)) errors.push('Нууц үг шаардлага хангахгүй байна');
  return { valid: errors.length === 0, errors };
}

module.exports = { isValidEmail, isValidPassword, validateRegistration, MIN_PASSWORD_LENGTH };
