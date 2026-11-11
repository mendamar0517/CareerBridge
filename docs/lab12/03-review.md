# 3. AI-ийн кодын review ба засвар

Шалгасан код: [02-good-prompt-response.md](02-good-prompt-response.md)-ийн `src/auth.js`, `tests/auth.test.js` (commit `f0ce8eb`, засваргүй).

## Шалгуур (Лекц 13)

1. **Логик:** шаардлагыг зөв хэрэгжүүлсэн үү, хилийн тохиолдол бүрэн үү
2. **Аюулгүй байдал:** enumeration, timing, fail-closed, нууц мэдээлэл задрах эсэх
3. **Стиль ба нийцэл:** ESLint, төслийн домэйн, давхардал

## Эхний хэмжилт (засварлахаас өмнө)

| Хэмжүүр | Үр дүн |
| --- | --- |
| `npx jest tests/auth.test.js` | 42/42 амжилттай |
| Coverage (`src/auth.js`) | 100% (lines, branches, functions) |
| `npx eslint` | **1 алдаа**: `sonarjs/no-hardcoded-passwords` |

Тест болон coverage бүрэн гарсан ч энэ нь код зөв гэсэн үг биш. Mock-той тестүүд AI-ийн өөрийн бичсэн шаардлагыг л шалгадаг.

## Олдсон асуудал

| № | Ангилал | Ач холбогдол | Асуудал | Засвар |
| --- | --- | --- | --- | --- |
| 1 | Аюулгүй байдал | **High** | `user.isActive === false` нь **fail-open**. `isActive` байхгүй, `null`, `'false'`, `0` үед идэвхгүй данс нэвтэрнэ | `user.isActive !== true` (fail-closed) + 4 тест |
| 2 | Стиль / CI | Medium | Тестийн fixture-д `sonarjs/no-hardcoded-passwords` алдаа. CI-ийн lint gate (Лаб 11) унана | Шалтгааныг тайлбарласан `eslint-disable-next-line` |
| 3 | Давхардал | Low | `MAX_EMAIL_LENGTH = 254`-ийг `registration.js`-д аль хэдийн тодорхойлсон байхад дахин тодорхойлсон | `require('./registration')`-ээс авах |
| 4 | Домэйн нийцэл | Low | Тестийн өгөгдөл: `role: 'candidate'` (схемд `SEEKER`), `ORA-12541` (Oracle-ийн алдаа, манай DB PostgreSQL) | `SEEKER`, `ECONNREFUSED 127.0.0.1:5432` |

### №1-ийн нотолгоо (засварлахаас өмнө, зөв нууц үгтэй)

| `isActive` | AI-ийн код | Засварын дараа |
| --- | --- | --- |
| `false` | `ACCOUNT_DISABLED` | `ACCOUNT_DISABLED` |
| байхгүй | **`ok: true`** | `ACCOUNT_DISABLED` |
| `null` | **`ok: true`** | `ACCOUNT_DISABLED` |
| `'false'` | **`ok: true`** | `ACCOUNT_DISABLED` |
| `0` | **`ok: true`** | `ACCOUNT_DISABLED` |

**Анхаарах:** энэ алдааны эх үүсвэр нь **миний prompt** байв. Prompt-ын 4-р шаардлагад `isActive === false` гэж бичсэн бөгөөд AI үүнийг үгчлэн хэрэгжүүлсэн. Иймд review нь зөвхөн AI-ийн кодыг бус, AI-д өгсөн шаардлагыг ч шалгах ёстой.

## AI-ийн анхааруулгыг шалгасан нь

AI хариундаа «`DUMMY_PASSWORD_HASH` бол зөвхөн хэлбэрийн хувьд зөв placeholder. Заавал солихгүй бол timing хамгаалалт ажиллахгүй» гэж анхааруулсан. Үүнийг жинхэнэ bcrypt сангаар шалгав (cost 12, буруу нууц үг):

| Сан | Жинхэнэ хэрэглэгч | Олдоогүй (AI-ийн dummy hash) |
| --- | --- | --- |
| `bcrypt` (native) | 256.7 ms | 239.5 ms |
| `bcryptjs` | 317.2 ms | 315.1 ms |

Placeholder нь 60 тэмдэгт, `$2b$12$` угтвартай, bcrypt-ийн base64 тэмдэгтүүдээс бүрдсэн тул bcrypt үүнийг хүчинтэй hash гэж үзэж, бүтэн тооцоолол хийсэн. Иймд **timing хамгаалалт ажиллаж байна**, AI-ийн анхааруулга шаардлагагүй байсан. Харин dummy hash-ийн cost (12) нь production-д хэрэглэгчийн нууц үгийг hash хийх cost-той ижил байх ёстой. Бүртгэлийг (US-01) хэрэгжүүлэх үед энэ нөхцлийг шалгах хэрэгтэй.

## Засварын дараа

| Хэмжүүр | Үр дүн |
| --- | --- |
| `npx jest tests/auth.test.js` | 46/46 амжилттай (+4 fail-closed тест) |
| Бүх тест | 88 амжилттай, 1 алгассан (DB-гүй орчин) |
| Coverage (`src/auth.js`) | 100% |
| `npm run lint` | 0 асуудал |
