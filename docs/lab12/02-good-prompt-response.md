# 2. Тодорхой prompt ба AI-ийн хариу

- **Хэрэгсэл:** Claude (тусдаа, шинэ agent session; repository-д хандах эрхгүй, tool ашиглахгүй)
- **Огноо:** 2026-11-11

## Prompt

````
Би Node.js 20 (CommonJS), Express 4 дээр "CareerBridge" гэдэг ажлын байрны веб платформ хөгжүүлж байна. Тест нь Jest 30, linter нь ESLint (eqeqeq, prefer-const, no-unused-vars, sonarjs, security plugin).

Даалгавар: нэвтрэлтийн (login) логикийг `src/auth.js` файлд бич.

Гарын үсэг:
```js
async function authenticate(credentials, userRepo, hasher)
```
- `credentials` = `{ email, password }` (HTTP request body-оос шууд ирнэ, итгэж болохгүй)
- `userRepo.findByEmail(email)` → `Promise<{ id, email, passwordHash, role, isActive } | null>` (email-ийг жижиг үсгээр хадгалсан)
- `hasher.compare(plain, hash)` → `Promise<boolean>` (bcrypt-ийн wrapper, гаднаас дамжуулна)

Буцаах утга:
- Амжилттай: `{ ok: true, user: { id, email, role } }`
- Амжилтгүй: `{ ok: false, error: '<КОД>' }`

Шаардлага:
1. Оролтыг шалгах: email, password хоёулаа string байх; email-ийг trim + lowercase хийх; email ≤ 254 тэмдэгт; password 1–72 byte (bcrypt-ийн хязгаар, UTF-8 byte-аар тоол). Буруу бол `INVALID_INPUT` буцааж, repository-д хандахгүй.
2. Хэрэглэгч олдоогүй ба нууц үг буруу гэсэн хоёр тохиолдолд ижил `INVALID_CREDENTIALS` алдаа буцаах (user enumeration-ээс сэргийлэх).
3. Хэрэглэгч олдоогүй үед ч `hasher.compare`-ийг dummy hash-тай дуудаж, хариу өгөх хугацааг ойролцоо байлгах (timing attack).
4. `isActive === false` бол нууц үг зөв байсан ч `ACCOUNT_DISABLED` буцаах — гэхдээ зөвхөн нууц үг зөв үед (эс бөгөөс идэвхгүй данс байгааг задлахгүй).
5. `passwordHash`-ийг хэзээ ч буцаахгүй, нууц үгийг логт бичихгүй.
6. Repository эсвэл hasher алдаа шидвэл тэр алдааг дээш дамжуулах (залгихгүй).
7. Гадаад сан импортлохгүй (hasher, repo-г гаднаас авна).

Мөн `tests/auth.test.js`-д Jest тест бич: AAA бүтэцтэй, `jest.fn()` mock ашигласан, хэвийн тохиолдол, хилийн утга (72/73 byte, 254/255 тэмдэгт, хоосон, string биш), дээрх аюулгүй байдлын шаардлага бүрийг шалгасан байх.
````

## AI-ийн хариу (засваргүй, үгчлэн)

Доорх код таны тавьсан 7 шаардлагыг бүгдийг нь хангаж байгаа. Би ажиллуулж шалгаагүй. Ажиллуулах команд, мэдэх ёстой сул талуудыг төгсгөлд нь бичлээ.

## 1. `src/auth.js`

```js
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
```

## 2. `tests/auth.test.js`

```js
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
```

## 3. Шаардлага ба шийдлийн уялдаа

| № | Шаардлага | Хэрэгжүүлэлт |
|---|---|---|
| 1 | Оролтын шалгалт | `normalizeCredentials`: string эсэх, trim+lowercase, ≤254, `Buffer.byteLength` 1–72. Буруу бол repo руу хандахгүй |
| 2 | Enumeration | Олдоогүй ба буруу нууц үг хоёулаа `INVALID_CREDENTIALS` буцаана |
| 3 | Timing | Хэрэглэгч олдсон эсэхээс үл хамааран `compare` яг нэг удаа дуудагдана |
| 4 | Идэвхгүй данс | `isActive === false`-ийг шалгалтын дараалал дахь нууц үгийн шалгалтын ард байрлуулсан |
| 5 | Hash/лог | Буцаах `user`-ийн талбаруудыг тодорхой жагсаасан. `console` огт ашиглаагүй |
| 6 | Алдаа дамжуулах | `try/catch` байхгүй, тиймээс алдаа өөрчлөгдөхгүй дээш гарна |
| 7 | Гадаад сан | `require` байхгүй. `Buffer` нь Node-ийн глобал объект |

## 4. Анхаарах зүйлс

1. **`DUMMY_PASSWORD_HASH`-ийг заавал солих.** Кодонд байгаа утга зөвхөн хэлбэрийн хувьд зөв placeholder. Шаардлага 3 ажиллахын тулд:
   - кодын тайлбар дахь командаар жинхэнэ bcrypt hash үүсгэ;
   - түүний cost factor нь хэрэглэгчдийн hash-тай ижил байх ёстой.

   Cost нь бага, эсвэл hash-ийн формат буруу байвал `compare` хурдан дуусч, timing хамгаалалт ажиллахгүй. Тест mock ашигладаг тул энэ асуудлыг илрүүлэхгүй.
2. **Timing хамгаалалт бүрэн биш.** Хоёр зөрүү үлдэж байгаа:
   - `INVALID_INPUT` зам маш хурдан хариу өгдөг. Гэхдээ энэ нь хэрэглэгчийн мэдээлэл задлахгүй, зөвхөн оролтын хэлбэрийг илтгэнэ.
   - Өгөгдлийн сангийн хайлтын хугацаа ч бага зэрэг ялгаатай байж болно.

   Тиймээс Express давхаргад rate limiting, тодорхой тооны амжилтгүй оролдлогын дараах түр түгжээ нэмэхийг зөвлөж байна.
3. **`ACCOUNT_DISABLED` дансны төлвийг илтгэнэ.** Энэ код нь нууц үгийг мэддэг хүнд данс байгааг мэдэгдэнэ. Шаардлага 4 үүнийг зориуд зөвшөөрч байгаа бөгөөд хүлээн зөвшөөрөгдөх эрсдэл.
4. **Email-ийн уртыг UTF-16 code unit-ээр тоолсон.** `String.prototype.length` ашигласан. ASCII email-д энэ нь тэмдэгтийн тоотой ижил. Олон улсын (IDN/SMTPUTF8) хаягийг дэмжих бол `[...email].length` (code point) эсвэл byte-аар тоолох эсэхээ шийдэх хэрэгтэй.
5. **72 byte-аас урт нууц үгийг тайрахгүй, татгалзана.** Тайрвал bcrypt урт нууц үгийн эхний 72 byte-ыг л харьцуулах тул эхлэл нь адилхан өөр нууц үгээр нэвтэрч болдог. Татгалзах нь илүү аюулгүй.
6. **Ажиллуулах:**
   ```bash
   npx jest tests/auth.test.js --coverage
   npx eslint src/auth.js tests/auth.test.js
   ```
   Тестүүд `src/auth.js`-ийн бүх салааг хамардаг. Гэхдээ coverage болон ESLint-ийн бодит үр дүнг өөрөө ажиллуулж шалгаарай.