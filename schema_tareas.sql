CREATE TABLE IF NOT EXISTS tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  asignado_a text,
  fecha date NOT NULL DEFAULT current_date,
  completada boolean DEFAULT false,
  completada_at timestamptz,
  completada_por text,
  prioridad text DEFAULT 'normal' CHECK (prioridad IN ('alta','normal','baja')),
  creada_por text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON tareas FOR ALL USING (true);
