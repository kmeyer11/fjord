from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import TaskCategory, TaskStatus


class TaskCounts(BaseModel):
    backlog: int = 0
    scheduled: int = 0
    done: int = 0


class ProjectBase(BaseModel):
    name: str
    color: str = "#3c6e90"
    archived: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    archived: bool | None = None


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


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    criticality: int | None = Field(default=None, ge=1, le=5)
    due_at: datetime | None = None
    project_id: int | None = None


class Task(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int | None
    created_at: datetime
    updated_at: datetime


class MeetingCreate(BaseModel):
    title: str
    description: str = ""
    due_at: datetime


class ExternalEvent(BaseModel):
    id: str
    calendar: str
    title: str
    start: datetime
    end: datetime
    all_day: bool
    location: str | None = None
    description: str | None = None


class ICloudCredentials(BaseModel):
    username: str
    app_password: str
