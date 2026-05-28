// ── MASCOTA ──

async function renderMascota() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions('');
  const pacientes = await getPacientes();

  content.innerHTML = `
    <p style="color:var(--text2);margin-bottom:1.25rem;font-size:14px">Cuenta corriente por paciente</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem" id="mascota-grid">
      ${pacientes.length === 0 ? emptyState('wallet','No hay pacientes') : '<div class="spinner" style="margin:2rem auto;grid-column:1/-1"></div>'}
    </div>`;

  if (!pacientes.length) return;

  const grid = document.getElementById('mascota-grid');
  const rows = [];
  for (const p of pacientes) {
    const movs = await getMascota(p.id);
    const ingresos = movs.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
    const egresos = movs.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0);
    const saldo = ingresos - egresos;
    rows.push({ p, saldo });
  }

  grid.innerHTML = rows.map(({ p, saldo }) => `
    <div class="card" style="margin-bottom:0;cursor:pointer" onclick="verMascotaPaciente('${p.id}','${p.nombre}')">
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span class="avatar" style="width:40px;height:40px;font-size:15px">${initials(p.nombre)}</span>
          <div style="font-weight:600">${p.nombre}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:var(--text3)">Saldo</span>
          <span style="font-size:18px;font-weight:600;color:${saldo >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(saldo)}</span>
        </div>
        ${saldo < 0 ? '<div style="font-size:11px;color:var(--danger);margin-top:4px">⚠️ Saldo negativo</div>' : ''}
      </div>
    </div>`).join('');
}

async function verMascotaPaciente(pacienteId, nombre) {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions(`
    <button class="btn" onclick="renderMascota()"><i class="fa-solid fa-arrow-left"></i> Volver</button>
    <button class="btn" onclick="exportarMascotaExcel('${pacienteId}','${nombre}')"><i class="fa-solid fa-file-excel"></i> Exportar Excel</button>
    <button class="btn btn-primary" onclick="modalNuevoMovMascota('${pacienteId}','ingreso')"><i class="fa-solid fa-plus"></i> Ingreso plata</button>
    <button class="btn btn-danger" onclick="modalNuevoMovMascota('${pacienteId}','egreso')"><i class="fa-solid fa-minus"></i> Egreso</button>
  `);

  const movs = await getMascota(pacienteId);
  const ingresos = movs.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
  const egresos = movs.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0);
  const saldo = ingresos - egresos;

  content.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.5rem">
      <span class="avatar" style="width:44px;height:44px;font-size:16px">${initials(nombre)}</span>
      <div>
        <h2 style="font-family:var(--font-serif);font-size:22px">${nombre}</h2>
        <div style="font-size:13px;color:var(--text3)">Cuenta corriente mascota</div>
      </div>
    </div>

    <div class="metrics-grid" style="margin-bottom:1.5rem">
      <div class="metric-card">
        <div class="metric-icon green"><i class="fa-solid fa-arrow-trend-up"></i></div>
        <div class="metric-label">Total ingresos</div>
        <div class="metric-value">${fmt(ingresos)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon danger"><i class="fa-solid fa-arrow-trend-down"></i></div>
        <div class="metric-label">Total egresos</div>
        <div class="metric-value">${fmt(egresos)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon ${saldo >= 0 ? 'gold' : 'danger'}"><i class="fa-solid fa-scale-balanced"></i></div>
        <div class="metric-label">Saldo actual</div>
        <div class="metric-value" style="color:${saldo >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(saldo)}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Movimientos</h3></div>
      <div class="card-body no-pad">
        ${movs.length === 0 ? emptyState('wallet','Sin movimientos registrados') :
          `<div class="table-wrap"><table>
            <thead><tr><th>Fecha</th><th>Descripción</th><th>Detalle productos</th><th>Tipo</th><th>Monto</th><th>Saldo</th><th></th></tr></thead>
            <tbody>
              ${(() => {
                let saldoAcc = 0;
                const reversed = [...movs].reverse();
                const rows = reversed.map(m => {
                  saldoAcc += m.tipo === 'ingreso' ? m.monto : -m.monto;
                  const productos = m.productos ? JSON.parse(typeof m.productos === 'string' ? m.productos : JSON.stringify(m.productos)) : [];
                  return `<tr>
                    <td>${fmtDate(m.fecha)}</td>
                    <td style="font-weight:500">${m.descripcion}</td>
                    <td style="font-size:12px;color:var(--text2)">
                      ${productos.length ? productos.map(p => `${p.nombre}: ${fmt(p.precio)}`).join(' · ') : '—'}
                    </td>
                    <td><span class="badge ${m.tipo==='ingreso'?'badge-success':'badge-danger'}">${m.tipo}</span></td>
                    <td style="font-weight:600;color:${m.tipo==='ingreso'?'var(--success)':'var(--danger)'}">${fmt(m.monto)}</td>
                    <td style="font-weight:600;color:${saldoAcc>=0?'var(--success)':'var(--danger)'}">${fmt(saldoAcc)}</td>
                    <td><button class="btn btn-sm btn-danger" onclick="eliminarMovMascota('${m.id}','${pacienteId}','${nombre}')"><i class="fa-solid fa-trash"></i></button></td>
                  </tr>`;
                });
                return rows.reverse().join('');
              })()}
            </tbody>
          </table></div>`}
      </div>
    </div>`;
}

function modalNuevoMovMascota(pacienteId, tipo) {
  const esIngreso = tipo === 'ingreso';
  openModal(`${esIngreso ? '💚 Ingreso de plata' : '🔴 Egreso'} — Mascota`, `
    <div class="modal-form">
      <div class="form-row">
        <div class="form-group"><label>Descripción *</label>
          <input type="text" id="mas-desc" placeholder="${esIngreso ? 'Ej: Transferencia apoderado' : 'Ej: Compra mascota, Cigarros...'}">
        </div>
        <div class="form-group"><label>Fecha *</label>
          <input type="date" id="mas-fecha" value="${today()}">
        </div>
      </div>
      ${esIngreso ? '' : `
        <div style="margin-bottom:12px">
          <label style="font-size:13px;font-weight:500;color:var(--text2);display:block;margin-bottom:8px">Productos (opcional)</label>
          <div id="productos-list"></div>
          <button class="btn btn-sm" onclick="agregarProducto()" style="margin-top:8px"><i class="fa-solid fa-plus"></i> Agregar producto</button>
        </div>
        <div id="total-calculado" style="font-size:12px;color:var(--text3);margin-bottom:8px"></div>
      `}
      <div class="form-row one">
        <div class="form-group"><label>Monto *</label>
          <input type="number" id="mas-monto" placeholder="0" ${esIngreso ? '' : 'oninput="calcularTotal()"'}>
        </div>
      </div>
    </div>
  `, `
    <button class="btn" onclick="closeModal()">Cancelar</button>
    <button class="btn btn-primary" onclick="guardarMovMascota('${pacienteId}','${tipo}')">Registrar ${tipo}</button>
  `);
}

function agregarProducto() {
  const list = document.getElementById('productos-list');
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
  div.innerHTML = `
    <input type="text" placeholder="Nombre producto" style="flex:2;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px" class="prod-nombre">
    <input type="number" placeholder="Precio" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius);font-size:13px" class="prod-precio" oninput="calcularTotal()">
    <button onclick="this.parentElement.remove();calcularTotal()" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:18px">×</button>`;
  list.appendChild(div);
}

function calcularTotal() {
  const precios = [...document.querySelectorAll('.prod-precio')].map(i => parseInt(i.value) || 0);
  const suma = precios.reduce((a, b) => a + b, 0);
  const el = document.getElementById('total-calculado');
  if (el && suma > 0) {
    el.textContent = `Total productos: ${fmt(suma)}`;
    document.getElementById('mas-monto').value = suma;
  }
}

async function guardarMovMascota(pacienteId, tipo) {
  const desc = document.getElementById('mas-desc').value.trim();
  const monto = parseInt(document.getElementById('mas-monto').value) || 0;
  if (!desc || !monto) { showToast('Completa descripción y monto', 'error'); return; }

  const productos = tipo === 'egreso'
    ? [...document.querySelectorAll('#productos-list > div')].map(div => ({
        nombre: div.querySelector('.prod-nombre').value.trim(),
        precio: parseInt(div.querySelector('.prod-precio').value) || 0
      })).filter(p => p.nombre)
    : [];

  try {
    await createMascotaMovimiento({ paciente_id: pacienteId, tipo, descripcion: desc, monto, fecha: document.getElementById('mas-fecha').value, productos: JSON.stringify(productos) });
    closeModal();
    showToast(`${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado ✅`, 'success');
    const pac = await getPaciente(pacienteId);
    verMascotaPaciente(pacienteId, pac.nombre);
  } catch(e) { showToast('Error', 'error'); }
}

async function eliminarMovMascota(id, pacienteId, nombre) {
  if (!confirm('¿Eliminar este movimiento?')) return;
  const { error } = await db.from('mascota').delete().eq('id', id);
  if (error) { showToast('Error al eliminar', 'error'); return; }
  showToast('Movimiento eliminado');
  verMascotaPaciente(pacienteId, nombre);
}

async function exportarMascotaExcel(pacienteId, nombre) {
  const movs = await getMascota(pacienteId);
  if (!movs.length) { showToast('Sin movimientos para exportar', 'error'); return; }

  let saldoAcc = 0;
  const reversed = [...movs].reverse();
  const filas = reversed.map(m => {
    saldoAcc += m.tipo === 'ingreso' ? m.monto : -m.monto;
    const productos = m.productos ? JSON.parse(typeof m.productos === 'string' ? m.productos : JSON.stringify(m.productos)) : [];
    const detalle = productos.length ? productos.map(p => `${p.nombre}: $${Number(p.precio).toLocaleString('es-CL')}`).join(' | ') : '—';
    return {
      fecha: m.fecha,
      descripcion: m.descripcion,
      detalle,
      tipo: m.tipo,
      ingreso: m.tipo === 'ingreso' ? m.monto : null,
      egreso: m.tipo === 'egreso' ? m.monto : null,
      saldo: saldoAcc
    };
  }).reverse();

  const totalIng = movs.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
  const totalEgr = movs.filter(m => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0);
  const saldoFinal = totalIng - totalEgr;

  // HTML table styled for printing
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Mascota — ${nombre}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; padding: 30px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; border-bottom: 2px solid #1a6b4a; padding-bottom:16px; }
  .header h1 { font-size:20px; color:#1a6b4a; font-weight:700; }
  .header p { font-size:12px; color:#666; margin-top:4px; }
  .resumen { display:flex; gap:20px; margin-bottom:24px; }
  .resumen-item { flex:1; padding:12px 16px; border-radius:8px; }
  .resumen-item.verde { background:#e8f5ee; }
  .resumen-item.rojo { background:#fdecea; }
  .resumen-item.gold { background:#fdf3e3; }
  .resumen-item label { font-size:11px; color:#666; display:block; margin-bottom:4px; }
  .resumen-item span { font-size:18px; font-weight:700; }
  .verde span { color:#1a6b4a; }
  .rojo span { color:#c0392b; }
  .gold span { color:${saldoFinal >= 0 ? '#1a6b4a' : '#c0392b'}; }
  table { width:100%; border-collapse:collapse; }
  th { background:#1a6b4a; color:white; padding:10px 12px; text-align:left; font-size:12px; font-weight:600; }
  td { padding:9px 12px; border-bottom:1px solid #eee; font-size:12px; vertical-align:top; }
  tr:nth-child(even) td { background:#f9f9f9; }
  tr:hover td { background:#f0f7f3; }
  .badge { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600; }
  .badge.ing { background:#e8f5ee; color:#1a6b4a; }
  .badge.egr { background:#fdecea; color:#c0392b; }
  .monto-ing { color:#1a6b4a; font-weight:600; }
  .monto-egr { color:#c0392b; font-weight:600; }
  .saldo-pos { color:#1a6b4a; font-weight:600; }
  .saldo-neg { color:#c0392b; font-weight:600; }
  .footer { margin-top:20px; font-size:11px; color:#999; text-align:center; border-top:1px solid #eee; padding-top:12px; }
  @media print { body { padding:15px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Reencuéntrate — Cuenta Mascota</h1>
      <p>Paciente: <strong>${nombre}</strong></p>
      <p>Generado el: ${new Date().toLocaleDateString('es-CL', {day:'2-digit',month:'long',year:'numeric'})}</p>
    </div>
  </div>

  <div class="resumen">
    <div class="resumen-item verde">
      <label>Total ingresos</label>
      <span>$${totalIng.toLocaleString('es-CL')}</span>
    </div>
    <div class="resumen-item rojo">
      <label>Total egresos</label>
      <span>$${totalEgr.toLocaleString('es-CL')}</span>
    </div>
    <div class="resumen-item gold">
      <label>Saldo final</label>
      <span>$${saldoFinal.toLocaleString('es-CL')}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Descripción</th>
        <th>Detalle productos</th>
        <th>Tipo</th>
        <th>Ingreso</th>
        <th>Egreso</th>
        <th>Saldo</th>
      </tr>
    </thead>
    <tbody>
      ${filas.map(f => `
        <tr>
          <td>${f.fecha}</td>
          <td>${f.descripcion}</td>
          <td style="color:#666;font-size:11px">${f.detalle}</td>
          <td><span class="badge ${f.tipo==='ingreso'?'ing':'egr'}">${f.tipo}</span></td>
          <td class="monto-ing">${f.ingreso != null ? '$'+Number(f.ingreso).toLocaleString('es-CL') : ''}</td>
          <td class="monto-egr">${f.egreso != null ? '$'+Number(f.egreso).toLocaleString('es-CL') : ''}</td>
          <td class="${f.saldo >= 0 ? 'saldo-pos' : 'saldo-neg'}">$${Number(f.saldo).toLocaleString('es-CL')}</td>
        </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    Reencuéntrate — Centro de Rehabilitación de Adicciones · Documento generado automáticamente
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Mascota_${nombre.replace(/ /g,'_')}_${today()}.html`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Archivo descargado ✅ — ábrelo en Chrome e imprime', 'success');
}
