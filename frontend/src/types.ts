export const STATUSES = ['To Do', 'In Progress', 'Done'] as const
export const PRIORITIES = ['Low', 'Medium', 'High'] as const
export type Status = (typeof STATUSES)[number]
export type Priority = (typeof PRIORITIES)[number]

export interface Task {
  id: number
  title: string
  description: string
  priority: Priority
  status: Status
}

export type TaskInput = Omit<Task, 'id'>
