// ── FARMACOLOGÍA ──

async function renderFarmacologia() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions('');
  const pacientes = await getPacientes();

  content.innerHTML = `
    <p style="color:var(--text2);margin-bottom:1.25rem;font-size:14px">Selecciona un paciente para ver y gestionar su farmacología</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem">
      ${pacientes.length === 0 ? emptyState('pills','No hay pacientes registrados') :
        pacientes.map(p => `
          <div class="card" style="margin-bottom:0;cursor:pointer" onclick="verFarmacologiaPaciente('${p.id}','${p.nombre}')">
            <div class="card-body">
              <div style="display:flex;align-items:center;gap:10px">
                <span class="avatar" style="width:40px;height:40px;font-size:15px">${initials(p.nombre)}</span>
                <div>
                  <div style="font-weight:600">${p.nombre}</div>
                  <div style="font-size:12px;color:var(--text3)">Ver farmacología</div>
                </div>
                <i class="fa-solid fa-chevron-right" style="margin-left:auto;color:var(--text3)"></i>
              </div>
            </div>
          </div>`).join('')}
    </div>`;
}

async function verFarmacologiaPaciente(pacienteId, nombre) {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`
    <button class="btn" onclick="renderFarmacologia()"><i class="fa-solid fa-arrow-left"></i> Volver</button>
    <button class="btn btn-primary" onclick="modalNuevoFarmaco('${pacienteId}')"><i class="fa-solid fa-plus"></i> Agregar fármaco</button>
    <button class="btn" onclick="modalPrestamo('${pacienteId}','${nombre}')">💊 Préstamo</button>
    <button class="btn" onclick="verPrestamosPaciente('${pacienteId}','${nombre}')">Ver préstamos</button>
  `);

  const farmacos = await getFarmacos(pacienteId);
  const normales = farmacos.filter(f => !f.es_sos);
  const sos = farmacos.filter(f => f.es_sos);

  function diasRestantes(f) {
    const total = (f.dosis_manana || 0) + (f.dosis_tarde || 0) + (f.dosis_noche || 0);
    if (!total) return null;
    return Math.floor(f.stock_unidades / total);
  }

  function farmacoBadge(f) {
    if (f.estado === 'descontinuacion') return '<span class="badge" style="background:#fff3cd;color:#856404;border:1px solid #ffc107">⚠️ Descontinuación gradual</span>';
    const dias = diasRestantes(f);
    if (dias === null) return '<span class="badge badge-neutral">Sin pauta</span>';
    if (dias <= 7) return `<span class="badge badge-danger">🔴 ${dias} días</span>`;
    if (dias <= 14) return `<span class="badge badge-warning">⚠️ ${dias} días</span>`;
    return `<span class="badge badge-success">${dias} días</span>`;
  }

  content.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem">
      <span class="avatar" style="width:44px;height:44px;font-size:16px">${initials(nombre)}</span>
      <div>
        <h2 style="font-family:var(--font-serif);font-size:22px">${nombre}</h2>
        <div style="font-size:13px;color:var(--text3)">Farmacología</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3><i class="fa-solid fa-pills" style="color:var(--green);margin-right:8px"></i>Medicamentos activos</h3></div>
      <div class="card-body no-pad">
        ${normales.length === 0 ? emptyState('pills','Sin medicamentos registrados') :
          `<div class="table-wrap"><table>
            <thead><tr><th>Medicamento</th><th>Mañana</th><th>Tarde</th><th>Noche</th><th>Stock</th><th>Días restantes</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              ${normales.map(f => `<tr style="${f.estado==='descontinuacion'?'background:#fffbeb':''}">
                <td>
                  <div style="font-weight:500">${f.nombre}</div>
                  ${f.motivo ? `<div style="font-size:11px;color:var(--text3)">${f.motivo}</div>` : ''}
                </td>
                <td>${f.dosis_manana ? `${f.dosis_manana} — ${f.hora_manana||''}` : '—'}</td>
                <td>${f.dosis_tarde ? `${f.dosis_tarde} — ${f.hora_tarde||''}` : '—'}</td>
                <td>${f.dosis_noche ? `${f.dosis_noche} — ${f.hora_noche||''}` : '—'}</td>
                <td><strong>${f.stock_unidades}</strong> unid.</td>
                <td>${farmacoBadge(f)}</td>
                <td>${f.estado === 'activo' ? '<span class="badge badge-success">Activo</span>' : '<span class="badge" style="background:#fff3cd;color:#856404">Descontinuando</span>'}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-sm" onclick="modalIngresarStock('${f.id}','${f.nombre}',${f.stock_unidades},'${pacienteId}')"><i class="fa-solid fa-plus"></i></button>
                    <button class="btn btn-sm" onclick="modalEditarFarmaco('${f.id}')"><i class="fa-solid fa-pen"></i></button>
                    ${f.estado==='activo' ? `<button class="btn btn-sm btn-danger" onclick="descontinuarFarmaco('${f.id}')">Descontinuar</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="eliminarFarmaco('${f.id}','${pacienteId}','${nombre}')"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table></div>`}
      </div>
    </div>

    ${sos.length ? `
    <div class="card">
      <div class="card-head"><h3><i class="fa-solid fa-triangle-exclamation" style="color:var(--danger);margin-right:8px"></i>Medicamentos SOS</h3></div>
      <div class="card-body no-pad">
        <div class="table-wrap"><table>
          <thead><tr><th>Medicamento</th><th>Stock</th><th>Motivo/Indicación</th><th></th></tr></thead>
          <tbody>
            ${sos.map(f => `<tr>
              <td style="font-weight:500">${f.nombre}</td>
              <td>${f.stock_unidades} unid.</td>
              <td style="color:var(--text2);font-size:13px">${f.motivo||'—'}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-sm btn-danger" onclick="modalRegistrarSOS('${f.id}','${f.nombre}','${pacienteId}')">Usar SOS</button>
                  <button class="btn btn-sm" onclick="modalIngresarStock('${f.id}','${f.nombre}',${f.stock_unidades},'${pacienteId}')"><i class="fa-solid fa-plus"></i></button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-head">
        <h3><i class="fa-solid fa-calendar-week" style="color:var(--info);margin-right:8px"></i>Pastillero semanal</h3>
        <button class="btn btn-primary" onclick="modalNuevoPastillero('${pacienteId}','${nombre}')"><i class="fa-solid fa-plus"></i> Crear pastillero</button>
      </div>
      <div class="card-body" id="pastilleros-container">
        <div class="spinner" style="margin:1rem auto"></div>
      </div>
    </div>`;

  // Cargar pastilleros
  const pastilleros = await getPastilleros(pacienteId);
  const pc = document.getElementById('pastilleros-container');
  if (!pastilleros.length) { pc.innerHTML = emptyState('calendar','Sin pastilleros registrados'); return; }
  pc.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Semana</th><th>Estado</th><th>Confirmado por</th><th>Fecha confirmación</th><th></th></tr></thead>
    <tbody>
      ${pastilleros.map(p => `<tr>
        <td>${fmtDate(p.semana_inicio)} → ${fmtDate(p.semana_fin)}</td>
        <td>${p.confirmado ? '<span class="badge badge-success">✅ Confirmado</span>' : '<span class="badge badge-warning">Pendiente</span>'}</td>
        <td>${p.confirmado_por || '—'}</td>
        <td>${p.confirmado_at ? fmtDate(p.confirmado_at.split('T')[0]) : '—'}</td>
        <td style="display:flex;gap:6px">${!p.confirmado ? `<button class="btn btn-sm btn-primary" onclick="confirmarPastilleroUI('${p.id}','${pacienteId}','${nombre}')">Confirmar</button>` : ''}<button class="btn btn-sm" onclick="verPastillero('${pacienteId}','${p.semana_inicio}','${p.semana_fin}')"><i class="fa-solid fa-eye"></i> Ver</button><button class="btn btn-sm btn-danger" onclick="eliminarPastillero('${p.id}','${pacienteId}','${nombre}')"><i class="fa-solid fa-trash"></i></button></td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

async function modalNuevoFarmaco(pacienteId) {
  openModal('Nuevo medicamento', `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Nombre *</label><input type="text" id="f-nombre" placeholder="Ej: Clonazepam"></div>
        <div class="form-group"><label>Motivo / Indicación</label><input type="text" id="f-motivo" placeholder="¿Por qué se indica?"></div>
      </div>
      <div class="form-row three">
        <div class="form-group"><label>Dosis mañana</label><input type="number" id="f-dm" value="0" min="0"></div>
        <div class="form-group"><label>Dosis tarde</label><input type="number" id="f-dt" value="0" min="0"></div>
        <div class="form-group"><label>Dosis noche</label><input type="number" id="f-dn" value="0" min="0"></div>
      </div>
      <div class="form-row three">
        <div class="form-group"><label>Hora mañana</label><input type="time" id="f-hm"></div>
        <div class="form-group"><label>Hora tarde</label><input type="time" id="f-ht"></div>
        <div class="form-group"><label>Hora noche</label><input type="time" id="f-hn"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Stock inicial (unidades)</label><input type="number" id="f-stock" value="0" min="0"></div>
        <div class="form-group"><label>Fecha ingreso</label><input type="date" id="f-fecha" value="${today()}"></div>
      </div>
      <div class="form-row one">
        <div class="form-group" style="flex-direction:row;align-items:center;gap:10px">
          <input type="checkbox" id="f-sos" style="width:16px;height:16px">
          <label for="f-sos" style="margin:0">Es medicamento SOS (no va en pastillero)</label>
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarFarmaco('${pacienteId}')">Guardar</button>
  `);
}

async function guardarFarmaco(pacienteId) {
  const nombre = document.getElementById('f-nombre').value.trim();
  if (!nombre) { showToast('Nombre es obligatorio', 'error'); return; }
  const payload = {
    paciente_id: pacienteId,
    nombre,
    motivo: document.getElementById('f-motivo').value.trim() || null,
    dosis_manana: parseInt(document.getElementById('f-dm').value) || 0,
    dosis_tarde: parseInt(document.getElementById('f-dt').value) || 0,
    dosis_noche: parseInt(document.getElementById('f-dn').value) || 0,
    hora_manana: document.getElementById('f-hm').value || null,
    hora_tarde: document.getElementById('f-ht').value || null,
    hora_noche: document.getElementById('f-hn').value || null,
    stock_unidades: parseInt(document.getElementById('f-stock').value) || 0,
    fecha_ingreso: document.getElementById('f-fecha').value,
    es_sos: document.getElementById('f-sos').checked,
    estado: 'activo'
  };
  try {
    await createFarmaco(payload);
    closeModal();
    showToast('Medicamento registrado', 'success');
    const pac = await getPaciente(pacienteId);
    verFarmacologiaPaciente(pacienteId, pac.nombre);
  } catch(e) { showToast('Error al guardar', 'error'); }
}

function modalIngresarStock(farmacoId, nombre, stockActual, pacienteId) {
  openModal(`Ingresar stock — ${nombre}`, `
    <div class="modal-form">
      <p style="color:var(--text2);margin-bottom:1rem">Stock actual: <strong>${stockActual} unidades</strong></p>
      <div class="form-row">
        <div class="form-group"><label>Unidades a agregar *</label><input type="number" id="st-unidades" placeholder="30" min="1"></div>
        <div class="form-group"><label>Fecha ingreso</label><input type="date" id="st-fecha" value="${today()}"></div>
      </div>
      <div class="form-row one"><div class="form-group"><label>Notas</label><input type="text" id="st-notas" placeholder="Ej: compra del 15/05"></div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="confirmarIngresarStock('${farmacoId}','${pacienteId}')">Confirmar ingreso</button>
  `);
}

async function confirmarIngresarStock(farmacoId, pacienteId) {
  const unidades = parseInt(document.getElementById('st-unidades').value) || 0;
  if (!unidades) { showToast('Ingresa las unidades', 'error'); return; }
  try {
    await registrarIngresoFarmaco({ farmaco_id: farmacoId, paciente_id: pacienteId, unidades, fecha: document.getElementById('st-fecha').value, notas: document.getElementById('st-notas').value.trim() || null });
    closeModal();
    showToast('Stock actualizado', 'success');
    const pac = await getPaciente(pacienteId);
    verFarmacologiaPaciente(pacienteId, pac.nombre);
  } catch(e) { showToast('Error', 'error'); }
}

async function descontinuarFarmaco(id) {
  if (!confirm('¿Marcar este medicamento como en descontinuación gradual?')) return;
  try {
    await updateFarmaco(id, { estado: 'descontinuacion' });
    showToast('Marcado como descontinuación gradual');
    document.querySelector('.btn.btn-primary[onclick*="Volver"]')?.click();
  } catch(e) { showToast('Error', 'error'); }
}

function modalRegistrarSOS(farmacoId, nombre, pacienteId) {
  openModal(`⚠️ Usar SOS — ${nombre}`, `
    <div class="modal-form">
      <div class="form-row one"><div class="form-group"><label>Motivo de uso *</label><textarea id="sos-motivo" placeholder="Describe la situación que requirió el SOS..."></textarea></div></div>
      <div class="form-row one"><div class="form-group"><label>Administrado por</label><input type="text" id="sos-admin" placeholder="Nombre del terapeuta" value="${currentUser?.nombre||''}"></div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-danger" onclick="confirmarSOS('${farmacoId}','${pacienteId}')">Confirmar uso SOS</button>
  `);
}

async function confirmarSOS(farmacoId, pacienteId) {
  const motivo = document.getElementById('sos-motivo').value.trim();
  if (!motivo) { showToast('Ingresa el motivo', 'error'); return; }
  try {
    await registrarSOS({ farmaco_id: farmacoId, paciente_id: pacienteId, motivo, administrado_por: document.getElementById('sos-admin').value.trim() });
    closeModal();
    showToast('SOS registrado', 'success');
    const pac = await getPaciente(pacienteId);
    verFarmacologiaPaciente(pacienteId, pac.nombre);
  } catch(e) { showToast('Error', 'error'); }
}

function modalNuevoPastillero(pacienteId, nombre) {
  const lunes = new Date();
  lunes.setDate(lunes.getDate() - lunes.getDay() + 1);
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
  openModal(`Nuevo pastillero — ${nombre}`, `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Semana inicio (lunes)</label><input type="date" id="past-inicio" value="${lunes.toISOString().split('T')[0]}"></div>
        <div class="form-group"><label>Semana fin (domingo)</label><input type="date" id="past-fin" value="${domingo.toISOString().split('T')[0]}"></div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="crearPastillero('${pacienteId}','${nombre}')">Crear pastillero</button>
  `);
}

async function crearPastillero(pacienteId, nombre) {
  try {
    await createPastillero({ paciente_id: pacienteId, semana_inicio: document.getElementById('past-inicio').value, semana_fin: document.getElementById('past-fin').value });
    closeModal();
    showToast('Pastillero creado', 'success');
    verFarmacologiaPaciente(pacienteId, nombre);
  } catch(e) { showToast('Error', 'error'); }
}

async function confirmarPastilleroUI(pastilleroId, pacienteId, nombre) {
  try {
    await confirmarPastillero(pastilleroId, currentUser?.nombre || 'Terapeuta');
    const farmacos = await getFarmacos(pacienteId);
    for (const f of farmacos.filter(x => !x.es_sos)) {
      const dosis = (parseFloat(f.dosis_manana)||0) + (parseFloat(f.dosis_tarde)||0) + (parseFloat(f.dosis_noche)||0);
      if (dosis > 0) {
        const stockActual = parseFloat(f.stock_unidades) || 0;
        const nuevo = Math.max(0, Math.round((stockActual - dosis * 7) * 1000) / 1000);
        await updateFarmaco(f.id, { stock_unidades: nuevo });
      }
    }
    showToast('Pastillero confirmado y stock descontado ✅', 'success');
    verFarmacologiaPaciente(pacienteId, nombre);
  } catch(e) {
    console.error(e);
    showToast('Error: ' + (e.message||''), 'error');
  }
}

// ENTREGAS DIARIAS
async function renderEntregas() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="generarEntregasHoy()"><i class="fa-solid fa-rotate"></i> Generar entregas de hoy</button>`);

  const entregas = await getEntregas(today());
  const turnos = ['manana', 'tarde', 'noche'];
  const labels = { manana: '☀️ Mañana', tarde: '🌤️ Tarde', noche: '🌙 Noche' };

  content.innerHTML = `
    <p style="color:var(--text2);margin-bottom:1.25rem;font-size:14px">
      Hoy — ${new Date().toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long' })}
    </p>
    ${turnos.map(t => {
      const entregasTurno = entregas.filter(e => e.turno === t);
      const completadas = entregasTurno.filter(e => e.entregado).length;
      return `
        <div class="card">
          <div class="card-head">
            <h3>${labels[t]}</h3>
            <span class="badge ${completadas === entregasTurno.length && entregasTurno.length > 0 ? 'badge-success' : 'badge-warning'}">${completadas}/${entregasTurno.length} entregados</span>
          </div>
          <div class="card-body no-pad">
            ${entregasTurno.length === 0 ? emptyState('clock','Sin entregas generadas — usa "Generar entregas de hoy"') :
              `<div class="table-wrap"><table>
                <thead><tr><th>Paciente</th><th>Estado</th><th>Entregado por</th><th>Hora</th><th></th></tr></thead>
                <tbody>
                  ${entregasTurno.map(e => `<tr>
                    <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar">${initials(e.pacientes?.nombre||'?')}</span>${e.pacientes?.nombre||'—'}</div></td>
                    <td>${e.entregado ? '<span class="badge badge-success">✅ Entregado</span>' : '<span class="badge badge-warning">Pendiente</span>'}</td>
                    <td>${e.entregado_por || '—'}</td>
                    <td>${e.entregado_at ? new Date(e.entregado_at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                    <td>${!e.entregado ? `<button class="btn btn-sm btn-primary" onclick="marcarEntregado('${e.id}')">Confirmar entrega</button>` : ''}</td>
                  </tr>`).join('')}
                </tbody>
              </table></div>`}
          </div>
        </div>`;
    }).join('')}`;
}

async function generarEntregasHoy() {
  const pacientes = await getPacientes();
  try {
    await crearEntregasDia(today(), pacientes);
    showToast('Entregas generadas', 'success');
    renderEntregas();
  } catch(e) { showToast('Error al generar', 'error'); }
}

async function marcarEntregado(id) {
  try {
    await confirmarEntrega(id, currentUser?.nombre || 'Terapeuta');
    showToast('Entrega confirmada ✅', 'success');
    renderEntregas();
  } catch(e) { showToast('Error', 'error'); }
}

async function eliminarFarmaco(id, pacienteId, pacNombre) {
  if (!confirm('¿Eliminar este medicamento?')) return;
  const { error } = await db.from('farmacos').delete().eq('id', id);
  if (error) { showToast('Error al eliminar', 'error'); return; }
  showToast('Medicamento eliminado');
  verFarmacologiaPaciente(pacienteId, pacNombre);
}

async function eliminarPastillero(id, pacienteId, pacNombre) {
  if (!confirm('¿Eliminar este pastillero?')) return;
  const { error } = await db.from('pastilleros').delete().eq('id', id);
  if (error) { showToast('Error', 'error'); return; }
  showToast('Pastillero eliminado');
  verFarmacologiaPaciente(pacienteId, pacNombre);
}

async function modalEditarFarmaco(id) {
  const { data: f } = await db.from('farmacos').select('*').eq('id', id).single();
  if (!f) { showToast('No se encontró el medicamento', 'error'); return; }

  openModal(`Editar — ${f.nombre}`, `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Nombre *</label>
          <input type="text" id="ef-nombre" value="${f.nombre}">
        </div>
        <div class="form-group"><label>Motivo / Indicación</label>
          <input type="text" id="ef-motivo" value="${f.motivo || ''}">
        </div>
      </div>
      <div class="form-row three">
        <div class="form-group"><label>Dosis mañana</label>
          <input type="number" id="ef-dm" value="${f.dosis_manana || 0}" min="0" step="0.25">
        </div>
        <div class="form-group"><label>Dosis tarde</label>
          <input type="number" id="ef-dt" value="${f.dosis_tarde || 0}" min="0" step="0.25">
        </div>
        <div class="form-group"><label>Dosis noche</label>
          <input type="number" id="ef-dn" value="${f.dosis_noche || 0}" min="0" step="0.25">
        </div>
      </div>
      <div class="form-row three">
        <div class="form-group"><label>Hora mañana</label>
          <input type="time" id="ef-hm" value="${f.hora_manana || ''}">
        </div>
        <div class="form-group"><label>Hora tarde</label>
          <input type="time" id="ef-ht" value="${f.hora_tarde || ''}">
        </div>
        <div class="form-group"><label>Hora noche</label>
          <input type="time" id="ef-hn" value="${f.hora_noche || ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Stock actual (unidades)</label>
          <input type="number" id="ef-stock" value="${f.stock_unidades || 0}" min="0">
        </div>
        <div class="form-group"><label>Estado</label>
          <select id="ef-estado">
            <option value="activo" ${f.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="descontinuacion" ${f.estado === 'descontinuacion' ? 'selected' : ''}>Descontinuación gradual</option>
            <option value="descontinuado" ${f.estado === 'descontinuado' ? 'selected' : ''}>Descontinuado</option>
          </select>
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group" style="flex-direction:row;align-items:center;gap:10px">
          <input type="checkbox" id="ef-sos" ${f.es_sos ? 'checked' : ''} style="width:15px;height:15px">
          <label for="ef-sos" style="margin:0">Es medicamento SOS</label>
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarEdicionFarmaco('${f.id}','${f.paciente_id}')">Guardar cambios</button>
  `);
}

async function guardarEdicionFarmaco(id, pacienteId) {
  const nombre = document.getElementById('ef-nombre').value.trim();
  if (!nombre) { showToast('Nombre es obligatorio', 'error'); return; }
  const payload = {
    nombre,
    motivo: document.getElementById('ef-motivo').value.trim() || null,
    dosis_manana: parseFloat(document.getElementById('ef-dm').value) || 0,
    dosis_tarde: parseFloat(document.getElementById('ef-dt').value) || 0,
    dosis_noche: parseFloat(document.getElementById('ef-dn').value) || 0,
    hora_manana: document.getElementById('ef-hm').value || null,
    hora_tarde: document.getElementById('ef-ht').value || null,
    hora_noche: document.getElementById('ef-hn').value || null,
    stock_unidades: parseInt(document.getElementById('ef-stock').value) || 0,
    estado: document.getElementById('ef-estado').value,
    es_sos: document.getElementById('ef-sos').checked
  };
  try {
    await updateFarmaco(id, payload);
    closeModal();
    showToast('Medicamento actualizado ✅', 'success');
    const pac = await getPaciente(pacienteId);
    verFarmacologiaPaciente(pacienteId, pac.nombre);
  } catch(e) { showToast('Error al guardar', 'error'); }
}

async function verPastillero(pacienteId, semanaInicio, semanaFin) {
  const farmacos = await getFarmacos(pacienteId);
  const normales = farmacos.filter(f => !f.es_sos);
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  openModal(`Pastillero — ${fmtDate(semanaInicio)} al ${fmtDate(semanaFin)}`, `
    <div class="modal-form">
      ${normales.length === 0 ? '<p style="color:var(--text3)">Sin medicamentos registrados</p>' : `
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;background:var(--green);color:white;border-radius:6px 0 0 0">Medicamento</th>
                <th style="padding:8px;background:var(--green);color:white;text-align:center">☀️ Mañana</th>
                <th style="padding:8px;background:var(--green);color:white;text-align:center">🌤️ Tarde</th>
                <th style="padding:8px;background:var(--green);color:white;text-align:center">🌙 Noche</th>
                <th style="padding:8px;background:var(--green);color:white;text-align:center">Por día</th>
                <th style="padding:8px;background:var(--green);color:white;text-align:center">Stock</th>
                <th style="padding:8px;background:var(--green);color:white;text-align:center;border-radius:0 6px 0 0">Días</th>
              </tr>
            </thead>
            <tbody>
              ${normales.map((f, i) => {
                const dosis = (parseFloat(f.dosis_manana)||0) + (parseFloat(f.dosis_tarde)||0) + (parseFloat(f.dosis_noche)||0);
                const diasRestantes = dosis > 0 ? Math.floor(f.stock_unidades / dosis) : null;
                const bajo = diasRestantes !== null && diasRestantes <= 7;
                return `<tr style="background:${i%2===0?'white':'var(--surface2)'}${bajo?';outline:2px solid var(--danger)':''}">
                  <td style="padding:8px;font-weight:500;border-bottom:1px solid var(--border)">${f.nombre}${f.estado==='descontinuacion'?'<br><span style="font-size:10px;color:var(--warning)">⚠️ Descontinuando</span>':''}</td>
                  <td style="padding:8px;text-align:center;border-bottom:1px solid var(--border)">${f.dosis_manana > 0 ? `<span style="background:var(--warning-pale);color:var(--warning);padding:2px 8px;border-radius:10px;font-weight:600">${f.dosis_manana}</span>` : '—'}</td>
                  <td style="padding:8px;text-align:center;border-bottom:1px solid var(--border)">${f.dosis_tarde > 0 ? `<span style="background:var(--info-pale);color:var(--info);padding:2px 8px;border-radius:10px;font-weight:600">${f.dosis_tarde}</span>` : '—'}</td>
                  <td style="padding:8px;text-align:center;border-bottom:1px solid var(--border)">${f.dosis_noche > 0 ? `<span style="background:#ede9fe;color:#7c3aed;padding:2px 8px;border-radius:10px;font-weight:600">${f.dosis_noche}</span>` : '—'}</td>
                  <td style="padding:8px;text-align:center;font-weight:600;border-bottom:1px solid var(--border)">${dosis}</td>
                  <td style="padding:8px;text-align:center;border-bottom:1px solid var(--border)">${f.stock_unidades}</td>
                  <td style="padding:8px;text-align:center;font-weight:700;border-bottom:1px solid var(--border);color:${bajo?'var(--danger)':diasRestantes===null?'var(--text3)':'var(--success)'}">
                    ${diasRestantes === null ? '—' : diasRestantes === 0 ? '🔴 Agotado' : bajo ? `⚠️ ${diasRestantes}` : `✅ ${diasRestantes}`}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:1rem;padding:10px 14px;background:var(--surface2);border-radius:var(--radius);font-size:12px;color:var(--text2)">
          <strong>Semana:</strong> ${dias[0]} ${fmtDate(semanaInicio)} → ${dias[6]} ${fmtDate(semanaFin)}
        </div>
      `}
    </div>
  `);
}

// ── PRÉSTAMOS ENTRE PACIENTES ──────────────────────────────────

async function modalPrestamo(pacienteId, nombrePaciente) {
  const farmacos = await getFarmacos(pacienteId);
  const pacientes = await getPacientes();
  const otrosPacientes = pacientes.filter(p => p.id !== pacienteId);

  openModal(`💊 Préstamo — ${nombrePaciente}`, `
    <div class="modal-form">
      <div style="background:var(--info-pale);border-radius:var(--radius);padding:10px 14px;margin-bottom:1rem;font-size:13px;color:var(--info)">
        El stock del que presta baja y el del que recibe sube. Queda registrado para seguimiento.
      </div>
      <div class="form-row">
        <div class="form-group"><label>Medicamento que presta *</label>
          <select id="pr-farmaco">
            <option value="">Seleccionar...</option>
            ${farmacos.filter(f => !f.es_sos && f.stock_unidades > 0).map(f => 
              `<option value="${f.id}" data-stock="${f.stock_unidades}">${f.nombre} (stock: ${f.stock_unidades})</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group"><label>Cantidad *</label>
          <input type="number" id="pr-cantidad" placeholder="0" min="0.25" step="0.25">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Prestar a *</label>
          <select id="pr-receptor">
            <option value="">Seleccionar paciente...</option>
            ${otrosPacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Fecha *</label>
          <input type="date" id="pr-fecha" value="${today()}">
        </div>
      </div>
      <div class="form-row one"><div class="form-group"><label>Notas</label>
        <input type="text" id="pr-notas" placeholder="Ej: Le faltaban para completar el pastillero">
      </div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="confirmarPrestamo('${pacienteId}','${nombrePaciente}')">Confirmar préstamo</button>
  `);
}

async function confirmarPrestamo(prestadorId, prestadorNombre) {
  const farmacoId = document.getElementById('pr-farmaco').value;
  const cantidad = parseFloat(document.getElementById('pr-cantidad').value) || 0;
  const receptorId = document.getElementById('pr-receptor').value;
  const fecha = document.getElementById('pr-fecha').value;
  const notas = document.getElementById('pr-notas').value.trim();

  if (!farmacoId || !cantidad || !receptorId || !fecha) { 
    showToast('Completa todos los campos obligatorios', 'error'); return; 
  }

  // Obtener datos del fármaco del prestador
  const { data: fPrestador } = await db.from('farmacos').select('*').eq('id', farmacoId).single();
  if (!fPrestador) { showToast('Error al obtener el medicamento', 'error'); return; }
  
  if (parseFloat(fPrestador.stock_unidades) < cantidad) {
    showToast(`Stock insuficiente — solo hay ${fPrestador.stock_unidades} unidades`, 'error'); return;
  }

  // Buscar si el receptor tiene el mismo medicamento
  const { data: farmacoReceptor } = await db.from('farmacos')
    .select('*')
    .eq('paciente_id', receptorId)
    .ilike('nombre', fPrestador.nombre)
    .single();

  try {
    // Descontar del prestador
    const nuevoStockPrestador = Math.round((parseFloat(fPrestador.stock_unidades) - cantidad) * 1000) / 1000;
    await db.from('farmacos').update({ stock_unidades: nuevoStockPrestador }).eq('id', farmacoId);

    // Sumar al receptor si tiene el mismo medicamento
    if (farmacoReceptor) {
      const nuevoStockReceptor = Math.round((parseFloat(farmacoReceptor.stock_unidades) + cantidad) * 1000) / 1000;
      await db.from('farmacos').update({ stock_unidades: nuevoStockReceptor }).eq('id', farmacoReceptor.id);
    }

    // Registrar préstamo
    const receptorData = await getPaciente(receptorId);
    await db.from('prestamos_farmacos').insert({
      prestador_id: prestadorId,
      receptor_id: receptorId,
      farmaco_nombre: fPrestador.nombre,
      farmaco_id_prestador: farmacoId,
      farmaco_id_receptor: farmacoReceptor?.id || null,
      cantidad,
      fecha,
      notas: notas || null,
      devuelto: false
    });

    closeModal();
    showToast(`Préstamo registrado ✅ — ${cantidad} unidades de ${fPrestador.nombre} a ${receptorData?.nombre}`, 'success');
    verFarmacologiaPaciente(prestadorId, prestadorNombre);
  } catch(e) {
    console.error(e);
    showToast('Error al registrar el préstamo', 'error');
  }
}

async function verPrestamosPaciente(pacienteId, nombre) {
  const { data: prestados } = await db.from('prestamos_farmacos')
    .select('*, receptor:pacientes!prestamos_farmacos_receptor_id_fkey(nombre)')
    .eq('prestador_id', pacienteId)
    .eq('devuelto', false)
    .order('fecha', { ascending: false });

  const { data: recibidos } = await db.from('prestamos_farmacos')
    .select('*, prestador:pacientes!prestamos_farmacos_prestador_id_fkey(nombre)')
    .eq('receptor_id', pacienteId)
    .eq('devuelto', false)
    .order('fecha', { ascending: false });

  openModal(`💊 Préstamos — ${nombre}`, `
    <div class="modal-form">
      <div style="margin-bottom:1rem">
        <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;margin-bottom:8px">Lo que prestó (debe recibir de vuelta)</div>
        ${!prestados?.length ? '<p style="color:var(--text3);font-size:13px">Sin préstamos pendientes</p>' :
          prestados.map(p => `
            <div style="background:var(--warning-pale);border-radius:var(--radius);padding:10px 12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:500;font-size:13px">${p.farmaco_nombre} — ${p.cantidad} unidades</div>
                <div style="font-size:12px;color:var(--text2)">A: ${p.receptor?.nombre} · ${fmtDate(p.fecha)}</div>
                ${p.notas ? `<div style="font-size:11px;color:var(--text3)">${p.notas}</div>` : ''}
              </div>
              <button class="btn btn-sm btn-primary" onclick="registrarDevolucion('${p.id}','${pacienteId}','${nombre}')">Devuelto</button>
            </div>`).join('')}
      </div>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;margin-bottom:8px">Lo que recibió prestado (debe devolver)</div>
        ${!recibidos?.length ? '<p style="color:var(--text3);font-size:13px">Sin préstamos recibidos pendientes</p>' :
          recibidos.map(p => `
            <div style="background:var(--danger-pale);border-radius:var(--radius);padding:10px 12px;margin-bottom:8px">
              <div style="font-weight:500;font-size:13px">${p.farmaco_nombre} — ${p.cantidad} unidades</div>
              <div style="font-size:12px;color:var(--text2)">De: ${p.prestador?.nombre} · ${fmtDate(p.fecha)}</div>
              ${p.notas ? `<div style="font-size:11px;color:var(--text3)">${p.notas}</div>` : ''}
            </div>`).join('')}
      </div>
    </div>
  `);
}

async function registrarDevolucion(prestamoId, pacienteId, nombre) {
  const { data: prestamo } = await db.from('prestamos_farmacos').select('*').eq('id', prestamoId).single();
  if (!prestamo) return;

  try {
    // Devolver stock al prestador
    const { data: fPrestador } = await db.from('farmacos').select('stock_unidades').eq('id', prestamo.farmaco_id_prestador).single();
    if (fPrestador) {
      const nuevo = Math.round((parseFloat(fPrestador.stock_unidades) + prestamo.cantidad) * 1000) / 1000;
      await db.from('farmacos').update({ stock_unidades: nuevo }).eq('id', prestamo.farmaco_id_prestador);
    }
    // Descontar del receptor si tiene el fármaco
    if (prestamo.farmaco_id_receptor) {
      const { data: fReceptor } = await db.from('farmacos').select('stock_unidades').eq('id', prestamo.farmaco_id_receptor).single();
      if (fReceptor) {
        const nuevo = Math.max(0, Math.round((parseFloat(fReceptor.stock_unidades) - prestamo.cantidad) * 1000) / 1000);
        await db.from('farmacos').update({ stock_unidades: nuevo }).eq('id', prestamo.farmaco_id_receptor);
      }
    }
    // Marcar como devuelto
    await db.from('prestamos_farmacos').update({ devuelto: true, fecha_devolucion: today() }).eq('id', prestamoId);
    closeModal();
    showToast('Devolución registrada ✅', 'success');
    verFarmacologiaPaciente(pacienteId, nombre);
  } catch(e) {
    showToast('Error al registrar devolución', 'error');
  }
}
