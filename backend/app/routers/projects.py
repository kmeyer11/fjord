from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _with_counts(project: models.Project) -> schemas.ProjectWithCounts:
    counts = schemas.TaskCounts()
    for task in project.tasks:
        setattr(counts, task.status.value, getattr(counts, task.status.value) + 1)
    return schemas.ProjectWithCounts(
        **schemas.Project.model_validate(project).model_dump(), task_counts=counts
    )


def _get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = db.get(models.Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("", response_model=list[schemas.ProjectWithCounts])
def list_projects(include_archived: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.Project)
    if not include_archived:
        query = query.filter(models.Project.archived.is_(False))
    query = query.order_by(models.Project.favorite.desc(), models.Project.id)
    return [_with_counts(p) for p in query.all()]


@router.post("", response_model=schemas.ProjectWithCounts, status_code=201)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    project = models.Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return _with_counts(project)


@router.get("/{project_id}", response_model=schemas.ProjectWithCounts)
def get_project(project_id: int, db: Session = Depends(get_db)):
    return _with_counts(_get_project_or_404(project_id, db))


@router.patch("/{project_id}", response_model=schemas.ProjectWithCounts)
def update_project(project_id: int, payload: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    project = _get_project_or_404(project_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return _with_counts(project)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = _get_project_or_404(project_id, db)
    db.delete(project)
    db.commit()


@router.get("/{project_id}/tasks", response_model=list[schemas.Task])
def list_project_tasks(project_id: int, db: Session = Depends(get_db)):
    _get_project_or_404(project_id, db)
    return (
        db.query(models.Task)
        .filter(models.Task.project_id == project_id)
        .order_by(models.Task.id)
        .all()
    )


@router.post("/{project_id}/tasks", response_model=schemas.Task, status_code=201)
def create_project_task(project_id: int, payload: schemas.TaskCreate, db: Session = Depends(get_db)):
    _get_project_or_404(project_id, db)
    task = models.Task(project_id=project_id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task
