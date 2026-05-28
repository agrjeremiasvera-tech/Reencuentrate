CREATE TABLE IF NOT EXISTS mi_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  fecha date NOT NULL DEFAULT current_date,
  prioridad text DEFAULT 'normal',
  categoria text,
  completada boolean DEFAULT false,
  completada_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mi_agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON mi_agenda FOR ALL USING (true);
