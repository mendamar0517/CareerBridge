# 1. Ерөнхий prompt ба AI-ийн анхны хариу

- **Хэрэгсэл:** Claude (тусдаа, шинэ agent session; repository-д хандах эрхгүй, tool ашиглахгүй)
- **Огноо:** 2026-11-11
- **Prompt:**

```
login function бичээд өг
```

## AI-ийн хариу (засваргүй, үгчлэн)

> **Тэмдэглэл:** session нь repository-д хандаагүй ч хэрэглэгчийн бүртгэлийн ерөнхий контексттэй байсан тул «CareerBridge» нэр, `careerbridge_schema.sql` файлыг дурдсан байна.

# Login функц (FastAPI)

Таны stack-ийг repo-оос шалгаагүй байгаа. Тиймээс доорх код **Python/FastAPI + SQLAlchemy** дээр бичигдсэн бөгөөд `users` хүснэгтэд `email`, `password_hash`, `role`, `is_active` баганууд байна гэж үзсэн. CareerBridge өөр технологи (жишээ нь Node.js, Django) ашигладаг эсвэл баганын нэр `careerbridge_schema.sql`-тэй таарахгүй бол хэлээрэй, тохируулж өгье.

## 1. Хамаарлууд

```bash
pip install fastapi sqlalchemy bcrypt pyjwt "pydantic[email]"
```

## 2. `app/auth.py`

```python
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db   # Session өгдөг dependency
from app.models import User       # SQLAlchemy User model

SECRET_KEY = os.environ["JWT_SECRET_KEY"]   # кодонд бүү хадгал
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------- Schema ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Туслах функцууд ----------
def hash_password(plain: str) -> str:
    """Бүртгэл үүсгэх үед ашиглана."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:          # 72 byte-аас урт эсвэл буруу hash
        return False


# Хэрэглэгч олдоогүй үед ч bcrypt ажиллуулж, хариу өгөх хугацааг ижил байлгана
_DUMMY_HASH = hash_password("dummy-password")


def create_access_token(user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ---------- Login endpoint ----------
@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Имэйл эсвэл нууц үг буруу байна",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = db.scalar(select(User).where(User.email == data.email.lower()))

    if user is None:
        verify_password(data.password, _DUMMY_HASH)   # timing attack-аас хамгаална
        raise invalid

    if not verify_password(data.password, user.password_hash):
        raise invalid

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Бүртгэл идэвхгүй байна")

    return TokenResponse(access_token=create_access_token(user.id, user.role))
```

## 3. `main.py`-д холбох

```python
from fastapi import FastAPI
from app.auth import router as auth_router

app = FastAPI()
app.include_router(auth_router)
```

## 4. Шалгах

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123"}'
```

## Аюулгүй байдлын шийдлүүд

| Шийдэл | Шалтгаан |
|---|---|
| Буруу имэйл, буруу нууц үг хоёрт ижил мессеж буцаана | Ямар имэйл бүртгэлтэйг таахаас сэргийлнэ |
| Хэрэглэгч олдоогүй үед ч bcrypt ажиллуулна | Хариу өгөх хугацаагаар имэйл бүртгэлтэй эсэхийг мэдэхээс сэргийлнэ |
| bcrypt + salt хэрэглэнэ | Нууц үгийг хэзээ ч ил текстээр хадгалахгүй |
| JWT-д `exp` тавина | Token хугацаагүй хүчинтэй байхаас сэргийлнэ |
| `SECRET_KEY`-г environment variable-аас уншина | Нууц түлхүүр repo руу орохоос сэргийлнэ |

**Дараа нэмж болох зүйлс:** rate limiting буюу олон удаа буруу оролдоход түр хаах (жишээ нь `slowapi`), refresh token, мөн token шалгадаг `get_current_user` dependency. Эдгээрийг хэрэгтэй бол дараагийн алхамд бичиж өгье.

Хэрэв энэ ажил CareerBridge-ийн Product Backlog дахь нэвтрэх User Story-д хамаарах бол commit болон PR-даа тухайн US-ID-г дурдаарай. Ингэснээр лабораторийн тайлан дахь Sprint-ийн ажилтай холбогдоно.
