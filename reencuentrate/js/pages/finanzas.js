// ── FINANZAS ──────────────────────────────────

async function renderFinanzas() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="modalNuevoMovimiento()"><i class="fa-solid fa-plus"></i> Registrar movimiento</button>`);

  const mes = mesActual();
  const movimientos = await getMovimientos(mes);

  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, m) => a + m.monto, 0);
  const utilidad = ingresos - gastos;

  const porCategoria = {};
  movimientos.filter(m => m.tipo === 'gasto').forEach(m => {
    const cat = m.categoria || 'Otros';
    porCategoria[cat] = (porCategoria[cat] || 0) + m.monto;
  });

  content.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon green"><i class="fa-solid fa-arrow-trend-up"></i></div>
        <div class="metric-label">Ingresos del mes</div>
        <div class="metric-value">${fmt(ingresos)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon danger"><i class="fa-solid fa-arrow-trend-down"></i></div>
        <div class="metric-label">Gastos del mes</div>
        <div class="metric-value">${fmt(gastos)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon ${utilidad >= 0 ? 'gold' : 'danger'}"><i class="fa-solid fa-scale-balanced"></i></div>
        <div class="metric-label">Utilidad neta</div>
        <div class="metric-value" style="color:${utilidad >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(utilidad)}</div>
      </div>
    </div>

    ${Object.keys(porCategoria).length ? `
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-head"><h3>Gastos por categoría</h3></div>
        <div class="card-body">
          ${Object.entries(porCategoria).sort((a,b)=>b[1]-a[1]).map(([cat, monto]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-size:13px;color:var(--text2)">${cat}</span>
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:100px;background:var(--border);border-radius:99px;height:6px;overflow:hidden">
                  <div style="width:${Math.round((monto/gastos)*100)}%;height:100%;background:var(--danger);border-radius:99px"></div>
                </div>
                <span style="font-size:13px;font-weight:500;min-width:90px;text-align:right">${fmt(monto)}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''}

    <div class="card">
      <div class="card-head">
        <h3>Movimientos — ${new Date().toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</h3>
        <span class="badge badge-neutral">${movimientos.length}</span>
      </div>
      <div class="card-body no-pad">
        ${movimientos.length === 0
          ? emptyState('receipt', 'Sin movimientos este mes')
          : `<div class="table-wrap"><table>
              <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Paciente</th><th>Tipo</th><th>Monto</th><th></th></tr></thead>
              <tbody>
                ${movimientos.map(m => `
                  <tr>
                    <td>${fmtDate(m.fecha)}</td>
                    <td>${m.descripcion || '—'}</td>
                    <td><span class="badge badge-neutral" style="font-size:11px">${m.categoria || 'General'}</span></td>
                    <td style="color:var(--text3)">${m.pacientes?.nombre || '—'}</td>
                    <td><span class="badge ${m.tipo === 'ingreso' ? 'badge-success' : 'badge-danger'}">${m.tipo}</span></td>
                    <td style="font-weight:600;color:${m.tipo==='ingreso'?'var(--success)':'var(--danger)'}">${fmt(m.monto)}</td>
                    <td><button class="btn btn-sm btn-danger" onclick="eliminarMovimiento('${m.id}')"><i class="fa-solid fa-trash"></i></button></td>
                  </tr>`).join('')}
              </tbody>
            </table></div>`
        }
      </div>
    </div>
  `;
}

async function modalNuevoMovimiento() {
  const pacientes = await getPacientes();
  openModal('Registrar movimiento', `
    <div class="form-row">
      <div class="form-group"><label>Tipo *</label>
        <select id="mov-tipo" onchange="toggleCategoria()">
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
        </select>
      </div>
      <div class="form-group"><label>Monto ($) *</label>
        <input type="number" id="mov-monto" placeholder="0">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Descripción</label>
        <input type="text" id="mov-desc" placeholder="Ej: Mensualidad Juan Pérez">
      </div>
      <div class="form-group"><label>Fecha *</label>
        <input type="date" id="mov-fecha" value="${today()}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group" id="cat-group"><label>Categoría</label>
        <select id="mov-cat">
          <option value="Mensualidad">Mensualidad</option>
          <option value="Psiquiatría">Psiquiatría</option>
          <option value="Medicamentos">Medicamentos</option>
          <option value="Sueldos">Sueldos</option>
          <option value="Arriendo">Arriendo</option>
          <option value="Servicios">Servicios (agua/luz/gas)</option>
          <option value="Alimentación">Alimentación</option>
          <option value="Insumos">Insumos clínicos</option>
          <option value="Otros">Otros</option>
        </select>
      </div>
      <div class="form-group"><label>Paciente (opcional)</label>
        <select id="mov-paciente">
          <option value="">General</option>
          ${pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
        </select>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarMovimiento()">Registrar</button>
  `);
}

async function guardarMovimiento() {
  const monto = parseInt(document.getElementById('mov-monto').value) || 0;
  if (!monto) { showToast('Ingresa un monto', 'error'); return; }

  const pacId = document.getElementById('mov-paciente').value;
  const payload = {
    tipo: document.getElementById('mov-tipo').value,
    monto,
    descripcion: document.getElementById('mov-desc').value.trim() || null,
    fecha: document.getElementById('mov-fecha').value,
    categoria: document.getElementById('mov-cat').value,
    paciente_id: pacId || null
  };

  try {
    await createMovimiento(payload);
    closeModal();
    showToast('Movimiento registrado', 'success');
    renderFinanzas();
  } catch(e) {
    showToast('Error al guardar', 'error');
  }
}

async function eliminarMovimiento(id) {
  if (!confirm('¿Eliminar este movimiento?')) return;
  try {
    await deleteMovimiento(id);
    showToast('Movimiento eliminado');
    renderFinanzas();
  } catch(e) {
    showToast('Error', 'error');
  }
}
