// ── DASHBOARD v2 ──

async function renderDashboard() {
  const content = document.getElementById('content');
  content.innerHTML = loadingHTML();
  setTopbarActions('');

  try {
    const [pacientes, movimientos, pases] = await Promise.all([
      getPacientes(),
      getMovimientos(mesActual()),
      getPases()
    ]);

    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
    const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((a, m) => a + m.monto, 0);
    const utilidad = ingresos - gastos;
    const pendientes = pacientes.filter(p => !p.pagado_mes);
    const pasesHoy = pases.filter(p => p.estado === 'aprobado' && p.fecha_regreso?.startsWith(today()));

    content.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon green"><i class="fa-solid fa-users"></i></div>
          <div class="metric-label">Pacientes activos</div>
          <div class="metric-value">${pacientes.length}</div>
          <div class="metric-sub">cap. máx. 15</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon green"><i class="fa-solid fa-arrow-trend-up"></i></div>
          <div class="metric-label">Ingresos del mes</div>
          <div class="metric-value">${fmt(ingresos)}</div>
          <div class="metric-sub">${new Date().toLocaleDateString('es-CL',{month:'long',year:'numeric'})}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon danger"><i class="fa-solid fa-arrow-trend-down"></i></div>
          <div class="metric-label">Gastos del mes</div>
          <div class="metric-value">${fmt(gastos)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon gold"><i class="fa-solid fa-sack-dollar"></i></div>
          <div class="metric-label">Utilidad neta</div>
          <div class="metric-value" style="color:${utilidad>=0?'var(--success)':'var(--danger)'}">${fmt(utilidad)}</div>
        </div>
      </div>

      ${pasesHoy.length ? `
      <div style="background:var(--info-pale);border:1px solid #bfdbfe;border-radius:var(--radius);padding:12px 16px;margin-bottom:1.25rem">
        <strong style="color:var(--info)">🚪 Pases que regresan hoy:</strong>
        <span style="color:var(--info);font-size:13px"> ${pasesHoy.map(p=>p.pacientes?.nombre).join(', ')}</span>
      </div>` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
        <div class="card">
          <div class="card-head">
            <h3>⏳ Pagos pendientes</h3>
            <span class="badge ${pendientes.length?'badge-warning':'badge-success'}">${pendientes.length}</span>
          </div>
          <div class="card-body no-pad">
            ${pendientes.length === 0
              ? emptyState('circle-check','Todos al día')
              : `<div class="table-wrap"><table>
                  <thead><tr><th>Paciente</th><th>Monto</th><th></th></tr></thead>
                  <tbody>
                    ${pendientes.map(p => `<tr>
                      <td><div style="display:flex;align-items:center;gap:8px"><span class="avatar">${initials(p.nombre)}</span>${p.nombre}</div></td>
                      <td>${fmt((p.mensualidad||0)+(p.costo_psiquiatra||50000))}</td>
                      <td><button class="btn btn-sm btn-primary" onclick="marcarPagado('${p.id}',${(p.mensualidad||0)+(p.costo_psiquiatra||50000)},'${p.nombre}')">Pagado</button></td>
                    </tr>`).join('')}
                  </tbody>
                </table></div>`}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>📋 Últimos movimientos</h3></div>
          <div class="card-body no-pad">
            ${movimientos.length === 0
              ? emptyState('receipt','Sin movimientos este mes')
              : `<div class="table-wrap"><table>
                  <thead><tr><th>Descripción</th><th>Tipo</th><th>Monto</th></tr></thead>
                  <tbody>
                    ${movimientos.slice(0,6).map(m => `<tr>
                      <td style="font-size:13px">${m.descripcion||'—'}</td>
                      <td><span class="badge ${m.tipo==='ingreso'?'badge-success':'badge-danger'}">${m.tipo}</span></td>
                      <td style="font-weight:600">${fmt(m.monto)}</td>
                    </tr>`).join('')}
                  </tbody>
                </table></div>`}
          </div>
        </div>
      </div>`;

  } catch(e) {
    content.innerHTML = `<div class="card"><div class="card-body"><p style="color:var(--danger)">Error cargando dashboard. Intenta recargar la página.</p></div></div>`;
    console.error(e);
  }
}

async function marcarPagado(pacienteId, monto, nombre) {
  await updatePaciente(pacienteId, { pagado_mes: true });
  await createMovimiento({ tipo: 'ingreso', monto, descripcion: `Mensualidad + psiquiatra — ${nombre}`, fecha: today(), paciente_id: pacienteId, categoria: 'Mensualidad' });
  showToast('Pago registrado', 'success');
  renderDashboard();
}
