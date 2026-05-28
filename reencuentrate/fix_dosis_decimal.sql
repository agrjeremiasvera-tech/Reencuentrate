-- Arreglar columnas de dosis para aceptar decimales
ALTER TABLE farmacos 
  ALTER COLUMN dosis_manana TYPE numeric USING dosis_manana::numeric,
  ALTER COLUMN dosis_tarde TYPE numeric USING dosis_tarde::numeric,
  ALTER COLUMN dosis_noche TYPE numeric USING dosis_noche::numeric;
