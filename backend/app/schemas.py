from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import TaskCategory, TaskStatus


class TaskCounts(BaseModel):
    backlog: int = 0
    in_progress: int = 0
    done: int = 0


class ProjectBase(BaseModel):
    name: str
    color: str = "#3c6e90"
    archived: bool = False
    favorite: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    archived: bool | None = None
    favorite: bool | None = None


class Project(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ProjectWithCounts(Project):
    task_counts: TaskCounts


class TaskBase(BaseModel):
    title: str
    description: str = ""
    status: TaskStatus = TaskStatus.backlog
    criticality: int = Field(default=3, ge=1, le=5)
    category: TaskCategory = TaskCategory.task
    due_at: datetime | None = None
    all_day: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    criticality: int | None = Field(default=None, ge=1, le=5)
    due_at: datetime | None = None
    all_day: bool | None = None
    project_id: int | None = None
    # Meetings only. True turns this (and future) meeting into a weekly series
    # starting from its due_at; False detaches it and drops future occurrences.
    recurring: bool | None = None
    # Manual on-demand archive/unarchive, independent of the completed_at rule.
    archived_at: datetime | None = None


class Task(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int | None
    recurrence_id: str | None = None
    completed_at: datetime | None = None
    archived_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class SeriesUpdate(BaseModel):
    title: str | None = None
    weekday: int = Field(ge=0, le=6)  # 0=Monday..6=Sunday
    time: str  # "HH:MM"
    all_day: bool | None = None


class MeetingCreate(BaseModel):
    title: str
    description: str = ""
    due_at: datetime
    all_day: bool = False
    # If set, generates a weekly-repeating series on the same weekday and time as due_at.
    recurring: bool = False


class ExternalEvent(BaseModel):
    id: str
    calendar: str
    calendar_color: str | None = None
    title: str
    start: datetime
    end: datetime
    all_day: bool
    location: str | None = None
    description: str | None = None


class ICloudCredentials(BaseModel):
    username: str
    app_password: str


class CalendarInfo(BaseModel):
    url: str
    name: str
    color: str | None = None


class TargetCalendarUpdate(BaseModel):
    # None stops writing meetings to Apple Calendar.
    url: str | None


class Preferences(BaseModel):
    # A preset name from the frontend's fjord-scene/presets.ts; the frontend
    # falls back to its default for names it doesn't know, so only the shape
    # is checked here. None clears the choice.
    scene: str | None = Field(default=None, max_length=40, pattern=r"^[a-z0-9-]+$")
