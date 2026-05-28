// ── UTILS ─────────────────────────────────────

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('es-CL');
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function mesActual() {
  return new Date().toISOString().slice(0, 7);
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

function openModal(title, bodyHTML, footerHTML = '') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-form">${bodyHTML}</div>
    ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
  `;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function setTopbarActions(html) {
  document.getElementById('topbar-actions').innerHTML = html;
}

function loadingHTML() {
  return '<div class="loading-wrap"><div class="spinner"></div></div>';
}

function emptyState(icon, msg) {
  return `<div class="empty-state"><i class="fa-solid fa-${icon}"></i><p>${msg}</p></div>`;
}

function proximoPago(fechaIngreso) {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const prox = new Date(ingreso);
  while (prox <= hoy) {
    prox.setMonth(prox.getMonth() + 1);
  }
  return prox.toISOString().split('T')[0];
}

function diasRestantes(fecha) {
  const diff = new Date(fecha) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function pagoVencido(fecha) {
  return new Date(fecha) < new Date();
}
