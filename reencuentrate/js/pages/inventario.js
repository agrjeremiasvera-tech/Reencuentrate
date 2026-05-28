// ── INVENTARIO v4 ──

let _invTab = 'productos'; // 'productos' o 'historial'

async function renderInventario() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();

  if (_invTab === 'historial') {
    renderHistorialInventario();
    return;
  }

  setTopbarActions(`
    <button class="btn" onclick="verListaCompras()"><i class="fa-solid fa-cart-shopping"></i> Lista de compras</button>
    <button class="btn" onclick="modalNuevoGrupo()"><i class="fa-solid fa-folder-plus"></i> Nuevo grupo</button>
    <button class="btn btn-primary" onclick="modalNuevoProducto()"><i class="fa-solid fa-plus"></i> Nuevo producto</button>
  `);

  const { data: grupos } = await db.from('inv_grupos').select('*').order('nombre');
  const { data: subgrupos } = await db.from('inv_subgrupos').select('*').order('nombre');
  const { data: productos } = await db.from('inv_productos').select('*').order('nombre');

  const gs = grupos || [];
  const sgs = subgrupos || [];
  const ps = productos || [];
  const bajos = ps.filter(p => p.es_consumible && p.stock_actual <= p.alerta_minima);

  content.innerHTML = `
    ${bajos.length ? `
    <div style="background:var(--danger-pale);border:1px solid #f5c6c3;border-radius:var(--radius);padding:12px 16px;margin-bottom:1.25rem">
      <strong style="color:var(--danger)">🔴 Stock bajo (${bajos.length}):</strong>
      <span style="color:var(--danger);font-size:13px"> ${bajos.map(b => b.nombre).join(', ')}</span>
    </div>` : ''}

    <div style="display:flex;gap:8px;margin-bottom:1.25rem;flex-wrap:wrap;align-items:center">
      <button class="btn active" id="tab-inv-prod" onclick="switchInvTab('productos',this)">📦 Inventario</button>
      <button class="btn" id="tab-inv-hist" onclick="switchInvTab('historial',this)">📊 Control / Historial</button>
      <div style="flex:1"></div>
      <input type="text" id="inv-buscar" placeholder="🔍 Buscar producto..." oninput="filtrarProductos()"
        style="width:220px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;outline:none">
    </div>

    <div id="inv-grupos-container">
      ${gs.length === 0 ? emptyState('boxes-stacking', 'No hay grupos. Crea el primero con "Nuevo grupo"') :
        gs.map(g => {
          const subsDel = sgs.filter(s => s.grupo_id === g.id);
          const prodsSinSub = ps.filter(p => p.grupo_id === g.id && !p.subgrupo_id);
          const totalProds = ps.filter(p => p.grupo_id === g.id).length;
          return `
          <div class="card inv-grupo" data-grupo="${g.id}" style="margin-bottom:1.25rem">
            <div class="card-head">
              <h3><i class="fa-solid fa-warehouse" style="color:var(--green);margin-right:8px"></i>${g.nombre}</h3>
              <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <span class="badge badge-neutral">${totalProds} productos</span>
                <button class="btn btn-sm" onclick="modalNuevoSubgrupo('${g.id}','${g.nombre}')"><i class="fa-solid fa-folder-plus"></i> Subgrupo</button>
                <button class="btn btn-sm btn-primary" onclick="modalNuevoProducto('${g.id}')"><i class="fa-solid fa-plus"></i> Producto</button>
                <button class="btn btn-sm" onclick="modalEditarGrupo('${g.id}','${g.nombre}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-danger" onclick="eliminarGrupo('${g.id}','${g.nombre}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
            <div class="card-body" style="padding:0">
              ${subsDel.map(s => {
                const prodsDel = ps.filter(p => p.subgrupo_id === s.id);
                return `
                <div style="border-bottom:1px solid var(--border)">
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 1.25rem;background:var(--surface2)">
                    <div style="font-size:13px;font-weight:600;color:var(--text2);display:flex;align-items:center;gap:6px">
                      <i class="fa-solid fa-folder-open" style="color:var(--gold)"></i> ${s.nombre}
                      <span style="font-size:11px;color:var(--text3);font-weight:400">(${prodsDel.length})</span>
                    </div>
                    <div style="display:flex;gap:4px">
                      <button class="btn btn-sm" onclick="modalNuevoProducto('${g.id}','${s.id}')"><i class="fa-solid fa-plus"></i></button>
                      <button class="btn btn-sm" onclick="modalEditarSubgrupo('${s.id}','${s.nombre}')"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn btn-sm btn-danger" onclick="eliminarSubgrupo('${s.id}','${s.nombre}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                  </div>
                  ${prodsDel.length === 0
                    ? `<p style="color:var(--text3);font-size:12px;padding:10px 1.25rem">Sin productos</p>`
                    : tablaProductos(prodsDel)}
                </div>`;
              }).join('')}
              ${prodsSinSub.length > 0 ? `
                <div>
                  ${subsDel.length > 0 ? `<div style="padding:6px 1.25rem;background:var(--surface2);font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase">Sin subgrupo</div>` : ''}
                  ${tablaProductos(prodsSinSub)}
                </div>` : ''}
              ${totalProds === 0 && subsDel.length === 0 ? `<p style="color:var(--text3);font-size:13px;padding:1rem 1.25rem">Sin productos.</p>` : ''}
            </div>
          </div>`;
        }).join('')}
    </div>`;
}

function switchInvTab(tab, btn) {
  _invTab = tab;
  document.querySelectorAll('[id^=tab-inv-]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderInventario();
}

function tablaProductos(prods) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Producto</th><th>Stock</th><th>Unidad</th><th>Estado</th><th>Último movimiento</th><th></th></tr></thead>
    <tbody>
      ${prods.map(p => {
        const bajo = p.es_consumible && p.stock_actual <= p.alerta_minima;
        return `<tr class="inv-prod-row" data-nombre="${p.nombre.toLowerCase()}" style="${bajo ? 'background:var(--danger-pale)' : ''}">
          <td style="font-weight:500">${p.nombre}${bajo ? ' 🔴' : ''}</td>
          <td style="font-weight:700;font-size:15px;color:${bajo?'var(--danger)':'var(--text)'}">${p.stock_actual}</td>
          <td style="color:var(--text3)">${p.unidad}</td>
          <td>${p.es_consumible
            ? (bajo ? '<span class="badge badge-danger">Stock bajo</span>' : '<span class="badge badge-success">OK</span>')
            : '<span class="badge badge-neutral">Fijo</span>'}</td>
          <td><span id="ultimo-${p.id}" style="font-size:12px;color:var(--text3)">—</span></td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${p.es_consumible ? `
                <button class="btn btn-sm" style="background:var(--green-pale);color:var(--green);border-color:var(--green-mid)" onclick="modalStockInicial('${p.id}','${p.nombre}',${p.stock_actual},'${p.unidad}')">Stock inicial</button>
                <button class="btn btn-sm" onclick="modalMovProducto('${p.id}','${p.nombre}','ingreso',${p.stock_actual},'${p.unidad}')">+ Ingreso</button>
                <button class="btn btn-sm btn-danger" onclick="modalMovProducto('${p.id}','${p.nombre}','egreso',${p.stock_actual},'${p.unidad}')">- Egreso</button>` : ''}
              <button class="btn btn-sm" onclick="modalEditarProducto('${p.id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-sm btn-danger" onclick="eliminarProducto('${p.id}','${p.nombre}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}

// Cargar últimos movimientos en background
async function cargarUltimosMovimientos(productos) {
  for (const p of productos) {
    const { data } = await db.from('inv_movimientos').select('tipo,fecha,cantidad').eq('producto_id', p.id).order('fecha', {ascending:false}).order('created_at',{ascending:false}).limit(1);
    const el = document.getElementById(`ultimo-${p.id}`);
    if (el && data?.length) {
      const m = data[0];
      el.innerHTML = `<span class="badge ${m.tipo==='ingreso'?'badge-success':'badge-danger'}" style="font-size:10px">${m.tipo==='ingreso'?'+':'-'}${m.cantidad}</span> ${fmtDate(m.fecha)}`;
    }
  }
}

function filtrarProductos() {
  const q = document.getElementById('inv-buscar')?.value.toLowerCase().trim();
  document.querySelectorAll('.inv-prod-row').forEach(row => {
    row.style.display = !q || row.dataset.nombre.includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.inv-grupo').forEach(g => {
    const visible = [...g.querySelectorAll('.inv-prod-row')].some(r => r.style.display !== 'none');
    g.style.display = !q || visible ? '' : 'none';
  });
}

// ── HISTORIAL / CONTROL ───────────────────────────────────────────

async function renderHistorialInventario() {
  const content = document.getElementById('content');
  setTopbarActions('');

  const { data: productos } = await db.from('inv_productos').select('id,nombre,unidad,inv_grupos(nombre)').eq('es_consumible', true).order('nombre');
  const ps = productos || [];

  // Fechas por defecto: último mes
  const hoy = today();
  const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30);
  const desde30 = hace30.toISOString().split('T')[0];

  content.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:1.25rem;flex-wrap:wrap;align-items:center">
      <button class="btn" id="tab-inv-prod" onclick="switchInvTab('productos',this)">📦 Inventario</button>
      <button class="btn active" id="tab-inv-hist" onclick="switchInvTab('historial',this)">📊 Control / Historial</button>
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-head"><h3>Filtros</h3></div>
      <div class="card-body">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="margin:0">
            <label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Producto</label>
            <select id="hist-prod" style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;outline:none">
              <option value="">Todos los productos</option>
              ${ps.map(p => `<option value="${p.id}">${p.nombre} (${p.inv_grupos?.nombre||''})</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Desde</label>
            <input type="date" id="hist-desde" value="${desde30}" style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;outline:none">
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:12px;color:var(--text2);display:block;margin-bottom:4px">Hasta</label>
            <input type="date" id="hist-hasta" value="${hoy}" style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px;outline:none">
          </div>
          <button class="btn btn-primary" onclick="buscarHistorial()">Buscar</button>
          <button class="btn" onclick="exportarHistorial()"><i class="fa-solid fa-file-excel"></i> Exportar</button>
        </div>
      </div>
    </div>

    <div id="hist-resultados"><div class="loading-wrap"><div class="spinner"></div></div></div>`;

  buscarHistorial();
}

async function buscarHistorial() {
  const prodId = document.getElementById('hist-prod')?.value;
  const desde = document.getElementById('hist-desde')?.value;
  const hasta = document.getElementById('hist-hasta')?.value;
  const el = document.getElementById('hist-resultados');
  if (!el) return;
  el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';

  let q = db.from('inv_movimientos').select('*, inv_productos(nombre, unidad, inv_grupos(nombre))').order('fecha', {ascending:false}).order('created_at',{ascending:false});
  if (prodId) q = q.eq('producto_id', prodId);
  if (desde) q = q.gte('fecha', desde);
  if (hasta) q = q.lte('fecha', hasta);
  const { data: movs } = await q;
  const todos = movs || [];

  if (!todos.length) { el.innerHTML = emptyState('clock-rotate-left', 'Sin movimientos en el período seleccionado'); return; }

  // Agrupar por producto para resumen
  const porProducto = {};
  todos.forEach(m => {
    const nombre = m.inv_productos?.nombre || '—';
    const unidad = m.inv_productos?.unidad || '';
    if (!porProducto[nombre]) porProducto[nombre] = { nombre, unidad, ingresos: 0, egresos: 0, movs: [] };
    if (m.tipo === 'ingreso') porProducto[nombre].ingresos += Number(m.cantidad);
    else porProducto[nombre].egresos += Number(m.cantidad);
    porProducto[nombre].movs.push(m);
  });

  el.innerHTML = `
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-head"><h3>Resumen por producto</h3><span class="badge badge-neutral">${Object.keys(porProducto).length} productos</span></div>
      <div class="card-body no-pad">
        <div class="table-wrap"><table>
          <thead><tr><th>Producto</th><th>Grupo</th><th>Total ingresos</th><th>Total egresos</th><th>Neto</th></tr></thead>
          <tbody>
            ${Object.values(porProducto).map(p => `<tr>
              <td style="font-weight:500">${p.nombre}</td>
              <td style="color:var(--text3);font-size:12px">${p.movs[0]?.inv_productos?.inv_grupos?.nombre||'—'}</td>
              <td style="color:var(--success);font-weight:600">+${p.ingresos} ${p.unidad}</td>
              <td style="color:var(--danger);font-weight:600">-${p.egresos} ${p.unidad}</td>
              <td style="font-weight:600;color:${p.ingresos-p.egresos>=0?'var(--success)':'var(--danger)'}">${p.ingresos-p.egresos>=0?'+':''}${p.ingresos-p.egresos} ${p.unidad}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Movimientos detallados</h3><span class="badge badge-neutral">${todos.length}</span></div>
      <div class="card-body no-pad">
        <div class="table-wrap"><table>
          <thead><tr><th>Fecha</th><th>Producto</th><th>Grupo</th><th>Tipo</th><th>Cantidad</th><th>Stock resultante</th><th>Descripción</th><th>Usuario</th></tr></thead>
          <tbody>
            ${todos.map(m => `<tr>
              <td style="font-weight:500">${fmtDate(m.fecha)}</td>
              <td>${m.inv_productos?.nombre||'—'}</td>
              <td style="color:var(--text3);font-size:12px">${m.inv_productos?.inv_grupos?.nombre||'—'}</td>
              <td><span class="badge ${m.tipo==='ingreso'?'badge-success':'badge-danger'}">${m.tipo==='ingreso'?'📦 Ingreso':'📤 Egreso'}</span></td>
              <td style="font-weight:600;color:${m.tipo==='ingreso'?'var(--success)':'var(--danger)'}">
                ${m.tipo==='ingreso'?'+':'-'}${m.cantidad} ${m.inv_productos?.unidad||''}
              </td>
              <td>${m.stock_resultante} ${m.inv_productos?.unidad||''}</td>
              <td style="color:var(--text2);font-size:12px">${m.descripcion||'—'}</td>
              <td style="color:var(--text3);font-size:12px">${m.usuario||'—'}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>
    </div>`;
}

async function exportarHistorial() {
  const prodId = document.getElementById('hist-prod')?.value;
  const desde = document.getElementById('hist-desde')?.value;
  const hasta = document.getElementById('hist-hasta')?.value;

  let q = db.from('inv_movimientos').select('*, inv_productos(nombre, unidad, inv_grupos(nombre))').order('fecha',{ascending:false});
  if (prodId) q = q.eq('producto_id', prodId);
  if (desde) q = q.gte('fecha', desde);
  if (hasta) q = q.lte('fecha', hasta);
  const { data: movs } = await q;
  if (!movs?.length) { showToast('Sin datos para exportar', 'error'); return; }

  const porProducto = {};
  movs.forEach(m => {
    const nombre = m.inv_productos?.nombre || '—';
    const unidad = m.inv_productos?.unidad || '';
    if (!porProducto[nombre]) porProducto[nombre] = { nombre, unidad, ingresos: 0, egresos: 0 };
    if (m.tipo === 'ingreso') porProducto[nombre].ingresos += Number(m.cantidad);
    else porProducto[nombre].egresos += Number(m.cantidad);
  });

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Historial Inventario</title>
  <style>
    body{font-family:Arial;font-size:12px;padding:20px;color:#222}
    h1{color:#1a6b4a;font-size:15px;margin-bottom:4px}
    .sub{color:#666;font-size:11px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#1a6b4a;color:white;padding:7px 10px;text-align:left;font-size:11px}
    td{padding:6px 10px;border-bottom:1px solid #eee;font-size:11px}
    tr:nth-child(even) td{background:#f9f9f9}
    .ing{color:#1a6b4a;font-weight:600}.egr{color:#c0392b;font-weight:600}
    h2{color:#1a6b4a;font-size:13px;margin:16px 0 8px}
  </style></head><body>
  <h1>Reencuéntrate — Control de Inventario</h1>
  <div class="sub">Período: ${desde||'—'} al ${hasta||'—'} · Generado: ${new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'})}</div>
  <h2>Resumen por producto</h2>
  <table><thead><tr><th>Producto</th><th>Grupo</th><th>Ingresos</th><th>Egresos</th><th>Neto</th></tr></thead><tbody>
    ${Object.values(porProducto).map(p=>`<tr><td>${p.nombre}</td><td>—</td><td class="ing">+${p.ingresos} ${p.unidad}</td><td class="egr">-${p.egresos} ${p.unidad}</td><td style="font-weight:600">${p.ingresos-p.egresos>=0?'+':''}${p.ingresos-p.egresos} ${p.unidad}</td></tr>`).join('')}
  </tbody></table>
  <h2>Movimientos detallados</h2>
  <table><thead><tr><th>Fecha</th><th>Producto</th><th>Grupo</th><th>Tipo</th><th>Cantidad</th><th>Stock resultante</th><th>Descripción</th><th>Usuario</th></tr></thead><tbody>
    ${movs.map(m=>`<tr>
      <td>${m.fecha}</td><td>${m.inv_productos?.nombre||'—'}</td>
      <td>${m.inv_productos?.inv_grupos?.nombre||'—'}</td>
      <td class="${m.tipo==='ingreso'?'ing':'egr'}">${m.tipo}</td>
      <td class="${m.tipo==='ingreso'?'ing':'egr'}">${m.tipo==='ingreso'?'+':'-'}${m.cantidad} ${m.inv_productos?.unidad||''}</td>
      <td>${m.stock_resultante} ${m.inv_productos?.unidad||''}</td>
      <td>${m.descripcion||'—'}</td><td>${m.usuario||'—'}</td>
    </tr>`).join('')}
  </tbody></table>
  </body></html>`;

  const blob = new Blob([html],{type:'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Historial_Inventario_${today()}.html`; a.click();
  URL.revokeObjectURL(url);
  showToast('Exportado ✅','success');
}

// ── GRUPOS ────────────────────────────────────────────────────────
function modalNuevoGrupo() {
  openModal('Nuevo grupo', `
    <div class="modal-form">
      <div class="form-row one"><div class="form-group"><label>Nombre *</label>
        <input type="text" id="grp-nombre" placeholder="Ej: Bodega grande, Loza, Herramientas...">
      </div></div>
    </div>
  `,`<button class="btn" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="guardarGrupo()">Crear grupo</button>`);
}
async function guardarGrupo() {
  const nombre = document.getElementById('grp-nombre').value.trim();
  if (!nombre) { showToast('Nombre es obligatorio','error'); return; }
  const {error} = await db.from('inv_grupos').insert({nombre});
  if (error) { showToast('Error: '+error.message,'error'); return; }
  closeModal(); showToast('Grupo creado','success'); renderInventario();
}
function modalEditarGrupo(id, nombre) {
  openModal('Editar grupo',`
    <div class="modal-form"><div class="form-row one"><div class="form-group"><label>Nombre *</label>
      <input type="text" id="grp-edit-nombre" value="${nombre}">
    </div></div></div>
  `,`<button class="btn" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="guardarEdicionGrupo('${id}')">Guardar</button>`);
}
async function guardarEdicionGrupo(id) {
  const nombre = document.getElementById('grp-edit-nombre').value.trim();
  if (!nombre) { showToast('Nombre es obligatorio','error'); return; }
  await db.from('inv_grupos').update({nombre}).eq('id',id);
  closeModal(); showToast('Grupo actualizado','success'); renderInventario();
}
async function eliminarGrupo(id, nombre) {
  if (!confirm(`¿Eliminar el grupo "${nombre}"? Se eliminarán todos sus subgrupos y productos.`)) return;
  await db.from('inv_grupos').delete().eq('id',id);
  showToast('Grupo eliminado'); renderInventario();
}

// ── SUBGRUPOS ─────────────────────────────────────────────────────
function modalNuevoSubgrupo(grupoId, grupoNombre) {
  openModal(`Nuevo subgrupo — ${grupoNombre}`,`
    <div class="modal-form"><div class="form-row one"><div class="form-group"><label>Nombre *</label>
      <input type="text" id="sub-nombre" placeholder="Ej: Abarrotes, Limpieza...">
    </div></div></div>
  `,`<button class="btn" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="guardarSubgrupo('${grupoId}')">Crear</button>`);
}
async function guardarSubgrupo(grupoId) {
  const nombre = document.getElementById('sub-nombre').value.trim();
  if (!nombre) { showToast('Nombre es obligatorio','error'); return; }
  await db.from('inv_subgrupos').insert({grupo_id:grupoId, nombre});
  closeModal(); showToast('Subgrupo creado','success'); renderInventario();
}
function modalEditarSubgrupo(id, nombre) {
  openModal('Editar subgrupo',`
    <div class="modal-form"><div class="form-row one"><div class="form-group"><label>Nombre *</label>
      <input type="text" id="sub-edit-nombre" value="${nombre}">
    </div></div></div>
  `,`<button class="btn" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="guardarEdicionSubgrupo('${id}')">Guardar</button>`);
}
async function guardarEdicionSubgrupo(id) {
  const nombre = document.getElementById('sub-edit-nombre').value.trim();
  if (!nombre) { showToast('Nombre es obligatorio','error'); return; }
  await db.from('inv_subgrupos').update({nombre}).eq('id',id);
  closeModal(); showToast('Subgrupo actualizado','success'); renderInventario();
}
async function eliminarSubgrupo(id, nombre) {
  if (!confirm(`¿Eliminar el subgrupo "${nombre}"?`)) return;
  await db.from('inv_productos').update({subgrupo_id:null}).eq('subgrupo_id',id);
  await db.from('inv_subgrupos').delete().eq('id',id);
  showToast('Subgrupo eliminado'); renderInventario();
}

// ── PRODUCTOS ─────────────────────────────────────────────────────
async function modalNuevoProducto(grupoId=null, subgrupoId=null) {
  const {data:grupos} = await db.from('inv_grupos').select('*').order('nombre');
  let subgruposHTML = '<option value="">Sin subgrupo</option>';
  if (grupoId) {
    const {data:subs} = await db.from('inv_subgrupos').select('*').eq('grupo_id',grupoId).order('nombre');
    subgruposHTML = `<option value="">Sin subgrupo</option>${(subs||[]).map(s=>`<option value="${s.id}" ${s.id===subgrupoId?'selected':''}>${s.nombre}</option>`).join('')}`;
  }
  openModal('Nuevo producto',`
    <div class="modal-form">
      <div class="form-row one"><div class="form-group"><label>Nombre *</label>
        <input type="text" id="prod-nombre" placeholder="Ej: Detergente, Arroz...">
      </div></div>
      <div class="form-row">
        <div class="form-group"><label>Grupo *</label>
          <select id="prod-grupo" onchange="cargarSubgruposModal(this.value)">
            <option value="">Seleccionar...</option>
            ${(grupos||[]).map(g=>`<option value="${g.id}" ${g.id===grupoId?'selected':''}>${g.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Subgrupo</label>
          <select id="prod-subgrupo">${subgruposHTML}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Stock inicial</label>
          <input type="number" id="prod-stock" value="0" min="0" step="0.5">
        </div>
        <div class="form-group"><label>Unidad</label>
          <select id="prod-unidad">
            ${['unidad','kilo','litro','gramo','ml','rollo','caja','bolsa','sobre','par'].map(u=>`<option>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Alerta mínima</label>
          <input type="number" id="prod-alerta" value="3" min="0" step="0.5">
        </div>
        <div class="form-group" style="justify-content:flex-end;padding-top:22px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="prod-consumible" checked style="width:15px;height:15px">
            <span style="font-size:13px">Es consumible</span>
          </label>
        </div>
      </div>
    </div>
  `,`<button class="btn" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="guardarProducto()">Guardar producto</button>`);
}

async function cargarSubgruposModal(grupoId) {
  const sel = document.getElementById('prod-subgrupo');
  if (!grupoId||!sel) { if(sel) sel.innerHTML='<option value="">Sin subgrupo</option>'; return; }
  const {data} = await db.from('inv_subgrupos').select('*').eq('grupo_id',grupoId).order('nombre');
  sel.innerHTML = `<option value="">Sin subgrupo</option>${(data||[]).map(s=>`<option value="${s.id}">${s.nombre}</option>`).join('')}`;
}

async function guardarProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const grupoId = document.getElementById('prod-grupo').value;
  if (!nombre||!grupoId) { showToast('Nombre y grupo son obligatorios','error'); return; }
  const {error} = await db.from('inv_productos').insert({
    nombre, grupo_id:grupoId,
    subgrupo_id: document.getElementById('prod-subgrupo').value||null,
    stock_actual: parseFloat(document.getElementById('prod-stock').value)||0,
    unidad: document.getElementById('prod-unidad').value,
    alerta_minima: parseFloat(document.getElementById('prod-alerta').value)||3,
    es_consumible: document.getElementById('prod-consumible').checked
  });
  if (error) { showToast('Error: '+error.message,'error'); return; }
  closeModal(); showToast('Producto agregado ✅','success'); renderInventario();
}

async function modalEditarProducto(id) {
  const {data:p} = await db.from('inv_productos').select('*').eq('id',id).single();
  if (!p) return;
  const {data:grupos} = await db.from('inv_grupos').select('*').order('nombre');
  const {data:subs} = await db.from('inv_subgrupos').select('*').eq('grupo_id',p.grupo_id).order('nombre');
  openModal(`Editar — ${p.nombre}`,`
    <div class="modal-form">
      <div class="form-row one"><div class="form-group"><label>Nombre *</label>
        <input type="text" id="pe-nombre" value="${p.nombre}">
      </div></div>
      <div class="form-row">
        <div class="form-group"><label>Grupo</label>
          <select id="pe-grupo" onchange="cargarSubgruposModal(this.value)">
            ${(grupos||[]).map(g=>`<option value="${g.id}" ${g.id===p.grupo_id?'selected':''}>${g.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Subgrupo</label>
          <select id="prod-subgrupo">
            <option value="">Sin subgrupo</option>
            ${(subs||[]).map(s=>`<option value="${s.id}" ${s.id===p.subgrupo_id?'selected':''}>${s.nombre}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Stock actual</label>
          <input type="number" id="pe-stock" value="${p.stock_actual}" min="0" step="0.5">
        </div>
        <div class="form-group"><label>Unidad</label>
          <select id="pe-unidad">
            ${['unidad','kilo','litro','gramo','ml','rollo','caja','bolsa','sobre','par'].map(u=>`<option ${u===p.unidad?'selected':''}>${u}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Alerta mínima</label>
          <input type="number" id="pe-alerta" value="${p.alerta_minima}" min="0" step="0.5">
        </div>
        <div class="form-group" style="justify-content:flex-end;padding-top:22px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" id="pe-consumible" ${p.es_consumible?'checked':''} style="width:15px;height:15px">
            <span style="font-size:13px">Es consumible</span>
          </label>
        </div>
      </div>
    </div>
  `,`<button class="btn" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="guardarEdicionProducto('${id}')">Guardar cambios</button>`);
}

async function guardarEdicionProducto(id) {
  const nombre = document.getElementById('pe-nombre').value.trim();
  if (!nombre) { showToast('Nombre es obligatorio','error'); return; }
  await db.from('inv_productos').update({
    nombre,
    grupo_id: document.getElementById('pe-grupo').value,
    subgrupo_id: document.getElementById('prod-subgrupo').value||null,
    stock_actual: parseFloat(document.getElementById('pe-stock').value)||0,
    unidad: document.getElementById('pe-unidad').value,
    alerta_minima: parseFloat(document.getElementById('pe-alerta').value)||3,
    es_consumible: document.getElementById('pe-consumible').checked
  }).eq('id',id);
  closeModal(); showToast('Producto actualizado ✅','success'); renderInventario();
}

async function eliminarProducto(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"?`)) return;
  await db.from('inv_productos').delete().eq('id',id);
  showToast('Producto eliminado'); renderInventario();
}

// ── MOVIMIENTOS ───────────────────────────────────────────────────
function modalMovProducto(id, nombre, tipo, actual, unidad) {
  const esIngreso = tipo === 'ingreso';
  openModal(`${esIngreso?'📦 Ingreso':'📤 Egreso'} — ${nombre}`,`
    <div class="modal-form">
      <div style="background:var(--surface2);border-radius:var(--radius);padding:10px 14px;margin-bottom:1rem;display:flex;justify-content:space-between">
        <span style="font-size:13px;color:var(--text2)">Stock actual</span>
        <span style="font-weight:600;font-size:15px">${actual} ${unidad}</span>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Cantidad *</label>
          <input type="number" id="mov-cant" placeholder="0" min="0.1" step="0.5">
        </div>
        <div class="form-group"><label>Fecha *</label>
          <input type="date" id="mov-fecha" value="${today()}">
        </div>
      </div>
      <div class="form-row one"><div class="form-group"><label>Descripción</label>
        <input type="text" id="mov-desc" placeholder="${esIngreso?'Ej: Compra supermercado':'Ej: Uso cocina, lavandería...'}">
      </div></div>
    </div>
  `,`<button class="btn" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-primary" onclick="confirmarMovProducto('${id}','${tipo}',${actual})">Confirmar ${tipo}</button>`);
}

async function confirmarMovProducto(id, tipo, actual) {
  const cantidad = parseFloat(document.getElementById('mov-cant').value)||0;
  if (!cantidad) { showToast('Ingresa la cantidad','error'); return; }
  const nuevo = tipo==='ingreso' ? actual+cantidad : Math.max(0, actual-cantidad);
  await db.from('inv_productos').update({stock_actual:nuevo}).eq('id',id);
  await db.from('inv_movimientos').insert({
    producto_id:id, tipo, cantidad, stock_resultante:nuevo,
    descripcion: document.getElementById('mov-desc').value.trim()||null,
    fecha: document.getElementById('mov-fecha').value,
    usuario: currentUser?.nombre
  });
  closeModal(); showToast(`${tipo==='ingreso'?'Ingreso':'Egreso'} registrado ✅`,'success'); renderInventario();
}

function modalStockInicial(id, nombre, actual, unidad) {
  openModal(`📋 Stock inicial — ${nombre}`, `
    <div class="modal-form">
      ${actual > 0 ? `<div style="background:var(--warning-pale);border-radius:var(--radius);padding:10px 14px;margin-bottom:1rem;font-size:13px;color:var(--warning)">
        ⚠️ Este producto ya tiene stock registrado (${actual} ${unidad}). El stock inicial reemplazará ese valor.
      </div>` : ''}
      <div class="form-row">
        <div class="form-group"><label>Cantidad inicial *</label>
          <input type="number" id="si-cant" placeholder="0" min="0" step="0.5" value="${actual||''}">
        </div>
        <div class="form-group"><label>Fecha de inventario *</label>
          <input type="date" id="si-fecha" value="${today()}">
        </div>
      </div>
      <div class="form-row one"><div class="form-group"><label>Notas</label>
        <input type="text" id="si-notas" placeholder="Ej: Inventario inicial 23/05/2026">
      </div></div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarStockInicial('${id}','${unidad}')">Guardar stock inicial</button>
  `);
}

async function guardarStockInicial(id, unidad) {
  const cantidad = parseFloat(document.getElementById('si-cant').value) || 0;
  const fecha = document.getElementById('si-fecha').value;
  if (!fecha) { showToast('Fecha es obligatoria', 'error'); return; }
  
  // Actualizar stock actual
  await db.from('inv_productos').update({ stock_actual: cantidad }).eq('id', id);
  
  // Registrar como movimiento de tipo ingreso con descripción especial
  await db.from('inv_movimientos').insert({
    producto_id: id,
    tipo: 'ingreso',
    cantidad,
    stock_resultante: cantidad,
    descripcion: document.getElementById('si-notas').value.trim() || 'Stock inicial',
    fecha,
    usuario: currentUser?.nombre
  });
  
  closeModal();
  showToast('Stock inicial registrado ✅', 'success');
  renderInventario();
}

async function verListaCompras() {
  const { data: productos } = await db.from('inv_productos')
    .select('*, inv_grupos(nombre), inv_subgrupos(nombre)')
    .eq('es_consumible', true)
    .order('nombre');

  const bajos = (productos || []).filter(p => Number(p.stock_actual) <= Number(p.alerta_minima));

  if (!bajos.length) {
    openModal('🛒 Lista de compras', `
      <div class="modal-form">
        <div style="text-align:center;padding:2rem">
          <div style="font-size:40px;margin-bottom:1rem">✅</div>
          <div style="font-weight:600;font-size:16px;color:var(--green)">Todo el stock está en niveles normales</div>
          <div style="font-size:13px;color:var(--text3);margin-top:8px">No hay productos que necesiten reposición</div>
        </div>
      </div>
    `);
    return;
  }

  // Agrupar por grupo
  const porGrupo = {};
  bajos.forEach(p => {
    const grupo = p.inv_grupos?.nombre || 'Sin grupo';
    if (!porGrupo[grupo]) porGrupo[grupo] = [];
    porGrupo[grupo].push(p);
  });

  openModal(`🛒 Lista de compras — ${bajos.length} productos`, `
    <div class="modal-form">
      <div style="background:var(--warning-pale);border-radius:var(--radius);padding:10px 14px;margin-bottom:1rem;font-size:13px;color:var(--warning)">
        ⚠️ Estos productos están por debajo del stock mínimo y necesitan reposición
      </div>

      ${Object.entries(porGrupo).map(([grupo, prods]) => `
        <div style="margin-bottom:1rem">
          <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px">
            <i class="fa-solid fa-warehouse" style="color:var(--green)"></i> ${grupo}
          </div>
          ${prods.map(p => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface2);border-radius:var(--radius);margin-bottom:6px">
              <div style="width:10px;height:10px;border-radius:50%;background:${Number(p.stock_actual) === 0 ? 'var(--danger)' : 'var(--warning)'};flex-shrink:0"></div>
              <div style="flex:1">
                <div style="font-weight:500;font-size:13px">${p.nombre}</div>
                <div style="font-size:11px;color:var(--text3)">Stock: ${p.stock_actual} ${p.unidad} · Mínimo: ${p.alerta_minima} ${p.unidad}</div>
              </div>
              <div style="font-size:12px;font-weight:600;color:${Number(p.stock_actual) === 0 ? 'var(--danger)' : 'var(--warning)'}">
                ${Number(p.stock_actual) === 0 ? '🔴 Agotado' : '⚠️ Bajo'}
              </div>
            </div>`).join('')}
        </div>`).join('')}

      <div style="margin-top:1rem;display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1" onclick="imprimirListaCompras()">
          <i class="fa-solid fa-print"></i> Imprimir lista
        </button>
        <button class="btn" style="flex:1" onclick="copiarListaCompras()">
          <i class="fa-solid fa-copy"></i> Copiar para WhatsApp
        </button>
      </div>
    </div>
  `);

  // Guardar datos para imprimir/copiar
  window._listaCompras = bajos;
  window._listaComprasPorGrupo = porGrupo;
}

function imprimirListaCompras() {
  const bajos = window._listaCompras || [];
  const porGrupo = window._listaComprasPorGrupo || {};
  const fecha = new Date().toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Lista de compras</title>
  <style>
    body{font-family:Arial;font-size:13px;padding:20px;color:#222;max-width:600px;margin:0 auto}
    h1{color:#1a6b4a;font-size:18px;margin-bottom:4px}
    .fecha{color:#666;font-size:12px;margin-bottom:20px}
    .grupo{font-size:11px;font-weight:700;color:#666;text-transform:uppercase;margin:16px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
    .item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f5f5}
    .check{width:18px;height:18px;border:2px solid #1a6b4a;border-radius:3px;flex-shrink:0}
    .nombre{flex:1;font-weight:500}
    .stock{font-size:11px;color:#999}
    .agotado{color:#c0392b;font-weight:700}
    .bajo{color:#d97706;font-weight:600}
    @media print{body{padding:10px}}
  </style></head><body>
  <h1>🛒 Reencuéntrate — Lista de compras</h1>
  <div class="fecha">${fecha}</div>
  ${Object.entries(porGrupo).map(([grupo, prods]) => `
    <div class="grupo">${grupo}</div>
    ${prods.map(p => `
      <div class="item">
        <div class="check"></div>
        <div class="nombre">${p.nombre}</div>
        <div class="stock ${Number(p.stock_actual)===0?'agotado':'bajo'}">
          ${Number(p.stock_actual)===0?'AGOTADO':`${p.stock_actual} ${p.unidad} (mín. ${p.alerta_minima})`}
        </div>
      </div>`).join('')}
  `).join('')}
  <script>window.onload=()=>window.print()</script>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

function copiarListaCompras() {
  const porGrupo = window._listaComprasPorGrupo || {};
  const fecha = new Date().toLocaleDateString('es-CL', { day:'numeric', month:'long' });
  
  let texto = `🛒 *Lista de compras Reencuéntrate*\n_${fecha}_\n\n`;
  
  Object.entries(porGrupo).forEach(([grupo, prods]) => {
    texto += `*${grupo}*\n`;
    prods.forEach(p => {
      const estado = Number(p.stock_actual) === 0 ? '🔴 AGOTADO' : '⚠️ Stock bajo';
      texto += `• ${p.nombre} — ${estado} (quedan ${p.stock_actual} ${p.unidad})\n`;
    });
    texto += '\n';
  });

  navigator.clipboard.writeText(texto).then(() => {
    showToast('Lista copiada — pégala en WhatsApp ✅', 'success');
  }).catch(() => {
    showToast('No se pudo copiar', 'error');
  });
}
