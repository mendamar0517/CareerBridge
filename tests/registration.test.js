const { isValidEmail, isValidPassword, validateRegistration } = require('../src/registration');

describe('US-01 – Ажил горилогчийн бүртгэл', () => {
  test('зөв имэйлийг хүлээн авна', () => {
    expect(isValidEmail('bat@example.com')).toBe(true);
  });

  test('@ тэмдэггүй имэйлийг татгалзана', () => {
    expect(isValidEmail('bat.example.com')).toBe(false);
  });

  test('8-аас богино нууц үгийг татгалзана', () => {
    expect(isValidPassword('abc123')).toBe(false);
  });

  test('бүх талбар зөв бол бүртгэл хүчинтэй', () => {
    const result = validateRegistration({ fullName: 'Бат', email: 'bat@example.com', password: 'secret123' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
