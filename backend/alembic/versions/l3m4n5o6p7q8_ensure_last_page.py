"""ensure last_page column exists

Revision ID: l3m4n5o6p7q8
Revises: j1k2l3m4n5o6
Create Date: 2026-05-06

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = 'l3m4n5o6p7q8'
down_revision = 'j1k2l3m4n5o6'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'last_page' not in columns:
        op.add_column('users', sa.Column('last_page', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('users', 'last_page')
