// ── AUTH ──────────────────────────────────────
let currentUser = null;
let currentProfile = null;

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btnText = document.getElementById('login-text');

  if (!email || !password) {
    showLoginError('Ingresa tu correo y contraseña');
    return;
  }

  btnText.textContent = 'Ingresando...';

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    btnText.textContent = 'Ingresar';
    showLoginError('Correo o contraseña incorrectos');
    return;
  }

  currentUser = data.user;
  await loadProfile();
  showApp();
}

async function loadProfile() {
  const { data } = await db
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  currentProfile = data;
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
}

async function handleLogout() {
  await db.auth.signOut();
  currentUser = null;
  currentProfile = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

async function checkSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile();
    showApp();
  }
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  const name = currentProfile?.nombre || currentUser.email.split('@')[0];
  const role = currentProfile?.rol || 'admin';

  document.getElementById('user-name-label').textContent = name;
  document.getElementById('user-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('user-role-label').textContent =
    role === 'admin' ? 'Administrador' :
    role === 'clinico' ? 'Equipo clínico' : 'Administrativo';

  navigate('dashboard', document.querySelector('.nav-item'));
}
