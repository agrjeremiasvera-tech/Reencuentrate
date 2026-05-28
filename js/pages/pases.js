// ── PASES EXTERNOS ──

async function renderPases() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="modalNuevoPase()"><i class="fa-solid fa-plus"></i> Solicitud de pase</button>`);

  const pases = await getPases();
  const hoy = today();
  const pendientes = pases.filter(p => p.estado === 'pendiente');
  const aprobados = pases.filter(p => p.estado === 'aprobado');
  const historial = pases.filter(p => ['completado','rechazado'].includes(p.estado));

  content.innerHTML = `
    ${pendientes.length ? `
    <div class="card" style="border-left:3px solid var(--warning)">
      <div class="card-head"><h3>⏳ Pendientes de aprobación</h3><span class="badge badge-warning">${pendientes.length}</span></div>
      <div class="card-body no-pad">${tablaPases(pendientes, true)}</div>
    </div>` : ''}

    <div class="card">
      <div class="card-head"><h3>✅ Pases aprobados</h3><span class="badge badge-success">${aprobados.length}</span></div>
      <div class="card-body no-pad">
        ${aprobados.length === 0 ? emptyState('door-open','Sin pases aprobados actualmente') : tablaPases(aprobados, false)}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>📋 Historial</h3></div>
      <div class="card-body no-pad">
        ${historial.length === 0 ? emptyState('clock-rotate-left','Sin historial') : tablaPases(historial, false)}
      </div>
    </div>`;
}

function tablaPases(pases, mostrarAcciones) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Paciente</th><th>Salida</th><th>Regreso</th><th>Motivo</th><th>Estado</th><th></th></tr></thead>
    <tbody>
      ${pases.map(p => `<tr>
        <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar">${initials(p.pacientes?.nombre||'?')}</span>${p.pacientes?.nombre||'—'}</div></td>
        <td>${fmtDate(p.fecha_salida?.split('T')[0])} ${p.fecha_salida?.split('T')[1]?.slice(0,5)||''}</td>
        <td>${fmtDate(p.fecha_regreso?.split('T')[0])} ${p.fecha_regreso?.split('T')[1]?.slice(0,5)||''}</td>
        <td style="color:var(--text2);font-size:13px">${p.motivo||'—'}</td>
        <td>
          ${p.estado==='pendiente' ? '<span class="badge badge-warning">Pendiente</span>' :
            p.estado==='aprobado' ? '<span class="badge badge-success">Aprobado</span>' :
            p.estado==='rechazado' ? '<span class="badge badge-danger">Rechazado</span>' :
            '<span class="badge badge-neutral">Completado</span>'}
        </td>
        <td>
          <div style="display:flex;gap:6px">
            ${mostrarAcciones ? `
              <button class="btn btn-sm btn-primary" onclick="aprobarPase('${p.id}')">Aprobar</button>
              <button class="btn btn-sm btn-danger" onclick="rechazarPase('${p.id}')">Rechazar</button>
            ` : ''}
            ${p.estado==='aprobado' ? `<button class="btn btn-sm" onclick="modalRelatoPase('${p.id}','${p.pacientes?.nombre||''}')">📋 Relato</button>` : ''}
            ${p.estado==='completado' && p.notas ? `<button class="btn btn-sm" onclick="verRelatoPase('${p.id}')">👁️ Ver relato</button>` : ''}
          </div>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
}

async function modalNuevoPase() {
  const pacientes = await getPacientes();
  const hoy2m = new Date();
  openModal('Solicitar pase externo', `
    <div class="modal-form">
      <div class="form-row one">
        <div class="form-group"><label>Paciente *</label>
          <select id="pase-pac">
            <option value="">Seleccionar...</option>
            ${pacientes.map(p => {
              const meses = Math.floor((new Date() - new Date(p.fecha_ingreso)) / (1000*60*60*24*30));
              const habilitado = meses >= 2;
              return `<option value="${p.id}" ${!habilitado ? 'disabled' : ''}>${p.nombre}${!habilitado ? ` (${meses} mes${meses!==1?'es':''} — mín. 2 meses)` : ''}`;
            }).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fecha y hora salida *</label><input type="datetime-local" id="pase-salida"></div>
        <div class="form-group"><label>Fecha y hora regreso *</label><input type="datetime-local" id="pase-regreso"></div>
      </div>
      <div class="form-row one"><div class="form-group"><label>Motivo</label><input type="text" id="pase-motivo" placeholder="Ej: Visita familiar"></div></div>
      <div class="form-row one"><div class="form-group"><label>Evaluación clínica del equipo</label><textarea id="pase-eval" placeholder="Notas del equipo clínico sobre el pase..."></textarea></div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarPase()">Solicitar pase</button>
  `);
}

async function guardarPase() {
  const pacId = document.getElementById('pase-pac').value;
  const salida = document.getElementById('pase-salida').value;
  const regreso = document.getElementById('pase-regreso').value;
  if (!pacId || !salida || !regreso) { showToast('Completa los campos obligatorios', 'error'); return; }
  try {
    await createPase({ paciente_id: pacId, fecha_salida: salida, fecha_regreso: regreso, motivo: document.getElementById('pase-motivo').value.trim()||null, evaluacion_clinica: document.getElementById('pase-eval').value.trim()||null, estado: 'pendiente' });
    closeModal();
    showToast('Pase solicitado — pendiente de aprobación', 'success');
    renderPases();
  } catch(e) { showToast('Error', 'error'); }
}

async function aprobarPase(id) {
  try {
    await updatePase(id, { estado: 'aprobado', aprobado_por: currentUser?.nombre, aprobado_at: new Date().toISOString() });
    showToast('Pase aprobado ✅', 'success');
    renderPases();
  } catch(e) { showToast('Error', 'error'); }
}

async function rechazarPase(id) {
  try {
    await updatePase(id, { estado: 'rechazado' });
    showToast('Pase rechazado');
    renderPases();
  } catch(e) { showToast('Error', 'error'); }
}

async function modalRelatoPase(id, pacienteNombre) {
  // Verificar si ya tiene relato
  const { data: pase } = await db.from('pases').select('notas,fecha_salida,fecha_regreso').eq('id', id).single();
  const yaTieneRelato = pase?.notas && pase.notas.includes('RELATO DE PASE');

  openModal(`📋 Relato de pase — ${pacienteNombre}`, `
    <div class="modal-form">
      ${yaTieneRelato ? `<div style="background:var(--warning-pale);border-radius:var(--radius);padding:10px 14px;margin-bottom:1rem;font-size:13px;color:var(--warning)">⚠️ Este pase ya tiene un relato guardado. Si guardas, se reemplazará.</div>` : ''}
      <div class="form-row">
        <div class="form-group"><label>Fecha de regreso *</label>
          <input type="date" id="rp-fecha" value="${today()}">
        </div>
        <div class="form-group"><label>Hora de regreso</label>
          <input type="time" id="rp-hora">
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>¿Consumió durante el pase?</label>
          <select id="rp-consumo">
            <option value="no">✅ No consumió</option>
            <option value="si">🔴 Sí consumió</option>
            <option value="sospecha">⚠️ Sospecha de consumo</option>
          </select>
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Relato del paciente — ¿Qué hizo durante el pase?</label>
          <textarea id="rp-relato" placeholder="El paciente cuenta qué hizo, con quién estuvo, cómo se sintió..." style="min-height:80px"></textarea>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>✅ Aspectos positivos</label>
          <textarea id="rp-positivo" placeholder="Lo que hizo bien, logros, conductas saludables..." style="min-height:70px"></textarea>
        </div>
        <div class="form-group"><label>❌ Aspectos negativos / errores</label>
          <textarea id="rp-negativo" placeholder="Situaciones difíciles, errores cometidos, conductas de riesgo..." style="min-height:70px"></textarea>
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Reflexión del paciente</label>
          <textarea id="rp-reflexion" placeholder="¿Qué aprendió del pase? ¿Qué haría diferente?"></textarea>
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Observación del terapeuta</label>
          <textarea id="rp-obs" placeholder="Evaluación clínica del pase, plan de acción..."></textarea>
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Registrado por</label>
          <input type="text" id="rp-quien" value="${currentUser?.nombre || ''}">
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarRelatoPase('${id}')">Guardar relato</button>
  `);
}

async function guardarRelatoPase(id) {
  const relato = document.getElementById('rp-relato').value.trim();
  if (!relato) { showToast('El relato del paciente es obligatorio', 'error'); return; }
  
  const consumo = document.getElementById('rp-consumo').value;
  const positivo = document.getElementById('rp-positivo').value.trim();
  const negativo = document.getElementById('rp-negativo').value.trim();
  const reflexion = document.getElementById('rp-reflexion').value.trim();
  const obs = document.getElementById('rp-obs').value.trim();
  const quien = document.getElementById('rp-quien').value.trim();
  const fecha = document.getElementById('rp-fecha').value;
  const hora = document.getElementById('rp-hora').value;

  const consumoTexto = consumo === 'no' ? '✅ No consumió' : consumo === 'si' ? '🔴 SÍ CONSUMIÓ' : '⚠️ Sospecha de consumo';

  const partes = [
    'RELATO DE PASE — ' + fecha + (hora ? ' ' + hora : ''),
    'Consumo: ' + consumoTexto,
    'Registrado por: ' + (quien || 'Terapeuta'),
    '',
    'RELATO DEL PACIENTE:',
    relato,
    positivo ? ('\nASPECTOS POSITIVOS:\n' + positivo) : '',
    negativo ? ('\nASPECTOS NEGATIVOS / ERRORES:\n' + negativo) : '',
    reflexion ? ('\nREFLEXIÓN DEL PACIENTE:\n' + reflexion) : '',
    obs ? ('\nOBSERVACIÓN DEL TERAPEUTA:\n' + obs) : ''
  ];
  const notaCompleta = partes.filter(p => p !== '').join('\n');

  try {
    await updatePase(id, { estado: 'completado', notas: notaCompleta });
    closeModal();
    showToast('Relato de pase guardado ✅', 'success');
    renderPases();
  } catch(e) { showToast('Error al guardar', 'error'); }
}

async function verRelatoPase(id) {
  const { data: pase } = await db.from('pases').select('*, pacientes(nombre)').eq('id', id).single();
  if (!pase) return;
  openModal(`📋 Relato de pase — ${pase.pacientes?.nombre}`, `
    <div class="modal-form">
      <pre style="white-space:pre-wrap;font-family:var(--font);font-size:13px;color:var(--text2);background:var(--surface2);padding:1rem;border-radius:var(--radius);line-height:1.6">${pase.notas || 'Sin relato'}</pre>
    </div>
  `);
}
