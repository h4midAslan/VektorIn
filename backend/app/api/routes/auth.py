import secrets
import random
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.database import get_db
from app.services.auth import hash_password, verify_password, create_access_token
from app.services.activity_logger import log_activity
from app.services.email import send_verification_code
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

FACULTY_SPECIALIZATIONS = {
    "Hava nəqliyyatı fakültəsi": [
        "Uçuş mühəndisliyi",
        "Hava nəqliyyatının hərəkətinin təşkili",
        "Aerokosmik mühəndislik",
        "Hidrometeorologiya",
    ],
    "Nəqliyyat texnologiyaları fakültəsi": [
        "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
        "Mexanika mühəndisliyi",
        "Aviasiya təhlükəsizliyi mühəndisliyi",
        "Materiallar mühəndisliyi",
    ],
    "Aerokosmik fakültə": [
        "Kompüter mühəndisliyi",
        "Ekologiya mühəndisliyi",
        "İnformasiya texnologiyaları",
    ],
    "Fizika-Texnologiya fakültəsi": [
        "Mühəndislik fizikası",
        "Radiotexnika və telekommunikasiya mühəndisliyi",
        "Elektrik və elektronika mühəndisliyi",
        "Cihaz mühəndisliyi",
        "Energetika mühəndisliyi",
        "Proseslərin avtomatlaşdırılması mühəndisliyi",
        "Mexatronika və robototexnika mühəndisliyi",
    ],
    "İqtisadiyyat və hüquq fakültəsi": [
        "Hüquqşünaslıq",
        "İqtisadiyyat",
        "Maliyyə",
        "Menecment",
        "Biznesin idarə edilməsi",
    ],
}


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    faculty: str
    major: str
    course: int


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    if not (data.email.endswith("@naa.edu.az") or data.email.endswith("@student.naa.edu.az")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yalnız @naa.edu.az və ya @student.naa.edu.az email ilə qeydiyyat mümkündür"
        )

    if data.faculty not in FACULTY_SPECIALIZATIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yanlış fakultə seçimi"
        )

    if data.major not in FACULTY_SPECIALIZATIONS[data.faculty]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seçilmiş fakultəyə aid olmayan ixtisas"
        )

    if data.course not in (1, 2, 3, 4):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kurs 1-4 arasında olmalıdır"
        )

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bu email artıq qeydiyyatdan keçib"
            )
        code = f"{random.randint(100000, 999999)}"
        existing.verification_token = code
        existing.password_hash = hash_password(data.password)
        db.commit()
        sent = send_verification_code(existing.email, code)
        logger.info("VERIFY_CODE email=%s code=%s sent=%s", existing.email, code, sent)
        if not sent:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Email göndərilə bilmədi. Bir az sonra yenidən cəhd edin."
            )
        return {"message": "Kod emailinizə göndərildi.", "email": existing.email}

    code = f"{random.randint(100000, 999999)}"
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        faculty=data.faculty,
        major=data.major,
        course=data.course,
        is_verified=False,
        verification_token=code,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_activity(db, action="register", user_id=user.id, email=user.email, request=request)
    sent = send_verification_code(user.email, code)
    logger.info("VERIFY_CODE email=%s code=%s sent=%s", user.email, code, sent)
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email göndərilə bilmədi. Bir az sonra yenidən cəhd edin."
        )

    return {"message": "Kod emailinizə göndərildi.", "email": user.email}


@router.get("/faculties")
def get_faculties():
    return FACULTY_SPECIALIZATIONS


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        log_activity(db, action="login_failed", email=data.email, request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email və ya şifrə yanlışdır"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email hələ təsdiqlənməyib. Emailinizi yoxlayın."
        )

    log_activity(db, action="login_success", user_id=user.id, email=user.email, request=request)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


class VerifyCodeRequest(BaseModel):
    email: str
    code: str


@router.post("/verify-code")
def verify_code(data: VerifyCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or user.is_verified:
        raise HTTPException(status_code=400, detail="Yanlış sorğu")
    if user.verification_token != data.code:
        raise HTTPException(status_code=400, detail="Kod yanlışdır")
    user.is_verified = True
    user.verification_token = None
    db.commit()
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)
