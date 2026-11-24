import type { Api, Execution, NewExecution, Play, Profile } from './types'

// Backend de mentira: todo vive en localStorage. Misma interfaz que Supabase.
const KEY = 'playbook.mock.v2'
const SESSION = 'playbook.mock.session'

interface MockUser extends Profile { email: string; password: string }
interface Db { users: MockUser[]; plays: Omit<Play, 'author_name'>[]; executions: Omit<Execution, 'username'>[] }

export const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@playbook.app', password: 'admin123' },
  { label: 'Usuario', email: 'tincho@playbook.app', password: 'demo123' },
]

const uid = () => crypto.randomUUID()
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5)
const iso = (d: Date) => d.toISOString()
const day = (d: Date) => d.toISOString().slice(0, 10)

function seed(): Db {
  const users: MockUser[] = [
    { id: 'u-admin', username: 'admin', is_admin: true, email: 'admin@playbook.app', password: 'admin123' },
    { id: 'u-tincho', username: 'tincho', is_admin: false, email: 'tincho@playbook.app', password: 'demo123' },
    { id: 'u-fede', username: 'fede', is_admin: false, email: 'fede@playbook.app', password: 'demo123' },
    { id: 'u-maru', username: 'maru', is_admin: false, email: 'maru@playbook.app', password: 'demo123' },
  ]
  const p = (i: number, author: string, title: string, description: string, status: Play['status'] = 'approved') => ({
    id: `p-${i}`, title, description, status, author_id: author, reject_reason: null,
    created_at: iso(daysAgo(200 - i * 9)), approved_at: status === 'approved' ? iso(daysAgo(199 - i * 9)) : null,
  })
  const plays = [
    p(1, 'u-admin', 'El Turista Perdido', 'Mapa de papel en mano (clave: de papel), cara de desorientado y acento indescifrable.\n\n1. Preguntá cómo llegar a un lugar que queda a media cuadra.\n2. Agradecé con exagerada emoción.\n3. Invitá un trago "como se hace en mi país".\n\nNadie le dice que no a alguien que viajó 12.000 km.'),
    p(2, 'u-tincho', 'El Arquitecto', 'Mirá un edificio cualquiera con profunda concentración. Suspirá. Decí en voz alta: "qué lástima lo que hicieron con esa cornisa".\n\nCuando pregunten, explicá que sos arquitecto. No hace falta serlo. Hace falta creérselo.'),
    p(3, 'u-fede', 'El Cumpleañero', 'Hoy es tu cumpleaños. Siempre es tu cumpleaños.\n\n1. El wingman pide que canten.\n2. Vos te hacés el sorprendido.\n3. Alguien se acerca a saludar.\n\nRiesgo: que te pidan el DNI.'),
    p(4, 'u-maru', 'La Apuesta', 'Acercate con un amigo y decí: "Perdón, necesitamos que definas una apuesta".\n\nLa apuesta puede ser cualquier cosa: si el tomate es fruta, cuántas provincias hay, quién baila peor. Lo importante es que el jurado quede comprometido con el veredicto… y con el festejo.'),
    p(5, 'u-admin', 'El Mago Jubilado', 'Sacá una moneda. Mirala con nostalgia. Guardala.\n\n"Me prometí que no iba a hacer más magia."\n\nDejá que insistan tres veces. A la tercera, hacé el único truco que sabés. Retirate invicto.'),
    p(6, 'u-tincho', 'El Perro Prestado', 'Pedile el perro a un amigo. Salí a pasear por el parque más concurrido.\n\nEl perro hace el 90% del trabajo. Vos sólo tenés que saber su nombre, su edad y una anécdota tierna. Estudiá antes de salir.'),
    p(7, 'u-fede', 'El Brindis Equivocado', 'Levantá la copa en la mesa de al lado y dedicá un brindis sentido a "Carlos y Mariana, por estos diez años".\n\nCuando te digan que no son Carlos y Mariana, pedí disculpas y preguntá a quién sí hay que brindar.'),
    p(8, 'u-maru', 'El Corresponsal', 'Micrófono en mano (sirve un cepillo): "Estamos haciendo una nota sobre la mejor noche de la ciudad, ¿nos dan su testimonio?".\n\nNo hay cámara. No hay canal. Hay charla asegurada.'),
    p(9, 'u-tincho', 'El Sommelier', 'Olfateá tu vaso de fernet con seriedad absoluta. Describí notas de roble, cuero y "un final largo a quiosco".\n\nSi alguien se ríe, ya ganaste.', 'pending'),
    p(10, 'u-fede', 'El Doble de Riesgo', 'Entrá rengueando. Cuando pregunten, explicá con humildad que es "de la última película".', 'pending'),
  ]
  // Historial determinístico para que las stats tengan algo que mostrar.
  const ctxs = ['bar', 'boliche', 'fiesta', 'trabajo', 'facu', 'app', 'viaje', 'calle']
  const who = ['u-tincho', 'u-fede', 'u-maru', 'u-admin']
  const notes = ['Funcionó mejor de lo esperado.', 'Casi me descubren.', null, null, 'Legendario.', null, 'Nunca más.', null]
  let s = 7
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const executions = Array.from({ length: 64 }, (_, i) => {
    const playIdx = Math.floor(rnd() * 8) + 1
    const d = daysAgo(Math.floor(rnd() * 170))
    const bias = [0, 4.3, 3.2, 3.8, 4.6, 2.6, 4.8, 3.4, 3.9][playIdx]
    return {
      id: `e-${i}`, play_id: `p-${playIdx}`, user_id: who[Math.floor(rnd() * who.length)],
      rating: Math.max(1, Math.min(5, Math.round(bias + (rnd() - 0.5) * 2.4))),
      context: ctxs[Math.floor(rnd() * rnd() * ctxs.length)],
      date: day(d), wingman: rnd() > 0.55, note: notes[Math.floor(rnd() * notes.length)], created_at: iso(d),
    }
  })
  return { users, plays, executions }
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* storage roto o bloqueado: arrancamos de cero */ }
  const db = seed()
  save(db)
  return db
}
function save(db: Db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* modo privado */ }
}
const toProfile = ({ id, username, is_admin }: MockUser): Profile => ({ id, username, is_admin })
const wait = <T,>(v: T) => new Promise<T>(r => setTimeout(() => r(v), 180))

export function resetMock() {
  localStorage.removeItem(KEY)
  localStorage.removeItem(SESSION)
}

export function createMockApi(): Api {
  const me = (db: Db) => {
    const id = localStorage.getItem(SESSION)
    return db.users.find(u => u.id === id) ?? null
  }
  const requireUser = (db: Db) => {
    const u = me(db)
    if (!u) throw new Error('Tenés que iniciar sesión.')
    return u
  }
  const requireAdmin = (db: Db) => {
    const u = requireUser(db)
    if (!u.is_admin) throw new Error('Sólo el admin puede hacer esto.')
    return u
  }
  const name = (db: Db, id: string) => db.users.find(u => u.id === id)?.username ?? 'anónimo'

  return {
    mode: 'mock',
    async getSession() {
      const u = me(load())
      return wait(u ? toProfile(u) : null)
    },
    async signIn(email, password) {
      const u = load().users.find(u => u.email === email.trim().toLowerCase() && u.password === password)
      if (!u) throw new Error('Mail o contraseña incorrectos.')
      localStorage.setItem(SESSION, u.id)
      return wait(toProfile(u))
    },
    async signUp(email, password, username) {
      const db = load()
      email = email.trim().toLowerCase()
      if (db.users.some(u => u.email === email)) throw new Error('Ese mail ya está registrado.')
      if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) throw new Error('Ese usuario ya existe.')
      const u: MockUser = { id: uid(), username, is_admin: false, email, password }
      db.users.push(u)
      save(db)
      localStorage.setItem(SESSION, u.id)
      return wait(toProfile(u))
    },
    async signOut() {
      localStorage.removeItem(SESSION)
    },
    async listPlays() {
      const db = load()
      const u = me(db)
      return wait(db.plays
        .filter(p => p.status === 'approved' || p.author_id === u?.id || u?.is_admin)
        .map(p => ({ ...p, author_name: name(db, p.author_id) })))
    },
    async listExecutions() {
      const db = load()
      return wait(db.executions.map(e => ({ ...e, username: name(db, e.user_id) })))
    },
    async proposePlay(title, description) {
      const db = load()
      const u = requireUser(db)
      db.plays.push({ id: uid(), title, description, status: 'pending', author_id: u.id, reject_reason: null, created_at: new Date().toISOString(), approved_at: null })
      save(db)
      return wait(undefined)
    },
    async approvePlay(id, edits) {
      const db = load()
      requireAdmin(db)
      const p = db.plays.find(p => p.id === id)
      if (!p) throw new Error('La jugada no existe.')
      Object.assign(p, edits, { status: 'approved', reject_reason: null, approved_at: p.approved_at ?? new Date().toISOString() })
      save(db)
      return wait(undefined)
    },
    async rejectPlay(id, reason) {
      const db = load()
      requireAdmin(db)
      const p = db.plays.find(p => p.id === id)
      if (!p) throw new Error('La jugada no existe.')
      Object.assign(p, { status: 'rejected', reject_reason: reason, approved_at: null })
      save(db)
      return wait(undefined)
    },
    async deletePlay(id) {
      const db = load()
      requireAdmin(db)
      db.plays = db.plays.filter(p => p.id !== id)
      db.executions = db.executions.filter(e => e.play_id !== id)
      save(db)
      return wait(undefined)
    },
    async addExecution(e: NewExecution) {
      const db = load()
      const u = requireUser(db)
      db.executions.push({ ...e, id: uid(), user_id: u.id, created_at: new Date().toISOString() })
      save(db)
      return wait(undefined)
    },
    async deleteExecution(id) {
      const db = load()
      const u = requireUser(db)
      db.executions = db.executions.filter(e => e.id !== id || (e.user_id !== u.id && !u.is_admin))
      save(db)
      return wait(undefined)
    },
  }
}
