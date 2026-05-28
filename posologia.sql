-- ═══════════════════════════════════════════
--  POSOLOGÍA COMPLETA — Reencuéntrate
--  Ejecuta esto en Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Limpiar posología existente para evitar duplicados
DELETE FROM farmacos WHERE paciente_id IN (
  '5fd72e9f-3378-475f-b1a0-6eaf821c52b2',
  'e1530778-6a03-4e04-a00b-2b679f111c57',
  'b1ab0345-e00d-4f06-b642-d8025c0addc5',
  '539d556a-87af-42d8-b9fd-d89de0c8b340',
  '2c7dc06d-149e-47fc-b0e0-81a4870724a1',
  '705b5a0f-7df6-4d1c-b805-49e18ab0c6dd',
  'fae49470-d473-4cfc-919e-30ed54bbfbfe',
  'dfcdc0d3-615c-4589-a865-f399628a2083'
);

-- ── BENJAMIN IGNACIO MONRROY ──────────────────────────────────────
INSERT INTO farmacos (paciente_id, nombre, dosis_manana, dosis_tarde, dosis_noche, estado, es_sos, stock_unidades, fecha_ingreso) VALUES
('e1530778-6a03-4e04-a00b-2b679f111c57', 'Ácido Valproico 250mg', 1, 0, 1, 'activo', false, 0, '2026-05-01'),
('e1530778-6a03-4e04-a00b-2b679f111c57', 'Olanzapina 10mg', 0, 0, 1, 'activo', false, 0, '2026-05-01'),
('e1530778-6a03-4e04-a00b-2b679f111c57', 'Zopiclona 7.5mg', 0, 0, 1, 'activo', false, 0, '2026-05-01'),
('e1530778-6a03-4e04-a00b-2b679f111c57', 'Trazadona 100mg', 0, 0, 1, 'activo', false, 0, '2026-05-01'),
('e1530778-6a03-4e04-a00b-2b679f111c57', 'Sertralina 50mg', 1, 0, 0, 'activo', false, 0, '2026-05-01'),
('e1530778-6a03-4e04-a00b-2b679f111c57', 'Clotiazepan 10mg', 1, 0.5, 1, 'activo', false, 0, '2026-05-01');

-- ── DULCE CACEDA ──────────────────────────────────────────────────
INSERT INTO farmacos (paciente_id, nombre, dosis_manana, dosis_tarde, dosis_noche, estado, es_sos, stock_unidades, fecha_ingreso) VALUES
('b1ab0345-e00d-4f06-b642-d8025c0addc5', 'Quetiapina 100mg', 0, 0, 1.5, 'activo', false, 0, '2026-04-07'),
('b1ab0345-e00d-4f06-b642-d8025c0addc5', 'Fluoxetina 20mg', 2, 0, 0, 'activo', false, 0, '2026-04-07'),
('b1ab0345-e00d-4f06-b642-d8025c0addc5', 'Clotiazepan 5mg', 1, 0, 1, 'activo', false, 0, '2026-04-07'),
('b1ab0345-e00d-4f06-b642-d8025c0addc5', 'Suplemento Re Genesis', 1, 0, 0, 'activo', false, 0, '2026-04-07'),
('b1ab0345-e00d-4f06-b642-d8025c0addc5', 'Suplemento Beautip', 1, 0, 0, 'activo', false, 0, '2026-04-07'),
('b1ab0345-e00d-4f06-b642-d8025c0addc5', 'Armony', 0, 0, 10, 'activo', false, 0, '2026-04-07'),
('b1ab0345-e00d-4f06-b642-d8025c0addc5', 'Lamotrigina 50mg', 1, 0, 1, 'activo', false, 0, '2026-04-07');

-- ── ANDREA PAZ HERMOSILLA ─────────────────────────────────────────
INSERT INTO farmacos (paciente_id, nombre, dosis_manana, dosis_tarde, dosis_noche, estado, es_sos, stock_unidades, fecha_ingreso) VALUES
('5fd72e9f-3378-475f-b1a0-6eaf821c52b2', 'Quetiapina 100mg', 0, 0, 1, 'activo', false, 0, '2026-04-29'),
('5fd72e9f-3378-475f-b1a0-6eaf821c52b2', 'Clonazepam 2mg', 0, 0, 0.25, 'activo', false, 0, '2026-04-29'),
('5fd72e9f-3378-475f-b1a0-6eaf821c52b2', 'Sertralina 50mg', 1, 0, 0, 'activo', false, 0, '2026-04-29'),
('5fd72e9f-3378-475f-b1a0-6eaf821c52b2', 'Clotiazepan 5mg', 1, 0, 1, 'activo', false, 0, '2026-04-29'),
('5fd72e9f-3378-475f-b1a0-6eaf821c52b2', 'Lamotrigina 50mg', 1, 0, 1, 'activo', false, 0, '2026-04-29');

-- ── ORIANA ANDREA SALAZAR ─────────────────────────────────────────
INSERT INTO farmacos (paciente_id, nombre, dosis_manana, dosis_tarde, dosis_noche, estado, es_sos, stock_unidades, fecha_ingreso) VALUES
('fae49470-d473-4cfc-919e-30ed54bbfbfe', 'Venlafaxina 150mg', 1.5, 0, 0, 'activo', false, 0, '2026-04-22'),
('fae49470-d473-4cfc-919e-30ed54bbfbfe', 'Litio 450mg', 0, 0, 1.5, 'activo', false, 0, '2026-04-22'),
('fae49470-d473-4cfc-919e-30ed54bbfbfe', 'Clotiazepan 5mg', 0.5, 0, 0.5, 'activo', false, 0, '2026-04-22'),
('fae49470-d473-4cfc-919e-30ed54bbfbfe', 'Calcium', 1, 0, 0, 'activo', false, 0, '2026-04-22'),
('fae49470-d473-4cfc-919e-30ed54bbfbfe', 'Bupropión 150mg', 0, 1, 0, 'activo', false, 0, '2026-04-22'),
('fae49470-d473-4cfc-919e-30ed54bbfbfe', 'Quetiapina 100mg', 0, 0, 1, 'activo', false, 0, '2026-04-22');

-- ── NICOLAS ANDRES MORAGA SALAZAR ────────────────────────────────
INSERT INTO farmacos (paciente_id, nombre, dosis_manana, dosis_tarde, dosis_noche, estado, es_sos, stock_unidades, fecha_ingreso) VALUES
('705b5a0f-7df6-4d1c-b805-49e18ab0c6dd', 'Risperidona 3mg', 0, 0, 1.5, 'activo', false, 0, '2026-04-07'),
('705b5a0f-7df6-4d1c-b805-49e18ab0c6dd', 'Fluoxetina 20mg', 1, 0, 0, 'activo', false, 0, '2026-04-07'),
('705b5a0f-7df6-4d1c-b805-49e18ab0c6dd', 'Litio 300mg', 2, 0, 0, 'activo', false, 0, '2026-04-07'),
('705b5a0f-7df6-4d1c-b805-49e18ab0c6dd', 'Bupropión 150mg', 1, 1, 0, 'activo', false, 0, '2026-04-07'),
('705b5a0f-7df6-4d1c-b805-49e18ab0c6dd', 'Quetiapina 100mg', 0, 0, 1, 'activo', false, 0, '2026-04-07'),
('705b5a0f-7df6-4d1c-b805-49e18ab0c6dd', 'Vitamina C', 1, 0, 0, 'activo', false, 0, '2026-04-07');

-- ── MATIAS ERNESTO CORTES CASTRO ─────────────────────────────────
INSERT INTO farmacos (paciente_id, nombre, dosis_manana, dosis_tarde, dosis_noche, estado, es_sos, stock_unidades, fecha_ingreso) VALUES
('539d556a-87af-42d8-b9fd-d89de0c8b340', 'Sertralina 50mg', 1, 0, 0, 'activo', false, 0, '2026-04-17'),
('539d556a-87af-42d8-b9fd-d89de0c8b340', 'Pregabalina 75mg', 0, 0, 1, 'activo', false, 0, '2026-04-17'),
('539d556a-87af-42d8-b9fd-d89de0c8b340', 'Risperidona 3mg', 0.5, 0, 0, 'activo', false, 0, '2026-04-17'),
('539d556a-87af-42d8-b9fd-d89de0c8b340', 'Risperidona 3mg SOS', 0, 0, 0, 'activo', true, 0, '2026-04-17'),
('539d556a-87af-42d8-b9fd-d89de0c8b340', 'Clotiazepan 5mg', 1, 0, 1, 'activo', false, 0, '2026-04-17');

-- ── TOMAS PAULO VERGARA OPAZO ────────────────────────────────────
INSERT INTO farmacos (paciente_id, nombre, dosis_manana, dosis_tarde, dosis_noche, estado, es_sos, stock_unidades, fecha_ingreso) VALUES
('dfcdc0d3-615c-4589-a865-f399628a2083', 'Ácido Valproico 250mg', 1, 0, 1, 'activo', false, 0, '2026-05-04'),
('dfcdc0d3-615c-4589-a865-f399628a2083', 'Zopiclona 7.5mg', 0, 0, 1, 'activo', false, 0, '2026-05-04'),
('dfcdc0d3-615c-4589-a865-f399628a2083', 'Venlafaxina 75mg', 1, 0, 0, 'activo', false, 0, '2026-05-04'),
('dfcdc0d3-615c-4589-a865-f399628a2083', 'Trazadona 100mg', 0, 0, 1, 'activo', false, 0, '2026-05-04'),
('dfcdc0d3-615c-4589-a865-f399628a2083', 'Risperidona 1mg/ml', 8, 8, 10, 'activo', false, 0, '2026-05-04'),
('dfcdc0d3-615c-4589-a865-f399628a2083', 'Risperidona 1mg/ml SOS', 0, 0, 0, 'activo', true, 10, '2026-05-04'),
('dfcdc0d3-615c-4589-a865-f399628a2083', 'Clotiazepan 10mg', 1, 0, 1, 'activo', false, 0, '2026-05-04');

-- ── MAXIMO JESUS HENRIQUEZ ────────────────────────────────────────
INSERT INTO farmacos (paciente_id, nombre, dosis_manana, dosis_tarde, dosis_noche, estado, es_sos, stock_unidades, fecha_ingreso) VALUES
('2c7dc06d-149e-47fc-b0e0-81a4870724a1', 'Fluoxetina 20mg', 1, 0, 0, 'activo', false, 0, '2026-05-04'),
('2c7dc06d-149e-47fc-b0e0-81a4870724a1', 'Quetiapina 100mg', 0, 0, 1, 'activo', false, 0, '2026-05-04'),
('2c7dc06d-149e-47fc-b0e0-81a4870724a1', 'Risperidona 1mg', 0.5, 0, 1, 'activo', false, 0, '2026-05-04'),
('2c7dc06d-149e-47fc-b0e0-81a4870724a1', 'Bupropión 150mg', 0, 1, 0, 'activo', false, 0, '2026-05-04'),
('2c7dc06d-149e-47fc-b0e0-81a4870724a1', 'Trazadona 100mg', 0, 0, 1, 'activo', false, 0, '2026-05-04');

