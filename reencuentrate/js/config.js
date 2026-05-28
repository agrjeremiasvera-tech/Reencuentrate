// ═══════════════════════════════════════════════
//  CONFIGURACIÓN REENCUÉNTRATE
//  Reemplaza los valores con los de tu proyecto Supabase
// ═══════════════════════════════════════════════

const SUPABASE_URL = 'https://mvgcwdptaikrbxwhtphs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z2N3ZHB0YWlrcmJ4d2h0cGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODQ4NDMsImV4cCI6MjA5NDk2MDg0M30.83h4YdJLWpgmJArxrpBXBEfPd8IkgcUHZdA_U7xHWbw';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Roles del sistema
const ROLES = {
  ADMIN: 'admin',
  CLINICO: 'clinico',
  ADMINISTRATIVO: 'administrativo'
};
