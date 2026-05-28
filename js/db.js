// ── DB QUERIES ────────────────────────────────

// PACIENTES
async function getPacientes() {
  const { data, error } = await db.from('pacientes').select('*').order('nombre');
  if (error) { console.error(error); return []; }
  return data;
}

async function getPaciente(id) {
  const { data } = await db.from('pacientes').select('*').eq('id', id).single();
  return data;
}

async function createPaciente(payload) {
  const { data, error } = await db.from('pacientes').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updatePaciente(id, payload) {
  const { error } = await db.from('pacientes').update(payload).eq('id', id);
  if (error) throw error;
}

async function deletePaciente(id) {
  const { error } = await db.from('pacientes').delete().eq('id', id);
  if (error) throw error;
}

// MEDICAMENTOS
async function getMedicamentos(pacienteId = null) {
  let q = db.from('medicamentos').select('*, pacientes(nombre)').order('paciente_id');
  if (pacienteId) q = q.eq('paciente_id', pacienteId);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data;
}

async function createMedicamento(payload) {
  const { data, error } = await db.from('medicamentos').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateMedicamento(id, payload) {
  const { error } = await db.from('medicamentos').update(payload).eq('id', id);
  if (error) throw error;
}

async function deleteMedicamento(id) {
  const { error } = await db.from('medicamentos').delete().eq('id', id);
  if (error) throw error;
}

// SESIONES / AGENDA
async function getSesiones(desde = null) {
  let q = db.from('sesiones').select('*, pacientes(nombre)').order('fecha').order('hora');
  if (desde) q = q.gte('fecha', desde);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data;
}

async function createSesion(payload) {
  const { data, error } = await db.from('sesiones').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateSesion(id, payload) {
  const { error } = await db.from('sesiones').update(payload).eq('id', id);
  if (error) throw error;
}

async function deleteSesion(id) {
  const { error } = await db.from('sesiones').delete().eq('id', id);
  if (error) throw error;
}

// MOVIMIENTOS FINANCIEROS
async function getMovimientos(mes = null) {
  let q = db.from('movimientos').select('*, pacientes(nombre)').order('fecha', { ascending: false });
  if (mes) {
    const start = mes + '-01';
    const end = mes + '-31';
    q = q.gte('fecha', start).lte('fecha', end);
  }
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data;
}

async function createMovimiento(payload) {
  const { data, error } = await db.from('movimientos').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function deleteMovimiento(id) {
  const { error } = await db.from('movimientos').delete().eq('id', id);
  if (error) throw error;
}

// EQUIPO
async function getEquipo() {
  const { data, error } = await db.from('equipo').select('*').order('nombre');
  if (error) { console.error(error); return []; }
  return data;
}

async function createMiembro(payload) {
  const { data, error } = await db.from('equipo').insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function deleteMiembro(id) {
  const { error } = await db.from('equipo').delete().eq('id', id);
  if (error) throw error;
}
