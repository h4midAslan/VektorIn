"""add banner_image to users

Revision ID: p8q9r0s1t2u3
Revises: o7p8q9r0s1t2
Create Date: 2026-05-31
"""
from alembic import op

revision = 'p8q9r0s1t2u3'
down_revision = 'o7p8q9r0s1t2'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_image VARCHAR(500)")


def downgrade():
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS banner_image")
