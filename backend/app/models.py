import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from app.database import Base


class UTCDateTime(TypeDecorator):
    """SQLite's DateTime silently drops tzinfo on both write and read, so a
    tz-aware datetime in (the frontend always sends full ISO strings) comes
    back naive — which every consumer (the API response, this app's own date
    arithmetic) then risks misreading as local time instead of UTC. This
    re-attaches UTC on the way out and normalizes to UTC before stripping on
    the way in, so values round-trip correctly regardless of caller offset."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    def process_result_value(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        return value.replace(tzinfo=timezone.utc)


class TaskStatus(str, enum.Enum):
    backlog = "backlog"
    in_progress = "in_progress"
    done = "done"


class TaskCategory(str, enum.Enum):
    task = "task"
    meeting = "meeting"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#3c6e90")
    archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    favorite: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int | None] = mapped_column(ForeignKey("projects.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), nullable=False, default=TaskStatus.backlog
    )
    # 1 (least critical) through 5 (most critical).
    criticality: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    category: Mapped[TaskCategory] = mapped_column(
        Enum(TaskCategory), nullable=False, default=TaskCategory.task
    )
    due_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    all_day: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # Shared by every occurrence of a weekly-recurring meeting; null for one-off tasks/meetings.
    recurrence_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    # When the task last transitioned into 'done'; cleared if it moves back out.
    # Drives the project board's auto-archive (see ARCHIVE_AFTER in routers/projects.py).
    completed_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    # Set when the user manually archives the task on demand, bypassing the
    # completed_at/ARCHIVE_AFTER rule entirely (see _is_archived in routers/projects.py).
    archived_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    project: Mapped["Project | None"] = relationship(back_populates="tasks")

    __table_args__ = (
        CheckConstraint("criticality BETWEEN 1 AND 5", name="ck_tasks_criticality_range"),
        # Never reuse a deleted id — it's the calendar event's UID and resource
        # name (see app/calendar_push.py).
        {"sqlite_autoincrement": True},
    )



class AppSetting(Base):
    """User preferences (currently just the front-page scene) as JSON values
    under a string key — one generic table, so a new preference needs no
    migration. Not for secrets: those live in the AppSecrets JSON file
    (config_store.py), deliberately outside this database."""

    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
