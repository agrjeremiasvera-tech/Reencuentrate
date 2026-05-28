// ── TAREAS DIARIAS ──

async function renderTareas() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();

  const esAdmin = currentUser?.esAdmin || currentUser?.permisos?.all;

  setTopbarActions(esAdmin ? `
    <button class="btn btn-primary" onclick="modalNuevaTarea()"><i class="fa-solid fa-plus"></i> Nueva tarea</button>
  ` : '');

  const hoy = today();
  const { data: tareasHoy } = await db.from('tareas').select('*').eq('fecha', hoy).order('prioridad').order('created_at');
  const { data: pendientesAnteriores } = await db.from('tareas').select('*').lt('fecha', hoy).eq('completada', false).order('fecha', { ascending: false });

  const hoyArr = tareasHoy || [];
  const anteriores = pendientesAnteriores || [];
  const completadasHoy = hoyArr.filter(t => t.completada).length;
  const totalHoy = hoyArr.length;

  content.innerHTML = `
    ${anteriores.length ? `
    <div style="background:var(--danger-pale);border:1px solid #f5c6c3;border-radius:var(--radius);padding:12px 16px;margin-bottom:1.25rem;cursor:pointer" onclick="verPendientesAnteriores()">
      <strong style="color:var(--danger)">⚠️ ${anteriores.length} tarea${anteriores.length!==1?'s':''} pendiente${anteriores.length!==1?'s':''} de días anteriores</strong>
      <span style="color:var(--danger);font-size:13px;margin-left:8px">— Clic para ver</span>
    </div>` : ''}

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-head">
        <h3>📋 Tareas de hoy — ${new Date().toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'})}</h3>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:13px;color:var(--text2)">${completadasHoy}/${totalHoy} completadas</span>
          ${totalHoy > 0 ? `
          <div style="width:100px;background:var(--border);border-radius:99px;height:8px;overflow:hidden">
            <div style="width:${Math.round((completadasHoy/totalHoy)*100)}%;height:100%;background:var(--green);border-radius:99px;transition:width 0.3s"></div>
          </div>` : ''}
        </div>
      </div>
      <div class="card-body no-pad" id="lista-tareas-hoy">
        ${renderListaTareas(hoyArr, esAdmin)}
      </div>
    </div>

    ${esAdmin ? `
    <div class="card">
      <div class="card-head">
        <h3>📅 Programar tareas futuras</h3>
        <button class="btn btn-sm btn-primary" onclick="modalNuevaTarea()"><i class="fa-solid fa-plus"></i> Nueva</button>
      </div>
      <div class="card-body no-pad" id="lista-futuras">
        <div class="spinner" style="margin:1rem auto"></div>
      </div>
    </div>` : ''}`;

  // Cargar tareas futuras en background
  if (esAdmin) {
    const { data: futuras } = await db.from('tareas').select('*').gt('fecha', hoy).order('fecha').order('prioridad');
    const el = document.getElementById('lista-futuras');
    if (el) el.innerHTML = renderListaTareas(futuras || [], true);
  }
}

function renderListaTareas(tareas, esAdmin) {
  if (!tareas.length) return `<div style="padding:1.5rem;text-align:center;color:var(--text3)">
    <i class="fa-solid fa-check-circle" style="font-size:24px;opacity:0.3;display:block;margin-bottom:8px"></i>
    Sin tareas${esAdmin ? ' — agrega una con el botón "Nueva tarea"' : ''}
  </div>`;

  return tareas.map(t => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 1.25rem;border-bottom:1px solid var(--border);${t.completada?'opacity:0.6':''}" id="tarea-${t.id}">
      <button onclick="toggleTarea('${t.id}',${t.completada})" style="background:none;border:2px solid ${t.completada?'var(--green)':'var(--border)'};border-radius:50%;width:24px;height:24px;flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-top:2px;transition:all 0.2s;background:${t.completada?'var(--green)':'transparent'}">
        ${t.completada ? '<i class="fa-solid fa-check" style="color:white;font-size:11px"></i>' : ''}
      </button>
      <div style="flex:1">
        <div style="font-weight:${t.completada?'400':'600'};font-size:14px;text-decoration:${t.completada?'line-through':'none'};color:${t.completada?'var(--text3)':'var(--text)'}">${t.titulo}</div>
        ${t.descripcion ? `<div style="font-size:12px;color:var(--text2);margin-top:3px">${t.descripcion}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
          ${t.prioridad === 'alta' ? '<span class="badge badge-danger" style="font-size:10px">🔴 Alta prioridad</span>' : ''}
          ${t.asignado_a ? `<span class="badge badge-neutral" style="font-size:10px">👤 ${t.asignado_a}</span>` : ''}
          ${t.fecha !== today() ? `<span class="badge badge-info" style="font-size:10px">📅 ${fmtDate(t.fecha)}</span>` : ''}
          ${t.completada && t.completada_por ? `<span style="font-size:11px;color:var(--text3)">✅ Por ${t.completada_por} ${t.completada_at ? '· ' + new Date(t.completada_at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}) : ''}</span>` : ''}
        </div>
      </div>
      ${esAdmin ? `<button class="btn btn-sm btn-danger" onclick="eliminarTarea('${t.id}')" style="flex-shrink:0"><i class="fa-solid fa-trash"></i></button>` : ''}
    </div>`).join('');
}

async function toggleTarea(id, completada) {
  const nuevo = !completada;
  await db.from('tareas').update({
    completada: nuevo,
    completada_at: nuevo ? new Date().toISOString() : null,
    completada_por: nuevo ? currentUser?.nombre : null
  }).eq('id', id);
  showToast(nuevo ? '✅ Tarea completada' : 'Tarea reabierta', nuevo ? 'success' : '');
  renderTareas();
}

function modalNuevaTarea() {
  openModal('Nueva tarea', `
    <div class="modal-form">
      <div class="form-row one"><div class="form-group"><label>Título *</label>
        <input type="text" id="ta-titulo" placeholder="Ej: Armar pastilleros semanales">
      </div></div>
      <div class="form-row one"><div class="form-group"><label>Descripción (opcional)</label>
        <textarea id="ta-desc" placeholder="Detalles de la tarea..."></textarea>
      </div></div>
      <div class="form-row">
        <div class="form-group"><label>Fecha *</label>
          <input type="date" id="ta-fecha" value="${today()}">
        </div>
        <div class="form-group"><label>Prioridad</label>
          <select id="ta-prioridad">
            <option value="normal">Normal</option>
            <option value="alta">🔴 Alta</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>
      <div class="form-row one"><div class="form-group"><label>Asignar a</label>
        <select id="ta-asignado">
          <option value="">Todos</option>
          <option value="Terapeuta">Terapeuta</option>
          <option value="Psicologo">Psicólogo</option>
          <option value="Sargento">Sargento</option>
        </select>
      </div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarTarea()">Crear tarea</button>
  `);
}

async function guardarTarea() {
  const titulo = document.getElementById('ta-titulo').value.trim();
  if (!titulo) { showToast('Título es obligatorio', 'error'); return; }
  const { error } = await db.from('tareas').insert({
    titulo,
    descripcion: document.getElementById('ta-desc').value.trim() || null,
    fecha: document.getElementById('ta-fecha').value,
    prioridad: document.getElementById('ta-prioridad').value,
    asignado_a: document.getElementById('ta-asignado').value || null,
    creada_por: currentUser?.nombre
  });
  if (error) { showToast('Error al crear', 'error'); return; }
  closeModal();
  showToast('Tarea creada ✅', 'success');
  renderTareas();
}

async function eliminarTarea(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  await db.from('tareas').delete().eq('id', id);
  showToast('Tarea eliminada');
  renderTareas();
}

async function verPendientesAnteriores() {
  const hoy = today();
  const { data } = await db.from('tareas').select('*').lt('fecha', hoy).eq('completada', false).order('fecha', { ascending: false });
  openModal('⚠️ Tareas pendientes anteriores', `
    <div class="modal-form">
      ${renderListaTareas(data || [], currentUser?.esAdmin || currentUser?.permisos?.all)}
    </div>
  `);
}
