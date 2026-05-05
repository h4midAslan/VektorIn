from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.services.database import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )

    from_user_ids = {n.from_user_id for n in notifs if n.from_user_id}
    users = {u.id: u for u in db.query(User).filter(User.id.in_(from_user_ids)).all()}

    result = []
    for n in notifs:
        from_user = users.get(n.from_user_id)
        result.append({
            "id": n.id,
            "type": n.type,
            "is_read": n.is_read,
            "post_id": n.post_id,
            "from_user_id": n.from_user_id,
            "from_user_name": from_user.full_name if from_user else "Naməlum",
            "created_at": str(n.created_at),
        })
    return result


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}


@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "Hamısı oxundu"}


@router.put("/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Oxundu"}
