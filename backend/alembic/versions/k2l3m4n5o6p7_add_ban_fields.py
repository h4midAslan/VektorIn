"""add ban_reason and banned_until to users

Revision ID: k2l3m4n5o6p7
Revises: j1k2l3m4n5o6
Create Date: 2026-05-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'k2l3m4n5o6p7'
down_revision = 'j1k2l3m4n5o6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('ban_reason', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('banned_until', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column('users', 'ban_reason')
    op.drop_column('users', 'banned_until')
