const { isEligibleGraduate } = require('../src/graduation');

describe('US-02 – Төгсөлтийн мэдээлэл (2 жилийн шалгуур)', () => {
  const now = new Date('2026-10-20');

  test('1 жилийн өмнө төгссөн бол тэнцэнэ', () => {
    expect(isEligibleGraduate('2025-06-15', now)).toBe(true);
  });

  test('3 жилийн өмнө төгссөн бол тэнцэхгүй', () => {
    expect(isEligibleGraduate('2023-06-15', now)).toBe(false);
  });

  test('ирээдүйн огноог татгалзана', () => {
    expect(isEligibleGraduate('2027-06-15', now)).toBe(false);
  });
});
