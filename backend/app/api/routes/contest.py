from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.services.database import get_db
from app.models.post import Post, PostLike, Comment
from app.models.user import User
from app.models.contest import Contest

router = APIRouter(prefix="/api/contest", tags=["contest"])


def _active_contest(db: Session):
    return db.query(Contest).filter(Contest.is_active == True).order_by(Contest.created_at.desc()).first()


@router.get("/info")
def get_contest_info(db: Session = Depends(get_db)):
    c = _active_contest(db)
    if not c:
        return {"active": False}
    now = datetime.now(timezone.utc)
    deadline = c.deadline if c.deadline.tzinfo else c.deadline.replace(tzinfo=timezone.utc)
    remaining = max(0, int((deadline - now).total_seconds()))
    if remaining == 0:
        c.is_active = False
        db.commit()
        return {"active": False}
    return {
        "id": c.id,
        "title": c.title,
        "prize": c.prize,
        "deadline": deadline.isoformat(),
        "remaining_seconds": remaining,
        "active": True,
        "tags": [t.strip() for t in c.tags.split(",")],
    }


@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    c = _active_contest(db)
    if not c:
        return []
    tag_filters = [t.strip().lstrip("#").lower() for t in c.tags.split(",")]

    query = db.query(Post).filter(Post.image_url.isnot(None))
    for tag in tag_filters:
        query = query.filter(Post.content.ilike(f"%#{tag}%"))
    posts = query.all()

    results = []
    for post in posts:
        like_count = db.query(func.count(PostLike.id)).filter(PostLike.post_id == post.id).scalar()
        comment_count = db.query(func.count(func.distinct(Comment.user_id))).filter(Comment.post_id == post.id).scalar()
        score = like_count + comment_count
        author = db.query(User).filter(User.id == post.author_id).first()
        if not author:
            continue
        results.append({
            "post_id": post.id,
            "image_url": post.image_url,
            "content": post.content,
            "like_count": like_count,
            "comment_count": comment_count,
            "score": score,
            "created_at": str(post.created_at),
            "author": {
                "id": author.id,
                "full_name": author.full_name,
                "profile_picture": author.profile_picture,
                "major": author.major,
            },
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1
    return results
