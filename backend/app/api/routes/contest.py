from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.services.database import get_db
from app.services.auth import get_current_user
from app.models.post import Post, PostLike
from app.models.user import User
from app.config import settings

router = APIRouter(prefix="/api/contest", tags=["contest"])

CONTEST_TAGS = ["#aviasiyaakademiyası", "#hashcampus"]
CONTEST_DEADLINE = datetime(2026, 6, 4, 23, 59, 59, tzinfo=timezone.utc)
CONTEST_PRIZE = "50 AZN"
CONTEST_TITLE = "Aviasiya Akademiyası Foto Müsabiqəsi"


def _matches_contest(content: str) -> bool:
    if not content:
        return False
    lower = content.lower()
    return all(tag in lower for tag in CONTEST_TAGS)


@router.get("/info")
def get_contest_info():
    now = datetime.now(timezone.utc)
    remaining = max(0, int((CONTEST_DEADLINE - now).total_seconds()))
    return {
        "title": CONTEST_TITLE,
        "prize": CONTEST_PRIZE,
        "deadline": CONTEST_DEADLINE.isoformat(),
        "remaining_seconds": remaining,
        "active": remaining > 0,
        "tags": ["#AviasiyaAkademiyası", "#HashCampus"],
    }


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    posts = (
        db.query(Post)
        .filter(
            Post.image_url.isnot(None),
            Post.content.ilike("%#aviasiyaakademiyası%"),
            Post.content.ilike("%#hashcampus%"),
        )
        .all()
    )

    results = []
    for post in posts:
        like_count = db.query(func.count(PostLike.id)).filter(PostLike.post_id == post.id).scalar()
        author = db.query(User).filter(User.id == post.author_id).first()
        if not author:
            continue
        results.append({
            "post_id": post.id,
            "image_url": post.image_url,
            "content": post.content,
            "like_count": like_count,
            "created_at": str(post.created_at),
            "author": {
                "id": author.id,
                "full_name": author.full_name,
                "profile_picture": author.profile_picture,
                "major": author.major,
            },
        })

    results.sort(key=lambda x: x["like_count"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results
