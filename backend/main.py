import os
import sqlite3
from contextlib import asynccontextmanager, closing
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

Priority = Literal["Low", "Medium", "High"]
Status = Literal["To Do", "In Progress", "Done"]


def db_path() -> str:
    return os.environ.get("TASKBOARD_DB", str(Path(__file__).with_name("tasks.db")))


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with closing(connect()) as conn, conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                priority TEXT NOT NULL DEFAULT 'Medium',
                status TEXT NOT NULL DEFAULT 'To Do'
            )"""
        )


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Taskboard API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _clean_title(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("title must not be empty")
    return v


class TaskCreate(BaseModel):
    title: str
    description: str = ""
    priority: Priority = "Medium"
    status: Status = "To Do"

    _title = field_validator("title")(_clean_title)


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: Priority | None = None
    status: Status | None = None

    @field_validator("title")
    @classmethod
    def _title(cls, v: str | None) -> str:
        if v is None:
            raise ValueError("title must not be null")
        return _clean_title(v)

    @field_validator("description", "priority", "status")
    @classmethod
    def _not_null(cls, v):
        if v is None:
            raise ValueError("value must not be null")
        return v


class Task(BaseModel):
    id: int
    title: str
    description: str
    priority: Priority
    status: Status


def _get(conn: sqlite3.Connection, task_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return row


@app.get("/tasks", response_model=list[Task])
def list_tasks():
    with closing(connect()) as conn:
        return [dict(r) for r in conn.execute("SELECT * FROM tasks ORDER BY id")]


@app.post("/tasks", response_model=Task, status_code=201)
def create_task(task: TaskCreate):
    with closing(connect()) as conn, conn:
        cur = conn.execute(
            "INSERT INTO tasks (title, description, priority, status) VALUES (?, ?, ?, ?)",
            (task.title, task.description, task.priority, task.status),
        )
        return dict(_get(conn, cur.lastrowid))


@app.patch("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, patch: TaskUpdate):
    changes = patch.model_dump(exclude_unset=True)
    with closing(connect()) as conn, conn:
        _get(conn, task_id)
        if changes:
            sets = ", ".join(f"{k} = ?" for k in changes)
            conn.execute(f"UPDATE tasks SET {sets} WHERE id = ?", (*changes.values(), task_id))
        return dict(_get(conn, task_id))


@app.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    with closing(connect()) as conn, conn:
        _get(conn, task_id)
        conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
