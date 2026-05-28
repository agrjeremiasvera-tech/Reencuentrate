// ── GRUPO ALTO ──

async function renderGrupoAlto() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`
    <button class="btn btn-primary" onclick="modalAgregarGrupoAlto()"><i class="fa-solid fa-plus"></i> Agregar miembro</button>
    <button class="btn" onclick="modalNuevaReunion()"><i class="fa-solid fa-users"></i> Nueva reunión</button>
  `);

  const [miembros, pacientes, reuniones] = await Promise.all([
    db.from('grupo_alto').select('*, pacientes(nombre, id)').eq('activo', true).order('fecha_ingreso').then(r => r.data || []),
    getPacientes(),
    db.from('grupo_alto_reuniones').select('*, grupo_alto_tareas(*, pacientes!grupo_alto_tareas_miembro_id_fkey(nombre), pacientes!grupo_alto_tareas_paciente_asignado_id_fkey(nombre))').order('fecha', { ascending: false }).limit(10).then(r => r.data || [])
  ]);

  // Obtener etapa de cada miembro
  const { data: progs } = await db.from('progresion_paciente')
    .select('paciente_id, etapas_tratamiento(nombre)')
    .eq('estado', 'activo')
    .in('paciente_id', miembros.map(m => m.paciente_id));
  const progMap = {};
  (progs || []).forEach(p => { progMap[p.paciente_id] = p.etapas_tratamiento?.nombre; });

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div>
        <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:1rem">⭐ Miembros actuales</h3>
        ${miembros.length === 0 ? `<div class="card"><div class="card-body">${emptyState('star','Sin miembros en grupo alto')}</div></div>` :
          miembros.map(m => `
            <div class="card" style="margin-bottom:0.75rem">
              <div class="card-body">
                <div style="display:flex;align-items:center;gap:10px">
                  <span class="avatar" style="width:40px;height:40px;font-size:15px;background:var(--gold-pale);color:var(--gold)">${initials(m.pacientes?.nombre||'?')}</span>
                  <div style="flex:1">
                    <div style="font-weight:600">${m.pacientes?.nombre}</div>
                    <div style="font-size:12px;color:var(--text3)">${progMap[m.paciente_id] || 'Sin etapa'} · Desde ${fmtDate(m.fecha_ingreso)}</div>
                  </div>
                  <button class="btn btn-sm btn-danger" onclick="retirarGrupoAlto('${m.id}','${m.pacientes?.nombre}')">Retirar</button>
                </div>
              </div>
            </div>`).join('')}
      </div>

      <div>
        <h3 style="font-family:var(--font-serif);font-size:18px;margin-bottom:1rem">📋 Últimas reuniones</h3>
        ${reuniones.length === 0 ? `<div class="card"><div class="card-body">${emptyState('users','Sin reuniones registradas')}</div></div>` :
          reuniones.map(r => `
            <div class="card" style="margin-bottom:0.75rem;cursor:pointer" onclick="verReunion('${r.id}')">
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <div style="font-weight:600">Reunión ${fmtDate(r.fecha)}</div>
                  <span class="badge badge-neutral">${(r.grupo_alto_tareas||[]).length} tareas</span>
                </div>
                ${r.observaciones_casa ? `<div style="font-size:12px;color:var(--text2)">${r.observaciones_casa.substring(0,80)}...</div>` : ''}
              </div>
            </div>`).join('')}
      </div>
    </div>`;
}

async function modalAgregarGrupoAlto() {
  const pacientes = await getPacientes();
  const { data: yaEnGA } = await db.from('grupo_alto').select('paciente_id').eq('activo', true);
  const gaIds = new Set((yaEnGA || []).map(g => g.paciente_id));

  openModal('Agregar a Grupo Alto', `
    <div class="modal-form">
      <div class="form-row one">
        <div class="form-group"><label>Paciente *</label>
          <select id="ga-pac">
            <option value="">Seleccionar...</option>
            ${pacientes.filter(p => !gaIds.has(p.id)).map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fecha ingreso al grupo *</label>
          <input type="date" id="ga-fecha" value="${today()}">
        </div>
        <div class="form-group"><label>Ingresado por</label>
          <input type="text" id="ga-por" value="${currentUser?.nombre || ''}">
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarMiembroGA()">Agregar</button>
  `);
}

async function guardarMiembroGA() {
  const pacId = document.getElementById('ga-pac').value;
  const fecha = document.getElementById('ga-fecha').value;
  if (!pacId || !fecha) { showToast('Selecciona un paciente', 'error'); return; }
  const { error } = await db.from('grupo_alto').insert({ paciente_id: pacId, fecha_ingreso: fecha, ingresado_por: document.getElementById('ga-por').value.trim() || null });
  if (error) { showToast('Error', 'error'); return; }
  closeModal(); showToast('Miembro agregado ✅', 'success'); renderGrupoAlto();
}

async function retirarGrupoAlto(id, nombre) {
  if (!confirm(`¿Retirar a ${nombre} del Grupo Alto?`)) return;
  await db.from('grupo_alto').update({ activo: false, fecha_egreso: today() }).eq('id', id);
  showToast('Miembro retirado'); renderGrupoAlto();
}

async function modalNuevaReunion() {
  const { data: miembros } = await db.from('grupo_alto').select('*, pacientes(nombre, id)').eq('activo', true);
  const pacientes = await getPacientes();
  const gaIds = new Set((miembros || []).map(m => m.paciente_id));
  const gruposBajos = pacientes.filter(p => !gaIds.has(p.id));

  openModal('Nueva reunión de Grupo Alto', `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Fecha *</label>
          <input type="date" id="gr-fecha" value="${today()}">
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Observaciones de la casa</label>
          <textarea id="gr-obs" placeholder="Fallas repetidas, dinámicas observadas, situaciones de la semana..."></textarea>
        </div>
      </div>
      <div style="margin-top:12px">
        <label style="font-size:13px;font-weight:600;color:var(--text2);display:block;margin-bottom:10px">Tareas asignadas</label>
        <div id="tareas-container">
          ${(miembros||[]).map(m => `
            <div style="background:var(--surface2);border-radius:var(--radius);padding:12px;margin-bottom:10px">
              <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:var(--green)">⭐ ${m.pacientes?.nombre}</div>
              <div class="form-row">
                <div class="form-group"><label style="font-size:12px">Compañero asignado</label>
                  <select class="tarea-pac" data-miembro="${m.paciente_id}">
                    <option value="">Sin asignar</option>
                    ${gruposBajos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:8px"><label style="font-size:12px">Informe del compañero</label>
                <textarea class="tarea-informe" data-miembro="${m.paciente_id}" placeholder="Observaciones sobre el compañero asignado..." style="min-height:60px"></textarea>
              </div>
              <div class="form-group"><label style="font-size:12px">Tarea asignada</label>
                <input type="text" class="tarea-tarea" data-miembro="${m.paciente_id}" placeholder="Ej: Generar vínculo con Máximo para poder señalarlo...">
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarReunion()">Guardar reunión</button>
  `);
}

async function guardarReunion() {
  const fecha = document.getElementById('gr-fecha').value;
  if (!fecha) { showToast('Fecha es obligatoria', 'error'); return; }

  const { data: reunion, error } = await db.from('grupo_alto_reuniones').insert({
    fecha,
    observaciones_casa: document.getElementById('gr-obs').value.trim() || null
  }).select().single();
  if (error) { showToast('Error al guardar', 'error'); return; }

  // Guardar tareas
  const tareas = [];
  document.querySelectorAll('.tarea-pac').forEach(sel => {
    const miembroId = sel.dataset.miembro;
    const pacAsignadoId = sel.value;
    const informe = document.querySelector(`.tarea-informe[data-miembro="${miembroId}"]`)?.value.trim();
    const tarea = document.querySelector(`.tarea-tarea[data-miembro="${miembroId}"]`)?.value.trim();
    if (informe || tarea) {
      tareas.push({ reunion_id: reunion.id, miembro_id: miembroId, paciente_asignado_id: pacAsignadoId || null, informe: informe || null, tarea_asignada: tarea || null });
    }
  });

  if (tareas.length) await db.from('grupo_alto_tareas').insert(tareas);
  closeModal(); showToast('Reunión registrada ✅', 'success'); renderGrupoAlto();
}

async function verReunion(id) {
  const { data: r } = await db.from('grupo_alto_reuniones')
    .select('*, grupo_alto_tareas(*, pacientes!grupo_alto_tareas_miembro_id_fkey(nombre), pacientes!grupo_alto_tareas_paciente_asignado_id_fkey(nombre))')
    .eq('id', id).single();
  if (!r) return;

  openModal(`Reunión — ${fmtDate(r.fecha)}`, `
    <div class="modal-form">
      ${r.observaciones_casa ? `
        <div style="background:var(--surface2);border-radius:var(--radius);padding:12px;margin-bottom:1rem">
          <div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:6px">OBSERVACIONES DE LA CASA</div>
          <p style="font-size:13px;color:var(--text2)">${r.observaciones_casa}</p>
        </div>` : ''}
      ${(r.grupo_alto_tareas||[]).length === 0 ? '<p style="color:var(--text3)">Sin tareas registradas</p>' :
        r.grupo_alto_tareas.map(t => `
          <div style="background:var(--green-pale);border-radius:var(--radius);padding:12px;margin-bottom:10px">
            <div style="font-weight:600;color:var(--green);margin-bottom:6px">⭐ ${t.pacientes?.nombre || '—'}</div>
            ${t.paciente_asignado_id ? `<div style="font-size:12px;color:var(--text2);margin-bottom:4px"><strong>Compañero:</strong> ${t.pacientes?.nombre}</div>` : ''}
            ${t.informe ? `<div style="font-size:13px;color:var(--text2);margin-bottom:6px"><strong>Informe:</strong> ${t.informe}</div>` : ''}
            ${t.tarea_asignada ? `<div style="background:white;border-radius:6px;padding:8px;font-size:13px"><strong>Tarea:</strong> ${t.tarea_asignada}</div>` : ''}
          </div>`).join('')}
    </div>
  `);
}
