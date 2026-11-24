import { useState } from 'react'
import { api } from '../lib/api'
import { resetMock } from '../lib/mockApi'
import { fmtDate } from '../lib/stats'
import { LIMITS, contextEmoji, contextLabel, type Play } from '../lib/types'
import { useStore } from '../store'
import { Stars } from './Stars'

const STATUS = { pending: 'En revisión', approved: 'En el libro', rejected: 'Rechazada' }

export default function ProfileView({ onLogin, onPropose, onOpenPlay }: { onLogin(): void; onPropose(): void; onOpenPlay(id: string): void }) {
  const { user, plays, book, executions, setUser, run, notify } = useStore()

  if (!user) {
    return (
      <div className="view">
        <header className="view-head"><h1>Tu perfil</h1><p>El libro se lee sin cuenta. Para escribir en él, hay que firmar.</p></header>
        <div className="card empty">
          <p className="hand">¿Quién anda ahí?</p>
          <p>Entrá para proponer jugadas, marcar las que hiciste y ver tu historial.</p>
          <button className="btn primary" onClick={onLogin}>Entrar o crear cuenta</button>
        </div>
        {api.mode === 'mock' && <DemoNote />}
      </div>
    )
  }

  const mine = plays.filter(p => p.author_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at))
  const history = executions.filter(e => e.user_id === user.id).sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
  const pending = plays.filter(p => p.status === 'pending').sort((a, b) => a.created_at.localeCompare(b.created_at))
  const titleOf = (id: string) => plays.find(p => p.id === id)?.title ?? 'Jugada eliminada'

  return (
    <div className="view">
      <header className="view-head">
        <h1>{user.username}{user.is_admin && <span className="badge gold">admin</span>}</h1>
        <p>{history.length} {history.length === 1 ? 'jugada ejecutada' : 'jugadas ejecutadas'} · {mine.filter(p => p.status === 'approved').length} en el libro</p>
      </header>

      {user.is_admin && (
        <section className="card">
          <div className="card-head"><h2>Solicitudes pendientes</h2>{pending.length > 0 && <span className="badge red">{pending.length}</span>}</div>
          {pending.length === 0
            ? <p className="muted">No hay nada para revisar. Todo en orden.</p>
            : <div className="reviews">{pending.map(p => <Review key={p.id} play={p} />)}</div>}
        </section>
      )}

      <section className="card">
        <div className="card-head"><h2>Mis propuestas</h2><button className="btn ghost small" onClick={onPropose}>+ Nueva</button></div>
        {mine.length === 0 ? <p className="muted">Todavía no propusiste ninguna jugada.</p> : (
          <ul className="list">
            {mine.map(p => (
              <li key={p.id}>
                <button disabled={p.status !== 'approved'} onClick={() => onOpenPlay(p.id)}>
                  <span className="list-main">
                    <span className="list-title">{p.title}</span>
                    {p.status === 'rejected' && p.reject_reason && <span className="list-sub">“{p.reject_reason}”</span>}
                  </span>
                  <span className={`badge ${p.status}`}>{STATUS[p.status]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-head"><h2>Mi historial</h2></div>
        {history.length === 0 ? <p className="muted">Cuando marques una jugada como hecha, aparece acá.</p> : (
          <ul className="list">
            {history.map(e => (
              <li key={e.id}>
                <div>
                  <span className="list-main">
                    <span className="list-title">{titleOf(e.play_id)}</span>
                    <span className="list-sub"><Stars value={e.rating} size={13} /> · {contextEmoji(e.context)} {contextLabel(e.context)} · {fmtDate(e.date)}{e.wingman && ' · con wingman'}</span>
                    {e.note && <span className="list-note hand">“{e.note}”</span>}
                  </span>
                  <button className="icon-btn" aria-label={`Borrar registro de ${titleOf(e.play_id)}`} onClick={() => { if (confirm('¿Borrar este registro?')) void run(() => api.deleteExecution(e.id), 'Registro borrado.') }}>🗑</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {user.is_admin && book.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Páginas del libro</h2><small>{book.length}</small></div>
          <ul className="list">
            {book.map((p, i) => (
              <li key={p.id}>
                <div>
                  <span className="list-main"><span className="list-title">{i + 1}. {p.title}</span><span className="list-sub">por {p.author_name}</span></span>
                  <button className="icon-btn" aria-label={`Quitar ${p.title} del libro`} onClick={() => { if (confirm(`¿Arrancar "${p.title}" del libro? Se borran también sus registros.`)) void run(() => api.deletePlay(p.id), 'Página arrancada.') }}>🗑</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="btn ghost" onClick={async () => { await api.signOut(); setUser(null); notify('Sesión cerrada.') }}>Cerrar sesión</button>
      {api.mode === 'mock' && <DemoNote />}
    </div>
  )
}

function Review({ play }: { play: Play }) {
  const { run } = useStore()
  const [title, setTitle] = useState(play.title)
  const [description, setDescription] = useState(play.description)
  const [busy, setBusy] = useState(false)
  const valid = title.trim().length >= 3 && description.trim().length >= 10

  const act = async (fn: () => Promise<void>, msg: string) => {
    setBusy(true)
    await run(fn, msg)
    setBusy(false)
  }

  return (
    <article className="review">
      <p className="review-by">de <b>{play.author_name}</b> · {fmtDate(play.created_at.slice(0, 10))}</p>
      <input value={title} onChange={e => setTitle(e.target.value)} maxLength={LIMITS.title} aria-label="Título" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} maxLength={LIMITS.description} aria-label="Descripción" />
      <div className="row">
        <button className="btn ghost danger grow" disabled={busy} onClick={() => {
          const reason = prompt('Motivo del rechazo (opcional, lo ve el autor):')
          if (reason !== null) void act(() => api.rejectPlay(play.id, reason.trim() || null), 'Propuesta rechazada.')
        }}>Rechazar</button>
        <button className="btn primary grow" disabled={busy || !valid} onClick={() => act(() => api.approvePlay(play.id, { title: title.trim(), description: description.trim() }), '¡Aprobada! Ya es una página del libro.')}>Aprobar</button>
      </div>
    </article>
  )
}

function DemoNote() {
  return (
    <div className="demo-box">
      <span>Modo demo: los datos viven sólo en este navegador. Con las variables de Supabase cargadas pasa a datos reales.</span>
      <div><button className="btn ghost small" onClick={() => { if (confirm('¿Volver a los datos de ejemplo?')) { resetMock(); location.reload() } }}>Reiniciar datos de ejemplo</button></div>
    </div>
  )
}
