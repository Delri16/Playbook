import { useCallback, useMemo, useState } from 'react'
import AuthSheet from './components/AuthSheet'
import Book, { type BookPage } from './components/Book'
import ExecuteSheet from './components/ExecuteSheet'
import { CoverPage, EndPage, IndexPage, IntroPage, PlayPage } from './components/Pages'
import ProfileView from './components/ProfileView'
import ProposeSheet from './components/ProposeSheet'
import StatsView from './components/StatsView'
import { groupBy } from './lib/stats'
import type { Play } from './lib/types'
import { useStore } from './store'

type Tab = 'book' | 'stats' | 'profile'
type Modal =
  | { type: 'auth'; reason?: string; then?: () => void }
  | { type: 'propose' }
  | { type: 'execute'; play: Play }
  | null

const INDEX_PER_PAGE = 9
const ROMAN = ['ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii']

export default function App() {
  const { user, book, plays, executions, loading, error, toast, refresh } = useStore()
  const [tab, setTab] = useState<Tab>('book')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState<Modal>(null)
  const close = useCallback(() => setModal(null), [])

  const indexPages = Math.max(1, Math.ceil(book.length / INDEX_PER_PAGE))
  const firstPlay = 2 + indexPages // tapa + prólogo + índice

  /** Acciones que requieren cuenta: si no hay sesión, primero el login y después sigue. */
  const withUser = useCallback((reason: string, action: () => void) => {
    if (user) action()
    else setModal({ type: 'auth', reason, then: action })
  }, [user])

  const propose = useCallback(
    () => withUser('Para proponer una jugada necesitás una cuenta.', () => setModal({ type: 'propose' })),
    [withUser],
  )

  const openPlay = useCallback((id: string) => {
    const i = book.findIndex(p => p.id === id)
    if (i < 0) return
    setPage(firstPlay + i)
    setTab('book')
  }, [book, firstPlay])

  const pages = useMemo<BookPage[]>(() => {
    const byPlay = groupBy(executions, e => e.play_id)
    return [
      { key: 'cover', kind: 'cover', node: <CoverPage count={book.length} /> },
      { key: 'intro', kind: 'paper', node: <IntroPage /> },
      ...Array.from({ length: indexPages }, (_, i): BookPage => ({
        key: `index-${i}`,
        kind: 'paper',
        node: (
          <IndexPage
            plays={book.slice(i * INDEX_PER_PAGE, (i + 1) * INDEX_PER_PAGE)}
            offset={i * INDEX_PER_PAGE}
            first={i === 0}
            roman={ROMAN[i] ?? String(i + 2)}
            onJump={n => setPage(firstPlay + n)}
          />
        ),
      })),
      ...book.map((play, i): BookPage => {
        const list = byPlay.get(play.id) ?? []
        return {
          key: play.id,
          kind: 'paper',
          node: (
            <PlayPage
              play={play}
              n={i + 1}
              executions={list}
              mine={user ? list.filter(e => e.user_id === user.id).length : 0}
              onDone={() => withUser('Para anotar una jugada necesitás una cuenta.', () => setModal({ type: 'execute', play }))}
            />
          ),
        }
      }),
      { key: 'end', kind: 'paper', node: <EndPage empty={book.length === 0} onPropose={propose} /> },
    ]
  }, [book, executions, user, indexPages, firstPlay, withUser, propose])

  const current = Math.min(page, pages.length - 1)
  const pendingCount = user?.is_admin ? plays.filter(p => p.status === 'pending').length : 0

  return (
    <div className="app">
      <main className="stage">
        {loading ? (
          <div className="splash"><div className="splash-book" /><p>Abriendo el libro…</p></div>
        ) : error && book.length === 0 ? (
          <div className="splash"><p>{error}</p><button className="btn primary" onClick={() => void refresh()}>Reintentar</button></div>
        ) : tab === 'book' ? (
          <div className="book-wrap">
            <Book pages={pages} current={current} onChange={setPage} />
            <div className="book-nav">
              <button className="icon-btn" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Página anterior">‹</button>
              <button className="book-pos" onClick={() => setPage(current <= 1 ? 2 : 0)} aria-label={current <= 1 ? 'Ir al índice' : 'Cerrar el libro'}>
                {current === 0 ? 'Tapa' : current >= firstPlay && current < firstPlay + book.length ? `${current - firstPlay + 1} / ${book.length}` : current === pages.length - 1 ? 'Fin' : 'Índice'}
              </button>
              <button className="icon-btn" disabled={current === pages.length - 1} onClick={() => setPage(current + 1)} aria-label="Página siguiente">›</button>
            </div>
          </div>
        ) : tab === 'stats' ? (
          <StatsView onOpenPlay={openPlay} />
        ) : (
          <ProfileView onLogin={() => setModal({ type: 'auth' })} onPropose={propose} onOpenPlay={openPlay} />
        )}
      </main>

      <nav className="tabbar" aria-label="Secciones">
        <button className={tab === 'book' ? 'on' : ''} onClick={() => setTab('book')}><span aria-hidden>📖</span>Playbook</button>
        <button className={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}><span aria-hidden>📊</span>Stats</button>
        <button className="tab-add" onClick={propose} aria-label="Proponer una jugada"><span aria-hidden>＋</span></button>
        <button className={tab === 'profile' ? 'on' : ''} onClick={() => setTab('profile')}>
          <span aria-hidden>{user?.is_admin ? '👑' : '👤'}</span>{user ? 'Perfil' : 'Entrar'}
          {pendingCount > 0 && <i className="dot">{pendingCount}</i>}
        </button>
      </nav>

      {modal?.type === 'auth' && <AuthSheet reason={modal.reason} onClose={close} onDone={modal.then} />}
      {modal?.type === 'propose' && <ProposeSheet onClose={close} />}
      {modal?.type === 'execute' && <ExecuteSheet play={modal.play} onClose={close} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
