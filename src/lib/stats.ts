import type { Execution } from './types'

export interface Agg { count: number; avg: number }

export function agg(list: Execution[]): Agg {
  const count = list.length
  return { count, avg: count ? list.reduce((s, e) => s + e.rating, 0) / count : 0 }
}

export function groupBy<T>(list: T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const x of list) {
    const k = key(x)
    const arr = m.get(k)
    if (arr) arr.push(x)
    else m.set(k, [x])
  }
  return m
}

/** Tasa de éxito al estilo del libro: promedio de estrellas llevado a porcentaje. */
export const successRate = (avg: number) => Math.round((avg / 5) * 100)

export const fmtAvg = (n: number) => n.toFixed(1).replace('.', ',')

export function lastMonths(n: number): { key: string; label: string }[] {
  const out = []
  const d = new Date()
  d.setDate(1)
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push({
      key: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`,
      label: m.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
    })
  }
  return out
}

export const fmtDate = (isoDay: string) =>
  new Date(isoDay + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
