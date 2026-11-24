import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export interface BookPage {
  key: string
  kind: 'cover' | 'paper'
  node: ReactNode
}

interface Props {
  pages: BookPage[]
  current: number
  onChange(i: number): void
}

interface Drag { index: number; p: number; forward: boolean }

/**
 * Libro de una sola página visible (pensado para celular en vertical).
 * Cada hoja gira sobre el lomo (borde izquierdo). --p va de 0 (plana) a 1 (dada vuelta)
 * y es una custom property registrada, así el giro y las sombras se animan juntos.
 */
export default function Book({ pages, current, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [top, setTop] = useState<number | null>(null) // hoja en movimiento: va arriba de todo
  const gesture = useRef<{ x: number; y: number; t: number; locked: boolean; dead: boolean } | null>(null)
  const moved = useRef(false)
  const last = pages.length - 1

  const go = useCallback((to: number) => {
    const next = Math.max(0, Math.min(last, to))
    if (next === current) return
    // Salto largo (desde el índice): sin animar hoja por hoja.
    setTop(Math.abs(next - current) === 1 ? Math.min(next, current) : null)
    onChange(next)
  }, [current, last, onChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return
      if (e.key === 'ArrowRight') go(current + 1)
      if (e.key === 'ArrowLeft') go(current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, current])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    moved.current = false
    gesture.current = { x: e.clientX, y: e.clientY, t: performance.now(), locked: false, dead: false }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || g.dead) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (!g.locked) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      const forward = dx < 0
      if (Math.abs(dy) > Math.abs(dx) || (forward ? current >= last : current <= 0)) {
        g.dead = true // scroll vertical o no hay más hojas
        return
      }
      g.locked = true
      moved.current = true
      ref.current?.setPointerCapture(e.pointerId)
      const index = forward ? current : current - 1
      setTop(index)
      setDrag({ index, p: forward ? 0 : 1, forward })
      return
    }
    // El borde libre de la hoja sigue al dedo: su posición es W·cos(ángulo).
    const w = ref.current?.clientWidth ?? 320
    setDrag(d => d && { ...d, p: Math.acos(Math.max(-1, Math.min(1, ((d.forward ? w : -w) + dx * 1.8) / w))) / Math.PI })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    gesture.current = null
    if (!g?.locked || !drag) return
    const speed = (e.clientX - g.x) / Math.max(1, performance.now() - g.t) // px/ms
    const flipped = drag.forward ? drag.p > 0.3 || speed < -0.4 : !(drag.p < 0.7 || speed > 0.4)
    setDrag(null)
    onChange(flipped ? drag.index + 1 : drag.index)
  }

  const onClick = (e: React.MouseEvent) => {
    if (moved.current) return
    if ((e.target as HTMLElement).closest('button, a, input, textarea, select, [data-noflip]')) return
    const r = ref.current!.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    if (current === 0 || x > 0.72) go(current + 1)
    else if (x < 0.28) go(current - 1)
  }

  const pOf = (i: number) => (drag?.index === i ? drag.p : i < current ? 1 : 0)

  return (
    <div
      ref={ref}
      className={`book${drag ? ' dragging' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
    >
      <div className="book-block" aria-hidden />
      {pages.map((page, i) => {
        // Sólo montamos las hojas cercanas.
        if (Math.abs(i - current) > 2 && i !== top) return null
        const p = pOf(i)
        const style = {
          '--p': p,
          '--prev': i > 0 ? pOf(i - 1) : 1,
          zIndex: i === top ? 3000 : i < current ? i : 2000 - i,
        } as React.CSSProperties
        return (
          <section
            key={page.key}
            className={`leaf ${page.kind}`}
            style={style}
            aria-hidden={i !== current}
            inert={i !== current}
            onTransitionEnd={e => { if (e.propertyName === '--p' && i === top && !drag) setTop(null) }}
          >
            <div className="leaf-front">
              {page.node}
              <div className="leaf-shade" />
              <div className="leaf-cast" />
            </div>
            <div className="leaf-back" />
          </section>
        )
      })}
    </div>
  )
}
