from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import TaskPriority, TaskStatus


class TaskCounts(BaseModel):
    backlog: int = 0
    scheduled: int = 0
    done: int = 0


class ProjectBase(BaseModel):
    name: str
    color: str = "#6366f1"
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
    priority: TaskPriority = TaskPriority.medium
    due_at: datetime | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_at: datetime | None = None
    project_id: int | None = None


class Task(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
