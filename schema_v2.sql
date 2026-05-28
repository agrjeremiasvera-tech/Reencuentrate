-- ═══════════════════════════════════════════
--  REENCUÉNTRATE v2.0 — Schema completo
--  IMPORTANTE: Ejecuta esto en el SQL Editor de Supabase
--  Si ya tienes la v1, este script agrega las tablas nuevas
-- ═══════════════════════════════════════════

-- ── USUARIOS DEL SISTEMA (sin correo, solo nombre+contraseña) ──
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  password_hash text not null,
  activo boolean default true,
  permisos jsonb default '{}',
  created_at timestamptz default now()
);

-- ── TURNOS DEL EQUIPO ──
create table if not exists turnos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id),
  nombre_usuario text,
  fecha_entrada timestamptz not null,
  fecha_salida timestamptz,
  notas text,
  created_at timestamptz default now()
);

-- ── FARMACOLOGÍA ──
create table if not exists farmacos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  nombre text not null,
  stock_unidades integer default 0,
  dosis_manana integer default 0,
  dosis_tarde integer default 0,
  dosis_noche integer default 0,
  hora_manana text,
  hora_tarde text,
  hora_noche text,
  es_sos boolean default false,
  estado text default 'activo' check (estado in ('activo','descontinuacion','descontinuado')),
  motivo text,
  fecha_ingreso date default current_date,
  notas text,
  created_at timestamptz default now()
);

-- ── INGRESOS DE FARMACOLOGÍA ──
create table if not exists farmacos_ingresos (
  id uuid primary key default gen_random_uuid(),
  farmaco_id uuid references farmacos(id) on delete cascade,
  paciente_id uuid references pacientes(id) on delete cascade,
  unidades integer not null,
  fecha date default current_date,
  notas text,
  created_at timestamptz default now()
);

-- ── PASTILLEROS ──
create table if not exists pastilleros (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  semana_inicio date not null,
  semana_fin date not null,
  confirmado boolean default false,
  confirmado_por text,
  confirmado_at timestamptz,
  created_at timestamptz default now()
);

-- ── ENTREGAS DE MEDICAMENTOS ──
create table if not exists entregas_medicamentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  turno text not null check (turno in ('manana','tarde','noche')),
  fecha date not null,
  entregado boolean default false,
  entregado_por text,
  entregado_at timestamptz,
  observaciones text,
  created_at timestamptz default now()
);

-- ── USO SOS ──
create table if not exists sos_usos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  farmaco_id uuid references farmacos(id) on delete cascade,
  fecha timestamptz default now(),
  motivo text,
  administrado_por text,
  created_at timestamptz default now()
);

-- ── PASES EXTERNOS ──
create table if not exists pases (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  fecha_salida timestamptz not null,
  fecha_regreso timestamptz not null,
  motivo text,
  estado text default 'pendiente' check (estado in ('pendiente','aprobado','rechazado','completado')),
  aprobado_por text,
  aprobado_at timestamptz,
  evaluacion_clinica text,
  notas text,
  created_at timestamptz default now()
);

-- ── CATEGORÍAS DE INVENTARIO ──
create table if not exists inventario_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text default 'fijo' check (tipo in ('fijo','consumible')),
  created_at timestamptz default now()
);

-- ── INVENTARIO ──
create table if not exists inventario (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid references inventario_categorias(id),
  nombre text not null,
  bodega text default 'grande' check (bodega in ('grande','chica','refrigerador','conservadora')),
  cantidad_actual numeric default 0,
  unidad text default 'unidad',
  alerta_minima numeric default 3,
  es_consumible boolean default false,
  notas text,
  created_at timestamptz default now()
);

-- ── MOVIMIENTOS DE INVENTARIO ──
create table if not exists inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  inventario_id uuid references inventario(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso','egreso','traspaso')),
  cantidad numeric not null,
  bodega_origen text,
  bodega_destino text,
  descripcion text,
  usuario text,
  fecha date default current_date,
  created_at timestamptz default now()
);

-- ── MASCOTA (cuenta corriente por paciente) ──
create table if not exists mascota (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  fecha date not null,
  descripcion text not null,
  tipo text not null check (tipo in ('ingreso','egreso')),
  monto integer not null,
  pagado boolean default false,
  pagado_at timestamptz,
  productos jsonb default '[]',
  created_at timestamptz default now()
);

-- ── INFORMES CLÍNICOS ──
create table if not exists informes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  titulo text not null,
  tipo text default 'psicologia' check (tipo in ('psicologia','psiquiatria','otro')),
  archivo_url text,
  archivo_nombre text,
  subido_por text,
  fecha date default current_date,
  notas text,
  created_at timestamptz default now()
);

-- ── CAMBIOS DE SARGENTO ──
create table if not exists sargentos (
  id uuid primary key default gen_random_uuid(),
  nombre_saliente text,
  nombre_entrante text not null,
  fecha timestamptz default now(),
  inventario_snapshot jsonb,
  notas text,
  created_at timestamptz default now()
);

-- ── AGENDA PSIQUIATRA ──
create table if not exists agenda_psiquiatra (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  profesional text,
  fecha date not null,
  hora time,
  estado text default 'programada' check (estado in ('programada','completada','cancelada')),
  notas text,
  created_at timestamptz default now()
);

-- ── AGENDA PSICÓLOGO ──
create table if not exists agenda_psicologo (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references pacientes(id) on delete cascade,
  profesional text,
  fecha date not null,
  hora time,
  estado text default 'programada' check (estado in ('programada','completada','cancelada')),
  notas text,
  created_at timestamptz default now()
);

-- ── SEGURIDAD ──
alter table if exists usuarios enable row level security;
alter table if exists turnos enable row level security;
alter table if exists farmacos enable row level security;
alter table if exists farmacos_ingresos enable row level security;
alter table if exists pastilleros enable row level security;
alter table if exists entregas_medicamentos enable row level security;
alter table if exists sos_usos enable row level security;
alter table if exists pases enable row level security;
alter table if exists inventario_categorias enable row level security;
alter table if exists inventario enable row level security;
alter table if exists inventario_movimientos enable row level security;
alter table if exists mascota enable row level security;
alter table if exists informes enable row level security;
alter table if exists sargentos enable row level security;
alter table if exists agenda_psiquiatra enable row level security;
alter table if exists agenda_psicologo enable row level security;

-- Políticas acceso autenticado
do $$ 
declare t text;
begin
  foreach t in array array['usuarios','turnos','farmacos','farmacos_ingresos','pastilleros',
    'entregas_medicamentos','sos_usos','pases','inventario_categorias','inventario',
    'inventario_movimientos','mascota','informes','sargentos','agenda_psiquiatra','agenda_psicologo']
  loop
    execute format('create policy "auth only" on %I for all using (auth.role() = ''authenticated'')', t);
  end loop;
end $$;

-- ── CATEGORÍAS POR DEFECTO ──
insert into inventario_categorias (nombre, tipo) values
  ('Ropa de cama', 'fijo'),
  ('Muebles y decoración', 'fijo'),
  ('Electrodomésticos', 'fijo'),
  ('Equipamiento gimnasio', 'fijo'),
  ('Herramientas', 'fijo'),
  ('Limpieza', 'consumible'),
  ('Alimentos secos', 'consumible'),
  ('Alimentos frescos', 'consumible'),
  ('Congelados', 'consumible'),
  ('Artículos de oficina', 'consumible'),
  ('Higiene personal', 'consumible'),
  ('Cocina y vajilla', 'fijo')
on conflict do nothing;

