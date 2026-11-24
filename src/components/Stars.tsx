export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  // Estrellas de sólo lectura; admite promedios (relleno parcial).
  const pct = Math.max(0, Math.min(100, (value / 5) * 100))
  return (
    <span className="stars" style={{ fontSize: size }} role="img" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
      <span className="stars-off">★★★★★</span>
      <span className="stars-on" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  )
}

export function StarInput({ value, onChange }: { value: number; onChange(v: number): void }) {
  const labels = ['', 'Desastre', 'Flojo', 'Zafó', 'Muy bien', '¡Legendario!']
  return (
    <div className="star-input">
      <div role="radiogroup" aria-label="Puntaje de aceptación">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
            className={n <= value ? 'on' : ''}
            onClick={() => onChange(n)}
          >★</button>
        ))}
      </div>
      <span className="star-label">{labels[value] || 'Tocá para puntuar'}</span>
    </div>
  )
}
