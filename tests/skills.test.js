const { addSkill } = require('../src/skills');

describe('US-04 – Ур чадвар бүртгэх', () => {
  test('шинэ ур чадвар нэмнэ', () => {
    expect(addSkill(['JavaScript'], 'Python')).toEqual(['JavaScript', 'Python']);
  });

  test('давхардсан ур чадварыг нэмэхгүй', () => {
    expect(addSkill(['Python'], 'python')).toEqual(['Python']);
  });

  test('хоосон нэрийг татгалзана', () => {
    expect(() => addSkill([], '  ')).toThrow();
  });
});
