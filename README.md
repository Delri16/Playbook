# El Playbook

Un playbook digital, pensado para celular: tapa de cuero, hojas que se pasan como un libro, y estadísticas de cada jugada.

- **Sin cuenta** se puede leer todo el libro.
- **Con cuenta** se proponen jugadas (título + descripción) y se marcan como hechas: estrellas del 1 al 5, contexto, fecha (hoy por defecto), si fue con wingman y una anécdota opcional.
- **El admin** aprueba (pudiendo editar), rechaza o arranca páginas desde su perfil.
- **Stats** con filtros por período, contexto y "sólo las mías": ranking, desglose por contexto, distribución de estrellas, actividad mensual, wingman vs. solo y salón de la fama.

## Correrlo

```bash
npm install
npm run dev
```

Sin variables de entorno corre en **modo demo**: los datos viven en `localStorage` con jugadas de ejemplo.
Cuentas demo (también hay botones de acceso rápido en el login):

| Rol     | Mail                  | Contraseña |
| ------- | --------------------- | ---------- |
| Admin   | `admin@playbook.app`  | `admin123` |
| Usuario | `tincho@playbook.app` | `demo123`  |

## Conectar Supabase

1. Crear un proyecto y ejecutar `supabase/schema.sql` en el SQL Editor (tablas, trigger de perfil y políticas RLS).
2. Copiar `.env.example` a `.env.local` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Registrarte desde la app y hacerte admin:
   ```sql
   update public.profiles set is_admin = true where username = 'TU_USUARIO';
   ```

Con las variables cargadas la app usa Supabase automáticamente (`src/lib/api.ts`). Si la confirmación por mail está activada en Auth, el alta avisa que hay que confirmar antes de entrar.

## Estructura

- `src/lib/types.ts` — modelo, interfaz `Api` y lista de contextos.
- `src/lib/mockApi.ts` / `src/lib/supabaseApi.ts` — las dos implementaciones del backend.
- `src/components/Book.tsx` — el libro: giro 3D de hojas con arrastre, toque en los bordes y flechas del teclado.
- `src/components/Pages.tsx` — tapa, prólogo, índice, página de jugada y página final.
- `src/components/StatsView.tsx`, `ProfileView.tsx` — estadísticas y perfil/admin.
