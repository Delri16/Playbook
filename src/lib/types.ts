export type PlayStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  username: string
  is_admin: boolean
}

export interface Play {
  id: string
  title: string
  description: string
  status: PlayStatus
  author_id: string
  author_name: string
  reject_reason: string | null
  created_at: string
  approved_at: string | null
}

export interface Execution {
  id: string
  play_id: string
  user_id: string
  username: string
  rating: number
  context: string
  date: string // YYYY-MM-DD
  wingman: boolean
  note: string | null
  created_at: string
}

export interface NewExecution {
  play_id: string
  rating: number
  context: string
  date: string
  wingman: boolean
  note: string | null
}

export interface Api {
  mode: 'mock' | 'supabase'
  getSession(): Promise<Profile | null>
  signIn(email: string, password: string): Promise<Profile>
  /** Devuelve null si la cuenta quedó pendiente de confirmación por mail. */
  signUp(email: string, password: string, username: string): Promise<Profile | null>
  signOut(): Promise<void>
  /** Todas las jugadas visibles para el usuario actual (aprobadas + propias + todas si es admin). */
  listPlays(): Promise<Play[]>
  listExecutions(): Promise<Execution[]>
  proposePlay(title: string, description: string): Promise<void>
  approvePlay(id: string, edits: { title: string; description: string }): Promise<void>
  rejectPlay(id: string, reason: string | null): Promise<void>
  deletePlay(id: string): Promise<void>
  addExecution(e: NewExecution): Promise<void>
  deleteExecution(id: string): Promise<void>
}

export const CONTEXTS = [
  { id: 'bar', label: 'Bar', emoji: '🍺' },
  { id: 'boliche', label: 'Boliche', emoji: '🪩' },
  { id: 'fiesta', label: 'Fiesta', emoji: '🎉' },
  { id: 'trabajo', label: 'Trabajo', emoji: '💼' },
  { id: 'facu', label: 'Facultad', emoji: '🎓' },
  { id: 'app', label: 'App de citas', emoji: '📱' },
  { id: 'viaje', label: 'Viaje', emoji: '✈️' },
  { id: 'calle', label: 'En la calle', emoji: '🚶' },
  { id: 'otro', label: 'Otro', emoji: '🎲' },
] as const

export const contextLabel = (id: string) => CONTEXTS.find(c => c.id === id)?.label ?? id
export const contextEmoji = (id: string) => CONTEXTS.find(c => c.id === id)?.emoji ?? '🎲'

export const LIMITS = { title: 60, description: 700, note: 280 }

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
