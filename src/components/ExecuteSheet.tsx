import { useState } from 'react'
import { api } from '../lib/api'
import { CONTEXTS, LIMITS, todayISO, type Play } from '../lib/types'
import { useStore } from '../store'
import Sheet from './Sheet'
import { StarInput } from './Stars'

const LAST_CTX = 'playbook.lastContext'
const remembered = () => {
  try { return localStorage.getItem(LAST_CTX) ?? '' } catch { return '' }
}

export default function ExecuteSheet({ play, onClose }: { play: Play; onClose(): void }) {
  const { run } = useStore()
  const [rating, setRating] = useState(0)
  const [context, setContext] = useState(remembered)
  const [date, setDate] = useState(todayISO)
  const [wingman, setWingman] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = rating > 0 && !!context && !!date && date <= todayISO()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!ok) return
    setBusy(true)
    try { localStorage.setItem(LAST_CTX, context) } catch { /* sin storage */ }
    const done = await run(
      () => api.addExecution({ play_id: play.id, rating, context, date, wingman, note: note.trim() || null }),
      rating === 5 ? '¡Legen… dario! Anotada.' : 'Jugada anotada.',
    )
    setBusy(false)
    if (done) onClose()
  }

  return (
    <Sheet title="¡Jugada hecha!" onClose={onClose}>
      <p className="sheet-play">{play.title}</p>
      <form onSubmit={submit} className="form">
        <fieldset>
          <legend>¿Qué tal salió?</legend>
          <StarInput value={rating} onChange={setRating} />
        </fieldset>
        <fieldset>
          <legend>¿Dónde?</legend>
          <div className="chips">
            {CONTEXTS.map(c => (
              <button key={c.id} type="button" className={`chip${context === c.id ? ' on' : ''}`} aria-pressed={context === c.id} onClick={() => setContext(c.id)}>
                <span aria-hidden>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label>¿Cuándo?
          <input type="date" value={date} max={todayISO()} onChange={e => setDate(e.target.value)} required />
        </label>
        <label className="toggle">
          <input type="checkbox" checked={wingman} onChange={e => setWingman(e.target.checked)} />
          <span className="toggle-track" aria-hidden />
          Con wingman
        </label>
        <label>Anécdota <em>(opcional)</em>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={LIMITS.note} placeholder="Para la posteridad…" />
        </label>
        <button className="btn primary" disabled={!ok || busy}>{busy ? 'Anotando…' : 'Anotar en el libro'}</button>
      </form>
    </Sheet>
  )
}
