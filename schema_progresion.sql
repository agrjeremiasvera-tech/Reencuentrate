-- ═══════════════════════════════════════════
--  PROGRESIÓN Y GRUPOS ALTOS
--  Ejecuta esto en Supabase SQL Editor
-- ═══════════════════════════════════════════

-- ETAPAS DEL TRATAMIENTO
CREATE TABLE IF NOT EXISTS etapas_tratamiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden integer NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  capacidades text[], -- ej: ['Confianza','Autonomía']
  duracion_aprox text,
  created_at timestamptz DEFAULT now()
);

-- PROGRESIÓN DEL PACIENTE
CREATE TABLE IF NOT EXISTS progresion_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  etapa_id uuid REFERENCES etapas_tratamiento(id),
  fecha_inicio date NOT NULL,
  fecha_evaluacion date,
  fecha_fin date,
  estado text DEFAULT 'activo' CHECK (estado IN ('activo','completado','devuelto')),
  motivo_movimiento text,
  registrado_por text,
  created_at timestamptz DEFAULT now()
);

-- GRUPO ALTO - MIEMBROS
CREATE TABLE IF NOT EXISTS grupo_alto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha_ingreso date NOT NULL,
  fecha_egreso date,
  activo boolean DEFAULT true,
  ingresado_por text,
  created_at timestamptz DEFAULT now()
);

-- GRUPO ALTO - REUNIONES
CREATE TABLE IF NOT EXISTS grupo_alto_reuniones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  asistentes text[],
  observaciones_casa text,
  created_at timestamptz DEFAULT now()
);

-- GRUPO ALTO - INFORMES Y TAREAS
CREATE TABLE IF NOT EXISTS grupo_alto_tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reunion_id uuid REFERENCES grupo_alto_reuniones(id) ON DELETE CASCADE,
  miembro_id uuid REFERENCES pacientes(id), -- quien del grupo alto
  paciente_asignado_id uuid REFERENCES pacientes(id), -- compañero grupo bajo
  informe text,
  tarea_asignada text,
  plan_accion text,
  completada boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- SEGURIDAD
ALTER TABLE etapas_tratamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresion_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_alto ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_alto_reuniones ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_alto_tareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth only" ON etapas_tratamiento FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth only" ON progresion_paciente FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth only" ON grupo_alto FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth only" ON grupo_alto_reuniones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth only" ON grupo_alto_tareas FOR ALL USING (auth.role() = 'authenticated');

-- ETAPAS PRECARGADAS
INSERT INTO etapas_tratamiento (orden, nombre, descripcion, capacidades, duracion_aprox) VALUES
(0, 'Compromiso Existencial', 'Etapa de adaptación e introspección. El paciente reflexiona y genera un compromiso genuino al cambio.', ARRAY['Introspección','Compromiso al cambio'], '7-10 días'),
(1, 'Grupo 4', 'Primera etapa de tratamiento. Se trabaja la base del carácter sano.', ARRAY['Confianza','Autonomía'], '1.5-2 meses'),
(2, 'Grupo 3', 'Segunda etapa. Se trabaja la energía y productividad personal.', ARRAY['Iniciativa','Industriosidad'], '1.5-2 meses'),
(3, 'Grupo 2', 'Tercera etapa. Se trabaja la identidad y el compromiso con uno mismo.', ARRAY['Identidad','Compromiso'], '1.5-2 meses'),
(4, 'Grupo 1', 'Cuarta etapa. Se trabaja la proyección hacia los demás.', ARRAY['Generatividad','Resolución de Conflicto'], '1.5-2 meses'),
(5, 'Comisión Ejecutiva', 'Evaluación oral ante psicólogo, terapeuta y director. Requisito para pasar a Nivel 1.', ARRAY['Evaluación integral'], 'Evaluación'),
(6, 'Nivel 1', 'Primera etapa de consolidación. Mayor autonomía y responsabilidades.', ARRAY['Consolidación'], '1-2 meses'),
(7, 'Nivel 2', 'Preparación para la reinserción. Más libertades y responsabilidades.', ARRAY['Preparación reinserción'], '1-2 meses'),
(8, 'Nivel 3', 'Reinserción laboral. Sale a trabajar y vuelve al centro los fines de semana.', ARRAY['Reinserción laboral'], '1-2 meses'),
(9, 'Reinserción Social', 'Etapa final. Egreso gradual y vuelta a la vida en comunidad.', ARRAY['Reinserción social','Egreso'], 'Variable')
ON CONFLICT DO NOTHING;

