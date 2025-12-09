import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  active: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Login user
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  if (!sql) {
    return { success: false, error: 'Base de datos no configurada' };
  }

  try {
    const results = await sql`
      SELECT id, name, email, role, active, password_hash
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1
    `;

    if (results.length === 0) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const user = results[0];

    // Check if user is active
    if (!user.active) {
      return { success: false, error: 'Usuario desactivado. Contacte al administrador.' };
    }

    // Simple password check (in production, use bcrypt)
    // For now, we'll do a simple comparison
    if (user.password_hash !== password && user.password_hash !== null) {
      // If password_hash is null, allow any password (for initial setup)
      if (user.password_hash) {
        return { success: false, error: 'Credenciales inválidas' };
      }
    }

    // Return user without password
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: 'Error al iniciar sesión' };
  }
}

// Update user password
export async function updatePassword(userId: string, newPassword: string): Promise<boolean> {
  if (!sql) return false;

  try {
    await sql`
      UPDATE users
      SET password_hash = ${newPassword}, updated_at = NOW()
      WHERE id = ${userId}
    `;
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<AuthUser | null> {
  if (!sql) return null;

  try {
    const results = await sql`
      SELECT id, name, email, role, active
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (results.length === 0) return null;

    return results[0] as AuthUser;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Check if any admin exists (for initial setup)
export async function hasAdminUser(): Promise<boolean> {
  if (!sql) return false;

  try {
    const results = await sql`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `;
    return parseInt(results[0].count) > 0;
  } catch (error) {
    console.error('Error checking admin:', error);
    return false;
  }
}

// Create initial admin user
export async function createInitialAdmin(name: string, email: string, password: string): Promise<LoginResult> {
  if (!sql) {
    return { success: false, error: 'Base de datos no configurada' };
  }

  try {
    // Check if admin already exists
    const hasAdmin = await hasAdminUser();
    if (hasAdmin) {
      return { success: false, error: 'Ya existe un administrador' };
    }

    const results = await sql`
      INSERT INTO users (name, email, role, password_hash, active)
      VALUES (${name}, ${email.toLowerCase().trim()}, 'admin', ${password}, true)
      RETURNING id, name, email, role, active
    `;

    return {
      success: true,
      user: results[0] as AuthUser,
    };
  } catch (error: any) {
    console.error('Error creating admin:', error);
    if (error.message?.includes('duplicate')) {
      return { success: false, error: 'El email ya está registrado' };
    }
    return { success: false, error: 'Error al crear administrador' };
  }
}
