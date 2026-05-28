-- ═══════════════════════════════════════════
--  REENCUÉNTRATE — Esquema de base de datos
--  Pega todo esto en el SQL Editor de Supabase
-- ═══════════════════════════════════════════

-- PERFILES DE USUARIO
create table profiles (
  id uuid references auth.users primary key,
  nombre text,
  rol text default 'admin' check (rol in ('admin','clinico','administrativo')),
  created_at timestamptz default now()
);

-- PACIENTES
create table pacientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_ingreso date not null,
  mensualidad integer default 0,
  costo_psiquiatra integer default 50000,
  psicologo text,
  terapeuta_ocupacional text,
  diagnostico text,
  contacto_emergencia text,
  telefono_familiar text,
  proximo_pago date,
  pagado_mes boolean default false,
  activo boolean default true,
  created_at timestamptz default now()
);

-- MEDICAMENTOS
create table medicamentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  nombre text not null,
  dosis text,
  stock_dias integer default 30,
  alerta_dias integer default 7,
  notas text,
  created_at timestamptz default now()
);

-- SESIONES / AGENDA
create table sesiones (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  profesional text,
  tipo text,
  fecha date not null,
  hora time,
  estado text default 'Programada' check (estado in ('Programada','Completada','Cancelada')),
  notas text,
  created_at timestamptz default now()
);

-- MOVIMIENTOS FINANCIEROS
create table movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('ingreso','gasto')),
  monto integer not null,
  descripcion text,
  categoria text,
  fecha date not null,
  paciente_id uuid references pacientes(id) on delete set null,
  created_at timestamptz default now()
);

-- EQUIPO
create table equipo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cargo text,
  email text,
  telefono text,
  especialidad text,
  created_at timestamptz default now()
);

-- ── SEGURIDAD (Row Level Security) ──────────
alter table profiles enable row level security;
alter table pacientes enable row level security;
alter table medicamentos enable row level security;
alter table sesiones enable row level security;
alter table movimientos enable row level security;
alter table equipo enable row level security;

-- Políticas: solo usuarios autenticados pueden acceder
create policy "auth only" on profiles for all using (auth.role() = 'authenticated');
create policy "auth only" on pacientes for all using (auth.role() = 'authenticated');
create policy "auth only" on medicamentos for all using (auth.role() = 'authenticated');
create policy "auth only" on sesiones for all using (auth.role() = 'authenticated');
create policy "auth only" on movimientos for all using (auth.role() = 'authenticated');
create policy "auth only" on equipo for all using (auth.role() = 'authenticated');

-- ── TRIGGER: crear perfil al registrar usuario ──
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nombre, rol)
  values (new.id, new.email, 'admin');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
