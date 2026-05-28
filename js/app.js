// ── APP ROUTER ────────────────────────────────

const pages = {
  dashboard: { title: 'Dashboard', render: renderDashboard },
  pacientes: { title: 'Pacientes', render: renderPacientes },
  medicamentos: { title: 'Medicamentos', render: renderMedicamentos },
  agenda: { title: 'Agenda', render: renderAgenda },
  finanzas: { title: 'Finanzas', render: renderFinanzas },
  equipo: { title: 'Equipo', render: renderEquipo }
};

function navigate(pageId, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.closest('.nav-item').classList.add('active');
  document.getElementById('page-title').textContent = pages[pageId]?.title || '';
  pages[pageId]?.render();
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
  return false;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
