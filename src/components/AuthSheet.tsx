import { useState } from 'react'
import { api } from '../lib/api'
import { DEMO_ACCOUNTS } from '../lib/mockApi'
import { useStore } from '../store'
import Sheet from './Sheet'

export default function AuthSheet({ reason, onClose, onDone }: { reason?: string; onClose(): void; onDone?(): void }) {
  const { setUser, notify } = useStore()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enter(fn: () => ReturnType<typeof api.signUp>) {
    setBusy(true)
    setError(null)
    try {
      const u = await fn()
      if (!u) {
        notify('Te mandamos un mail para confirmar la cuenta.')
        onClose()
        return
      }
      setUser(u)
      notify(`¡Bienvenido, ${u.username}!`)
      onClose()
      onDone?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar.')
    } finally {
      setBusy(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const name = username.trim()
    if (mode === 'up' && !/^[a-zA-Z0-9_.]{2,24}$/.test(name)) {
      setError('El usuario lleva de 2 a 24 letras, números, punto o guion bajo.')
      return
    }
    void enter(() => (mode === 'in' ? api.signIn(email, password) : api.signUp(email, password, name)))
  }

  return (
    <Sheet title={mode === 'in' ? 'Entrar' : 'Crear cuenta'} onClose={onClose}>
      {reason && <p className="hint">{reason}</p>}
      <div className="segmented">
        <button className={mode === 'in' ? 'on' : ''} onClick={() => { setMode('in'); setError(null) }}>Ya tengo cuenta</button>
        <button className={mode === 'up' ? 'on' : ''} onClick={() => { setMode('up'); setError(null) }}>Soy nuevo</button>
      </div>
      <form onSubmit={submit} className="form">
        {mode === 'up' && (
          <label>Usuario
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="como te van a ver en el libro" autoCapitalize="none" autoComplete="username" maxLength={24} required />
          </label>
        )}
        <label>Mail
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" required />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Un segundo…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}</button>
      </form>
      {api.mode === 'mock' && (
        <div className="demo-box">
          <span>Modo demo · entrar rápido como</span>
          <div>
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.email} className="btn ghost small" disabled={busy} onClick={() => enter(() => api.signIn(a.email, a.password))}>{a.label}</button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}
