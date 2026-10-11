from alembic import op
import sqlalchemy as sa

revision = "b8e4c29f1d63"
down_revision = "a41d7c9e2f10"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("customers", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))


def downgrade():
    op.drop_column("customers", "archived_at")
