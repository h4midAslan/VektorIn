import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.database import get_db
from app.services.auth import hash_password, verify_password, create_access_token
from app.services.activity_logger import log_activity
from app.services.email import send_verification_code
from app.models.user import User
from app.models.connection import Connection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

UNIVERSITY_DATA = {
    "student.naa.edu.az": {
        "name": "Milli Aviasiya Akademiyası",
        "faculties": {
            "Hava nəqliyyatı fakültəsi": [
                "Hava nəqliyyatının idarə edilməsi",
                "Hava nəqliyyatının hərəkətinin təşkili",
                "Mühəndislik mexanikası",
                "Hidrometeorologiya",
            ],
            "Nəqliyyat texnologiyaları fakültəsi": [
                "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
                "Mexanika mühəndisliyi",
                "Nəqliyyat mühəndisliyi",
                "Materiallar mühəndisliyi",
            ],
            "Texniki fakültə": [
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
        },
    },
    "student.aztu.edu.az": {
        "name": "Azərbaycan Texniki Universiteti",
        "faculties": {
            "İnformasiya Texnologiyaları və Telekommunikasiya Fakültəsi": [
                "Kompüter elmləri",
                "İnformasiya texnologiyaları",
                "Kompüter mühəndisliyi",
                "İnformasiya təhlükəsizliyi",
                "Radiotexnika və telekommunikasiya mühəndisliyi",
                "Proqram təminatı mühəndisliyi",
                "Data Analitika",
                "Süni intellekt",
                "Data elmləri",
            ],
            "Maşınqayırma və Metallurgiya Fakültəsi": [
                "Mexatronika və robototexnika mühəndisliyi",
                "Sənaye mühəndisliyi",
                "Qida mühəndisliyi",
                "Maşın mühəndisliyi",
                "Mexanika mühəndisliyi",
                "Cihaz mühəndisliyi",
                "Proseslərin avtomatlaşdırılması mühəndisliyi",
                "Ekologiya mühəndisliyi",
                "Həyat fəaliyyətinin təhlükəsizliyi mühəndisliyi",
                "Kimya mühəndisliyi",
                "Metallurgiya mühəndisliyi",
                "Mədən mühəndisliyi",
                "Materiallar mühəndisliyi",
            ],
            "Xüsusi Texnika və Texnologiya Fakültəsi": [
                "İnformasiya təhlükəsizliyi",
                "Silah sistemləri mühəndisliyi",
                "Mexatronika və robototexnika mühəndisliyi",
                "Maşın mühəndisliyi",
                "Materiallar mühəndisliyi",
                "Kimya mühəndisliyi",
                "Xüsusi rabitə vasitələri mühəndisliyi",
                "Sistemlər mühəndisliyi",
                "Aerokosmik mühəndislik",
                "Optotexnika mühəndisliyi",
            ],
            "Nəqliyyat və Logistika Fakültəsi": [
                "Logistika və nəqliyyat texnologiyaları mühəndisliyi",
                "Nəqliyyatda daşımalar və menecment",
                "Yol hərəkətinin təşkili və təhlükəsizliyi",
            ],
            "Energetika Fakültəsi": [
                "Energetika mühəndisliyi",
                "Elektrik mühəndisliyi",
                "Elektrik və elektronika mühəndisliyi",
                "Bərpa olunan enerji mühəndisliyi",
                "Mühəndis fizikası",
            ],
            "Sənaye İqtisadiyyatı və Menecment Fakültəsi": [
                "İqtisadiyyat",
                "Menecment",
                "Sənaye iqtisadiyyatı",
                "Biznes mühəndisliyi",
                "Maliyyə",
            ],
        },
    },
    "unec.edu.az": {
        "name": "UNEC",
        "faculties": {
            "Biznes və Menecment fakültəsi": [
                "Biznesin idarə edilməsi",
                "Menecment",
                "Marketinq",
                "Beynəlxalq ticarət və logistika",
            ],
            "İqtisadiyyat və İdarəetmə fakültəsi": [
                "İqtisadiyyat",
                "Ekologiya",
                "Sosial iş",
                "Statistika",
                "Beynəlxalq münasibətlər",
                "Dövlət və bələdiyyə idarəetməsi",
            ],
            "Maliyyə və Mühasibat fakültəsi": [
                "Maliyyə",
                "Mühasibat",
            ],
            "Mühəndislik fakültəsi": [
                "Sənaye mühəndisliyi",
                "Qida mühəndisliyi",
                "Materiallar mühəndisliyi",
                "Ekologiya mühəndisliyi",
                "Maşın mühəndisliyi",
                "Elektrik və elektronika mühəndisliyi",
            ],
            "Rəqəmsal İqtisadiyyat fakültəsi": [
                "İnformasiya texnologiyaları",
                "Kommunikasiya sistemləri mühəndisliyi",
                "İnformasiya təhlükəsizliyi",
                "Kompüter elmləri",
                "Kompüter mühəndisliyi",
            ],
            "Türk Dünyası İqtisad fakültəsi": [
                "Maliyyə",
                "Marketinq",
                "İqtisadiyyat",
                "Mühasibat",
                "Biznesin idarə edilməsi",
                "Beynəlxalq ticarət və logistika",
                "Dövlət və bələdiyyə idarəetməsi",
                "Beynəlxalq münasibətlər",
            ],
        },
    },
}

# Flat dict for backward compatibility
FACULTY_SPECIALIZATIONS = {}
for uni in UNIVERSITY_DATA.values():
    FACULTY_SPECIALIZATIONS.update(uni["faculties"])


def _get_university_from_email(email: str):
    domain = email.split("@")[-1].lower()
    return UNIVERSITY_DATA.get(domain)


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


def _cleanup_unverified(db: Session):
    """24 saatdan köhnə doğrulanmamış hesabları sil."""
    try:
        from datetime import datetime, timezone, timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        old_ids = [row.id for row in db.query(User.id).filter(
            User.is_verified == False,
            User.created_at < cutoff,
        ).all()]
        if not old_ids:
            return
        # FK constraint-ləri olan cədvəlləri əvvəl sil (cascade yoxdur)
        db.query(Connection).filter(
            or_(Connection.sender_id.in_(old_ids), Connection.receiver_id.in_(old_ids))
        ).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_(old_ids)).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning("_cleanup_unverified failed: %s", e)


@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    _cleanup_unverified(db)
    uni = _get_university_from_email(data.email)
    if not uni:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yalnız universitet email ünvanı ilə qeydiyyat mümkündür."
        )

    if data.faculty not in uni["faculties"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yanlış fakultə seçimi"
        )

    if data.major not in uni["faculties"][data.faculty]:
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
        code = f"{secrets.randbelow(900000) + 100000}"
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

    code = f"{secrets.randbelow(900000) + 100000}"
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

    sent = send_verification_code(user.email, code)
    logger.info("VERIFY_CODE email=%s code=%s sent=%s", user.email, code, sent)
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email göndərilə bilmədi. Bir az sonra yenidən cəhd edin."
        )

    return {"message": "Kod emailinizə göndərildi.", "email": user.email}


@router.get("/faculties")
def get_faculties(email: str = ""):
    if email:
        uni = _get_university_from_email(email)
        if not uni:
            return {}
        return {"university_name": uni["name"], "faculties": uni["faculties"]}
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
@limiter.limit("5/minute")
def verify_code(request: Request, data: VerifyCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or user.is_verified:
        raise HTTPException(status_code=400, detail="Yanlış sorğu")
    if user.verification_token != data.code:
        log_activity(db, action="verify_failed", email=data.email, request=request)
        raise HTTPException(status_code=400, detail="Kod yanlışdır")
    user.is_verified = True
    user.verification_token = None
    db.commit()
    log_activity(db, action="register", user_id=user.id, email=user.email, request=request)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)
