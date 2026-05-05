#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python -c "
from app.services.database import engine
from app.models.base import Base
from app.models.user import User
from app.models.post import Post, PostLike, PostDislike, Comment, PostReport
from app.models.connection import Connection
from app.models.message import Message
from app.models.certificate import Certificate
from app.models.project import Project
from app.models.event import Event
from app.models.activity_log import ActivityLog
from app.models.article import Article, ArticleLike, ArticleComment
from app.models.notification import Notification
from sqlalchemy import text
Base.metadata.create_all(bind=engine)
with engine.begin() as conn:
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE'))
    conn.execute(text('ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)'))
    conn.execute(text('ALTER TABLE posts ALTER COLUMN content DROP NOT NULL'))
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty VARCHAR(255)'))
    conn.execute(text('ALTER TABLE posts ADD COLUMN IF NOT EXISTS show_dislikes BOOLEAN DEFAULT TRUE'))
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE'))
    conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)'))
print('Tables created successfully')
"
