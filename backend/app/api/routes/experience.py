from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.services.database import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.experience import Experience

router = APIRouter(prefix="/api/experiences", tags=["experiences"])


class ExperienceCreate(BaseModel):
    company: str
    role: str
    start_date: str
    end_date: str | None = None
    is_current: bool = False
    description: str | None = None


class ExperienceUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool | None = None
    description: str | None = None


class ExperienceResponse(BaseModel):
    id: int
    user_id: int
    company: str
    role: str
    start_date: str
    end_date: str | None
    is_current: bool
    description: str | None

    class Config:
        from_attributes = True


@router.post("", response_model=ExperienceResponse)
def add_experience(data: ExperienceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exp = Experience(
        user_id=current_user.id,
        company=data.company,
        role=data.role,
        start_date=data.start_date,
        end_date=None if data.is_current else data.end_date,
        is_current=data.is_current,
        description=data.description,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


@router.get("/me", response_model=list[ExperienceResponse])
def get_my_experiences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Experience).filter(Experience.user_id == current_user.id).order_by(Experience.start_date.desc()).all()


@router.get("/user/{user_id}", response_model=list[ExperienceResponse])
def get_user_experiences(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Experience).filter(Experience.user_id == user_id).order_by(Experience.start_date.desc()).all()


@router.put("/{exp_id}", response_model=ExperienceResponse)
def update_experience(exp_id: int, data: ExperienceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exp = db.query(Experience).filter(Experience.id == exp_id, Experience.user_id == current_user.id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Təcrübə tapılmadı")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(exp, field, value)
    if exp.is_current:
        exp.end_date = None
    db.commit()
    db.refresh(exp)
    return exp


@router.delete("/{exp_id}")
def delete_experience(exp_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exp = db.query(Experience).filter(Experience.id == exp_id, Experience.user_id == current_user.id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Təcrübə tapılmadı")
    db.delete(exp)
    db.commit()
    return {"detail": "Silindi"}
