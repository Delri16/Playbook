-- El Playbook — esquema Supabase. Pegar entero en el SQL Editor y ejecutar.

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique check (char_length(username) between 2 and 24),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.plays (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 60),
  description text not null check (char_length(description) between 10 and 700),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  author_id uuid not null default auth.uid() references public.profiles on delete cascade,
  reject_reason text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.executions (
  id uuid primary key default gen_random_uuid(),
  play_id uuid not null references public.plays on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  context text not null,
  date date not null default current_date,
  wingman boolean not null default false,
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now()
);

create index on public.plays (status, approved_at);
create index on public.executions (play_id);
create index on public.executions (user_id);

-- Perfil automático al registrarse (el username viaja en los metadatos del signUp)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'jugador_' || substr(new.id::text, 1, 6)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

alter table public.profiles enable row level security;
alter table public.plays enable row level security;
alter table public.executions enable row level security;

-- Perfiles: lectura pública (username en páginas y rankings). Nadie los edita desde el cliente.
create policy "profiles_read" on public.profiles for select using (true);

-- Jugadas: cualquiera ve las aprobadas; cada uno ve las suyas; el admin ve todo.
create policy "plays_read" on public.plays for select
  using (status = 'approved' or author_id = auth.uid() or public.is_admin());
-- Proponer: logueado, siempre entra como pendiente.
create policy "plays_propose" on public.plays for insert to authenticated
  with check (author_id = auth.uid() and status = 'pending' and approved_at is null and reject_reason is null);
-- Aprobar / rechazar / editar / borrar: sólo admin.
create policy "plays_admin_update" on public.plays for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "plays_admin_delete" on public.plays for delete to authenticated
  using (public.is_admin());

-- Ejecuciones: lectura pública (stats), cada uno registra y borra las suyas, sólo sobre jugadas aprobadas.
create policy "executions_read" on public.executions for select using (true);
create policy "executions_insert" on public.executions for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from public.plays p where p.id = play_id and p.status = 'approved'));
create policy "executions_delete" on public.executions for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Para hacerte admin (después de registrarte en la app):
--   update public.profiles set is_admin = true where username = 'TU_USUARIO';
