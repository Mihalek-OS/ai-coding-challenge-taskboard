import type { Task, TaskInput } from './types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = body?.detail
    const message = typeof detail === 'string' ? detail : detail?.[0]?.msg?.replace('Value error, ', '')
    throw new Error(message ?? `Request failed (${res.status})`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const listTasks = () => request<Task[]>('/tasks')

export const createTask = (task: Partial<TaskInput>) =>
  request<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) })

export const updateTask = (id: number, patch: Partial<TaskInput>) =>
  request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })

export const deleteTask = (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' })
