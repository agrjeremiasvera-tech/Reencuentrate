-- Ejecuta esto en Supabase para arreglar/crear usuario Yerman
DELETE FROM usuarios WHERE nombre ILIKE '%yerman%';

INSERT INTO usuarios (nombre, password_hash, activo, permisos)
VALUES (
  'Yerman',
  'rc2024_150196',
  true,
  '{"pacientes":true,"farmacologia":true,"agenda":true,"pases":true,"inventario":true,"mascota":true,"equipo":true}'
);
