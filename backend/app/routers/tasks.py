from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _get_task_or_404(task_id: int, db: Session) -> models.Task:
    task = db.get(models.Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("", response_model=list[schemas.Task])
def list_tasks(status: models.TaskStatus | None = None, db: Session = Depends(get_db)):
    """All tasks across every project — the calendar view and its backlog panel
    need a cross-project list, unlike the per-project listing under /api/projects."""
    query = db.query(models.Task)
    if status is not None:
        query = query.filter(models.Task.status == status)
    return query.order_by(models.Task.id).all()


@router.get("/{task_id}", response_model=schemas.Task)
def get_task(task_id: int, db: Session = Depends(get_db)):
    return _get_task_or_404(task_id, db)


@router.patch("/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = _get_task_or_404(task_id, db)
    updates = payload.model_dump(exclude_unset=True)
    if "project_id" in updates and db.get(models.Project, updates["project_id"]) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in updates.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = _get_task_or_404(task_id, db)
    db.delete(task)
    db.commit()
