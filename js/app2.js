// ── APP v2 ROUTER ──

const MODULOS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart-pie', permiso: 'dashboard' },
  { id: 'pacientes', label: 'Pacientes', icon: 'users', permiso: 'pacientes' },
  { id: 'farmacologia', label: 'Farmacología', icon: 'pills', permiso: 'farmacologia' },
  { id: 'entregas', label: 'Entregas diarias', icon: 'hand-holding-medical', permiso: 'farmacologia' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar-days', permiso: 'agenda' },
  { id: 'pases', label: 'Pases externos', icon: 'door-open', permiso: 'pases' },
  { id: 'inventario', label: 'Inventario', icon: 'boxes-stacking', permiso: 'inventario' },
  { id: 'mascota', label: 'Mascota', icon: 'wallet', permiso: 'mascota' },
  { id: 'finanzas', label: 'Finanzas', icon: 'chart-line', permiso: 'finanzas' },
  { id: 'equipo', label: 'Equipo', icon: 'user-doctor', permiso: 'equipo' },
  { id: 'progresion', label: 'Progresión', icon: 'arrow-trend-up', permiso: 'progresion' },
  { id: 'tareas', label: 'Tareas', icon: 'list-check', permiso: 'tareas' },
  { id: 'informes', label: 'Informes clínicos', icon: 'file-medical', permiso: 'informes' },
  { id: 'grupo_alto', label: 'Grupo Alto', icon: 'star', permiso: 'grupo_alto' },
  { id: 'usuarios', label: 'Usuarios', icon: 'user-gear', permiso: 'usuarios', soloAdmin: true },
];

const renders = {
  dashboard: renderDashboard,
  pacientes: renderPacientes,
  farmacologia: renderFarmacologia,
  entregas: renderEntregas,
  agenda: renderAgenda,
  pases: renderPases,
  inventario: renderInventario,
  mascota: renderMascota,
  finanzas: renderFinanzas,
  equipo: renderEquipo,
  progresion: renderProgresion,
  tareas: renderTareas,
  informes: renderInformes,
  grupo_alto: renderGrupoAlto,
  usuarios: renderUsuarios,
};

function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = MODULOS
    .filter(m => {
      if (m.soloAdmin && !currentUser?.esAdmin) return false;
      return currentUser?.esAdmin || currentUser?.permisos?.all || tienePermiso(m.permiso);
    })
    .map(m => `<a href="#" class="nav-item" data-page="${m.id}" onclick="navigate('${m.id}',this)">
      <i class="fa-solid fa-${m.icon}"></i><span>${m.label}</span>
    </a>`).join('');
}

function navigate(pageId, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navEl = el?.closest?.('.nav-item') || document.querySelector(`[data-page="${pageId}"]`);
  if (navEl) navEl.classList.add('active');
  const modulo = MODULOS.find(m => m.id === pageId);
  document.getElementById('page-title').textContent = modulo?.label || '';
  if (renders[pageId]) renders[pageId]();
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
  return false;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
