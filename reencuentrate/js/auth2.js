// ── AUTH v2 ──
let currentUser = null;

async function handleLogin() {
  const nombre = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-password').value;
  const btnText = document.getElementById('login-text');
  if (!nombre || !password) { showLoginError('Ingresa usuario y contraseña'); return; }
  btnText.textContent = 'Ingresando...';

  // Admin
  if (nombre.toLowerCase() === 'admin' || nombre.toLowerCase() === 'jeremías' || nombre.toLowerCase() === 'jeremias') {
    const { data, error } = await db.auth.signInWithPassword({ email: 'agr.jeremiasvera@gmail.com', password });
    if (error) { btnText.textContent = 'Ingresar'; showLoginError('Contraseña incorrecta'); return; }
    currentUser = { id: data.user.id, nombre: 'Jeremías', esAdmin: true, permisos: { all: true } };
    sessionStorage.setItem('rc_user', JSON.stringify(currentUser));
    showApp(); return;
  }

  // Buscar usuario en tabla
  const { data, error } = await db.from('usuarios').select('*').ilike('nombre', `%${nombre}%`).eq('activo', true);
  if (error || !data?.length) { btnText.textContent = 'Ingresar'; showLoginError('Usuario no encontrado'); return; }

  const usuario = data[0];
  // Verificar contraseña — comparar hash btoa o texto plano para compatibilidad
  const hashIntento = 'rc2024_' + password;
  const coincide = usuario.password_hash === hashIntento || usuario.password_hash === password;

  if (!coincide) { btnText.textContent = 'Ingresar'; showLoginError('Contraseña incorrecta'); return; }

  currentUser = { id: usuario.id, nombre: usuario.nombre, esAdmin: false, permisos: usuario.permisos || {} };
  sessionStorage.setItem('rc_user', JSON.stringify(currentUser));
  showApp();
}

function handleLogout() {
  if (currentUser?.esAdmin) db.auth.signOut();
  sessionStorage.removeItem('rc_user');
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-user').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
}

function checkSession() {
  const saved = sessionStorage.getItem('rc_user');
  if (saved) { try { currentUser = JSON.parse(saved); showApp(); } catch(e) { sessionStorage.removeItem('rc_user'); } }
}

function tienePermiso(modulo) {
  if (!currentUser) return false;
  if (currentUser.esAdmin || currentUser.permisos?.all) return true;
  return !!currentUser.permisos?.[modulo];
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('login-text').textContent = 'Ingresar';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('user-name-label').textContent = currentUser.nombre;
  document.getElementById('user-avatar').textContent = currentUser.nombre.charAt(0).toUpperCase();
  buildNav();
  if (currentUser.esAdmin || currentUser.permisos?.all) {
    navigate('dashboard', null);
  } else {
    const primero = Object.keys(currentUser.permisos || {}).find(k => currentUser.permisos[k]);
    navigate(primero || 'dashboard', null);
  }
}
