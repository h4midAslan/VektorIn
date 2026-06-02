"""add experience table, languages, gpa, show_email to users

Revision ID: q9r0s1t2u3v4
Revises: p8q9r0s1t2u3
Create Date: 2026-06-02
"""
from alembic import op
import sqlalchemy as sa

revision = 'q9r0s1t2u3v4'
down_revision = 'p8q9r0s1t2u3'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('languages', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('gpa', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('show_email', sa.Boolean(), nullable=True, server_default='false'))

    op.create_table(
        'experiences',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('company', sa.String(255), nullable=False),
        sa.Column('role', sa.String(255), nullable=False),
        sa.Column('start_date', sa.String(20), nullable=False),
        sa.Column('end_date', sa.String(20), nullable=True),
        sa.Column('is_current', sa.Boolean(), default=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_experiences_user_id', 'experiences', ['user_id'])


def downgrade():
    op.drop_index('ix_experiences_user_id', 'experiences')
    op.drop_table('experiences')
    op.drop_column('users', 'show_email')
    op.drop_column('users', 'gpa')
    op.drop_column('users', 'languages')
