import { createMockApi } from './mockApi'
import { createSupabaseApi } from './supabaseApi'
import type { Api } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Con las variables de entorno cargadas usa Supabase; si no, modo demo en localStorage.
export const api: Api = url && key ? createSupabaseApi(url, key) : createMockApi()
