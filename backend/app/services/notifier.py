from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(db: Session, user_id: int, from_user_id: int, type: str, post_id: int = None):
    if user_id == from_user_id:
        return
    notif = Notification(user_id=user_id, from_user_id=from_user_id, type=type, post_id=post_id)
    db.add(notif)
    db.commit()
