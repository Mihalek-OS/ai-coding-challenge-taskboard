import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import * as api from './api'
import {
  AlertIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  CloseIcon,
  EditIcon,
  InboxIcon,
  ListIcon,
  LogoIcon,
  PlusIcon,
  TrashIcon,
} from './icons'
import { TaskForm } from './TaskForm'
import { STATUSES, type Status, type Task, type TaskInput } from './types'

const STATUS_META: Record<Status, { tone: string; icon: ReactNode; hint: string }> = {
  'To Do': { tone: 'todo', icon: <CircleIcon />, hint: 'New tasks land here' },
  'In Progress': { tone: 'progress', icon: <ClockIcon />, hint: 'Nothing in flight right now' },
  Done: { tone: 'done', icon: <CheckCircleIcon />, hint: 'Finished work shows up here' },
}

type FormState = { mode: 'create' } | { mode: 'edit'; task: Task } | null

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)

  function notify(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2800)
  }

  const load = useCallback(async () => {
    try {
      setTasks(await api.listTasks())
    } catch {
      setError('Could not reach the backend. Is it running on port 8000?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!form) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setForm(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [form])

  async function run(action: () => Promise<unknown>, success?: string) {
    setError('')
    let failure = ''
    try {
      await action()
    } catch (e) {
      failure = e instanceof Error ? e.message : 'Action failed.'
    }
    await load() // always resync with the backend, even after a failed request
    if (failure) setError(failure)
    else if (success) notify(success)
  }

  async function save(input: TaskInput) {
    if (!form) return
    const creating = form.mode === 'create'
    try {
      if (creating) await api.createTask(input)
      else await api.updateTask(form.task.id, input)
    } catch (e) {
      await load() // keep the board in sync; the form shows the error
      throw e
    }
    setForm(null)
    await load()
    notify(creating ? 'Task created' : 'Task updated')
  }

  const kpis = [
    { label: 'Total tasks', value: tasks.length, tone: 'blue', icon: <ListIcon />, note: 'Across all columns' },
    {
      label: 'In progress',
      value: tasks.filter((t) => t.status === 'In Progress').length,
      tone: 'violet',
      icon: <ClockIcon />,
      note: 'Currently being worked on',
    },
    {
      label: 'Done',
      value: tasks.filter((t) => t.status === 'Done').length,
      tone: 'green',
      icon: <CheckCircleIcon />,
      note: 'Completed tasks',
    },
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">
            <LogoIcon />
          </span>
          <div>
            <h1>Taskboard</h1>
            <p className="subtitle">Plan, track and ship your team&apos;s work</p>
          </div>
        </div>
        <button className="btn primary" onClick={() => setForm({ mode: 'create' })}>
          <PlusIcon /> New task
        </button>
      </header>

      <section className="kpis" aria-label="Dashboard">
        {kpis.map((k) => (
          <div className={`card kpi ${k.tone}`} key={k.label}>
            <span className="kpi-icon">{k.icon}</span>
            <div className="kpi-body">
              <span className="kpi-label">{k.label}</span>
              <span className="kpi-value">{loading ? '–' : k.value}</span>
              <span className="kpi-note">{k.note}</span>
            </div>
            <span className="kpi-bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        ))}
      </section>

      {error && (
        <p className="banner error" role="alert">
          <AlertIcon />
          <span>{error}</span>
          <button className="icon-btn" aria-label="Dismiss error" onClick={() => setError('')}>
            <CloseIcon />
          </button>
        </p>
      )}

      <main className="board">
        {STATUSES.map((status) => {
          const items = tasks.filter((t) => t.status === status)
          const meta = STATUS_META[status]
          return (
            <section className={`column ${meta.tone}`} key={status} aria-label={status}>
              <h2>
                <span className="col-icon">{meta.icon}</span>
                {status} <span className="count">{items.length}</span>
              </h2>
              {items.length === 0 &&
                (loading ? (
                  <div className="skeleton" role="status" aria-label="Loading">
                    <span />
                    <span />
                  </div>
                ) : (
                  <div className="empty">
                    <span className="empty-icon">
                      <InboxIcon />
                    </span>
                    <strong>No tasks</strong>
                    <span>{meta.hint}</span>
                  </div>
                ))}
              {items.map((t) => (
                <article className={`card task ${meta.tone}`} key={t.id}>
                  <div className="task-head">
                    <h3>{t.title}</h3>
                    <span className={`badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                  </div>
                  {t.description && <p className="desc">{t.description}</p>}
                  <div className="task-foot">
                    <select
                      aria-label={`Status of ${t.title}`}
                      value={t.status}
                      onChange={(e) =>
                        run(() => api.updateTask(t.id, { status: e.target.value as Status }), 'Status updated')
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button className="btn small" onClick={() => setForm({ mode: 'edit', task: t })}>
                      <EditIcon /> Edit
                    </button>
                    <button
                      className="btn small danger"
                      onClick={() => run(() => api.deleteTask(t.id), 'Task deleted')}
                    >
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )
        })}
      </main>

      {form && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setForm(null)}>
          <div
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-label={form.mode === 'edit' ? 'Edit task' : 'New task'}
          >
            <TaskForm
              task={form.mode === 'edit' ? form.task : undefined}
              onSubmit={save}
              onCancel={() => setForm(null)}
            />
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          <CheckCircleIcon /> {toast}
        </div>
      )}
    </div>
  )
}
