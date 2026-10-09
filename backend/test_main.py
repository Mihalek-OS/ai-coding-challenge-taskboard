import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def db_file(tmp_path, monkeypatch):
    path = tmp_path / "test.db"
    monkeypatch.setenv("TASKBOARD_DB", str(path))
    return path


@pytest.fixture
def client(db_file):
    with TestClient(app) as c:
        yield c


def make(client, **kw):
    return client.post("/tasks", json={"title": "T", **kw})


def test_empty_list(client):
    assert client.get("/tasks").json() == []


def test_create_defaults(client):
    r = make(client)
    assert r.status_code == 201
    assert r.json() == {"id": 1, "title": "T", "description": "", "priority": "Medium", "status": "To Do"}


def test_create_trims_title_and_unique_ids(client):
    a = make(client, title="  Backend API  ", priority="High", description="d").json()
    b = make(client).json()
    assert a["title"] == "Backend API" and a["priority"] == "High" and a["description"] == "d"
    assert a["id"] != b["id"]
    assert [t["id"] for t in client.get("/tasks").json()] == [a["id"], b["id"]]


@pytest.mark.parametrize(
    "body",
    [
        {"title": ""},
        {"title": "   "},
        {},
        {"title": "x", "priority": "Urgent"},
        {"title": "x", "status": "Blocked"},
    ],
)
def test_create_invalid(client, body):
    assert client.post("/tasks", json=body).status_code == 422
    assert client.get("/tasks").json() == []


def test_patch_all_fields_keeps_id(client):
    tid = make(client).json()["id"]
    r = client.patch(f"/tasks/{tid}", json={"title": "New", "description": "x", "priority": "Low", "status": "Done"})
    assert r.status_code == 200
    assert r.json() == {"id": tid, "title": "New", "description": "x", "priority": "Low", "status": "Done"}
    assert client.get("/tasks").json() == [r.json()]


def test_patch_partial(client):
    tid = make(client, priority="High").json()["id"]
    r = client.patch(f"/tasks/{tid}", json={"status": "In Progress"}).json()
    assert r["status"] == "In Progress" and r["priority"] == "High" and r["title"] == "T"


@pytest.mark.parametrize(
    "body",
    [{"title": ""}, {"title": "  "}, {"title": None}, {"priority": "x"}, {"status": "x"}, {"status": None}],
)
def test_patch_invalid(client, body):
    tid = make(client).json()["id"]
    assert client.patch(f"/tasks/{tid}", json=body).status_code == 422
    assert client.get("/tasks").json()[0]["title"] == "T"


def test_not_found(client):
    assert client.patch("/tasks/999", json={"title": "x"}).status_code == 404
    assert client.delete("/tasks/999").status_code == 404


def test_delete(client):
    a = make(client).json()["id"]
    b = make(client).json()["id"]
    assert client.delete(f"/tasks/{a}").status_code == 204
    assert [t["id"] for t in client.get("/tasks").json()] == [b]
    assert client.delete(f"/tasks/{a}").status_code == 404


def test_persistence_across_restart(db_file):
    with TestClient(app) as c:
        tid = make(c, title="Keep", priority="High").json()["id"]
        c.patch(f"/tasks/{tid}", json={"status": "Done"})
    assert db_file.exists()
    with TestClient(app) as c:  # fresh startup, same DB file
        tasks = c.get("/tasks").json()
    assert tasks == [{"id": tid, "title": "Keep", "description": "", "priority": "High", "status": "Done"}]


def test_docs_available(client):
    assert client.get("/docs").status_code == 200
