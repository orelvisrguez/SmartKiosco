import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

export interface DBUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all users
export async function fetchUsers(): Promise<DBUser[]> {
  if (!sql) return [];

  try {
    const results = await sql`
      SELECT id, name, email, role, active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    return results as DBUser[];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// Create user
export async function createUser(user: {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  password?: string;
}): Promise<DBUser> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      INSERT INTO users (name, email, role, password_hash, active)
      VALUES (${user.name}, ${user.email}, ${user.role}, ${user.password || null}, true)
      RETURNING id, name, email, role, active, created_at, updated_at
    `;
    return results[0] as DBUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update user
export async function updateUser(id: string, user: Partial<{
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  active: boolean;
}>): Promise<DBUser> {
  if (!sql) throw new Error('Database not configured');

  try {
    const results = await sql`
      UPDATE users
      SET
        name = COALESCE(${user.name}, name),
        email = COALESCE(${user.email}, email),
        role = COALESCE(${user.role}, role),
        active = COALESCE(${user.active}, active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, role, active, created_at, updated_at
    `;
    return results[0] as DBUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Delete user
export async function deleteUser(id: string): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    await sql`DELETE FROM users WHERE id = ${id}`;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Get user stats
export async function getUserStats(): Promise<{
  total: number;
  admins: number;
  managers: number;
  cashiers: number;
  active: number;
}> {
  if (!sql) return { total: 0, admins: 0, managers: 0, cashiers: 0, active: 0 };

  try {
    const results = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'manager') as managers,
        COUNT(*) FILTER (WHERE role = 'cashier') as cashiers,
        COUNT(*) FILTER (WHERE active = true) as active
      FROM users
    `;
    return {
      total: parseInt(results[0].total) || 0,
      admins: parseInt(results[0].admins) || 0,
      managers: parseInt(results[0].managers) || 0,
      cashiers: parseInt(results[0].cashiers) || 0,
      active: parseInt(results[0].active) || 0,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}

// Get user by email (for login)
export async function getUserByEmail(email: string): Promise<DBUser | null> {
  if (!sql) return null;

  try {
    const results = await sql`
      SELECT id, name, email, role, active, created_at, updated_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    return results.length > 0 ? results[0] as DBUser : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}
