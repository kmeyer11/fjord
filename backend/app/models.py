import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TaskStatus(str, enum.Enum):
    backlog = "backlog"
    scheduled = "scheduled"
    done = "done"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#3c6e90")
    archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    tasks: Mapped[list["Task"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus), nullable=False, default=TaskStatus.backlog
    )
    priority: Mapped[TaskPriority] = mapped_column(
        Enum(TaskPriority), nullable=False, default=TaskPriority.medium
    )
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    project: Mapped["Project"] = relationship(back_populates="tasks")


class AppConfig(Base):
    """Singleton row (id is always 1) holding the PIN gate, .ics feed secret,
    and iCloud CalDAV credentials (app password stored encrypted — see
    app.secrets_store)."""

    __tablename__ = "app_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pin_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    secret_key: Mapped[str] = mapped_column(String(64), nullable=False)
    ics_token: Mapped[str] = mapped_column(String(64), nullable=False)
    icloud_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    icloud_app_password_enc: Mapped[str | None] = mapped_column(String(512), nullable=True)
