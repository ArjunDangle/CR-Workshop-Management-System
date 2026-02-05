"""add_image_url

Revision ID: 2be9cde0607c
Revises: 0396550bb073
Create Date: 2026-02-05 23:22:15.955691

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '2be9cde0607c'
down_revision: Union[str, Sequence[str], None] = '0396550bb073'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # We only want to add the image_url column. 
    # We are removing the Enum conversions to avoid the "type does not exist" error.
    op.add_column('machine', sa.Column('image_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

def downgrade():
    op.drop_column('machine', 'image_url')