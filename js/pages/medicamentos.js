// ── MEDICAMENTOS ──────────────────────────────

async function renderMedicamentos() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="modalNuevoMedicamento()"><i class="fa-solid fa-plus"></i> Agregar medicamento</button>`);

  const meds = await getMedicamentos();

  const bajos = meds.filter(m => m.stock_dias <= m.alerta_dias);

  content.innerHTML = `
    ${bajos.length ? `
      <div style="background:var(--danger-pale);border:1px solid #f5c6c3;border-radius:var(--radius);padding:12px 16px;margin-bottom:1.25rem;display:flex;align-items:center;gap:10px">
        <i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i>
        <span style="font-size:14px;color:var(--danger);font-weight:500">${bajos.length} medicamento${bajos.length !== 1 ? 's' : ''} con stock bajo — requieren reposición</span>
      </div>` : ''}

    <div class="card">
      <div class="card-head">
        <h3>Stock por paciente</h3>
        <span class="badge badge-neutral">${meds.length} registros</span>
      </div>
      <div class="card-body no-pad">
        ${meds.length === 0
          ? emptyState('pills', 'Sin medicamentos registrados. Agrega el primero.')
          : `<div class="table-wrap"><table>
              <thead><tr><th>Paciente</th><th>Medicamento</th><th>Dosis</th><th>Stock (días)</th><th>Nivel</th><th>Alerta</th><th></th></tr></thead>
              <tbody>
                ${meds.map(m => {
                  const pct = Math.min(100, Math.round((m.stock_dias / 30) * 100));
                  const cls = m.stock_dias <= m.alerta_dias ? 'low' : m.stock_dias <= m.alerta_dias * 2 ? 'warn' : 'ok';
                  const badge = m.stock_dias <= m.alerta_dias ? 'badge-danger' : m.stock_dias <= m.alerta_dias * 2 ? 'badge-warning' : 'badge-success';
                  return `<tr>
                    <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar">${initials(m.pacientes?.nombre || '?')}</span>${m.pacientes?.nombre || '—'}</div></td>
                    <td style="font-weight:500">${m.nombre}</td>
                    <td>${m.dosis || '—'}</td>
                    <td><span class="badge ${badge}">${m.stock_dias} días</span></td>
                    <td style="min-width:100px">
                      <div class="progress"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
                    </td>
                    <td style="color:var(--text3);font-size:12px">&lt; ${m.alerta_dias} días</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm" onclick="modalReponerStock('${m.id}', '${m.nombre}', ${m.stock_dias})"><i class="fa-solid fa-plus"></i> Reponer</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarMedicamento('${m.id}')"><i class="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table></div>`
        }
      </div>
    </div>
  `;
}

async function modalNuevoMedicamento() {
  const pacientes = await getPacientes();
  openModal('Nuevo medicamento', `
    <div class="form-row">
      <div class="form-group"><label>Paciente *</label>
        <select id="m-paciente">
          <option value="">Seleccionar...</option>
          ${pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Medicamento *</label>
        <input type="text" id="m-nombre" placeholder="Ej: Naltrexona">
      </div>
    </div>
    <div class="form-row three">
      <div class="form-group"><label>Dosis</label>
        <input type="text" id="m-dosis" placeholder="50mg/día">
      </div>
      <div class="form-group"><label>Stock inicial (días)</label>
        <input type="number" id="m-stock" placeholder="30" value="30">
      </div>
      <div class="form-group"><label>Alerta mínima (días)</label>
        <input type="number" id="m-alerta" placeholder="7" value="7">
      </div>
    </div>
    <div class="form-row one">
      <div class="form-group"><label>Notas</label>
        <input type="text" id="m-notas" placeholder="Instrucciones de administración...">
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarMedicamento()">Guardar</button>
  `);
}

async function guardarMedicamento() {
  const pacienteId = document.getElementById('m-paciente').value;
  const nombre = document.getElementById('m-nombre').value.trim();
  if (!pacienteId || !nombre) { showToast('Paciente y medicamento son obligatorios', 'error'); return; }

  const payload = {
    paciente_id: pacienteId,
    nombre,
    dosis: document.getElementById('m-dosis').value.trim() || null,
    stock_dias: parseInt(document.getElementById('m-stock').value) || 30,
    alerta_dias: parseInt(document.getElementById('m-alerta').value) || 7,
    notas: document.getElementById('m-notas').value.trim() || null
  };

  try {
    await createMedicamento(payload);
    closeModal();
    showToast('Medicamento registrado', 'success');
    renderMedicamentos();
  } catch(e) {
    showToast('Error al guardar', 'error');
  }
}

function modalReponerStock(id, nombre, stockActual) {
  openModal(`Reponer stock — ${nombre}`, `
    <div class="modal-form">
      <p style="color:var(--text2);margin-bottom:1rem">Stock actual: <strong>${stockActual} días</strong></p>
      <div class="form-group"><label>Días a agregar *</label>
        <input type="number" id="rep-dias" placeholder="30" value="30">
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="confirmarReposicion('${id}', ${stockActual})">Confirmar reposición</button>
  `);
}

async function confirmarReposicion(id, stockActual) {
  const dias = parseInt(document.getElementById('rep-dias').value) || 0;
  if (!dias) { showToast('Ingresa los días a agregar', 'error'); return; }
  try {
    await updateMedicamento(id, { stock_dias: stockActual + dias });
    closeModal();
    showToast('Stock actualizado', 'success');
    renderMedicamentos();
  } catch(e) {
    showToast('Error al actualizar', 'error');
  }
}

async function eliminarMedicamento(id) {
  if (!confirm('¿Eliminar este medicamento?')) return;
  try {
    await deleteMedicamento(id);
    showToast('Medicamento eliminado');
    renderMedicamentos();
  } catch(e) {
    showToast('Error al eliminar', 'error');
  }
}
