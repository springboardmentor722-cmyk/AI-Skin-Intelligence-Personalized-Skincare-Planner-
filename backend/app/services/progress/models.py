import datetime

from sqlalchemy import ForeignKey, Index, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's
# literal DDL exactly, same discipline as skin_profile/models.py.


class ProgressImage(Base):
    """`image_url` is the DDL's literal column name, but stores the S3-compatible
    object *key* (core/storage.py), never a public URL — this table's images are
    private-bucket, presigned-URL-only, same as `verification_documents.storage_key`
    (a different literal name for the same idea, since this table predates that
    naming convention)."""

    __tablename__ = "progress_images"
    __table_args__ = (Index("idx_progress_images_user", "user_id"),)

    progress_image_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    image_url: Mapped[str | None] = mapped_column(default=None)
    image_stage: Mapped[str | None] = mapped_column(default=None)
    skin_health_score_at_upload: Mapped[float | None] = mapped_column(Numeric(5, 2), default=None)
    uploaded_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
