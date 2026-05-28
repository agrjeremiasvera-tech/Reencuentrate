-- ═══════════════════════════════════════════
--  REENCUÉNTRATE v3 — Inventario con grupos/subgrupos
--  Ejecuta esto en el SQL Editor de Supabase
-- ═══════════════════════════════════════════

-- GRUPOS (Bodega grande, Herramientas, Loza, etc.)
create table if not exists inv_grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  created_at timestamptz default now()
);

-- SUBGRUPOS (Abarrotes, Limpieza, Refrigerador, etc.)
create table if not exists inv_subgrupos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references inv_grupos(id) on delete cascade,
  nombre text not null,
  created_at timestamptz default now()
);

-- PRODUCTOS
create table if not exists inv_productos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references inv_grupos(id) on delete cascade,
  subgrupo_id uuid references inv_subgrupos(id) on delete set null,
  nombre text not null,
  stock_actual numeric default 0,
  unidad text default 'unidad',
  alerta_minima numeric default 3,
  es_consumible boolean default true,
  created_at timestamptz default now()
);

-- MOVIMIENTOS DE PRODUCTOS
create table if not exists inv_movimientos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references inv_productos(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso','egreso')),
  cantidad numeric not null,
  stock_resultante numeric,
  descripcion text,
  usuario text,
  fecha date default current_date,
  created_at timestamptz default now()
);

-- SEGURIDAD
alter table inv_grupos enable row level security;
alter table inv_subgrupos enable row level security;
alter table inv_productos enable row level security;
alter table inv_movimientos enable row level security;

create policy "auth only" on inv_grupos for all using (auth.role() = 'authenticated');
create policy "auth only" on inv_subgrupos for all using (auth.role() = 'authenticated');
create policy "auth only" on inv_productos for all using (auth.role() = 'authenticated');
create policy "auth only" on inv_movimientos for all using (auth.role() = 'authenticated');

-- GRUPOS INICIALES basados en tu inventario
insert into inv_grupos (nombre, descripcion) values
  ('Bodega grande', 'Stock principal de insumos y alimentos'),
  ('Bodega chica', 'Lo que está en uso en la casa'),
  ('Herramientas y equipos', 'Herramientas, equipos de gimnasio, electrodomésticos'),
  ('Loza y cocina', 'Vajilla, utensilios y equipamiento de cocina'),
  ('Ropa de cama y baño', 'Sábanas, cobertores, toallas, cortinas'),
  ('Oficina y clínica', 'Artículos de oficina y materiales clínicos'),
  ('Panadería', 'Ingredientes y producción de pan')
on conflict do nothing;

-- SUBGRUPOS INICIALES
insert into inv_subgrupos (grupo_id, nombre)
select g.id, s.nombre from inv_grupos g
cross join (values
  ('Bodega grande', 'Abarrotes'),
  ('Bodega grande', 'Artículos de limpieza'),
  ('Bodega grande', 'Higiene personal'),
  ('Bodega grande', 'Congelados'),
  ('Bodega chica', 'Refrigerador'),
  ('Bodega chica', 'En uso cocina'),
  ('Bodega chica', 'En uso limpieza'),
  ('Herramientas y equipos', 'Herramientas jardín'),
  ('Herramientas y equipos', 'Equipamiento gimnasio'),
  ('Herramientas y equipos', 'Electrodomésticos')
) as s(grupo, nombre)
where g.nombre = s.grupo
on conflict do nothing;

