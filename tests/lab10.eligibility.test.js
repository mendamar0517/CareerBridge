// Лаборатори 10 — US-02 «2 жилийн шалгуур»-ын тестийн иж бүрдэл
// Бүтэц: Arrange (өгөгдөл бэлдэх) → Act (функц дуудах) → Assert (үр дүн шалгах)
const { isEligibleGraduate } = require('../src/graduation');
const { getSeekerEligibility } = require('../src/eligibility');

// Бүх тестэд ижил «өнөөдөр»: үр дүн тест ажилласан өдрөөс хамаарахгүй
const NOW = new Date('2026-10-20');

describe('isEligibleGraduate() — хэвийн тохиолдол', () => {
  test('1 жилийн өмнө төгссөн бол тэнцэнэ', () => {
    // Arrange
    const graduationDate = '2025-10-20';
    // Act
    const result = isEligibleGraduate(graduationDate, NOW);
    // Assert
    expect(result).toBe(true);
  });

  test('3 жилийн өмнө төгссөн бол тэнцэхгүй', () => {
    // Arrange
    const graduationDate = '2023-10-20';
    // Act
    const result = isEligibleGraduate(graduationDate, NOW);
    // Assert
    expect(result).toBe(false);
  });
});

describe('isEligibleGraduate() — хилийн (edge case) тохиолдол', () => {
  // Лаб 11: SonarJS (parameterized-tests) — ижил бүтэцтэй 4 тестийг нэг хүснэгт болгов
  test.each([
    ['яг 2 жилийн өмнө (хил багтана)', '2024-10-20', true],
    ['2 жил 1 өдрийн өмнө', '2024-10-19', false],
    ['өнөөдөр', '2026-10-20', true],
    ['маргааш (ирээдүй)', '2026-10-21', false],
  ])('%s төгссөн → %s', (_label, graduationDate, expected) => {
    // Arrange: graduationDate, expected (хүснэгтээс)
    // Act
    const result = isEligibleGraduate(graduationDate, NOW);
    // Assert
    expect(result).toBe(expected);
  });

  test.each([
    ['хоосон мөр', ''],
    ['undefined', undefined],
    ['огноо биш текст', 'өчигдөр'],
    ['боломжгүй огноо', '2026-13-45'],
  ])('буруу утга (%s) бол тэнцэхгүй', (_label, graduationDate) => {
    // Act
    const result = isEligibleGraduate(graduationDate, NOW);
    // Assert
    expect(result).toBe(false);
  });
});

describe('getSeekerEligibility() — repository-г mock ашиглан тусгаарлах', () => {
  test('repository-оос ирсэн огноогоор шалгаж, нэг удаа дуудна', async () => {
    // Arrange: өгөгдлийн сангийн оронд jest.fn() mock
    const repo = { findLatestGraduationDate: jest.fn().mockResolvedValue('2025-06-15') };
    // Act
    const result = await getSeekerEligibility(repo, 42, NOW);
    // Assert: үр дүн ба mock-ийн дуудлага
    expect(result).toEqual({ seekerId: 42, eligible: true, reason: 'WITHIN_2_YEARS' });
    expect(repo.findLatestGraduationDate).toHaveBeenCalledTimes(1);
    expect(repo.findLatestGraduationDate).toHaveBeenCalledWith(42);
  });

  test('2 жилээс өмнө төгссөн бол OVER_2_YEARS', async () => {
    // Arrange
    const repo = { findLatestGraduationDate: jest.fn().mockResolvedValue('2023-01-10') };
    // Act
    const result = await getSeekerEligibility(repo, 7, NOW);
    // Assert
    expect(result).toEqual({ seekerId: 7, eligible: false, reason: 'OVER_2_YEARS' });
  });

  test('төгсөлтийн мэдээлэлгүй бол NO_GRADUATION', async () => {
    // Arrange
    const repo = { findLatestGraduationDate: jest.fn().mockResolvedValue(null) };
    // Act
    const result = await getSeekerEligibility(repo, 7, NOW);
    // Assert
    expect(result).toEqual({ seekerId: 7, eligible: false, reason: 'NO_GRADUATION' });
  });

  test('буруу seekerId бол өгөгдлийн санд хандахгүй', async () => {
    // Arrange
    const repo = { findLatestGraduationDate: jest.fn() };
    // Act + Assert
    await expect(getSeekerEligibility(repo, -1, NOW)).rejects.toThrow('seekerId буруу байна');
    expect(repo.findLatestGraduationDate).not.toHaveBeenCalled();
  });

  test('өгөгдлийн сангийн алдааг дамжуулна', async () => {
    // Arrange: DB холболт тасарсныг mock-оор дуурайх
    const repo = { findLatestGraduationDate: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) };
    // Act + Assert
    await expect(getSeekerEligibility(repo, 42, NOW)).rejects.toThrow('ECONNREFUSED');
  });
});
