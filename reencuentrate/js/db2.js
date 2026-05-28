// ── DB v2 ──

// PACIENTES
async function getPacientes() {
  const { data } = await db.from('pacientes').select('*').eq('activo', true).order('nombre');
  return data || [];
}
async function getPaciente(id) {
  const { data } = await db.from('pacientes').select('*').eq('id', id).single();
  return data;
}
async function createPaciente(p) {
  const { data, error } = await db.from('pacientes').insert(p).select().single();
  if (error) throw error; return data;
}
async function updatePaciente(id, p) {
  const { error } = await db.from('pacientes').update(p).eq('id', id);
  if (error) throw error;
}
async function deletePaciente(id) {
  const { error } = await db.from('pacientes').update({ activo: false }).eq('id', id);
  if (error) throw error;
}

// FARMACOLOGÍA
async function getFarmacos(pacienteId) {
  const { data } = await db.from('farmacos').select('*').eq('paciente_id', pacienteId).neq('estado','descontinuado').order('nombre');
  return data || [];
}
async function createFarmaco(p) {
  const { data, error } = await db.from('farmacos').insert(p).select().single();
  if (error) throw error; return data;
}
async function updateFarmaco(id, p) {
  const { error } = await db.from('farmacos').update(p).eq('id', id);
  if (error) throw error;
}
async function registrarIngresoFarmaco(p) {
  const { error } = await db.from('farmacos_ingresos').insert(p);
  if (error) throw error;
  // Actualizar stock
  const { data: f } = await db.from('farmacos').select('stock_unidades').eq('id', p.farmaco_id).single();
  await db.from('farmacos').update({ stock_unidades: (f?.stock_unidades || 0) + p.unidades }).eq('id', p.farmaco_id);
}
async function registrarSOS(p) {
  const { error } = await db.from('sos_usos').insert(p);
  if (error) throw error;
  const { data: f } = await db.from('farmacos').select('stock_unidades').eq('id', p.farmaco_id).single();
  if (f) await db.from('farmacos').update({ stock_unidades: Math.max(0, (f.stock_unidades || 0) - 1) }).eq('id', p.farmaco_id);
}

// PASTILLEROS
async function getPastilleros(pacienteId) {
  const { data } = await db.from('pastilleros').select('*').eq('paciente_id', pacienteId).order('semana_inicio', { ascending: false });
  return data || [];
}
async function createPastillero(p) {
  const { data, error } = await db.from('pastilleros').insert(p).select().single();
  if (error) throw error; return data;
}
async function confirmarPastillero(id, nombre) {
  const { error } = await db.from('pastilleros').update({ confirmado: true, confirmado_por: nombre, confirmado_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ENTREGAS
async function getEntregas(fecha) {
  const { data } = await db.from('entregas_medicamentos').select('*, pacientes(nombre)').eq('fecha', fecha).order('turno');
  return data || [];
}
async function crearEntregasDia(fecha, pacientes) {
  const rows = [];
  for (const p of pacientes) {
    for (const turno of ['manana', 'tarde', 'noche']) {
      rows.push({ paciente_id: p.id, turno, fecha, entregado: false });
    }
  }
  const { error } = await db.from('entregas_medicamentos').upsert(rows, { onConflict: 'paciente_id,turno,fecha' });
  if (error) throw error;
}
async function confirmarEntrega(id, nombre) {
  const { error } = await db.from('entregas_medicamentos').update({ entregado: true, entregado_por: nombre, entregado_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// PASES
async function getPases() {
  const { data } = await db.from('pases').select('*, pacientes(nombre, fecha_ingreso)').order('fecha_salida');
  return data || [];
}
async function createPase(p) {
  const { data, error } = await db.from('pases').insert(p).select().single();
  if (error) throw error; return data;
}
async function updatePase(id, p) {
  const { error } = await db.from('pases').update(p).eq('id', id);
  if (error) throw error;
}

// INVENTARIO
async function getCategorias() {
  const { data } = await db.from('inventario_categorias').select('*').order('nombre');
  return data || [];
}
async function getInventario(bodega = null) {
  let q = db.from('inventario').select('*, inventario_categorias(nombre, tipo)').order('nombre');
  if (bodega) q = q.eq('bodega', bodega);
  const { data } = await q;
  return data || [];
}
async function createInventarioItem(p) {
  const { data, error } = await db.from('inventario').insert(p).select().single();
  if (error) throw error; return data;
}
async function updateInventarioItem(id, p) {
  const { error } = await db.from('inventario').update(p).eq('id', id);
  if (error) throw error;
}
async function registrarMovimientoInventario(p) {
  const { error } = await db.from('inventario_movimientos').insert(p);
  if (error) throw error;
  const { data: item } = await db.from('inventario').select('cantidad_actual').eq('id', p.inventario_id).single();
  let nueva = item?.cantidad_actual || 0;
  if (p.tipo === 'ingreso') nueva += p.cantidad;
  else if (p.tipo === 'egreso') nueva = Math.max(0, nueva - p.cantidad);
  await db.from('inventario').update({ cantidad_actual: nueva }).eq('id', p.inventario_id);
}

// MASCOTA
async function getMascota(pacienteId) {
  const { data } = await db.from('mascota').select('*').eq('paciente_id', pacienteId).order('fecha', { ascending: false });
  return data || [];
}
async function createMascotaMovimiento(p) {
  const { data, error } = await db.from('mascota').insert(p).select().single();
  if (error) throw error; return data;
}
async function updateMascotaMovimiento(id, p) {
  const { error } = await db.from('mascota').update(p).eq('id', id);
  if (error) throw error;
}

// MOVIMIENTOS FINANCIEROS
async function getMovimientos(mes = null) {
  let q = db.from('movimientos').select('*, pacientes(nombre)').order('fecha', { ascending: false });
  if (mes) { q = q.gte('fecha', mes + '-01').lte('fecha', mes + '-31'); }
  const { data } = await q; return data || [];
}
async function createMovimiento(p) {
  const { data, error } = await db.from('movimientos').insert(p).select().single();
  if (error) throw error; return data;
}
async function deleteMovimiento(id) {
  const { error } = await db.from('movimientos').delete().eq('id', id);
  if (error) throw error;
}

// AGENDA PSIQUIATRA
async function getAgendaPsiquiatra(desde = null) {
  let q = db.from('agenda_psiquiatra').select('*, pacientes(nombre)').order('fecha').order('hora');
  if (desde) q = q.gte('fecha', desde);
  const { data } = await q; return data || [];
}
async function createAgendaPsiquiatra(p) {
  const { data, error } = await db.from('agenda_psiquiatra').insert(p).select().single();
  if (error) throw error; return data;
}
async function updateAgendaPsiquiatra(id, p) {
  const { error } = await db.from('agenda_psiquiatra').update(p).eq('id', id);
  if (error) throw error;
}

// AGENDA PSICÓLOGO
async function getAgendaPsicologo(desde = null) {
  let q = db.from('agenda_psicologo').select('*, pacientes(nombre)').order('fecha').order('hora');
  if (desde) q = q.gte('fecha', desde);
  const { data } = await q; return data || [];
}
async function createAgendaPsicologo(p) {
  const { data, error } = await db.from('agenda_psicologo').insert(p).select().single();
  if (error) throw error; return data;
}
async function updateAgendaPsicologo(id, p) {
  const { error } = await db.from('agenda_psicologo').update(p).eq('id', id);
  if (error) throw error;
}

// INFORMES
async function getInformes(pacienteId) {
  const { data } = await db.from('informes').select('*').eq('paciente_id', pacienteId).order('fecha', { ascending: false });
  return data || [];
}
async function createInforme(p) {
  const { data, error } = await db.from('informes').insert(p).select().single();
  if (error) throw error; return data;
}

// USUARIOS DEL SISTEMA
async function getUsuarios() {
  const { data } = await db.from('usuarios').select('*').eq('activo', true).order('nombre');
  return data || [];
}
async function createUsuario(p) {
  const { data, error } = await db.from('usuarios').insert(p).select().single();
  if (error) throw error; return data;
}
async function updateUsuario(id, p) {
  const { error } = await db.from('usuarios').update(p).eq('id', id);
  if (error) throw error;
}

// TURNOS
async function getTurnos() {
  const { data } = await db.from('turnos').select('*').order('fecha_entrada', { ascending: false }).limit(50);
  return data || [];
}
async function iniciarTurno(p) {
  const { data, error } = await db.from('turnos').insert(p).select().single();
  if (error) throw error; return data;
}
async function finalizarTurno(id) {
  const { error } = await db.from('turnos').update({ fecha_salida: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// SARGENTOS
async function getSargentos() {
  const { data } = await db.from('sargentos').select('*').order('fecha', { ascending: false });
  return data || [];
}
async function registrarCambioSargento(p) {
  const { data, error } = await db.from('sargentos').insert(p).select().single();
  if (error) throw error; return data;
}

// EQUIPO
async function getEquipo() {
  const { data } = await db.from('equipo').select('*').order('nombre');
  return data || [];
}
async function createMiembro(p) {
  const { data, error } = await db.from('equipo').insert(p).select().single();
  if (error) throw error; return data;
}
async function deleteMiembro(id) {
  const { error } = await db.from('equipo').delete().eq('id', id);
  if (error) throw error;
}
