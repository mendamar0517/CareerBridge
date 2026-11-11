'use strict';

const {
  authenticate,
  ERRORS,
  DUMMY_PASSWORD_HASH,
} = require('../src/auth');

const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'Correct-Horse-9';
const STORED_HASH = '$2b$12$storedHashValueForTestsOnlystoredHashValueForTests12';
const EMAIL_DOMAIN = '@example.com'; // 12 тэмдэгт

function buildUser(overrides = {}) {
  return {
    id: 42,
    email: VALID_EMAIL,
    passwordHash: STORED_HASH,
    role: 'candidate',
    isActive: true,
    ...overrides,
  };
}

// user-д null-ийг тодорхой дамжуулж болно ("олдоогүй" тохиолдол).
function buildDeps({ user = buildUser(), passwordMatches = true } = {}) {
  return {
    userRepo: { findByEmail: jest.fn().mockResolvedValue(user) },
    hasher: { compare: jest.fn().mockResolvedValue(passwordMatches) },
  };
}

function emailOfLength(length) {
  return 'a'.repeat(length - EMAIL_DOMAIN.length) + EMAIL_DOMAIN;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('authenticate — алдааны кодын гэрээ', () => {
  test('алдааны кодууд API-ийн гэрээтэй яг таарна', () => {
    // Arrange
    const expected = {
      INVALID_INPUT: 'INVALID_INPUT',
      INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
      ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    };

    // Act
    const actual = { ...ERRORS };

    // Assert
    expect(actual).toEqual(expected);
  });
});

describe('authenticate — хэвийн тохиолдол', () => {
  test('зөв мэдээлэлтэй үед зөвхөн id, email, role буцаана', async () => {
    // Arrange
    const { userRepo, hasher } = buildDeps();

    // Act
    const result = await authenticate(
      { email: VALID_EMAIL, password: VALID_PASSWORD },
      userRepo,
      hasher,
    );

    // Assert
    expect(result).toEqual({
      ok: true,
      user: { id: 42, email: VALID_EMAIL, role: 'candidate' },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user).not.toHaveProperty('isActive');
  });

  test('email-ийг trim + lowercase хийж repository-д дамжуулна', async () => {
    // Arrange
    const { userRepo, hasher } = buildDeps();

    // Act
    await authenticate({ email: '  User@Example.COM \t', password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(userRepo.findByEmail).toHaveBeenCalledTimes(1);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(VALID_EMAIL);
  });

  test('нууц үгийг өөрчлөлгүй (trim хийлгүй), хадгалсан hash-тай харьцуулна', async () => {
    // Arrange
    const { userRepo, hasher } = buildDeps();
    const passwordWithSpaces = '  pass word  ';

    // Act
    await authenticate({ email: VALID_EMAIL, password: passwordWithSpaces }, userRepo, hasher);

    // Assert
    expect(hasher.compare).toHaveBeenCalledTimes(1);
    expect(hasher.compare).toHaveBeenCalledWith(passwordWithSpaces, STORED_HASH);
  });
});

describe('authenticate — оролтын шалгалт (INVALID_INPUT)', () => {
  test.each([
    ['credentials null', null],
    ['credentials undefined', undefined],
    ['credentials string', 'user@example.com'],
    ['credentials array', []],
    ['email байхгүй', { password: VALID_PASSWORD }],
    ['email number', { email: 123, password: VALID_PASSWORD }],
    ['email null', { email: null, password: VALID_PASSWORD }],
    ['email array', { email: [VALID_EMAIL], password: VALID_PASSWORD }],
    ['email object (injection)', { email: { $ne: '' }, password: VALID_PASSWORD }],
    ['password байхгүй', { email: VALID_EMAIL }],
    ['password number', { email: VALID_EMAIL, password: 12345678 }],
    ['password boolean', { email: VALID_EMAIL, password: true }],
    ['password object (injection)', { email: VALID_EMAIL, password: { $gt: '' } }],
    ['email хоосон', { email: '', password: VALID_PASSWORD }],
    ['email зөвхөн хоосон зай', { email: '   ', password: VALID_PASSWORD }],
    ['password хоосон (0 byte)', { email: VALID_EMAIL, password: '' }],
  ])('%s → INVALID_INPUT, repo/hasher дуудагдахгүй', async (_label, credentials) => {
    // Arrange
    const { userRepo, hasher } = buildDeps();

    // Act
    const result = await authenticate(credentials, userRepo, hasher);

    // Assert
    expect(result).toEqual({ ok: false, error: ERRORS.INVALID_INPUT });
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
    expect(hasher.compare).not.toHaveBeenCalled();
  });
});

describe('authenticate — хилийн утга', () => {
  test('email 254 тэмдэгт → зөвшөөрнө', async () => {
    // Arrange
    const email = emailOfLength(254);
    const { userRepo, hasher } = buildDeps({ user: buildUser({ email }) });

    // Act
    const result = await authenticate({ email, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(email).toHaveLength(254);
    expect(result.ok).toBe(true);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(email);
  });

  test('email 255 тэмдэгт → INVALID_INPUT', async () => {
    // Arrange
    const email = emailOfLength(255);
    const { userRepo, hasher } = buildDeps();

    // Act
    const result = await authenticate({ email, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(email).toHaveLength(255);
    expect(result).toEqual({ ok: false, error: ERRORS.INVALID_INPUT });
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
  });

  test('уртыг trim хийсний дараа тоолно (254 + хоосон зай → зөвшөөрнө)', async () => {
    // Arrange
    const email = emailOfLength(254);
    const { userRepo, hasher } = buildDeps({ user: buildUser({ email }) });

    // Act
    const result = await authenticate({ email: `  ${email}  `, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(result.ok).toBe(true);
    expect(userRepo.findByEmail).toHaveBeenCalledWith(email);
  });

  test.each([
    ['1 byte (доод хил)', 'x'],
    ['72 byte ASCII', 'a'.repeat(72)],
    ['72 byte кирилл (36 × 2 byte)', 'ө'.repeat(36)],
    ['72 byte emoji (18 × 4 byte)', '😀'.repeat(18)],
  ])('password %s → зөвшөөрнө', async (_label, password) => {
    // Arrange
    const { userRepo, hasher } = buildDeps();

    // Act
    const result = await authenticate({ email: VALID_EMAIL, password }, userRepo, hasher);

    // Assert
    expect(result.ok).toBe(true);
    expect(hasher.compare).toHaveBeenCalledWith(password, STORED_HASH);
  });

  test.each([
    ['73 byte ASCII', 'a'.repeat(73)],
    ['74 byte кирилл (37 × 2 byte)', 'ө'.repeat(37)],
    ['73 byte холимог (37 тэмдэгт)', `a${'ө'.repeat(36)}`],
  ])('password %s → INVALID_INPUT', async (_label, password) => {
    // Arrange
    const { userRepo, hasher } = buildDeps();

    // Act
    const result = await authenticate({ email: VALID_EMAIL, password }, userRepo, hasher);

    // Assert
    expect(result).toEqual({ ok: false, error: ERRORS.INVALID_INPUT });
    expect(userRepo.findByEmail).not.toHaveBeenCalled();
    expect(hasher.compare).not.toHaveBeenCalled();
  });
});

describe('authenticate — аюулгүй байдал', () => {
  test('хэрэглэгч олдоогүй ба нууц үг буруу үед ижил хариу буцаана (enumeration)', async () => {
    // Arrange
    const notFound = buildDeps({ user: null, passwordMatches: false });
    const wrongPassword = buildDeps({ passwordMatches: false });
    const credentials = { email: VALID_EMAIL, password: VALID_PASSWORD };

    // Act
    const notFoundResult = await authenticate(credentials, notFound.userRepo, notFound.hasher);
    const wrongPasswordResult = await authenticate(credentials, wrongPassword.userRepo, wrongPassword.hasher);

    // Assert
    expect(notFoundResult).toEqual({ ok: false, error: ERRORS.INVALID_CREDENTIALS });
    expect(wrongPasswordResult).toEqual(notFoundResult);
  });

  test('хэрэглэгч олдоогүй үед ч compare-ийг dummy hash-аар нэг удаа дуудна (timing)', async () => {
    // Arrange
    const { userRepo, hasher } = buildDeps({ user: null, passwordMatches: false });

    // Act
    await authenticate({ email: VALID_EMAIL, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(hasher.compare).toHaveBeenCalledTimes(1);
    expect(hasher.compare).toHaveBeenCalledWith(VALID_PASSWORD, DUMMY_PASSWORD_HASH);
  });

  test('dummy hash-тай compare true буцаасан ч олдоогүй хэрэглэгчийг нэвтрүүлэхгүй', async () => {
    // Arrange
    const { userRepo, hasher } = buildDeps({ user: null, passwordMatches: true });

    // Act
    const result = await authenticate({ email: VALID_EMAIL, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(result).toEqual({ ok: false, error: ERRORS.INVALID_CREDENTIALS });
  });

  test('compare boolean биш truthy утга буцаавал нэвтрүүлэхгүй', async () => {
    // Arrange
    const { userRepo, hasher } = buildDeps();
    hasher.compare.mockResolvedValue('true');

    // Act
    const result = await authenticate({ email: VALID_EMAIL, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(result).toEqual({ ok: false, error: ERRORS.INVALID_CREDENTIALS });
  });

  test('идэвхгүй данс + зөв нууц үг → ACCOUNT_DISABLED, user буцахгүй', async () => {
    // Arrange
    const { userRepo, hasher } = buildDeps({ user: buildUser({ isActive: false }), passwordMatches: true });

    // Act
    const result = await authenticate({ email: VALID_EMAIL, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(result).toEqual({ ok: false, error: ERRORS.ACCOUNT_DISABLED });
    expect(result).not.toHaveProperty('user');
  });

  test('идэвхгүй данс + буруу нууц үг → INVALID_CREDENTIALS (төлөвийг задлахгүй)', async () => {
    // Arrange
    const { userRepo, hasher } = buildDeps({ user: buildUser({ isActive: false }), passwordMatches: false });

    // Act
    const result = await authenticate({ email: VALID_EMAIL, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(result).toEqual({ ok: false, error: ERRORS.INVALID_CREDENTIALS });
    expect(hasher.compare).toHaveBeenCalledWith(VALID_PASSWORD, STORED_HASH);
  });

  test.each([
    ['амжилттай', { user: buildUser(), passwordMatches: true }],
    ['нууц үг буруу', { user: buildUser(), passwordMatches: false }],
    ['идэвхгүй данс', { user: buildUser({ isActive: false }), passwordMatches: true }],
  ])('%s үед passwordHash хариунд огт агуулагдахгүй', async (_label, depsOptions) => {
    // Arrange
    const { userRepo, hasher } = buildDeps(depsOptions);

    // Act
    const result = await authenticate({ email: VALID_EMAIL, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    expect(JSON.stringify(result)).not.toContain(STORED_HASH);
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  test('ямар ч замаар console руу бичихгүй (нууц үг логт орохгүй)', async () => {
    // Arrange
    const spies = ['log', 'info', 'warn', 'error', 'debug'].map((method) =>
      jest.spyOn(console, method).mockImplementation(() => {}),
    );
    const scenarios = [
      { deps: buildDeps(), credentials: { email: VALID_EMAIL, password: VALID_PASSWORD } },
      { deps: buildDeps({ passwordMatches: false }), credentials: { email: VALID_EMAIL, password: VALID_PASSWORD } },
      { deps: buildDeps({ user: null }), credentials: { email: VALID_EMAIL, password: VALID_PASSWORD } },
      { deps: buildDeps({ user: buildUser({ isActive: false }) }), credentials: { email: VALID_EMAIL, password: VALID_PASSWORD } },
      { deps: buildDeps(), credentials: { email: VALID_EMAIL, password: 'a'.repeat(73) } },
    ];

    // Act
    await Promise.all(
      scenarios.map(({ deps, credentials }) => authenticate(credentials, deps.userRepo, deps.hasher)),
    );

    // Assert
    spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });
});

describe('authenticate — алдааг дээш дамжуулах', () => {
  test('repository алдаа шидвэл тэр алдааг өөрчлөлгүй дамжуулна', async () => {
    // Arrange
    const dbError = new Error('ORA-12541: TNS:no listener');
    const { userRepo, hasher } = buildDeps();
    userRepo.findByEmail.mockRejectedValue(dbError);

    // Act
    const promise = authenticate({ email: VALID_EMAIL, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    await expect(promise).rejects.toBe(dbError);
    expect(hasher.compare).not.toHaveBeenCalled();
  });

  test('hasher алдаа шидвэл тэр алдааг өөрчлөлгүй дамжуулна', async () => {
    // Arrange
    const hashError = new Error('Invalid salt');
    const { userRepo, hasher } = buildDeps();
    hasher.compare.mockRejectedValue(hashError);

    // Act
    const promise = authenticate({ email: VALID_EMAIL, password: VALID_PASSWORD }, userRepo, hasher);

    // Assert
    await expect(promise).rejects.toBe(hashError);
  });
});
