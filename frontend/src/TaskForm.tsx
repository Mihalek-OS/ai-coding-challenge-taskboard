import { useState, type FormEvent } from 'react'
import { AlertIcon, EditIcon, PlusIcon } from './icons'
import { PRIORITIES, STATUSES, type Priority, type Status, type Task, type TaskInput } from './types'

interface Props {
  task?: Task
  onSubmit: (input: TaskInput) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ task, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'Medium')
  const [status, setStatus] = useState<Status>(task?.status ?? 'To Do')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('Title is required.')
    setBusy(true)
    try {
      await onSubmit({ title: title.trim(), description, priority, status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <header className="form-head">
        <span className="form-icon">{task ? <EditIcon /> : <PlusIcon />}</span>
        <div>
          <h2>{task ? 'Edit task' : 'New task'}</h2>
          <p>{task ? 'Update the details of this task.' : 'Add a task to your board.'}</p>
        </div>
      </header>
      <label>
        Title
        <input
          autoFocus
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setError('')
          }}
          placeholder="What needs to be done?"
          aria-invalid={!!error}
          aria-describedby={error ? 'form-error' : undefined}
        />
      </label>
      <label>
        <span>
          Description <span className="hint">(optional)</span>
        </span>
        <textarea rows={3} placeholder="Add some context…" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="row">
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p className="field-error" id="form-error" role="alert">
          <AlertIcon />
          {error}
        </p>
      )}
      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
