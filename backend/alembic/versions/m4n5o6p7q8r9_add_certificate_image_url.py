"""add certificate image_url

Revision ID: m4n5o6p7q8r9
Revises: l3m4n5o6p7q8
Create Date: 2026-05-17
"""
from alembic import op
import sqlalchemy as sa

revision = 'm4n5o6p7q8r9'
down_revision = 'l3m4n5o6p7q8'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c['name'] for c in inspector.get_columns('certificates')]
    if 'image_url' not in columns:
        op.add_column('certificates', sa.Column('image_url', sa.String(500), nullable=True))


def downgrade():
    op.drop_column('certificates', 'image_url')
