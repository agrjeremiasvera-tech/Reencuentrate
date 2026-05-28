-- Agrega campo RUT y fecha de nacimiento a pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS rut text;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fecha_nacimiento date;
