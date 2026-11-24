import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Api, Execution, Play, Profile } from './types'

const ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Mail o contraseña incorrectos.',
  'User already registered': 'Ese mail ya está registrado.',
  'Email not confirmed': 'Confirmá tu mail antes de entrar.',
}
function fail(error: { message: string; code?: string }): never {
  if (error.code === '23505') throw new Error('Ese nombre de usuario ya existe.')
  throw new Error(ERRORS[error.message] ?? error.message)
}

export function createSupabaseApi(url: string, anonKey: string): Api {
  const sb: SupabaseClient = createClient(url, anonKey)

  async function profile(id: string): Promise<Profile | null> {
    const { data, error } = await sb.from('profiles').select('id, username, is_admin').eq('id', id).maybeSingle()
    if (error) fail(error)
    return data
  }

  return {
    mode: 'supabase',
    async getSession() {
      const { data } = await sb.auth.getSession()
      return data.session ? profile(data.session.user.id) : null
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) fail(error)
      const p = await profile(data.user.id)
      if (!p) throw new Error('No se encontró tu perfil.')
      return p
    },
    async signUp(email, password, username) {
      const { data: taken } = await sb.from('profiles').select('id').ilike('username', username).maybeSingle()
      if (taken) throw new Error('Ese nombre de usuario ya existe.')
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username } } })
      if (error) fail(error)
      // Con confirmación por mail activada no hay sesión todavía.
      if (!data.session || !data.user) return null
      return profile(data.user.id)
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async listPlays() {
      // RLS decide qué filas ve cada uno.
      const { data, error } = await sb.from('plays')
        .select('id, title, description, status, author_id, reject_reason, created_at, approved_at, profiles(username)')
      if (error) fail(error)
      return (data ?? []).map(({ profiles, ...p }: any): Play => ({ ...p, author_name: profiles?.username ?? 'anónimo' }))
    },
    async listExecutions() {
      const { data, error } = await sb.from('executions')
        .select('id, play_id, user_id, rating, context, date, wingman, note, created_at, profiles(username)')
        .order('date', { ascending: false })
        .limit(5000)
      if (error) fail(error)
      return (data ?? []).map(({ profiles, ...e }: any): Execution => ({ ...e, username: profiles?.username ?? 'anónimo' }))
    },
    async proposePlay(title, description) {
      const { error } = await sb.from('plays').insert({ title, description })
      if (error) fail(error)
    },
    async approvePlay(id, edits) {
      const { data: cur } = await sb.from('plays').select('approved_at').eq('id', id).maybeSingle()
      const { error } = await sb.from('plays')
        .update({ ...edits, status: 'approved', reject_reason: null, approved_at: cur?.approved_at ?? new Date().toISOString() })
        .eq('id', id)
      if (error) fail(error)
    },
    async rejectPlay(id, reason) {
      const { error } = await sb.from('plays').update({ status: 'rejected', reject_reason: reason, approved_at: null }).eq('id', id)
      if (error) fail(error)
    },
    async deletePlay(id) {
      const { error } = await sb.from('plays').delete().eq('id', id)
      if (error) fail(error)
    },
    async addExecution(e) {
      const { error } = await sb.from('executions').insert(e)
      if (error) fail(error)
    },
    async deleteExecution(id) {
      const { error } = await sb.from('executions').delete().eq('id', id)
      if (error) fail(error)
    },
  }
}
