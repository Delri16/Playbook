import { useMemo, useState } from 'react'
import { agg, fmtAvg, groupBy, lastMonths, successRate } from '../lib/stats'
import { CONTEXTS, contextEmoji, contextLabel } from '../lib/types'
import { useStore } from '../store'
import { Stars } from './Stars'

type Period = 'all' | '30' | '90' | 'year'
const PERIODS: { id: Period; label: string }[] = [
  { id: 'all', label: 'Siempre' },
  { id: '30', label: '30 días' },
  { id: '90', label: '90 días' },
  { id: 'year', label: 'Este año' },
]

export default function StatsView({ onOpenPlay }: { onOpenPlay(playId: string): void }) {
  const { executions, book, user } = useStore()
  const [period, setPeriod] = useState<Period>('all')
  const [context, setContext] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [sort, setSort] = useState<'avg' | 'count'>('avg')

  const bookIds = useMemo(() => new Map(book.map((p, i) => [p.id, { play: p, n: i + 1 }])), [book])

  // Todo menos el filtro de contexto: así el desglose por contexto sirve de selector.
  const base = useMemo(() => {
    const now = new Date()
    const from =
      period === 'all' ? '' :
      period === 'year' ? `${now.getFullYear()}-01-01` :
      new Date(now.getTime() - Number(period) * 864e5).toISOString().slice(0, 10)
    return executions.filter(e =>
      bookIds.has(e.play_id) && e.date >= from && (!onlyMine || e.user_id === user?.id))
  }, [executions, bookIds, period, onlyMine, user])

  const list = useMemo(() => (context ? base.filter(e => e.context === context) : base), [base, context])
  const total = agg(list)

  const byPlay = useMemo(() => [...groupBy(list, e => e.play_id)]
    .map(([id, l]) => ({ ...bookIds.get(id)!, ...agg(l) }))
    .sort((a, b) => (sort === 'avg' ? b.avg - a.avg || b.count - a.count : b.count - a.count || b.avg - a.avg)),
  [list, bookIds, sort])

  const byContext = useMemo(() => {
    const g = groupBy(base, e => e.context)
    return CONTEXTS.map(c => ({ id: c.id as string, ...agg(g.get(c.id) ?? []) })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)
  }, [base])

  const byStar = useMemo(() => [5, 4, 3, 2, 1].map(s => ({ s, count: list.filter(e => e.rating === s).length })), [list])

  const months = useMemo(() => {
    const g = groupBy(list, e => e.date.slice(0, 7))
    return lastMonths(6).map(m => ({ ...m, count: g.get(m.key)?.length ?? 0 }))
  }, [list])

  const players = useMemo(() => [...groupBy(list, e => e.user_id)]
    .map(([id, l]) => ({ id, username: l[0].username, ...agg(l) }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg).slice(0, 8), [list])

  const wingman = list.filter(e => e.wingman)
  const solo = list.filter(e => !e.wingman)
  const maxCtx = Math.max(1, ...byContext.map(c => c.count))
  const maxStar = Math.max(1, ...byStar.map(c => c.count))
  const maxMonth = Math.max(1, ...months.map(m => m.count))

  return (
    <div className="view">
      <header className="view-head">
        <h1>Estadísticas</h1>
        <p>Los números detrás de cada jugada.</p>
      </header>

      <div className="filters">
        <div className="scroll-row" role="group" aria-label="Período">
          {PERIODS.map(p => (
            <button key={p.id} className={`pill${period === p.id ? ' on' : ''}`} aria-pressed={period === p.id} onClick={() => setPeriod(p.id)}>{p.label}</button>
          ))}
          {user && (
            <button className={`pill${onlyMine ? ' on' : ''}`} aria-pressed={onlyMine} onClick={() => setOnlyMine(v => !v)}>Sólo las mías</button>
          )}
        </div>
        <div className="scroll-row" role="group" aria-label="Contexto">
          <button className={`pill${!context ? ' on' : ''}`} aria-pressed={!context} onClick={() => setContext('')}>Todo contexto</button>
          {CONTEXTS.map(c => (
            <button key={c.id} className={`pill${context === c.id ? ' on' : ''}`} aria-pressed={context === c.id} onClick={() => setContext(context === c.id ? '' : c.id)}>
              <span aria-hidden>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      {total.count === 0 ? (
        <div className="card empty">
          <p className="hand">Nada por acá.</p>
          <p>No hay jugadas ejecutadas con estos filtros.</p>
        </div>
      ) : (
        <>
          <div className="kpis">
            <div className="card kpi"><b>{total.count}</b><span>ejecuciones</span></div>
            <div className="card kpi"><b>{fmtAvg(total.avg)}<i>★</i></b><span>promedio</span></div>
            <div className="card kpi"><b>{successRate(total.avg)}%</b><span>tasa de éxito</span></div>
          </div>

          <section className="card">
            <div className="card-head">
              <h2>Ranking</h2>
              <div className="segmented mini">
                <button className={sort === 'avg' ? 'on' : ''} onClick={() => setSort('avg')}>Mejores</button>
                <button className={sort === 'count' ? 'on' : ''} onClick={() => setSort('count')}>Más hechas</button>
              </div>
            </div>
            <ol className="rank">
              {byPlay.map((r, i) => (
                <li key={r.play.id}>
                  <button onClick={() => onOpenPlay(r.play.id)}>
                    <span className="rank-n">{i + 1}</span>
                    <span className="rank-main">
                      <span className="rank-title">{r.play.title}</span>
                      <span className="rank-sub"><Stars value={r.avg} size={13} /> {fmtAvg(r.avg)} · {r.count} {r.count === 1 ? 'vez' : 'veces'}</span>
                    </span>
                    <span className="rank-go" aria-hidden>pág. {r.n} ›</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className="card">
            <div className="card-head"><h2>Por contexto</h2><small>tocá para filtrar</small></div>
            <ul className="bars">
              {byContext.map(c => (
                <li key={c.id}>
                  <button className={context && context !== c.id ? 'dim' : ''} onClick={() => setContext(context === c.id ? '' : c.id)}>
                    <span className="bar-label"><span aria-hidden>{contextEmoji(c.id)}</span> {contextLabel(c.id)}</span>
                    <span className="bar-track"><span className="bar-fill" style={{ width: `${(c.count / maxCtx) * 100}%` }} /></span>
                    <span className="bar-value">{c.count} <small>· {fmtAvg(c.avg)}★</small></span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="card-head"><h2>Cómo salieron</h2></div>
            <ul className="bars static">
              {byStar.map(r => (
                <li key={r.s}>
                  <div>
                    <span className="bar-label narrow">{r.s} ★</span>
                    <span className="bar-track"><span className="bar-fill" style={{ width: `${(r.count / maxStar) * 100}%` }} /></span>
                    <span className="bar-value">{r.count}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="card-head"><h2>Actividad</h2><small>últimos 6 meses</small></div>
            <div className="columns" role="img" aria-label={`Ejecuciones por mes: ${months.map(m => `${m.label} ${m.count}`).join(', ')}`}>
              {months.map(m => (
                <div key={m.key} className="column">
                  <span className="column-value">{m.count}</span>
                  <span className="column-bar" style={{ height: `${(m.count / maxMonth) * 100}%` }} />
                  <span className="column-label">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h2>¿Wingman o solo?</h2></div>
            <div className="versus">
              <div><span>Con wingman</span><b>{wingman.length ? `${fmtAvg(agg(wingman).avg)}★` : '—'}</b><small>{wingman.length} {wingman.length === 1 ? 'vez' : 'veces'}</small></div>
              <div><span>En solitario</span><b>{solo.length ? `${fmtAvg(agg(solo).avg)}★` : '—'}</b><small>{solo.length} {solo.length === 1 ? 'vez' : 'veces'}</small></div>
            </div>
          </section>

          {!onlyMine && (
            <section className="card">
              <div className="card-head"><h2>Salón de la fama</h2></div>
              <ol className="rank plain">
                {players.map((p, i) => (
                  <li key={p.id}>
                    <div>
                      <span className="rank-n">{i + 1}</span>
                      <span className="rank-main">
                        <span className="rank-title">{p.username}{p.id === user?.id && <em> (vos)</em>}</span>
                        <span className="rank-sub">{p.count} {p.count === 1 ? 'jugada' : 'jugadas'} · {fmtAvg(p.avg)}★ promedio</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  )
}
