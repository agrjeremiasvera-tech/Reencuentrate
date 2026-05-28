-- Tabla de préstamos entre pacientes
CREATE TABLE IF NOT EXISTS prestamos_farmacos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  receptor_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  farmaco_nombre text NOT NULL,
  farmaco_id_prestador uuid REFERENCES farmacos(id) ON DELETE SET NULL,
  farmaco_id_receptor uuid REFERENCES farmacos(id) ON DELETE SET NULL,
  cantidad numeric NOT NULL,
  fecha date NOT NULL,
  notas text,
  devuelto boolean DEFAULT false,
  fecha_devolucion date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prestamos_farmacos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open" ON prestamos_farmacos FOR ALL USING (true);

-- Arreglar stock_unidades para decimales
ALTER TABLE farmacos 
ALTER COLUMN stock_unidades TYPE numeric USING stock_unidades::numeric;
