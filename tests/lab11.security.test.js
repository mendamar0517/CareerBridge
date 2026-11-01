// Лаборатори 11 — статик шинжилгээгээр илэрсэн ReDoS эмзэг байдлын засварыг баталгаажуулах
const { isValidEmail, MAX_EMAIL_LENGTH } = require('../src/registration');

describe('isValidEmail() — ReDoS засвар (sonarjs/super-linear-regex)', () => {
  test.each([
    ['энгийн', 'bat@example.com', true],
    ['олон түвшний домэйн', 'bat@mail.example.co.uk', true],
    ['домэйнгүй', 'bat@', false],
    ['TLD-гүй', 'bat@example', false],
    ['дараалсан цэг', 'bat@example..com', false],
    ['хоосон зайтай', 'bat bold@example.com', false],
  ])('%s: %s → %s', (_label, email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });

  test(`${MAX_EMAIL_LENGTH} тэмдэгтээс урт имэйлийг татгалзана`, () => {
    // Arrange
    const local = 'a'.repeat(MAX_EMAIL_LENGTH);
    // Act + Assert
    expect(isValidEmail(`${local}@example.com`)).toBe(false);
  });

  test('халдлагын оролтыг (80 KB) 50 ms-ээс хурдан шалгана', () => {
    // Arrange: хуучин regex дээр ≈5 секунд CPU түгждэг байсан оролт
    const attack = 'a@' + 'a.'.repeat(40000) + ' ';
    // Act
    const start = process.hrtime.bigint();
    const result = isValidEmail(attack);
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    // Assert
    expect(result).toBe(false);
    expect(ms).toBeLessThan(50);
  });
});
