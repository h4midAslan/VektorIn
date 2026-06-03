from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, subqueryload
from sqlalchemy import func as sa_func
from pydantic import BaseModel
import httpx
import json
import time
from app.services.database import get_db
from app.services.auth import get_current_user
from app.services.notifier import create_notification
from app.models.user import User
from app.models.post import Post, PostLike, PostDislike, Comment, PostReport
from app.config import settings
from app.services.activity_logger import log_activity

router = APIRouter(prefix="/api/posts", tags=["posts"])

_posts_cache: dict = {}
_POSTS_CACHE_TTL = 30


def _invalidate_posts_cache():
    _posts_cache.clear()


def _build_original(orig: Post) -> dict | None:
    if not orig:
        return None
    images, single_url = _parse_images(orig.image_url)
    return {
        "id": orig.id,
        "content": orig.content,
        "image_url": single_url,
        "images": images,
        "video_url": orig.video_url,
        "created_at": str(orig.created_at) if orig.created_at else None,
        "author_name": orig.author.full_name if orig.author else "Silinmiş istifadəçi",
        "author_id": orig.author_id,
        "author_picture": orig.author.profile_picture if orig.author else None,
    }


def _get_posts_base(db: Session, limit: int, offset: int) -> list[dict]:
    key = (limit, offset)
    now = time.time()
    cached = _posts_cache.get(key)
    if cached and now - cached["ts"] < _POSTS_CACHE_TTL:
        return cached["data"]

    posts = (
        db.query(Post)
        .options(
            joinedload(Post.author),
            subqueryload(Post.likes),
            subqueryload(Post.dislikes),
            subqueryload(Post.comments),
            joinedload(Post.repost_of).joinedload(Post.author),
        )
        .order_by(Post.is_pinned.desc(), Post.created_at.desc())
        .offset(offset)
        .limit(min(limit, 50))
        .all()
    )

    # Count reposts per original post
    all_ids = [p.id for p in posts]
    repost_counts = {}
    if all_ids:
        from sqlalchemy import case
        rows = db.query(Post.repost_of_id, sa_func.count(Post.id)).filter(
            Post.repost_of_id.in_(all_ids)
        ).group_by(Post.repost_of_id).all()
        repost_counts = {r[0]: r[1] for r in rows}

    data = []
    for post in posts:
        images, single_url = _parse_images(post.image_url)
        data.append({
            "id": post.id,
            "content": post.content,
            "image_url": single_url,
            "images": images,
            "video_url": post.video_url,
            "is_pinned": post.is_pinned,
            "show_dislikes": post.show_dislikes if post.show_dislikes is not None else True,
            "created_at": str(post.created_at) if post.created_at else None,
            "author_name": post.author.full_name,
            "author_id": post.author_id,
            "author_picture": post.author.profile_picture,
            "like_count": len(post.likes),
            "dislike_count": len(post.dislikes),
            "comment_count": len(post.comments),
            "repost_of_id": post.repost_of_id,
            "repost_of": _build_original(post.repost_of),
            "repost_count": repost_counts.get(post.id, 0),
        })
    _posts_cache[key] = {"data": data, "ts": now}
    return data


class AIEnhanceRequest(BaseModel):
    text: str


@router.post("/ai-enhance")
async def ai_enhance(data: AIEnhanceRequest, current_user: User = Depends(get_current_user)):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Mətn boş ola bilməz")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI xidməti aktiv deyil")

    prompt = f"""Sen peşəkar LinkedIn post redaktorusan. Aşağıdakı mətnə bax və onu professional, akademik üslubda LinkedIn postu kimi yenidən yaz.

Qaydalar:
- Azərbaycan dilində yaz
- Giriş cümləsi diqqət çəkici olsun
- Strukturlu ol: giriş → əsas fikir → nəticə/çağırış
- Emojilər az istifadə et (1-2 max)
- 150-250 söz arasında olsun
- Həşteqləri sona əlavə et (3-5 ədəd)
- Tələbə icması üçün uyğun ton

İstifadəçinin mətni:
{data.text.strip()}

Yalnız hazır postu yaz, heç bir izahat əlavə etmə."""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            if res.status_code != 200:
                import logging
                logging.getLogger(__name__).error("Gemini error %s: %s", res.status_code, res.text)
                raise HTTPException(status_code=502, detail=f"AI xəta: {res.status_code}")
            result = res.json()
            enhanced = result["candidates"][0]["content"]["parts"][0]["text"]
            return {"text": enhanced.strip()}
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI cavab vermək üçün çox gec etdi")


class PostCreate(BaseModel):
    content: str | None = None
    image_url: str | None = None
    images: list[str] = []
    video_url: str | None = None
    show_dislikes: bool = True
    repost_of_id: int | None = None


class CommentCreate(BaseModel):
    content: str


class ReportCreate(BaseModel):
    reason: str | None = None


class OriginalPostData(BaseModel):
    id: int
    content: str | None
    image_url: str | None
    images: list[str]
    video_url: str | None
    created_at: str | None
    author_name: str
    author_id: int
    author_picture: str | None
    class Config: from_attributes = True


class PostResponse(BaseModel):
    id: int
    content: str | None
    image_url: str | None
    images: list[str]
    video_url: str | None
    is_pinned: bool
    show_dislikes: bool
    created_at: str | None
    author_name: str
    author_id: int
    author_picture: str | None
    like_count: int
    dislike_count: int
    comment_count: int
    is_liked: bool
    is_disliked: bool
    repost_of_id: int | None = None
    repost_of: OriginalPostData | None = None
    repost_count: int = 0

    class Config:
        from_attributes = True


def _parse_images(image_url):
    if not image_url:
        return [], None
    if image_url.startswith("["):
        try:
            imgs = json.loads(image_url)
            return imgs, None
        except Exception:
            pass
    return [], image_url


def _build_post_response(post, current_user_id, user_liked_ids, user_disliked_ids):
    images, single_url = _parse_images(post.image_url)
    orig = _build_original(post.repost_of) if post.repost_of_id else None
    return PostResponse(
        id=post.id,
        content=post.content,
        image_url=single_url,
        images=images,
        video_url=post.video_url,
        is_pinned=post.is_pinned,
        show_dislikes=post.show_dislikes if post.show_dislikes is not None else True,
        created_at=str(post.created_at) if post.created_at else None,
        author_name=post.author.full_name,
        author_id=post.author_id,
        author_picture=post.author.profile_picture,
        like_count=len(post.likes),
        dislike_count=len(post.dislikes),
        comment_count=len(post.comments),
        is_liked=post.id in user_liked_ids,
        is_disliked=post.id in user_disliked_ids,
        repost_of_id=post.repost_of_id,
        repost_of=OriginalPostData(**orig) if orig else None,
        repost_count=0,
    )


@router.get("/feed-init")
def feed_init(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Feed açılışında lazım olan hər şeyi 1 sorğuda qaytarır.
    Əvvəl 7 ayrı API çağırışı gedirdi — indi 1-ə endirildi."""
    from sqlalchemy import or_
    from app.models.connection import Connection
    from app.models.contest import Contest
    from datetime import datetime, timezone

    # ── Postlar (30s cache-li) ──────────────────────────────────────────────
    post_dicts = _get_posts_base(db, 20, 0)
    post_ids = [p["id"] for p in post_dicts]

    user_liked_ids = set(
        r[0] for r in db.query(PostLike.post_id)
        .filter(PostLike.post_id.in_(post_ids), PostLike.user_id == current_user.id).all()
    ) if post_ids else set()
    user_disliked_ids = set(
        r[0] for r in db.query(PostDislike.post_id)
        .filter(PostDislike.post_id.in_(post_ids), PostDislike.user_id == current_user.id).all()
    ) if post_ids else set()

    posts = [
        {**p, "is_liked": p["id"] in user_liked_ids, "is_disliked": p["id"] in user_disliked_ids}
        for p in post_dicts
    ]

    # ── Bağlantılar (accepted) ──────────────────────────────────────────────
    my_conns = db.query(Connection).filter(
        or_(Connection.sender_id == current_user.id, Connection.receiver_id == current_user.id),
        Connection.status == "accepted",
    ).all()
    connected_ids = [
        c.receiver_id if c.sender_id == current_user.id else c.sender_id
        for c in my_conns
    ]

    # Göndərilmiş pending istəklər
    sent_conns = db.query(Connection).filter(
        Connection.sender_id == current_user.id,
        Connection.status == "pending",
    ).all()
    pending_ids = [c.receiver_id for c in sent_conns]

    # ── Tövsiyə olunan istifadəçilər (sadələşdirilmiş, sürətli) ───────────
    excluded = set(connected_ids) | set(pending_ids) | {current_user.id}
    suggested_users = db.query(User).filter(
        ~User.id.in_(excluded),
        User.is_verified == True,
    ).order_by(User.id.desc()).limit(6).all()

    suggested = [
        {
            "id": u.id,
            "full_name": u.full_name,
            "username": u.username,
            "profile_picture": u.profile_picture,
            "headline": u.headline,
            "faculty": u.faculty,
        }
        for u in suggested_users
    ]

    # ── Contest (mövcud cache-lərdən istifadə edir) ──────────────────────
    contest_data = {"active": False}
    leaderboard = []
    try:
        c = db.query(Contest).filter(Contest.is_active == True).first()
        if c:
            now = datetime.now(timezone.utc)
            deadline = c.deadline if c.deadline.tzinfo else c.deadline.replace(tzinfo=timezone.utc)
            remaining = max(0, int((deadline - now).total_seconds()))
            if remaining > 0:
                contest_data = {
                    "active": True,
                    "id": c.id,
                    "title": c.title,
                    "prize": c.prize,
                    "deadline": deadline.isoformat(),
                    "remaining_seconds": remaining,
                    "tags": [t.strip() for t in c.tags.split(",")],
                }
    except Exception:
        pass

    # ── İstifadəçi məlumatı ─────────────────────────────────────────────
    user_data = {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "username": current_user.username,
        "profile_picture": current_user.profile_picture,
        "headline": current_user.headline,
        "faculty": current_user.faculty,
        "university": current_user.university,
    }

    return {
        "posts": posts,
        "user": user_data,
        "connected_ids": connected_ids,
        "pending_ids": pending_ids,
        "suggested": suggested,
        "contest": contest_data,
        "leaderboard": leaderboard,
    }


@router.get("", response_model=list[PostResponse])
def get_feed(limit: int = 20, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post_dicts = _get_posts_base(db, limit, offset)
    post_ids = [p["id"] for p in post_dicts]
    user_liked_ids = set(
        r[0] for r in db.query(PostLike.post_id).filter(PostLike.post_id.in_(post_ids), PostLike.user_id == current_user.id).all()
    ) if post_ids else set()
    user_disliked_ids = set(
        r[0] for r in db.query(PostDislike.post_id).filter(PostDislike.post_id.in_(post_ids), PostDislike.user_id == current_user.id).all()
    ) if post_ids else set()

    return [PostResponse(**{**p, "is_liked": p["id"] in user_liked_ids, "is_disliked": p["id"] in user_disliked_ids}) for p in post_dicts]


@router.post("", response_model=PostResponse)
def create_post(data: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = data.content.strip() if data.content else None
    if data.images:
        stored_image = json.dumps(data.images)
    else:
        stored_image = data.image_url

    # Repost: only content is allowed (no new images/video on repost)
    if data.repost_of_id:
        original = db.query(Post).filter(Post.id == data.repost_of_id).first()
        if not original:
            raise HTTPException(status_code=404, detail="Orijinal post tapılmadı")
        post = Post(author_id=current_user.id, content=content, repost_of_id=data.repost_of_id, show_dislikes=True)
    else:
        if not content and not stored_image and not data.video_url:
            raise HTTPException(status_code=400, detail="Post boş ola bilməz")
        post = Post(author_id=current_user.id, content=content, image_url=stored_image, video_url=data.video_url, show_dislikes=data.show_dislikes)

    db.add(post)
    db.commit()
    log_activity(db, action="post_repost" if data.repost_of_id else "post_create", user_id=current_user.id, email=current_user.email, details=str(data.repost_of_id or ""))
    _invalidate_posts_cache()
    db.refresh(post)
    post.author = current_user
    post.likes = []
    post.dislikes = []
    post.comments = []
    post.repost_of = original if data.repost_of_id else None
    if post.repost_of and not hasattr(post.repost_of, 'author'):
        post.repost_of = db.query(Post).options(joinedload(Post.author)).filter(Post.id == data.repost_of_id).first()
    return _build_post_response(post, current_user.id, set(), set())


@router.post("/{post_id}/like")
def toggle_like(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    # Remove dislike if exists
    existing_dislike = db.query(PostDislike).filter(PostDislike.post_id == post_id, PostDislike.user_id == current_user.id).first()
    if existing_dislike:
        db.delete(existing_dislike)

    existing = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Like silindi"}

    like = PostLike(post_id=post_id, user_id=current_user.id)
    db.add(like)
    db.commit()
    create_notification(db, user_id=post.author_id, from_user_id=current_user.id, type="post_liked", post_id=post_id)
    return {"message": "Like edildi"}


@router.post("/{post_id}/dislike")
def toggle_dislike(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    # Remove like if exists
    existing_like = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == current_user.id).first()
    if existing_like:
        db.delete(existing_like)

    existing = db.query(PostDislike).filter(PostDislike.post_id == post_id, PostDislike.user_id == current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Dislike silindi"}

    dislike = PostDislike(post_id=post_id, user_id=current_user.id)
    db.add(dislike)
    db.commit()
    return {"message": "Dislike edildi"}


@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Bu postu silə bilməzsən")

    db.delete(post)
    db.commit()
    _invalidate_posts_cache()
    log_activity(db, action="post_delete", user_id=current_user.id, email=current_user.email, details=f"post_id={post_id}")
    return {"message": "Post silindi"}


@router.get("/user/{user_id}", response_model=list[PostResponse])
def get_user_posts(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    posts = (
        db.query(Post)
        .filter(Post.author_id == user_id)
        .options(joinedload(Post.author), subqueryload(Post.likes), subqueryload(Post.dislikes), subqueryload(Post.comments))
        .order_by(Post.created_at.desc())
        .all()
    )

    post_ids = [p.id for p in posts]
    user_liked_ids = set(
        r[0] for r in db.query(PostLike.post_id).filter(PostLike.post_id.in_(post_ids), PostLike.user_id == current_user.id).all()
    ) if post_ids else set()
    user_disliked_ids = set(
        r[0] for r in db.query(PostDislike.post_id).filter(PostDislike.post_id.in_(post_ids), PostDislike.user_id == current_user.id).all()
    ) if post_ids else set()

    return [_build_post_response(post, current_user.id, user_liked_ids, user_disliked_ids) for post in posts]


@router.post("/{post_id}/comment")
def add_comment(post_id: int, data: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    comment = Comment(post_id=post_id, user_id=current_user.id, content=data.content)
    db.add(comment)
    db.commit()
    create_notification(db, user_id=post.author_id, from_user_id=current_user.id, type="post_commented", post_id=post_id)
    return {"message": "Şərh əlavə edildi"}


@router.get("/{post_id}/comments")
def get_comments(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    return [
        {
            "id": c.id,
            "content": c.content,
            "user_name": c.user.full_name,
            "user_id": c.user_id,
            "created_at": str(c.created_at),
        }
        for c in comments
    ]


@router.post("/{post_id}/report")
def report_post(post_id: int, data: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")
    if post.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Öz postunu şikayət edə bilməzsən")

    existing = db.query(PostReport).filter(
        PostReport.post_id == post_id,
        PostReport.reporter_id == current_user.id,
        PostReport.resolved == False,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu postu artıq şikayət etmisən")

    reason = data.reason.strip() if data.reason else None
    report = PostReport(post_id=post_id, reporter_id=current_user.id, reason=reason)
    db.add(report)
    db.commit()
    return {"message": "Şikayət göndərildi"}


@router.post("/{post_id}/pin")
def pin_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Yalnız admin pin edə bilər")

    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post tapılmadı")

    post.is_pinned = not post.is_pinned
    db.commit()
    return {"message": "Pin statusu dəyişdirildi", "is_pinned": post.is_pinned}
