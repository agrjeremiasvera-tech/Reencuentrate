// ── MI AGENDA PERSONAL (Admin) ──

async function renderMiAgenda() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="modalNuevaNota()"><i class="fa-solid fa-plus"></i> Nueva nota</button>`);

  const { data: notas } = await db.from('mi_agenda')
    .select('*')
    .order('fecha').order('created_at', { ascending: false });

  const todas = notas || [];
  const hoy = today();
  const pendientes = todas.filter(n => !n.completada && n.fecha <= hoy);
  const futuras = todas.filter(n => !n.completada && n.fecha > hoy);
  const completadas = todas.filter(n => n.completada).slice(0, 10);

  content.innerHTML = `
    ${pendientes.length ? `
    <div class="card" style="border-left:3px solid var(--danger);margin-bottom:1.25rem">
      <div class="card-head"><h3>🔴 Pendientes</h3><span class="badge badge-danger">${pendientes.length}</span></div>
      <div class="card-body no-pad">${renderNotas(pendientes, true)}</div>
    </div>` : ''}

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-head"><h3>📅 Próximas</h3><span class="badge badge-neutral">${futuras.length}</span></div>
      <div class="card-body no-pad">
        ${futuras.length === 0 ? emptyState('calendar','Sin notas futuras') : renderNotas(futuras, true)}
      </div>
    </div>

    ${completadas.length ? `
    <div class="card">
      <div class="card-head"><h3>✅ Completadas recientemente</h3></div>
      <div class="card-body no-pad">${renderNotas(completadas, true)}</div>
    </div>` : ''}`;
}

function renderNotas(notas, esAdmin) {
  return notas.map(n => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 1.25rem;border-bottom:1px solid var(--border);${n.completada?'opacity:0.6':''}">
      <button onclick="toggleNota('${n.id}',${n.completada})" 
        style="background:${n.completada?'var(--green)':'transparent'};border:2px solid ${n.completada?'var(--green)':'var(--border)'};border-radius:50%;width:24px;height:24px;flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-top:2px;transition:all 0.2s">
        ${n.completada ? '<i class="fa-solid fa-check" style="color:white;font-size:11px"></i>' : ''}
      </button>
      <div style="flex:1">
        <div style="font-weight:${n.completada?'400':'600'};text-decoration:${n.completada?'line-through':'none'};color:${n.completada?'var(--text3)':'var(--text)'}">${n.titulo}</div>
        ${n.descripcion ? `<div style="font-size:13px;color:var(--text2);margin-top:3px">${n.descripcion}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          ${n.prioridad === 'alta' ? '<span class="badge badge-danger" style="font-size:10px">🔴 Urgente</span>' : ''}
          ${n.categoria ? `<span class="badge badge-neutral" style="font-size:10px">${n.categoria}</span>` : ''}
          <span style="font-size:11px;color:var(--text3)">📅 ${fmtDate(n.fecha)}</span>
        </div>
      </div>
      <button class="btn btn-sm btn-danger" onclick="eliminarNota('${n.id}')"><i class="fa-solid fa-trash"></i></button>
    </div>`).join('');
}

function modalNuevaNota() {
  openModal('Nueva nota personal', `
    <div class="modal-form">
      <div class="form-row one"><div class="form-group"><label>Título *</label>
        <input type="text" id="ag-titulo" placeholder="Ej: Llamar a SEREMI, Reunión con psiquiatra...">
      </div></div>
      <div class="form-row one"><div class="form-group"><label>Descripción</label>
        <textarea id="ag-desc" placeholder="Detalles, recordatorio..."></textarea>
      </div></div>
      <div class="form-row">
        <div class="form-group"><label>Fecha *</label>
          <input type="date" id="ag-fecha" value="${today()}">
        </div>
        <div class="form-group"><label>Prioridad</label>
          <select id="ag-prio">
            <option value="normal">Normal</option>
            <option value="alta">🔴 Urgente</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>
      <div class="form-row one"><div class="form-group"><label>Categoría</label>
        <select id="ag-cat">
          <option value="">Sin categoría</option>
          <option>Legal / SEREMI</option>
          <option>Familia paciente</option>
          <option>Equipo</option>
          <option>Compras</option>
          <option>Finanzas</option>
          <option>Personal</option>
          <option>Otro</option>
        </select>
      </div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarNota()">Guardar</button>
  `);
}

async function guardarNota() {
  const titulo = document.getElementById('ag-titulo').value.trim();
  if (!titulo) { showToast('Título es obligatorio', 'error'); return; }
  const { error } = await db.from('mi_agenda').insert({
    titulo,
    descripcion: document.getElementById('ag-desc').value.trim() || null,
    fecha: document.getElementById('ag-fecha').value,
    prioridad: document.getElementById('ag-prio').value,
    categoria: document.getElementById('ag-cat').value || null,
    completada: false
  });
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  closeModal();
  showToast('Nota guardada ✅', 'success');
  renderMiAgenda();
}

async function toggleNota(id, completada) {
  await db.from('mi_agenda').update({ completada: !completada, completada_at: !completada ? new Date().toISOString() : null }).eq('id', id);
  showToast(!completada ? '✅ Completada' : 'Reabierta');
  renderMiAgenda();
}

async function eliminarNota(id) {
  if (!confirm('¿Eliminar esta nota?')) return;
  await db.from('mi_agenda').delete().eq('id', id);
  showToast('Nota eliminada');
  renderMiAgenda();
}
