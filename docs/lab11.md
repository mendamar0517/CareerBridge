# Лаборатори 11 — Статик шинжилгээ, эмзэг байдал илрүүлэх

F.CSA316 · 12-р долоо хоног · CLO4, CLO5 · Баг 11

## Хэрэгсэл

| Хэрэгсэл | Зорилго |
| --- | --- |
| ESLint 9 ([`eslint.config.js`](../eslint.config.js)) | Linter. ESLint 9-өөс эхлэн `.eslintrc`-ийн оронд flat config ашиглана |
| `@eslint/js` recommended | Түгээмэл алдаа: ашиглагдаагүй хувьсагч, тодорхойлогдоогүй нэр |
| `eslint-plugin-security` | Аюулгүй байдлын эрсдэлтэй загвар: unsafe regex, `eval`, child_process |
| `eslint-plugin-sonarjs` | SonarQube-ийн JavaScript дүрэм: ReDoS, code smell |
| `eslint-plugin-n` | Node.js-ийн дүрэм: `process.exit`, хамаарлын алдаа |
| `eslint-plugin-jest` | Тестийн дүрэм |
| `npm audit` | Хамаарлын мэдэгдэж буй эмзэг байдал (GitHub Advisory Database) |
| Dependabot ([`.github/dependabot.yml`](../.github/dependabot.yml)) | npm, GitHub Actions, Docker-ийн шинэчлэлийг долоо хоног бүр PR болгон санал болгоно |

```bash
npm run lint                               # ESLint
npm audit                                  # бүх хамаарал
npm audit --omit=dev --audit-level=high    # зөвхөн production (CI gate)
```

## 1. Linter: өмнө / дараа

- **Өмнө:** 14 асуудал ([eslint-before.txt](lab11/eslint-before.txt))
- **Дараа:** 0 асуудал ([eslint-after.txt](lab11/eslint-after.txt))

| № | Файл:мөр | Дүрэм | Ангилал | Ач холбогдол | Засвар |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/registration.js:2` | `sonarjs/super-linear-regex` | Аюулгүй байдал (ReDoS) | **High** | Regex-ийг шугаман болгож, 254 тэмдэгтийн хязгаар нэмэв |
| 2 | `src/app.js:28` | `sonarjs/no-ignored-exceptions` | Чанар | Medium | DB-ийн алдааг логт бичнэ, хэрэглэгчид дотоод мэдээлэл харуулахгүй |
| 3 | `src/app.js:28` | `no-unused-vars` | Чанар | Medium | (№2-той хамт засагдсан) |
| 4 | `src/server.js:18` | `n/no-process-exit` | Чанар | Low | `process.exitCode = 0`, процесс хэвийн дуусна |
| 5 | `src/registration.js:14` | `sonarjs/concise-regex` | Стиль | Low | `[0-9]` → `\d` |
| 6 | `tests/lab10…test.js:30` | `sonarjs/parameterized-tests` | Стиль | Low | Ижил бүтэцтэй 4 тестийг `test.each` болгов |
| 7–14 | `eslint.config.js`, `tests/*` | `n/no-unpublished-require` ×8 | Худал илрүүлэлт | — | `package.json`-д `"private": true` (санамсаргүй publish-ээс хамгаална) |

### ReDoS (№1): хэмжилт

`/^[^\s@]+@[^\s@]+\.[^\s@]+$/` нь `a@a.a.a.…a ` хэлбэрийн оролтод backtracking-оос болж квадрат хугацаа зарцуулдаг. Node.js нэг thread-тэй тул энэ хугацаанд сервер бусад хүсэлтэд хариу өгөхгүй. `express.json` 100 KB хүртэлх body хүлээн авдаг байсан тул бодит DoS эрсдэлтэй байв.

| Оролтын урт | Хуучин regex | Шинэ regex |
| --- | --- | --- |
| 20 003 | 258.6 ms | 0.1 ms |
| 80 003 | 4 453.8 ms | 0.7 ms |

Засвар:
1. `MAX_EMAIL_LENGTH = 254`: урт оролтыг regex ажиллахаас өмнө татгалзана.
2. Домэйны эхний хэсэгт цэг зөвшөөрөхгүй болгосон (`[^\s@.]+`). Ингэснээр тааруулах хуваалт ганцхан болж, хугацаа шугаман болно.
3. Давхар quantifier ашиглаагүй тул `security/detect-unsafe-regex` дүрэм ч тэнцэнэ.

Баталгаажуулах тест: [`tests/lab11.security.test.js`](../tests/lab11.security.test.js). 80 KB-ийн халдлагын оролтыг 50 ms-ээс хурдан шалгах ёстой.

## 2. npm audit

Бүрэн тайлан: [npm-audit.txt](lab11/npm-audit.txt)

| | Critical | High | Moderate | Low | Нийт |
| --- | --- | --- | --- | --- | --- |
| Лаб 11-ээс өмнө (`main`) | 0 | 0 | 16 | 4 | 20 |
| ESLint нэмсний дараа | 0 | 0 | 27 | 4 | **31** |
| Production (`--omit=dev`) | 0 | 0 | 0 | 0 | **0** |

31 бичлэг бүгд хоёр үндсэн advisory-оос үүдэлтэй, бусад нь тэдгээрээс дамжсан хамаарал:

| Advisory | Сан | Ач холбогдол | Хаанаас | Засвар гарсан эсэх |
| --- | --- | --- | --- | --- |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249): globparts DoS | `minimatch <11.0.1` | Moderate | `jest`, `eslint` | 11.0.1+ гарсан. Гэхдээ Jest, ESLint хуучин API-тай хувилбарыг ашигладаг |
| [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4): prototype poisoning | `deepmerge ≤4.3.1` | Low | `jest-config` | Гараагүй (хамгийн сүүлийн 4.3.1 эмзэг) |

### Шийдвэр: Critical/High байхгүй, Moderate/Low эрсдлийг хүлээн зөвшөөрнө

| Туршсан арга | Үр дүн |
| --- | --- |
| `npm audit fix --force` | Jest 29 → **25** болгож бууруулна. Ухралт тул татгалзав |
| Jest 30 руу шинэчлэх | 31 → 30. Jest 30 ч эмзэг minimatch-ийг ашигладаг |
| `overrides: { minimatch: "^11.0.3" }` | Moderate 0 болсон ч **coverage эвдэрсэн** (`minimatch is not a function`). Татгалзав |

Үндэслэл:
1. Эмзэг сангууд зөвхөн **хөгжүүлэлтийн хэрэгсэлд** (Jest, ESLint) байна. Production хамаарлын мод хоосон, Docker image (`npm ci --omit=dev`) болон Kubernetes-д ордоггүй.
2. minimatch-ийн DoS нь халдагч glob pattern-ийг удирдах үед л ашиглагдана. Манайд pattern-ууд зөвхөн тохиргооны файлаас ирдэг.
3. deepmerge-ийн prototype poisoning нь `jest-config` дотор итгэмжлэгдсэн тохиргоон дээр л ажилладаг.

### Засах төлөвлөгөө

| Арга хэмжээ | Хэзээ |
| --- | --- |
| CI gate: `npm audit --omit=dev --audit-level=high`. Production-д High/Critical гарвал CI улаан болно | Энэ PR |
| CI gate: бүх хамааралд Critical гарвал CI улаан. Бусдыг run Summary-д тайлагнана | Энэ PR |
| Dependabot долоо хоног бүр шалгаж, Jest, ESLint засвартай хувилбар гаргахад PR нээнэ | Энэ PR-ээс эхлэн |
| deepmerge, minimatch-ийн засварыг дахин шалгах | Sprint бүрийн Review |

## 3. CI-д нэгтгэх

`build-and-test` job-д нэмэгдсэн алхмууд:

1. `npm run lint`: ESLint-ийн асуудал гарвал CI улаан болно
2. `npm audit --omit=dev --audit-level=high`: production хамаарал
3. `npm audit --audit-level=critical`: бүх хамаарал. Audit-ийн хүснэгт Summary-д гарна

## Хүлээлгэж өгөх зүйл (deliverable)

- [x] Linter-ийн «өмнө / дараа» харьцуулалт (14 → 0)
- [x] `npm audit` тайлан, ангилал, шийдвэр
- [x] Шинэчилсэн CI workflow (lint + audit) + Dependabot
- [ ] Screenshot: CI run Summary (npm audit хүснэгт), lint алхам ногоон
