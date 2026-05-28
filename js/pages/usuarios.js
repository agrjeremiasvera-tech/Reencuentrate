// ── USUARIOS ──

const TODOS_PERMISOS = [
  { key: 'pacientes', label: 'Pacientes' },
  { key: 'farmacologia', label: 'Farmacología' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'pases', label: 'Pases externos' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'mascota', label: 'Mascota' },
  { key: 'finanzas', label: 'Finanzas' },
  { key: 'equipo', label: 'Equipo' },
];

async function renderUsuarios() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`<button class="btn btn-primary" onclick="modalNuevoUsuario()"><i class="fa-solid fa-plus"></i> Nuevo usuario</button>`);

  const usuarios = await getUsuarios();

  content.innerHTML = `
    <div style="background:var(--green-pale);border:1px solid var(--green-mid);border-radius:var(--radius);padding:12px 16px;margin-bottom:1.25rem;font-size:13px;color:var(--green)">
      <i class="fa-solid fa-shield-halved"></i> Solo el administrador puede ver y gestionar los usuarios del sistema.
    </div>
    <div class="card">
      <div class="card-head"><h3>Usuarios del sistema</h3><span class="badge badge-neutral">${usuarios.length + 1}</span></div>
      <div class="card-body no-pad">
        <div class="table-wrap"><table>
          <thead><tr><th>Usuario</th><th>Permisos</th><th></th></tr></thead>
          <tbody>
            <tr style="background:var(--green-pale)">
              <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar" style="background:var(--green);color:white">J</span><div><div style="font-weight:600">Jeremías (Admin)</div><div style="font-size:11px;color:var(--text3)">Administrador</div></div></div></td>
              <td><span class="badge badge-success">Acceso total</span></td>
              <td></td>
            </tr>
            ${usuarios.map(u => `<tr>
              <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar">${initials(u.nombre)}</span><div style="font-weight:500">${u.nombre}</div></div></td>
              <td style="font-size:12px;color:var(--text2)">${Object.keys(u.permisos||{}).filter(k=>u.permisos[k]).join(', ') || 'Sin permisos'}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-sm" onclick="modalEditarUsuario('${u.id}','${u.nombre}',${JSON.stringify(u.permisos||{}).replace(/"/g,"'")})"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-sm btn-danger" onclick="desactivarUsuario('${u.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>`;
}

function modalNuevoUsuario() {
  openModal('Nuevo usuario', `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Nombre de usuario *</label><input type="text" id="usr-nombre" placeholder="Ej: Yerman Rojas"></div>
        <div class="form-group"><label>Contraseña *</label><input type="password" id="usr-pass" placeholder="Contraseña segura"></div>
      </div>
      <div style="margin-top:4px">
        <label style="font-size:13px;font-weight:500;color:var(--text2);display:block;margin-bottom:10px">Permisos — selecciona los módulos a los que puede acceder</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${TODOS_PERMISOS.map(p => `
            <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer">
              <input type="checkbox" name="perm" value="${p.key}" style="width:15px;height:15px">
              <span style="font-size:13px">${p.label}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarNuevoUsuario()">Crear usuario</button>
  `);
}

async function guardarNuevoUsuario() {
  const nombre = document.getElementById('usr-nombre').value.trim();
  const pass = document.getElementById('usr-pass').value;
  if (!nombre || !pass) { showToast('Nombre y contraseña son obligatorios', 'error'); return; }

  const permisos = {};
  document.querySelectorAll('input[name="perm"]:checked').forEach(cb => { permisos[cb.value] = true; });

  // Hash simple con btoa (en producción usar bcrypt via Supabase function)
  const password_hash = 'rc2024_' + pass;

  try {
    await createUsuario({ nombre, password_hash, permisos });
    closeModal();
    showToast('Usuario creado', 'success');
    renderUsuarios();
  } catch(e) { showToast('Error al crear usuario', 'error'); }
}

async function desactivarUsuario(id) {
  if (!confirm('¿Desactivar este usuario?')) return;
  try {
    await updateUsuario(id, { activo: false });
    showToast('Usuario desactivado');
    renderUsuarios();
  } catch(e) { showToast('Error', 'error'); }
}

async function modalEditarUsuario(id, nombre) {
  const { data: usuario } = await db.from('usuarios').select('*').eq('id', id).single();
  const passActual = usuario?.password_hash?.replace('rc2024_', '') || '';
  const permsObj = usuario?.permisos || {};

  openModal(`Editar usuario — ${nombre}`, `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Nombre</label>
          <input type="text" id="eu-nombre" value="${nombre}">
        </div>
        <div class="form-group"><label>Contraseña actual</label>
          <input type="text" id="eu-pass-actual" value="${passActual}" readonly 
            style="background:var(--surface2);color:var(--text2)">
        </div>
      </div>
      <div class="form-row one">
        <div class="form-group"><label>Nueva contraseña (dejar vacío para mantener la actual)</label>
          <input type="text" id="eu-pass" placeholder="Escribe aquí para cambiar la contraseña">
        </div>
      </div>
      <div style="margin-top:4px">
        <label style="font-size:13px;font-weight:500;color:var(--text2);display:block;margin-bottom:10px">Permisos</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${TODOS_PERMISOS.map(p => `
            <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);cursor:pointer">
              <input type="checkbox" name="eu-perm" value="${p.key}" ${permsObj[p.key] ? 'checked' : ''} style="width:15px;height:15px">
              <span style="font-size:13px">${p.label}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarEdicionUsuario('${id}')">Guardar cambios</button>
  `);
}

async function guardarEdicionUsuario(id) {
  const nombre = document.getElementById('eu-nombre').value.trim();
  const pass = document.getElementById('eu-pass').value;
  if (!nombre) { showToast('Nombre es obligatorio', 'error'); return; }

  const permisos = {};
  document.querySelectorAll('input[name="eu-perm"]:checked').forEach(cb => { permisos[cb.value] = true; });

  const payload = { nombre, permisos };
  if (pass) payload.password_hash = 'rc2024_' + pass;

  try {
    await updateUsuario(id, payload);
    closeModal();
    showToast('Usuario actualizado ✅', 'success');
    renderUsuarios();
  } catch(e) { showToast('Error al guardar', 'error'); }
}
