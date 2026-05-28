# Reencuéntrate — Sistema de Gestión
## Guía de instalación paso a paso

---

## PASO 1 — Configurar Supabase (base de datos)

1. Entra a https://supabase.com y crea tu cuenta con Gmail
2. Haz clic en **"New project"**
3. Ponle nombre: `reencuentrate`
4. Elige una contraseña segura (guárdala)
5. Selecciona región: **South America (São Paulo)**
6. Espera ~2 minutos mientras se crea

### Crear las tablas
1. En el panel de Supabase, ve a **SQL Editor** (ícono de base de datos)
2. Haz clic en **"New query"**
3. Abre el archivo `schema.sql` de esta carpeta
4. Copia TODO el contenido y pégalo en el editor
5. Haz clic en **"Run"** — debe decir "Success"

### Obtener tus credenciales
1. Ve a **Settings → API** en Supabase
2. Copia la **Project URL** (algo como https://xxxx.supabase.co)
3. Copia la **anon/public key** (empieza con "eyJ...")

### Crear tu usuario administrador
1. Ve a **Authentication → Users**
2. Haz clic en **"Invite user"**
3. Ingresa tu correo
4. Recibirás un email para crear tu contraseña

---

## PASO 2 — Configurar la aplicación

1. Abre el archivo `js/config.js`
2. Reemplaza los valores:

```javascript
const SUPABASE_URL = 'https://tuproyecto.supabase.co';  // tu URL
const SUPABASE_KEY = 'eyJ...';  // tu anon key
```

---

## PASO 3 — Subir a Vercel (hosting gratuito)

### Opción A — Con GitHub (recomendado)
1. Crea cuenta en https://github.com con Gmail
2. Crea un repositorio nuevo llamado `reencuentrate`
3. Sube todos estos archivos al repositorio
4. Ve a https://vercel.com y crea cuenta con GitHub
5. Haz clic en **"New Project"**
6. Selecciona el repositorio `reencuentrate`
7. Haz clic en **"Deploy"**
8. En ~1 minuto tendrás tu URL: `reencuentrate.vercel.app`

### Opción B — Sin GitHub (más simple)
1. Ve a https://vercel.com y crea cuenta con Gmail
2. Instala Vercel CLI: `npm install -g vercel`
3. En la carpeta del proyecto, ejecuta: `vercel`
4. Sigue las instrucciones en pantalla

---

## PASO 4 — Usar la aplicación

1. Abre tu URL de Vercel
2. Inicia sesión con el correo que configuraste en Supabase
3. ¡Listo! Ya puedes empezar a registrar pacientes

---

## Estructura de archivos

```
reencuentrate/
├── index.html          ← Página principal
├── schema.sql          ← Tablas de base de datos (solo se ejecuta una vez)
├── css/
│   └── app.css         ← Estilos
└── js/
    ├── config.js       ← TUS CREDENCIALES VAN AQUÍ
    ├── auth.js         ← Login/logout
    ├── db.js           ← Consultas a la base de datos
    ├── utils.js        ← Funciones auxiliares
    ├── app.js          ← Navegación
    └── pages/
        ├── dashboard.js
        ├── pacientes.js
        ├── medicamentos.js
        ├── agenda.js
        ├── finanzas.js
        └── equipo.js
```

---

## ¿Necesitas ayuda?

Si en algún paso te trabas, vuelve al chat con Claude y dile exactamente en qué paso estás y qué dice la pantalla. Te guiamos paso a paso.
