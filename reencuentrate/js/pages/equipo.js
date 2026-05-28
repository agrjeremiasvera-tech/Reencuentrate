// ── EQUIPO Y TURNOS ──

async function renderEquipo() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="modalNuevoMiembro()"><i class="fa-solid fa-plus"></i> Agregar miembro</button>`);

  const [equipo, turnos] = await Promise.all([getEquipo(), getTurnos()]);
  const turnoActivo = turnos.find(t => !t.fecha_salida);

  content.innerHTML = `
    <div class="card" style="border-left:3px solid var(--green)">
      <div class="card-head"><h3>🕐 Turno actual</h3>
        ${turnoActivo
          ? `<button class="btn btn-sm btn-danger" onclick="cerrarTurno('${turnoActivo.id}')">Finalizar turno</button>`
          : `<button class="btn btn-sm btn-primary" onclick="modalIniciarTurno()">Iniciar turno</button>`}
      </div>
      <div class="card-body">
        ${turnoActivo
          ? `<div style="display:flex;align-items:center;gap:12px">
              <div class="user-avatar" style="width:44px;height:44px;font-size:16px;background:var(--green)">${initials(turnoActivo.nombre_usuario||'?')}</div>
              <div>
                <div style="font-weight:600;font-size:16px">${turnoActivo.nombre_usuario}</div>
                <div style="font-size:13px;color:var(--text3)">Desde ${new Date(turnoActivo.fecha_entrada).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})} — ${fmtDate(turnoActivo.fecha_entrada.split('T')[0])}</div>
              </div>
              <span class="badge badge-success" style="margin-left:auto">En turno</span>
            </div>`
          : `<p style="color:var(--text3);font-size:14px">No hay nadie de turno actualmente</p>`}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Últimos turnos</h3></div>
      <div class="card-body no-pad">
        ${turnos.length === 0 ? emptyState('clock','Sin turnos registrados') :
          `<div class="table-wrap"><table>
            <thead><tr><th>Terapeuta</th><th>Entrada</th><th>Salida</th><th>Duración</th></tr></thead>
            <tbody>
              ${turnos.slice(0,15).map(t => {
                const dur = t.fecha_salida ? Math.round((new Date(t.fecha_salida)-new Date(t.fecha_entrada))/(1000*60*60)*10)/10 : null;
                return `<tr>
                  <td style="font-weight:500">${t.nombre_usuario}</td>
                  <td>${new Date(t.fecha_entrada).toLocaleString('es-CL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                  <td>${t.fecha_salida ? new Date(t.fecha_salida).toLocaleString('es-CL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '<span class="badge badge-success">En turno</span>'}</td>
                  <td>${dur ? `${dur}h` : '—'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table></div>`}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Equipo clínico</h3></div>
      <div class="card-body no-pad">
        ${equipo.length === 0 ? emptyState('user-doctor','Sin miembros registrados') :
          `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;padding:1rem">
            ${equipo.map(e => `
              <div style="background:var(--surface2);border-radius:var(--radius);padding:1rem">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                  <div style="width:40px;height:40px;border-radius:50%;background:var(--green-pale);color:var(--green);display:flex;align-items:center;justify-content:center;font-weight:600">${initials(e.nombre)}</div>
                  <div><div style="font-weight:600">${e.nombre}</div><div style="font-size:12px;color:var(--text3)">${e.cargo}</div></div>
                </div>
                ${e.telefono ? `<div style="font-size:13px;color:var(--text2)"><i class="fa-solid fa-phone" style="width:16px"></i> ${e.telefono}</div>` : ''}
                <div style="margin-top:10px;text-align:right">
                  <button class="btn btn-sm btn-danger" onclick="eliminarMiembroEquipo('${e.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>`).join('')}
          </div>`}
      </div>
    </div>`;
}

function modalIniciarTurno() {
  openModal('Iniciar turno', `
    <div class="modal-form">
      <div class="form-row one"><div class="form-group"><label>Nombre del terapeuta *</label>
        <input type="text" id="turno-nombre" placeholder="Tu nombre completo" value="${currentUser?.nombre||''}">
      </div></div>
      <div class="form-row one"><div class="form-group"><label>Notas del turno</label>
        <input type="text" id="turno-notas" placeholder="Observaciones al iniciar...">
      </div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="confirmarIniciarTurno()">Iniciar turno</button>
  `);
}

async function confirmarIniciarTurno() {
  const nombre = document.getElementById('turno-nombre').value.trim();
  if (!nombre) { showToast('Ingresa tu nombre', 'error'); return; }
  try {
    await iniciarTurno({ nombre_usuario: nombre, fecha_entrada: new Date().toISOString(), notas: document.getElementById('turno-notas').value.trim()||null });
    closeModal(); showToast('Turno iniciado', 'success'); renderEquipo();
  } catch(e) { showToast('Error', 'error'); }
}

async function cerrarTurno(id) {
  try {
    await finalizarTurno(id);
    showToast('Turno finalizado');
    renderEquipo();
  } catch(e) { showToast('Error', 'error'); }
}

function modalNuevoMiembro() {
  openModal('Nuevo miembro del equipo', `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Nombre *</label><input type="text" id="eq-nombre" placeholder="Dra. María González"></div>
        <div class="form-group"><label>Cargo *</label>
          <select id="eq-cargo">
            <option>Psiquiatra</option><option>Psicólogo</option>
            <option>Terapeuta Ocupacional</option><option>Técnico en Rehabilitación</option>
            <option>Administrativo</option><option>Otro</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Teléfono</label><input type="text" id="eq-tel" placeholder="+56 9 1234 5678"></div>
        <div class="form-group"><label>Especialidad</label><input type="text" id="eq-esp" placeholder="Ej: Adicciones"></div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarMiembro()">Guardar</button>
  `);
}

async function guardarMiembro() {
  const nombre = document.getElementById('eq-nombre').value.trim();
  if (!nombre) { showToast('Nombre es obligatorio', 'error'); return; }
  try {
    await createMiembro({ nombre, cargo: document.getElementById('eq-cargo').value, telefono: document.getElementById('eq-tel').value.trim()||null, especialidad: document.getElementById('eq-esp').value.trim()||null });
    closeModal(); showToast('Miembro agregado', 'success'); renderEquipo();
  } catch(e) { showToast('Error', 'error'); }
}

async function eliminarMiembroEquipo(id) {
  if (!confirm('¿Eliminar este miembro?')) return;
  try { await deleteMiembro(id); showToast('Eliminado'); renderEquipo(); } catch(e) { showToast('Error', 'error'); }
}
