import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from './lib/api'
import type { Execution, Play, Profile } from './lib/types'

interface Store {
  user: Profile | null
  plays: Play[]
  /** Aprobadas, en orden de página. */
  book: Play[]
  executions: Execution[]
  loading: boolean
  error: string | null
  toast: string | null
  notify(msg: string): void
  setUser(u: Profile | null): void
  refresh(): Promise<void>
  /** Ejecuta una mutación, refresca y avisa. Devuelve true si salió bien. */
  run(fn: () => Promise<void>, okMsg?: string): Promise<boolean>
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => useContext(Ctx)!

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Profile | null>(null)
  const [plays, setPlays] = useState<Play[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const notify = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [p, e] = await Promise.all([api.listPlays(), api.listExecutions()])
      setPlays(p)
      setExecutions(e)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el playbook.')
    }
  }, [])

  useEffect(() => {
    (async () => {
      try { setUserState(await api.getSession()) } catch { /* seguimos como invitado */ }
      await refresh()
      setLoading(false)
    })()
  }, [refresh])

  const setUser = useCallback((u: Profile | null) => {
    setUserState(u)
    void refresh() // lo visible depende de quién mira
  }, [refresh])

  const run = useCallback(async (fn: () => Promise<void>, okMsg?: string) => {
    try {
      await fn()
      await refresh()
      if (okMsg) notify(okMsg)
      return true
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Algo salió mal.')
      return false
    }
  }, [refresh, notify])

  const book = useMemo(
    () => plays.filter(p => p.status === 'approved')
      .sort((a, b) => (a.approved_at ?? '').localeCompare(b.approved_at ?? '')),
    [plays],
  )

  return (
    <Ctx.Provider value={{ user, plays, book, executions, loading, error, toast, notify, setUser, refresh, run }}>
      {children}
    </Ctx.Provider>
  )
}
