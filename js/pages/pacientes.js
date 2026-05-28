// ── PACIENTES ─────────────────────────────────

async function renderPacientes() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="modalNuevoPaciente()"><i class="fa-solid fa-plus"></i> Nuevo paciente</button>`);

  const pacientes = await getPacientes();

  content.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h3>Todos los pacientes <span class="badge badge-neutral" style="margin-left:8px">${pacientes.length}</span></h3>
      </div>
      <div class="card-body no-pad">
        ${pacientes.length === 0
          ? emptyState('users', 'Aún no hay pacientes registrados. Agrega el primero.')
          : `<div class="table-wrap"><table>
              <thead><tr><th>Paciente</th><th>Ingreso</th><th>Próximo pago</th><th>Mensualidad</th><th>Psicólogo</th><th>Estado pago</th><th></th></tr></thead>
              <tbody>
                ${pacientes.map(p => `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span class="avatar">${initials(p.nombre)}</span>
                        <div>
                          <div style="font-weight:500">${p.nombre}</div>
                          ${p.diagnostico ? `<div style="font-size:11px;color:var(--text3)">${p.diagnostico}</div>` : ''}
                        </div>
                      </div>
                    </td>
                    <td>${fmtDate(p.fecha_ingreso)}</td>
                    <td>
                      <span class="badge ${pagoVencido(p.proximo_pago) && !p.pagado_mes ? 'badge-danger' : 'badge-neutral'}">
                        ${fmtDate(p.proximo_pago)}
                      </span>
                    </td>
                    <td>${fmt((p.mensualidad || 0) + (p.costo_psiquiatra || 50000))}</td>
                    <td>${p.psicologo || '—'}</td>
                    <td><span class="badge ${p.pagado_mes ? 'badge-success' : 'badge-warning'}">${p.pagado_mes ? 'Al día' : 'Pendiente'}</span></td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm" onclick="verPaciente('${p.id}')"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn btn-sm" onclick="editarPaciente('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="confirmarEliminarPaciente('${p.id}','${p.nombre}')"><i class="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table></div>`
        }
      </div>
    </div>
  `;
}

function modalNuevoPaciente(data = null) {
  const isEdit = !!data;
  openModal(isEdit ? 'Editar paciente' : 'Nuevo paciente', `
    <div class="form-row">
      <div class="form-group"><label>Nombre completo *</label>
        <input type="text" id="p-nombre" placeholder="Juan Pérez" value="${data?.nombre || ''}">
      </div>
      <div class="form-group"><label>Fecha de ingreso *</label>
        <input type="date" id="p-ingreso" value="${data?.fecha_ingreso || today()}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>RUT</label>
        <input type="text" id="p-rut" placeholder="12.345.678-9" value="${data?.rut || ''}">
      </div>
      <div class="form-group"><label>Fecha de nacimiento</label>
        <input type="date" id="p-nacimiento" value="${data?.fecha_nacimiento || ''}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Mensualidad ($)</label>
        <input type="number" id="p-mensualidad" placeholder="800000" value="${data?.mensualidad || ''}">
      </div>
      <div class="form-group"><label>Costo psiquiatra ($)</label>
        <input type="number" id="p-psiquiatra" value="${data?.costo_psiquiatra || 50000}">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group"><label>Psicólogo asignado</label>
        <input type="text" id="p-psicologo" placeholder="Nombre del psicólogo" value="${data?.psicologo || ''}">
      </div>
      <div class="form-group"><label>Terapeuta ocupacional</label>
        <input type="text" id="p-to" placeholder="Nombre del TO" value="${data?.terapeuta_ocupacional || ''}">
      </div>
    </div>
    <div class="form-row one">
      <div class="form-group"><label>Diagnóstico / Observaciones</label>
        <textarea id="p-diagnostico" placeholder="Notas clínicas relevantes...">${data?.diagnostico || ''}</textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Contacto de emergencia</label>
        <input type="text" id="p-contacto" placeholder="Nombre y teléfono" value="${data?.contacto_emergencia || ''}">
      </div>
      <div class="form-group"><label>Teléfono familiar</label>
        <input type="text" id="p-telefono" placeholder="+56 9 1234 5678" value="${data?.telefono_familiar || ''}">
      </div>
    </div>
  `,`
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="${isEdit ? `guardarEdicionPaciente('${data.id}')` : 'guardarNuevoPaciente()'}">
      ${isEdit ? 'Guardar cambios' : 'Registrar paciente'}
    </button>
  `);
}

async function guardarNuevoPaciente() {
  const nombre = document.getElementById('p-nombre').value.trim();
  const ingreso = document.getElementById('p-ingreso').value;
  if (!nombre || !ingreso) { showToast('Nombre y fecha son obligatorios', 'error'); return; }

  const prox = proximoPago(ingreso);
  const payload = {
    nombre,
    fecha_ingreso: ingreso,
    mensualidad: parseInt(document.getElementById('p-mensualidad').value) || 0,
    costo_psiquiatra: parseInt(document.getElementById('p-psiquiatra').value) || 50000,
    psicologo: document.getElementById('p-psicologo').value.trim() || null,
    terapeuta_ocupacional: document.getElementById('p-to').value.trim() || null,
    diagnostico: document.getElementById('p-diagnostico').value.trim() || null,
    contacto_emergencia: document.getElementById('p-contacto').value.trim() || null,
    telefono_familiar: document.getElementById('p-telefono').value.trim() || null,
    proximo_pago: prox,
    pagado_mes: false
  };

  try {
    await createPaciente(payload);
    closeModal();
    showToast('Paciente registrado', 'success');
    renderPacientes();
  } catch(e) {
    showToast('Error al guardar', 'error');
  }
}

async function editarPaciente(id) {
  const p = await getPaciente(id);
  modalNuevoPaciente(p);
}

async function guardarEdicionPaciente(id) {
  const payload = {
    nombre: document.getElementById('p-nombre').value.trim(),
    fecha_ingreso: document.getElementById('p-ingreso').value,
    mensualidad: parseInt(document.getElementById('p-mensualidad').value) || 0,
    costo_psiquiatra: parseInt(document.getElementById('p-psiquiatra').value) || 50000,
    psicologo: document.getElementById('p-psicologo').value.trim() || null,
    terapeuta_ocupacional: document.getElementById('p-to').value.trim() || null,
    diagnostico: document.getElementById('p-diagnostico').value.trim() || null,
    contacto_emergencia: document.getElementById('p-contacto').value.trim() || null,
    telefono_familiar: document.getElementById('p-telefono').value.trim() || null,
  };
  try {
    await updatePaciente(id, payload);
    closeModal();
    showToast('Cambios guardados', 'success');
    renderPacientes();
  } catch(e) {
    showToast('Error al guardar', 'error');
  }
}

async function verPaciente(id) {
  const p = await getPaciente(id);
  const meds = await getMedicamentos(id);
  openModal(p.nombre, `
    <div class="modal-form">
      <div class="detail-row"><span class="detail-label">Fecha de ingreso</span><span class="detail-value">${fmtDate(p.fecha_ingreso)}</span></div>
      <div class="detail-row"><span class="detail-label">Próximo pago</span><span class="detail-value">${fmtDate(p.proximo_pago)}</span></div>
      <div class="detail-row"><span class="detail-label">Mensualidad</span><span class="detail-value">${fmt(p.mensualidad)}</span></div>
      <div class="detail-row"><span class="detail-label">Costo psiquiatra</span><span class="detail-value">${fmt(p.costo_psiquiatra)}</span></div>
      <div class="detail-row"><span class="detail-label">Psicólogo</span><span class="detail-value">${p.psicologo || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">Terapeuta ocupacional</span><span class="detail-value">${p.terapeuta_ocupacional || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">Contacto emergencia</span><span class="detail-value">${p.contacto_emergencia || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">Teléfono familiar</span><span class="detail-value">${p.telefono_familiar || '—'}</span></div>
      ${p.diagnostico ? `<div style="margin-top:1rem;padding:1rem;background:var(--surface2);border-radius:var(--radius);font-size:13px;color:var(--text2)">${p.diagnostico}</div>` : ''}
      ${meds.length ? `
        <div style="margin-top:1rem">
          <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Medicamentos</div>
          ${meds.map(m => `<div class="detail-row"><span class="detail-label">${m.nombre}</span><span class="detail-value">${m.dosis || ''} — ${m.stock_dias} días</span></div>`).join('')}
        </div>` : ''}
    </div>
  `);
}

function confirmarEliminarPaciente(id, nombre) {
  openModal('Eliminar paciente', `
    <div class="modal-form">
      <p style="color:var(--text2)">¿Estás seguro que quieres eliminar a <strong>${nombre}</strong>? Esta acción no se puede deshacer.</p>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-danger" onclick="eliminarPaciente('${id}')"><i class="fa-solid fa-trash"></i> Eliminar</button>
  `);
}

async function eliminarPaciente(id) {
  try {
    await deletePaciente(id);
    closeModal();
    showToast('Paciente eliminado');
    renderPacientes();
  } catch(e) {
    showToast('Error al eliminar', 'error');
  }
}

function calcularProporcional() {
  const ingreso = document.getElementById('p-ingreso')?.value;
  const mensualidad = parseInt(document.getElementById('p-mensualidad')?.value) || 0;
  const info = document.getElementById('proporcional-info');
  const monto = document.getElementById('proporcional-monto');
  const detalle = document.getElementById('proporcional-detalle');
  if (!info) return;

  if (!ingreso || !mensualidad) { info.style.display = 'none'; return; }

  const fecha = new Date(ingreso);
  const dia = fecha.getDate();
  const diasEnMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();

  // Si ingresa el 1, no hay proporcional
  if (dia === 1) { info.style.display = 'none'; return; }

  const diasRestantes = diasEnMes - dia + 1;
  const montoProp = Math.round((mensualidad / diasEnMes) * diasRestantes);

  info.style.display = 'block';
  monto.textContent = '$' + montoProp.toLocaleString('es-CL');
  detalle.textContent = `(${diasRestantes} días de ${diasEnMes} — mes de ingreso)`;
}
