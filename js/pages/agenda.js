// ── AGENDA ──

async function renderAgenda() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions('');

  const [psiq, psic] = await Promise.all([
    getAgendaPsiquiatra(today()),
    getAgendaPsicologo(today())
  ]);

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <h3 style="font-family:var(--font-serif);font-size:18px">🧠 Psiquiatra</h3>
          <button class="btn btn-primary btn-sm" onclick="modalNuevaHora('psiquiatra')"><i class="fa-solid fa-plus"></i> Agendar</button>
        </div>
        ${tablaAgenda(psiq, 'psiquiatra')}
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <h3 style="font-family:var(--font-serif);font-size:18px">💬 Psicólogo</h3>
          <button class="btn btn-primary btn-sm" onclick="modalNuevaHora('psicologo')"><i class="fa-solid fa-plus"></i> Agendar</button>
        </div>
        ${tablaAgenda(psic, 'psicologo')}
      </div>
    </div>`;
}

function tablaAgenda(sesiones, tipo) {
  if (!sesiones.length) return `<div class="card"><div class="card-body">${emptyState('calendar','Sin sesiones agendadas')}</div></div>`;
  return `<div class="card"><div class="card-body no-pad"><div class="table-wrap"><table>
    <thead><tr><th>Paciente</th><th>Fecha</th><th>Hora</th><th>Estado</th><th></th></tr></thead>
    <tbody>
      ${sesiones.map(s => `<tr>
        <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar">${initials(s.pacientes?.nombre||'?')}</span>${s.pacientes?.nombre||'—'}</div></td>
        <td>${fmtDate(s.fecha)}</td>
        <td>${s.hora||'—'}</td>
        <td><span class="badge ${s.estado==='completada'?'badge-success':s.estado==='cancelada'?'badge-danger':'badge-neutral'}">${s.estado}</span></td>
        <td>
          ${s.estado==='programada'?`
            <button class="btn btn-sm" onclick="cambiarEstado${tipo==='psiquiatra'?'Psiq':'Psic'}('${s.id}','completada')">✅</button>
            <button class="btn btn-sm btn-danger" onclick="cambiarEstado${tipo==='psiquiatra'?'Psiq':'Psic'}('${s.id}','cancelada')">✕</button>
          `:''}
          <button class="btn btn-sm btn-danger" onclick="eliminarHora=='psiquiatra'?'Psiq':'Psic'('${s.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div></div></div>`;
}

async function modalNuevaHora(tipo) {
  const pacientes = await getPacientes();
  openModal(`Agendar hora — ${tipo === 'psiquiatra' ? 'Psiquiatra' : 'Psicólogo'}`, `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Paciente *</label>
          <select id="ag-pac"><option value="">Seleccionar...</option>
            ${pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Profesional</label><input type="text" id="ag-prof" placeholder="Nombre del profesional"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fecha *</label><input type="date" id="ag-fecha" value="${today()}"></div>
        <div class="form-group"><label>Hora</label><input type="time" id="ag-hora"></div>
      </div>
      <div class="form-row one"><div class="form-group"><label>Notas</label><input type="text" id="ag-notas" placeholder="Observaciones..."></div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarHora('${tipo}')">Agendar</button>
  `);
}

async function guardarHora(tipo) {
  const pacId = document.getElementById('ag-pac').value;
  const fecha = document.getElementById('ag-fecha').value;
  if (!pacId || !fecha) { showToast('Paciente y fecha son obligatorios', 'error'); return; }
  const payload = { paciente_id: pacId, profesional: document.getElementById('ag-prof').value.trim()||null, fecha, hora: document.getElementById('ag-hora').value||null, notas: document.getElementById('ag-notas').value.trim()||null, estado: 'programada' };
  try {
    if (tipo === 'psiquiatra') await createAgendaPsiquiatra(payload);
    else await createAgendaPsicologo(payload);
    closeModal(); showToast('Hora agendada', 'success'); renderAgenda();
  } catch(e) { showToast('Error', 'error'); }
}

async function cambiarEstadoPsiq(id, estado) {
  await updateAgendaPsiquiatra(id, { estado }); renderAgenda();
}
async function cambiarEstadoPsic(id, estado) {
  await updateAgendaPsicologo(id, { estado }); renderAgenda();
}

async function eliminarHoraPsiq(id) {
  if (!confirm('¿Eliminar esta hora?')) return;
  await db.from('agenda_psiquiatra').delete().eq('id', id);
  showToast('Hora eliminada'); renderAgenda();
}
async function eliminarHoraPsic(id) {
  if (!confirm('¿Eliminar esta hora?')) return;
  await db.from('agenda_psicologo').delete().eq('id', id);
  showToast('Hora eliminada'); renderAgenda();
}
