import { neon } from '@neondatabase/serverless';

const connectionString = import.meta.env.VITE_DATABASE_URL || '';
const sql = connectionString ? neon(connectionString) : null;

// ==================== INTERFACES ====================

export interface BusinessSettings {
  name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRate: number;
  logo_url: string | null;
}

export interface ReceiptSettings {
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showRuc: boolean;
  footerMessage: string;
  paperWidth: '58mm' | '80mm';
  printAutomatically: boolean;
  showItemCode: boolean;
}

export interface NotificationSettings {
  lowStockAlert: boolean;
  lowStockThreshold: number;
  dailyReportEmail: boolean;
  salesAlertEmail: boolean;
  emailRecipients: string;
  soundEnabled: boolean;
}

export interface SecuritySettings {
  sessionTimeout: number;
  requirePasswordChange: boolean;
  passwordChangeDays: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorEnabled: boolean;
}

export interface InventorySettings {
  autoReorderEnabled: boolean;
  defaultMinStock: number;
  trackExpiryDates: boolean;
  expiryWarningDays: number;
  allowNegativeStock: boolean;
  barcodeEnabled: boolean;
}

export interface SalesSettings {
  allowDiscounts: boolean;
  maxDiscountPercent: number;
  requireCustomer: boolean;
  enableLayaway: boolean;
  enableReturns: boolean;
  returnDaysLimit: number;
  enableCashDrawer: boolean;
  defaultPaymentMethod: 'cash' | 'card' | 'transfer';
}

export interface AppearanceSettings {
  theme: 'dark' | 'light';
  accentColor: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  fontSize: 'small' | 'medium' | 'large';
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string;
  retentionDays: number;
  lastBackup: string | null;
}

export interface AllSettings {
  business: BusinessSettings;
  receipt: ReceiptSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  inventory: InventorySettings;
  sales: SalesSettings;
  appearance: AppearanceSettings;
  backup: BackupSettings;
}

// ==================== DEFAULT VALUES ====================

const defaultSettings: AllSettings = {
  business: {
    name: 'Mi Kiosko',
    ruc: '',
    address: '',
    phone: '',
    email: '',
    currency: 'USD',
    taxRate: 0,
    logo_url: null,
  },
  receipt: {
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showRuc: true,
    footerMessage: '¡Gracias por su compra!',
    paperWidth: '80mm',
    printAutomatically: false,
    showItemCode: false,
  },
  notifications: {
    lowStockAlert: true,
    lowStockThreshold: 10,
    dailyReportEmail: false,
    salesAlertEmail: false,
    emailRecipients: '',
    soundEnabled: true,
  },
  security: {
    sessionTimeout: 30,
    requirePasswordChange: false,
    passwordChangeDays: 90,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    twoFactorEnabled: false,
  },
  inventory: {
    autoReorderEnabled: false,
    defaultMinStock: 5,
    trackExpiryDates: false,
    expiryWarningDays: 30,
    allowNegativeStock: false,
    barcodeEnabled: true,
  },
  sales: {
    allowDiscounts: true,
    maxDiscountPercent: 20,
    requireCustomer: false,
    enableLayaway: false,
    enableReturns: true,
    returnDaysLimit: 30,
    enableCashDrawer: false,
    defaultPaymentMethod: 'cash',
  },
  appearance: {
    theme: 'dark',
    accentColor: '#22D3EE',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    fontSize: 'medium',
  },
  backup: {
    autoBackupEnabled: false,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    lastBackup: null,
  },
};

// ==================== HELPER FUNCTIONS ====================

function parseJSON<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

// ==================== DATABASE OPERATIONS ====================

let tableInitialized = false;

export async function initializeSettingsTable(): Promise<void> {
  if (!sql || tableInitialized) return;

  try {
    // Check if table exists with correct schema (has 'category' column)
    const checkColumn = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'settings' AND column_name = 'category'
    `;

    if (checkColumn.length === 0) {
      // Table doesn't have 'category' column - drop and recreate
      try {
        await sql`DROP TABLE IF EXISTS settings CASCADE`;
      } catch {
        // Ignore drop errors
      }

      try {
        await sql`
          CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            category VARCHAR(50) NOT NULL UNIQUE,
            data JSONB NOT NULL DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
      } catch (createError: any) {
        // If table already exists (race condition), check if it has correct schema now
        if (!createError?.message?.includes('already exists')) {
          throw createError;
        }
      }
    }

    tableInitialized = true;
  } catch (error) {
    console.error('Error initializing settings table:', error);
    tableInitialized = true;
  }
}

export async function getSetting<K extends keyof AllSettings>(category: K): Promise<AllSettings[K]> {
  if (!sql) return defaultSettings[category];

  try {
    // Ensure table exists
    await initializeSettingsTable();

    const results = await sql`
      SELECT data FROM settings WHERE category = ${category}
    `;

    if (results.length === 0) {
      return defaultSettings[category];
    }

    return parseJSON(results[0].data, defaultSettings[category]);
  } catch (error) {
    console.error(`Error getting ${category} settings:`, error);
    return defaultSettings[category];
  }
}

export async function getAllSettings(): Promise<AllSettings> {
  if (!sql) return defaultSettings;

  try {
    // Ensure table exists
    await initializeSettingsTable();

    const results = await sql`SELECT category, data FROM settings`;

    const settings = { ...defaultSettings };

    for (const row of results) {
      const category = row.category as keyof AllSettings;
      if (category in settings) {
        settings[category] = parseJSON(row.data, defaultSettings[category]);
      }
    }

    return settings;
  } catch (error) {
    console.error('Error getting all settings:', error);
    return defaultSettings;
  }
}

export async function saveSetting<K extends keyof AllSettings>(
  category: K,
  data: AllSettings[K]
): Promise<AllSettings[K]> {
  if (!sql) throw new Error('Database not configured');

  try {
    // Ensure table exists before saving
    await initializeSettingsTable();

    const jsonData = JSON.stringify(data);

    await sql`
      INSERT INTO settings (category, data)
      VALUES (${category}, ${jsonData}::jsonb)
      ON CONFLICT (category)
      DO UPDATE SET data = ${jsonData}::jsonb, updated_at = NOW()
    `;

    return data;
  } catch (error) {
    console.error(`Error saving ${category} settings:`, error);
    throw error;
  }
}

export async function saveAllSettings(settings: AllSettings): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    // Ensure table exists
    await initializeSettingsTable();

    // Save all categories
    const categories = Object.keys(settings) as (keyof AllSettings)[];

    for (const category of categories) {
      await saveSetting(category, settings[category]);
    }
  } catch (error) {
    console.error('Error saving all settings:', error);
    throw error;
  }
}

export async function resetSettings(category?: keyof AllSettings): Promise<void> {
  if (!sql) throw new Error('Database not configured');

  try {
    if (category) {
      await sql`DELETE FROM settings WHERE category = ${category}`;
    } else {
      await sql`DELETE FROM settings`;
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

// ==================== SPECIFIC SETTINGS FUNCTIONS ====================

export async function getBusinessSettings(): Promise<BusinessSettings> {
  return getSetting('business');
}

export async function saveBusinessSettings(data: BusinessSettings): Promise<BusinessSettings> {
  return saveSetting('business', data);
}

export async function getReceiptSettings(): Promise<ReceiptSettings> {
  return getSetting('receipt');
}

export async function saveReceiptSettings(data: ReceiptSettings): Promise<ReceiptSettings> {
  return saveSetting('receipt', data);
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return getSetting('notifications');
}

export async function saveNotificationSettings(data: NotificationSettings): Promise<NotificationSettings> {
  return saveSetting('notifications', data);
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  return getSetting('security');
}

export async function saveSecuritySettings(data: SecuritySettings): Promise<SecuritySettings> {
  return saveSetting('security', data);
}

export async function getInventorySettings(): Promise<InventorySettings> {
  return getSetting('inventory');
}

export async function saveInventorySettings(data: InventorySettings): Promise<InventorySettings> {
  return saveSetting('inventory', data);
}

export async function getSalesSettings(): Promise<SalesSettings> {
  return getSetting('sales');
}

export async function saveSalesSettings(data: SalesSettings): Promise<SalesSettings> {
  return saveSetting('sales', data);
}

export async function getAppearanceSettings(): Promise<AppearanceSettings> {
  return getSetting('appearance');
}

export async function saveAppearanceSettings(data: AppearanceSettings): Promise<AppearanceSettings> {
  return saveSetting('appearance', data);
}

export async function getBackupSettings(): Promise<BackupSettings> {
  return getSetting('backup');
}

export async function saveBackupSettings(data: BackupSettings): Promise<BackupSettings> {
  return saveSetting('backup', data);
}

// ==================== DATABASE CONNECTION TEST ====================

export async function testDatabaseConnection(): Promise<{
  connected: boolean;
  version: string | null;
  error: string | null;
  latency: number;
}> {
  if (!sql) {
    return { connected: false, version: null, error: 'No connection string configured', latency: 0 };
  }

  const start = Date.now();

  try {
    const results = await sql`SELECT version()`;
    const latency = Date.now() - start;

    return {
      connected: true,
      version: results[0]?.version?.split(',')[0] || 'Unknown',
      error: null,
      latency,
    };
  } catch (error) {
    return {
      connected: false,
      version: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
    };
  }
}

// ==================== DATABASE STATS ====================

export async function getDatabaseStats(): Promise<{
  tables: number;
  totalRows: number;
  size: string;
}> {
  if (!sql) return { tables: 0, totalRows: 0, size: '0 KB' };

  try {
    const tablesResult = await sql`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;

    // Count total rows using pg_stat_user_tables for safety
    const rowsResult = await sql`
      SELECT COALESCE(SUM(n_live_tup), 0) as total
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
    `;

    const sizeResult = await sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;

    return {
      tables: parseInt(tablesResult[0]?.count) || 0,
      totalRows: parseInt(rowsResult[0]?.total) || 0,
      size: sizeResult[0]?.size || '0 KB',
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { tables: 0, totalRows: 0, size: '0 KB' };
  }
}

// ==================== EXPORT/IMPORT SETTINGS ====================

export async function exportSettings(): Promise<string> {
  const settings = await getAllSettings();
  return JSON.stringify(settings, null, 2);
}

export async function importSettings(jsonString: string): Promise<void> {
  try {
    const settings = JSON.parse(jsonString) as AllSettings;
    await saveAllSettings(settings);
  } catch (error) {
    throw new Error('Invalid settings format');
  }
}

// ==================== AUDIT LOG ====================

let auditTableInitialized = false;

export async function initializeAuditTable(): Promise<void> {
  if (!sql || auditTableInitialized) return;

  try {
    // Create audit table without foreign key to avoid issues if users table doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id UUID,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    auditTableInitialized = true;
  } catch (error) {
    console.error('Error initializing audit table:', error);
    auditTableInitialized = true; // Mark as initialized to avoid repeated failures
  }
}

export interface AuditLogEntry {
  id: number;
  user_id: string | null;
  user_name?: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
}

export async function getAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  if (!sql) return [];

  try {
    await initializeAuditTable();

    const results = await sql`
      SELECT
        a.*,
        u.name as user_name
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `;

    return results as AuditLogEntry[];
  } catch (error) {
    console.error('Error getting audit log:', error);
    return [];
  }
}

export async function logAuditEntry(entry: {
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
}): Promise<void> {
  if (!sql) return;

  try {
    await initializeAuditTable();

    await sql`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (
        ${entry.user_id || null},
        ${entry.action},
        ${entry.entity_type || null},
        ${entry.entity_id || null},
        ${entry.old_values ? JSON.stringify(entry.old_values) : null}::jsonb,
        ${entry.new_values ? JSON.stringify(entry.new_values) : null}::jsonb
      )
    `;
  } catch (error) {
    console.error('Error logging audit entry:', error);
  }
}

// ==================== DATA MAINTENANCE ====================

export async function optimizeDatabase(): Promise<{ success: boolean; message: string }> {
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    await sql`VACUUM ANALYZE`;
    return { success: true, message: 'Database optimized successfully' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function clearOldAuditLogs(daysOld = 90): Promise<number> {
  if (!sql) return 0;

  try {
    const result = await sql`
      DELETE FROM audit_log
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING id
    `;
    return result.length;
  } catch (error) {
    console.error('Error clearing old audit logs:', error);
    return 0;
  }
}

export { defaultSettings };
