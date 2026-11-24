import { agg, fmtAvg, successRate } from '../lib/stats'
import type { Execution, Play } from '../lib/types'
import { Stars } from './Stars'

export function CoverPage({ count }: { count: number }) {
  return (
    <div className="cover">
      <div className="cover-frame">
        <div className="cover-orn" aria-hidden>❦</div>
        <h1><span>The</span>Playbook</h1>
        <div className="cover-rule" aria-hidden />
        <p className="cover-sub">Jugadas probadas<br />para toda ocasión</p>
        <div className="cover-foot">
          <span>{count} jugadas · edición digital</span>
        </div>
      </div>
      <p className="cover-hint">Deslizá para abrir ›</p>
    </div>
  )
}

export function IntroPage() {
  return (
    <div className="paper-inner intro">
      <p className="kicker">Prólogo</p>
      <h2 className="page-title small">Cómo se usa<br />este libro</h2>
      <ol className="typed rules">
        <li>Cada página es una jugada. Pasalas deslizando, como un libro de verdad.</li>
        <li>Cualquiera puede proponer una jugada. Entra al libro sólo si el admin la aprueba.</li>
        <li>¿Ejecutaste una? Tocá <b>¡Jugada hecha!</b> y puntuala del 1 al 5.</li>
        <li>Todo queda anotado. Las estadísticas no mienten.</li>
      </ol>
      <p className="hand sign">Úselo con responsabilidad.</p>
      <PageFoot n="i" />
    </div>
  )
}

export function IndexPage({ plays, offset, first, roman, onJump }: { plays: Play[]; offset: number; first: boolean; roman: string; onJump(playIndex: number): void }) {
  return (
    <div className="paper-inner">
      <p className="kicker">{first ? 'Contenido' : 'Contenido (cont.)'}</p>
      <h2 className="page-title small">Índice</h2>
      <ul className="index typed">
        {plays.map((p, i) => (
          <li key={p.id}>
            <button onClick={() => onJump(offset + i)}>
              <span className="index-title">{p.title}</span>
              <span className="index-dots" aria-hidden />
              <span className="index-n">{offset + i + 1}</span>
            </button>
          </li>
        ))}
      </ul>
      <PageFoot n={roman} />
    </div>
  )
}

interface PlayPageProps {
  play: Play
  n: number
  executions: Execution[]
  mine: number
  onDone(): void
}

export function PlayPage({ play, n, executions, mine, onDone }: PlayPageProps) {
  const { count, avg } = agg(executions)
  return (
    <div className="paper-inner play">
      <p className="kicker">Jugada N.º {String(n).padStart(2, '0')}</p>
      <h2 className="page-title">{play.title}</h2>
      <div className="title-rule" aria-hidden><span>✦</span></div>
      <div className="play-body typed" data-noflip>
        {play.description}
        <p className="hand author">— propuesta por {play.author_name}</p>
      </div>
      <div className="play-foot">
        {count > 0 ? (
          <div className="play-stats">
            <div className="stamp" aria-label={`Tasa de éxito ${successRate(avg)} por ciento`}>
              <small>Tasa de éxito</small>
              <b>{successRate(avg)}%</b>
            </div>
            <div className="play-numbers">
              <span><Stars value={avg} size={17} /> <b>{fmtAvg(avg)}</b></span>
              <span>{count} {count === 1 ? 'vez ejecutada' : 'veces ejecutada'}</span>
              {mine > 0 && <span className="hand mine">vos: {mine} {mine === 1 ? 'vez' : 'veces'} ✓</span>}
            </div>
          </div>
        ) : (
          <div className="play-stats">
            <div className="stamp virgin"><small>Estado</small><b>Sin estrenar</b></div>
            <div className="play-numbers"><span>Nadie la probó todavía.</span><span className="hand mine">¿te animás?</span></div>
          </div>
        )}
        <button className="btn ink" onClick={onDone}>¡Jugada hecha!</button>
      </div>
      <PageFoot n={String(n)} />
    </div>
  )
}

export function EndPage({ empty, onPropose }: { empty: boolean; onPropose(): void }) {
  return (
    <div className="paper-inner end">
      <p className="kicker">{empty ? 'Página en blanco' : 'Continuará'}</p>
      <h2 className="page-title small">{empty ? 'El libro está vacío' : '¿Tenés una jugada mejor?'}</h2>
      <p className="typed">Este libro se escribe entre todos. Proponé la tuya: si el admin la aprueba, se gana su propia página.</p>
      <button className="btn ink" onClick={onPropose}>Proponer una jugada</button>
      <p className="hand sign">Fin… por ahora.</p>
    </div>
  )
}

function PageFoot({ n }: { n: string }) {
  return <div className="page-foot" aria-hidden>— {n} —</div>
}
