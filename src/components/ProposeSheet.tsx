import { useState } from 'react'
import { api } from '../lib/api'
import { LIMITS } from '../lib/types'
import { useStore } from '../store'
import Sheet from './Sheet'

export default function ProposeSheet({ onClose }: { onClose(): void }) {
  const { run, user } = useStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = title.trim().length >= 3 && description.trim().length >= 10

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ok) return
    setBusy(true)
    const done = await run(
      () => api.proposePlay(title.trim(), description.trim()),
      user?.is_admin ? 'Propuesta creada. Aprobala desde tu perfil.' : '¡Enviada! El admin la tiene que aprobar.',
    )
    setBusy(false)
    if (done) onClose()
  }

  return (
    <Sheet title="Proponer una jugada" onClose={onClose}>
      <p className="hint">Cada jugada es una página del libro. Entra cuando el admin la aprueba.</p>
      <form onSubmit={submit} className="form">
        <label>Título
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="El Turista Perdido" maxLength={LIMITS.title} required />
          <small>{title.length}/{LIMITS.title}</small>
        </label>
        <label>Descripción
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Cómo se ejecuta, paso a paso…" rows={7} maxLength={LIMITS.description} required />
          <small>{description.length}/{LIMITS.description}</small>
        </label>
        <button className="btn primary" disabled={!ok || busy}>{busy ? 'Enviando…' : 'Enviar propuesta'}</button>
      </form>
    </Sheet>
  )
}
