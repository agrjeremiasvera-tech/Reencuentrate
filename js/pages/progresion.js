// ── PROGRESIÓN TERAPÉUTICA ──

async function renderProgresion() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions('');

  const [pacientes, etapas] = await Promise.all([
    getPacientes(),
    db.from('etapas_tratamiento').select('*').order('orden').then(r => r.data || [])
  ]);

  // Obtener etapa activa de cada paciente
  const { data: progresiones } = await db.from('progresion_paciente')
    .select('*, etapas_tratamiento(*)')
    .eq('estado', 'activo')
    .order('created_at', { ascending: false });

  const progMap = {};
  (progresiones || []).forEach(p => {
    if (!progMap[p.paciente_id]) progMap[p.paciente_id] = p;
  });

  // Obtener miembros de grupo alto
  const { data: grupoAlto } = await db.from('grupo_alto').select('paciente_id').eq('activo', true);
  const gaIds = new Set((grupoAlto || []).map(g => g.paciente_id));

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;margin-bottom:1.5rem">
      ${pacientes.map(p => {
        const prog = progMap[p.id];
        const etapa = prog?.etapas_tratamiento;
        const esGA = gaIds.has(p.id);
        return `
          <div class="card" style="margin-bottom:0">
            <div class="card-body">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <span class="avatar" style="width:40px;height:40px;font-size:15px">${initials(p.nombre)}</span>
                <div style="flex:1">
                  <div style="font-weight:600">${p.nombre}</div>
                  ${esGA ? '<span class="badge badge-info" style="font-size:10px">⭐ Grupo Alto</span>' : ''}
                </div>
              </div>
              ${etapa ? `
                <div style="background:var(--green-pale);border-radius:var(--radius);padding:10px 12px;margin-bottom:10px">
                  <div style="font-size:12px;color:var(--text3);margin-bottom:2px">Etapa actual</div>
                  <div style="font-weight:600;color:var(--green)">${etapa.nombre}</div>
                  <div style="font-size:12px;color:var(--text2);margin-top:4px">${(etapa.capacidades||[]).join(' · ')}</div>
                  <div style="font-size:11px;color:var(--text3);margin-top:4px">Desde: ${fmtDate(prog.fecha_inicio)}</div>
                  ${prog.fecha_evaluacion ? `<div style="font-size:11px;color:var(--warning)">Evaluación: ${fmtDate(prog.fecha_evaluacion)}</div>` : ''}
                </div>
                <div style="background:var(--surface2);border-radius:6px;padding:6px 10px;margin-bottom:10px">
                  <div style="font-size:11px;color:var(--text3)">Progreso</div>
                  <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
                    ${etapas.map(e => `
                      <div style="width:20px;height:20px;border-radius:4px;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:600;
                        background:${e.orden < etapa.orden ? 'var(--green)' : e.orden === etapa.orden ? 'var(--gold)' : 'var(--border)'};
                        color:${e.orden <= etapa.orden ? 'white' : 'var(--text3)'};"
                        title="${e.nombre}">${e.orden}</div>`).join('')}
                  </div>
                </div>` : `
                <div style="background:var(--warning-pale);border-radius:var(--radius);padding:10px 12px;margin-bottom:10px;font-size:13px;color:var(--warning)">
                  Sin etapa asignada
                </div>`}
              <div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-primary" onclick="modalAsignarEtapa('${p.id}','${p.nombre}')" style="flex:1">
                  ${etapa ? 'Cambiar etapa' : 'Asignar etapa'}
                </button>
                <button class="btn btn-sm" onclick="verHistorialProgresion('${p.id}','${p.nombre}')">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                </button>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

async function modalAsignarEtapa(pacienteId, nombre) {
  const { data: etapas } = await db.from('etapas_tratamiento').select('*').order('orden');
  openModal(`Asignar etapa — ${nombre}`, `
    <div class="modal-form">
      <div class="form-row one">
        <div class="form-group"><label>Etapa *</label>
          <select id="et-etapa">
            <option value="">Seleccionar etapa...</option>
            ${(etapas||[]).map(e => `<option value="${e.id}">${e.nombre} — ${(e.capacidades||[]).join(', ')}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fecha inicio *</label>
          <input type="date" id="et-inicio" value="${today()}">
        </div>
        <div class="form-group"><label>Fecha evaluación</label>
          <input type="date" id="et-eval">
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Motivo del movimiento</label>
          <textarea id="et-motivo" placeholder="Ej: Cumplió objetivos del Grupo 4, pasa a Grupo 3..."></textarea>
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarEtapa('${pacienteId}')">Guardar</button>
  `);
}

async function guardarEtapa(pacienteId) {
  const etapaId = document.getElementById('et-etapa').value;
  const inicio = document.getElementById('et-inicio').value;
  if (!etapaId || !inicio) { showToast('Etapa y fecha son obligatorios', 'error'); return; }

  // Cerrar etapa anterior
  await db.from('progresion_paciente')
    .update({ estado: 'completado', fecha_fin: today() })
    .eq('paciente_id', pacienteId)
    .eq('estado', 'activo');

  // Crear nueva
  const { error } = await db.from('progresion_paciente').insert({
    paciente_id: pacienteId,
    etapa_id: etapaId,
    fecha_inicio: inicio,
    fecha_evaluacion: document.getElementById('et-eval').value || null,
    motivo_movimiento: document.getElementById('et-motivo').value.trim() || null,
    registrado_por: currentUser?.nombre,
    estado: 'activo'
  });
  if (error) { showToast('Error al guardar', 'error'); return; }
  closeModal();
  showToast('Etapa actualizada ✅', 'success');
  renderProgresion();
}

async function verHistorialProgresion(pacienteId, nombre) {
  const { data } = await db.from('progresion_paciente')
    .select('*, etapas_tratamiento(*)')
    .eq('paciente_id', pacienteId)
    .order('created_at', { ascending: false });

  openModal(`Historial — ${nombre}`, `
    <div class="modal-form">
      ${!data?.length ? '<p style="color:var(--text3)">Sin historial de progresión</p>' :
        `<div class="table-wrap"><table>
          <thead><tr><th>Etapa</th><th>Inicio</th><th>Evaluación</th><th>Fin</th><th>Estado</th><th>Motivo</th></tr></thead>
          <tbody>
            ${data.map(p => `<tr>
              <td style="font-weight:500">${p.etapas_tratamiento?.nombre || '—'}</td>
              <td>${fmtDate(p.fecha_inicio)}</td>
              <td>${p.fecha_evaluacion ? fmtDate(p.fecha_evaluacion) : '—'}</td>
              <td>${p.fecha_fin ? fmtDate(p.fecha_fin) : '<span class="badge badge-success">Activo</span>'}</td>
              <td><span class="badge ${p.estado==='activo'?'badge-success':p.estado==='devuelto'?'badge-danger':'badge-neutral'}">${p.estado}</span></td>
              <td style="font-size:12px;color:var(--text2)">${p.motivo_movimiento || '—'}</td>
              <td><button class="btn btn-sm btn-danger" onclick="eliminarProgresion('${p.id}','${pacienteId}','${nombre}')"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>`}
    </div>
  `);
}

async function eliminarProgresion(id, pacienteId, nombre) {
  if (!confirm('¿Eliminar este registro de progresión?')) return;
  const { error } = await db.from('progresion_paciente').delete().eq('id', id);
  if (error) { showToast('Error al eliminar', 'error'); return; }
  closeModal();
  showToast('Registro eliminado');
  renderProgresion();
  verHistorialProgresion(pacienteId, nombre);
}
