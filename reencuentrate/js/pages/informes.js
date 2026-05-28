// ── INFORMES CLÍNICOS ──

async function renderInformes() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="modalNuevoInforme()"><i class="fa-solid fa-plus"></i> Nuevo informe</button>`);

  const pacientes = await getPacientes();
  const { data: informes } = await db.from('informes')
    .select('*, pacientes(nombre)')
    .order('fecha', { ascending: false });

  const todos = informes || [];

  content.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:1.25rem;align-items:center;flex-wrap:wrap">
      <input type="text" id="inf-buscar" placeholder="🔍 Buscar por paciente..." oninput="filtrarInformes()"
        style="width:240px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;outline:none">
      <select id="inf-tipo" onchange="filtrarInformes()"
        style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;outline:none">
        <option value="">Todos los tipos</option>
        <option value="psicologia">Psicología</option>
        <option value="psiquiatria">Psiquiatría</option>
        <option value="otro">Otro</option>
      </select>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Informes clínicos</h3>
        <span class="badge badge-neutral">${todos.length}</span>
      </div>
      <div class="card-body no-pad" id="inf-tabla">
        ${renderTablaInformes(todos)}
      </div>
    </div>`;

  window._todosInformes = todos;
}

function renderTablaInformes(informes) {
  if (!informes.length) return emptyState('file-medical', 'Sin informes registrados');
  return `<div class="table-wrap"><table>
    <thead><tr><th>Paciente</th><th>Título</th><th>Tipo</th><th>Fecha</th><th>Subido por</th><th>Notas</th><th></th></tr></thead>
    <tbody>
      ${informes.map(i => `<tr class="inf-row" data-paciente="${(i.pacientes?.nombre||'').toLowerCase()}" data-tipo="${i.tipo}">
        <td><div style="display:flex;align-items:center;gap:8px">
          <span class="avatar">${initials(i.pacientes?.nombre||'?')}</span>${i.pacientes?.nombre||'—'}
        </div></td>
        <td style="font-weight:500">${i.titulo}</td>
        <td><span class="badge ${i.tipo==='psicologia'?'badge-info':i.tipo==='psiquiatria'?'badge-success':'badge-neutral'}">${i.tipo}</span></td>
        <td>${fmtDate(i.fecha)}</td>
        <td style="color:var(--text3);font-size:12px">${i.subido_por||'—'}</td>
        <td style="color:var(--text2);font-size:12px;max-width:200px">${i.notas||'—'}</td>
        <td>
          <div style="display:flex;gap:4px">
            ${i.archivo_url ? `<a href="${i.archivo_url}" target="_blank" class="btn btn-sm"><i class="fa-solid fa-download"></i> Ver</a>` : ''}
            <button class="btn btn-sm btn-danger" onclick="eliminarInforme('${i.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function filtrarInformes() {
  const q = document.getElementById('inf-buscar')?.value.toLowerCase().trim();
  const tipo = document.getElementById('inf-tipo')?.value;
  const todos = window._todosInformes || [];
  const filtrados = todos.filter(i => {
    const matchPac = !q || (i.pacientes?.nombre||'').toLowerCase().includes(q);
    const matchTipo = !tipo || i.tipo === tipo;
    return matchPac && matchTipo;
  });
  document.getElementById('inf-tabla').innerHTML = renderTablaInformes(filtrados);
}

async function modalNuevoInforme() {
  const pacientes = await getPacientes();
  openModal('Nuevo informe clínico', `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Paciente *</label>
          <select id="ni-pac">
            <option value="">Seleccionar...</option>
            ${pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Tipo *</label>
          <select id="ni-tipo">
            <option value="psicologia">Psicología</option>
            <option value="psiquiatria">Psiquiatría</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Título *</label>
          <input type="text" id="ni-titulo" placeholder="Ej: Informe mensual mayo 2026">
        </div>
        <div class="form-group"><label>Fecha *</label>
          <input type="date" id="ni-fecha" value="${today()}">
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Notas / Resumen</label>
          <textarea id="ni-notas" placeholder="Resumen del informe, observaciones principales..."></textarea>
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Archivo (PDF o Word)</label>
          <input type="file" id="ni-archivo" accept=".pdf,.doc,.docx" 
            style="padding:8px;border:1px solid var(--border);border-radius:var(--radius);width:100%;font-size:13px">
          <div style="font-size:11px;color:var(--text3);margin-top:4px">Máximo 5MB — PDF o Word</div>
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarInforme()">Guardar informe</button>
  `);
}

async function guardarInforme() {
  const pacId = document.getElementById('ni-pac').value;
  const titulo = document.getElementById('ni-titulo').value.trim();
  if (!pacId || !titulo) { showToast('Paciente y título son obligatorios', 'error'); return; }

  const fileInput = document.getElementById('ni-archivo');
  const file = fileInput?.files?.[0];
  let archivoUrl = null;
  let archivoNombre = null;

  // Subir archivo a Supabase Storage si hay uno
  if (file) {
    if (file.size > 5 * 1024 * 1024) { showToast('El archivo supera los 5MB', 'error'); return; }
    showToast('Subiendo archivo...', '');
    const ext = file.name.split('.').pop();
    const path = `informes/${pacId}/${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await db.storage
      .from('informes')
      .upload(path, file, { upsert: true });
    
    if (uploadError) {
      console.error(uploadError);
      // Si falla el storage, guardamos igual sin archivo
      showToast('No se pudo subir el archivo, se guardará sin adjunto', 'error');
    } else {
      const { data: urlData } = db.storage.from('informes').getPublicUrl(path);
      archivoUrl = urlData?.publicUrl;
      archivoNombre = file.name;
    }
  }

  const { error } = await db.from('informes').insert({
    paciente_id: pacId,
    titulo,
    tipo: document.getElementById('ni-tipo').value,
    fecha: document.getElementById('ni-fecha').value,
    notas: document.getElementById('ni-notas').value.trim() || null,
    subido_por: currentUser?.nombre,
    archivo_url: archivoUrl,
    archivo_nombre: archivoNombre
  });

  if (error) { showToast('Error al guardar', 'error'); return; }
  closeModal();
  showToast('Informe guardado ✅', 'success');
  renderInformes();
}

async function eliminarInforme(id) {
  if (!confirm('¿Eliminar este informe?')) return;
  await db.from('informes').delete().eq('id', id);
  showToast('Informe eliminado');
  renderInformes();
}
