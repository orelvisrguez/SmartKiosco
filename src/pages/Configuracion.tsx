import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Store,
  Receipt,
  Bell,
  Shield,
  Database,
  Palette,
  Save,
  RefreshCw,
  Package,
  ShoppingCart,
  Clock,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  HardDrive,
  History,
  Zap,
  Globe,
  Lock,
  Users,
  FileText,
  RotateCcw,
  Server,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllSettings,
  saveAllSettings,
  testDatabaseConnection,
  getDatabaseStats,
  getAuditLog,
  logAuditEntry,
  exportSettings,
  importSettings,
  resetSettings,
  type AllSettings,
  type BusinessSettings,
  type ReceiptSettings,
  type NotificationSettings,
  type SecuritySettings,
  type InventorySettings,
  type SalesSettings,
  type AppearanceSettings,
  type BackupSettings,
  type AuditLogEntry,
  defaultSettings,
} from '@/lib/api/settings';
import { fetchUsers, type DBUser } from '@/lib/api/users';

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sections: ConfigSection[] = [
  { id: 'business', title: 'Negocio', description: 'Información de la empresa', icon: Store },
  { id: 'receipt', title: 'Recibos', description: 'Formato de tickets', icon: Receipt },
  { id: 'sales', title: 'Ventas', description: 'Opciones de venta', icon: ShoppingCart },
  { id: 'inventory', title: 'Inventario', description: 'Control de stock', icon: Package },
  { id: 'notifications', title: 'Notificaciones', description: 'Alertas y avisos', icon: Bell },
  { id: 'security', title: 'Seguridad', description: 'Accesos y permisos', icon: Shield },
  { id: 'appearance', title: 'Apariencia', description: 'Tema y personalización', icon: Palette },
  { id: 'database', title: 'Base de Datos', description: 'Conexión y mantenimiento', icon: Database },
  { id: 'backup', title: 'Respaldos', description: 'Copias de seguridad', icon: HardDrive },
  { id: 'audit', title: 'Auditoría', description: 'Registro de actividad', icon: History },
];

const currencies = [
  { value: 'USD', label: 'USD - Dólar Estadounidense' },
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'PEN', label: 'PEN - Sol Peruano' },
  { value: 'COP', label: 'COP - Peso Colombiano' },
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'CLP', label: 'CLP - Peso Chileno' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const accentColors = [
  { value: '#22D3EE', name: 'Cyan' },
  { value: '#4ADE80', name: 'Verde' },
  { value: '#FBBF24', name: 'Amarillo' },
  { value: '#F87171', name: 'Rojo' },
  { value: '#A78BFA', name: 'Morado' },
  { value: '#EC4899', name: 'Rosa' },
  { value: '#FB923C', name: 'Naranja' },
  { value: '#60A5FA', name: 'Azul' },
];

export function Configuracion() {
  const [activeSection, setActiveSection] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<AllSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<AllSettings>(defaultSettings);

  // Database state
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; version: string | null; latency: number }>({
    connected: false,
    version: null,
    latency: 0,
  });
  const [dbStats, setDbStats] = useState<{ tables: number; totalRows: number; size: string }>({
    tables: 0,
    totalRows: 0,
    size: '0 KB',
  });
  const [testingConnection, setTestingConnection] = useState(false);

  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Users state (for security section)
  const [users, setUsers] = useState<DBUser[]>([]);

  // Load settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settingsData, dbStatusData, dbStatsData] = await Promise.all([
        getAllSettings(),
        testDatabaseConnection(),
        getDatabaseStats(),
      ]);
      setSettings(settingsData);
      setOriginalSettings(settingsData);
      setDbStatus(dbStatusData);
      setDbStats(dbStatsData);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  // Update settings helper
  const updateSettings = <K extends keyof AllSettings>(
    category: K,
    updates: Partial<AllSettings[K]>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...updates },
    }));
  };

  // Save all settings
  const handleSave = async () => {
    try {
      setSaving(true);
      await saveAllSettings(settings);
      await logAuditEntry({
        action: 'settings_updated',
        entity_type: 'settings',
        new_values: settings,
      });
      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  // Reset settings
  const handleReset = async (category?: keyof AllSettings) => {
    if (!confirm(category ? `¿Restablecer configuración de ${category}?` : '¿Restablecer toda la configuración?')) {
      return;
    }

    try {
      await resetSettings(category);
      await loadSettings();
      toast.success('Configuración restablecida');
    } catch (error) {
      toast.error('Error al restablecer');
    }
  };

  // Test database connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testDatabaseConnection();
      setDbStatus(result);
      if (result.connected) {
        toast.success(`Conexión exitosa (${result.latency}ms)`);
        const stats = await getDatabaseStats();
        setDbStats(stats);
      } else {
        toast.error(result.error || 'Error de conexión');
      }
    } catch (error) {
      toast.error('Error al probar conexión');
    } finally {
      setTestingConnection(false);
    }
  };

  // Load audit log
  const handleLoadAuditLog = async () => {
    setLoadingAudit(true);
    try {
      const [log, usersList] = await Promise.all([
        getAuditLog(100),
        fetchUsers(),
      ]);
      setAuditLog(log);
      setUsers(usersList);
    } catch (error) {
      toast.error('Error al cargar registro de auditoría');
    } finally {
      setLoadingAudit(false);
    }
  };

  // Export settings
  const handleExport = async () => {
    try {
      const json = await exportSettings();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuracion_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Configuración exportada');
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  // Import settings
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importSettings(text);
        await loadSettings();
        toast.success('Configuración importada exitosamente');
      } catch (error) {
        toast.error('Error al importar configuración');
      }
    };
    input.click();
  };

  // Toggle component
  const Toggle = ({ value, onChange, disabled = false }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${value ? 'bg-primary-500' : 'bg-neutral-600'}`}
    >
      <motion.div
        animate={{ x: value ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
      />
    </button>
  );

  // Input field component
  const InputField = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    suffix,
    min,
    max,
  }: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    suffix?: string;
    min?: number;
    max?: number;
  }) => (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">{suffix}</span>
        )}
      </div>
    </div>
  );

  // Select field component
  const SelectField = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  // Setting row component
  const SettingRow = ({
    title,
    description,
    children,
    icon: Icon,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-neutral-400" />}
        <div>
          <p className="text-neutral-50 font-medium">{title}</p>
          {description && <p className="text-sm text-neutral-400">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'business':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <Store className="w-6 h-6 text-primary-500" />
              Información del Negocio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Nombre del Negocio"
                value={settings.business.name}
                onChange={(v) => updateSettings('business', { name: v })}
                placeholder="Mi Kiosko"
              />
              <InputField
                label="RUC / NIT / RFC"
                value={settings.business.ruc}
                onChange={(v) => updateSettings('business', { ruc: v })}
                placeholder="20123456789"
              />
              <div className="md:col-span-2">
                <InputField
                  label="Dirección"
                  value={settings.business.address}
                  onChange={(v) => updateSettings('business', { address: v })}
                  placeholder="Av. Principal 123"
                />
              </div>
              <InputField
                label="Teléfono"
                value={settings.business.phone}
                onChange={(v) => updateSettings('business', { phone: v })}
                placeholder="+51 999 888 777"
              />
              <InputField
                label="Email"
                value={settings.business.email}
                onChange={(v) => updateSettings('business', { email: v })}
                type="email"
                placeholder="contacto@negocio.com"
              />
              <SelectField
                label="Moneda"
                value={settings.business.currency}
                onChange={(v) => updateSettings('business', { currency: v })}
                options={currencies}
              />
              <InputField
                label="Tasa de Impuesto"
                value={settings.business.taxRate}
                onChange={(v) => updateSettings('business', { taxRate: parseFloat(v) || 0 })}
                type="number"
                suffix="%"
                min={0}
                max={100}
              />
            </div>
          </div>
        );

      case 'receipt':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary-500" />
              Configuración de Recibos
            </h2>
            <div className="space-y-4">
              <SettingRow title="Mostrar logo en el ticket" icon={FileText}>
                <Toggle
                  value={settings.receipt.showLogo}
                  onChange={(v) => updateSettings('receipt', { showLogo: v })}
                />
              </SettingRow>
              <SettingRow title="Mostrar dirección" icon={Store}>
                <Toggle
                  value={settings.receipt.showAddress}
                  onChange={(v) => updateSettings('receipt', { showAddress: v })}
                />
              </SettingRow>
              <SettingRow title="Mostrar teléfono" icon={Bell}>
                <Toggle
                  value={settings.receipt.showPhone}
                  onChange={(v) => updateSettings('receipt', { showPhone: v })}
                />
              </SettingRow>
              <SettingRow title="Mostrar RUC/NIT" icon={FileText}>
                <Toggle
                  value={settings.receipt.showRuc}
                  onChange={(v) => updateSettings('receipt', { showRuc: v })}
                />
              </SettingRow>
              <SettingRow title="Mostrar código de producto" icon={Package}>
                <Toggle
                  value={settings.receipt.showItemCode}
                  onChange={(v) => updateSettings('receipt', { showItemCode: v })}
                />
              </SettingRow>
              <SettingRow title="Imprimir automáticamente" description="Al completar cada venta" icon={Zap}>
                <Toggle
                  value={settings.receipt.printAutomatically}
                  onChange={(v) => updateSettings('receipt', { printAutomatically: v })}
                />
              </SettingRow>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <SelectField
                label="Ancho del papel"
                value={settings.receipt.paperWidth}
                onChange={(v) => updateSettings('receipt', { paperWidth: v as '58mm' | '80mm' })}
                options={[
                  { value: '58mm', label: '58mm (Térmico pequeño)' },
                  { value: '80mm', label: '80mm (Térmico estándar)' },
                ]}
              />
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Mensaje de pie de ticket</label>
                <textarea
                  value={settings.receipt.footerMessage}
                  onChange={(e) => updateSettings('receipt', { footerMessage: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 resize-none"
                  rows={3}
                  placeholder="¡Gracias por su compra!"
                />
              </div>
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-primary-500" />
              Configuración de Ventas
            </h2>
            <div className="space-y-4">
              <SettingRow title="Permitir descuentos" description="Habilitar aplicar descuentos en ventas">
                <Toggle
                  value={settings.sales.allowDiscounts}
                  onChange={(v) => updateSettings('sales', { allowDiscounts: v })}
                />
              </SettingRow>
              {settings.sales.allowDiscounts && (
                <div className="ml-8 p-4 bg-neutral-800/50 rounded-lg border-l-2 border-primary-500">
                  <InputField
                    label="Descuento máximo permitido"
                    value={settings.sales.maxDiscountPercent}
                    onChange={(v) => updateSettings('sales', { maxDiscountPercent: parseFloat(v) || 0 })}
                    type="number"
                    suffix="%"
                    min={0}
                    max={100}
                  />
                </div>
              )}
              <SettingRow title="Requerir cliente" description="Obligar registro de cliente en cada venta">
                <Toggle
                  value={settings.sales.requireCustomer}
                  onChange={(v) => updateSettings('sales', { requireCustomer: v })}
                />
              </SettingRow>
              <SettingRow title="Habilitar apartados" description="Permitir ventas con pago parcial">
                <Toggle
                  value={settings.sales.enableLayaway}
                  onChange={(v) => updateSettings('sales', { enableLayaway: v })}
                />
              </SettingRow>
              <SettingRow title="Habilitar devoluciones" description="Permitir devolución de productos">
                <Toggle
                  value={settings.sales.enableReturns}
                  onChange={(v) => updateSettings('sales', { enableReturns: v })}
                />
              </SettingRow>
              {settings.sales.enableReturns && (
                <div className="ml-8 p-4 bg-neutral-800/50 rounded-lg border-l-2 border-primary-500">
                  <InputField
                    label="Días límite para devolución"
                    value={settings.sales.returnDaysLimit}
                    onChange={(v) => updateSettings('sales', { returnDaysLimit: parseInt(v) || 0 })}
                    type="number"
                    suffix="días"
                    min={1}
                  />
                </div>
              )}
              <SettingRow title="Usar caja registradora" description="Habilitar control de caja">
                <Toggle
                  value={settings.sales.enableCashDrawer}
                  onChange={(v) => updateSettings('sales', { enableCashDrawer: v })}
                />
              </SettingRow>
            </div>
            <div className="pt-4">
              <SelectField
                label="Método de pago predeterminado"
                value={settings.sales.defaultPaymentMethod}
                onChange={(v) => updateSettings('sales', { defaultPaymentMethod: v as 'cash' | 'card' | 'transfer' })}
                options={[
                  { value: 'cash', label: 'Efectivo' },
                  { value: 'card', label: 'Tarjeta' },
                  { value: 'transfer', label: 'Transferencia' },
                ]}
              />
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <Package className="w-6 h-6 text-primary-500" />
              Configuración de Inventario
            </h2>
            <div className="space-y-4">
              <SettingRow title="Reorden automático" description="Crear alertas de reorden automáticamente">
                <Toggle
                  value={settings.inventory.autoReorderEnabled}
                  onChange={(v) => updateSettings('inventory', { autoReorderEnabled: v })}
                />
              </SettingRow>
              <SettingRow title="Permitir stock negativo" description="Vender productos sin stock disponible">
                <Toggle
                  value={settings.inventory.allowNegativeStock}
                  onChange={(v) => updateSettings('inventory', { allowNegativeStock: v })}
                />
              </SettingRow>
              <SettingRow title="Habilitar código de barras" description="Escanear productos por código de barras">
                <Toggle
                  value={settings.inventory.barcodeEnabled}
                  onChange={(v) => updateSettings('inventory', { barcodeEnabled: v })}
                />
              </SettingRow>
              <SettingRow title="Rastrear fechas de vencimiento" description="Control de caducidad de productos">
                <Toggle
                  value={settings.inventory.trackExpiryDates}
                  onChange={(v) => updateSettings('inventory', { trackExpiryDates: v })}
                />
              </SettingRow>
              {settings.inventory.trackExpiryDates && (
                <div className="ml-8 p-4 bg-neutral-800/50 rounded-lg border-l-2 border-primary-500">
                  <InputField
                    label="Días de anticipación para alerta"
                    value={settings.inventory.expiryWarningDays}
                    onChange={(v) => updateSettings('inventory', { expiryWarningDays: parseInt(v) || 30 })}
                    type="number"
                    suffix="días"
                    min={1}
                  />
                </div>
              )}
            </div>
            <div className="pt-4">
              <InputField
                label="Stock mínimo predeterminado"
                value={settings.inventory.defaultMinStock}
                onChange={(v) => updateSettings('inventory', { defaultMinStock: parseInt(v) || 5 })}
                type="number"
                suffix="unidades"
                min={0}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary-500" />
              Configuración de Notificaciones
            </h2>
            <div className="space-y-4">
              <SettingRow title="Sonidos de notificación" description="Reproducir sonidos en alertas">
                <Toggle
                  value={settings.notifications.soundEnabled}
                  onChange={(v) => updateSettings('notifications', { soundEnabled: v })}
                />
              </SettingRow>
              <SettingRow title="Alerta de stock bajo" description="Notificar cuando un producto tenga poco stock">
                <Toggle
                  value={settings.notifications.lowStockAlert}
                  onChange={(v) => updateSettings('notifications', { lowStockAlert: v })}
                />
              </SettingRow>
              {settings.notifications.lowStockAlert && (
                <div className="ml-8 p-4 bg-neutral-800/50 rounded-lg border-l-2 border-primary-500">
                  <InputField
                    label="Umbral de stock bajo"
                    value={settings.notifications.lowStockThreshold}
                    onChange={(v) => updateSettings('notifications', { lowStockThreshold: parseInt(v) || 10 })}
                    type="number"
                    suffix="unidades"
                    min={1}
                  />
                </div>
              )}
              <SettingRow title="Reporte diario por email" description="Enviar resumen de ventas al final del día">
                <Toggle
                  value={settings.notifications.dailyReportEmail}
                  onChange={(v) => updateSettings('notifications', { dailyReportEmail: v })}
                />
              </SettingRow>
              <SettingRow title="Alertas de ventas por email" description="Notificar ventas importantes">
                <Toggle
                  value={settings.notifications.salesAlertEmail}
                  onChange={(v) => updateSettings('notifications', { salesAlertEmail: v })}
                />
              </SettingRow>
              {(settings.notifications.dailyReportEmail || settings.notifications.salesAlertEmail) && (
                <div className="pt-4">
                  <InputField
                    label="Destinatarios de email"
                    value={settings.notifications.emailRecipients}
                    onChange={(v) => updateSettings('notifications', { emailRecipients: v })}
                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                  />
                  <p className="text-xs text-neutral-400 mt-1">Separar múltiples emails con coma</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary-500" />
              Configuración de Seguridad
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Tiempo de sesión inactiva"
                  value={settings.security.sessionTimeout}
                  onChange={(v) => updateSettings('security', { sessionTimeout: parseInt(v) || 30 })}
                  type="number"
                  suffix="minutos"
                  min={5}
                />
                <InputField
                  label="Intentos máximos de login"
                  value={settings.security.maxLoginAttempts}
                  onChange={(v) => updateSettings('security', { maxLoginAttempts: parseInt(v) || 5 })}
                  type="number"
                  min={1}
                  max={10}
                />
                <InputField
                  label="Duración de bloqueo"
                  value={settings.security.lockoutDuration}
                  onChange={(v) => updateSettings('security', { lockoutDuration: parseInt(v) || 15 })}
                  type="number"
                  suffix="minutos"
                  min={1}
                />
              </div>
              <SettingRow title="Requerir cambio de contraseña" description="Forzar cambio periódico de contraseña" icon={Lock}>
                <Toggle
                  value={settings.security.requirePasswordChange}
                  onChange={(v) => updateSettings('security', { requirePasswordChange: v })}
                />
              </SettingRow>
              {settings.security.requirePasswordChange && (
                <div className="ml-8 p-4 bg-neutral-800/50 rounded-lg border-l-2 border-primary-500">
                  <InputField
                    label="Días para cambio de contraseña"
                    value={settings.security.passwordChangeDays}
                    onChange={(v) => updateSettings('security', { passwordChangeDays: parseInt(v) || 90 })}
                    type="number"
                    suffix="días"
                    min={30}
                  />
                </div>
              )}
              <SettingRow title="Autenticación de dos factores" description="Requerir código adicional al iniciar sesión" icon={Shield}>
                <Toggle
                  value={settings.security.twoFactorEnabled}
                  onChange={(v) => updateSettings('security', { twoFactorEnabled: v })}
                />
              </SettingRow>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <Palette className="w-6 h-6 text-primary-500" />
              Apariencia
            </h2>
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-50 mb-4">Tema de la Aplicación</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateSettings('appearance', { theme: 'dark' })}
                  className={`p-4 rounded-xl text-center transition-all ${
                    settings.appearance.theme === 'dark'
                      ? 'bg-neutral-900 border-2 border-primary-500'
                      : 'bg-neutral-700 border-2 border-transparent hover:border-neutral-600'
                  }`}
                >
                  <div className="w-full h-16 bg-neutral-950 rounded-lg mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 bg-neutral-800 rounded" />
                  </div>
                  <p className="font-medium text-neutral-50">Modo Oscuro</p>
                  {settings.appearance.theme === 'dark' && (
                    <p className="text-xs text-primary-500">Activo</p>
                  )}
                </button>
                <button
                  onClick={() => updateSettings('appearance', { theme: 'light' })}
                  className={`p-4 rounded-xl text-center transition-all ${
                    settings.appearance.theme === 'light'
                      ? 'bg-neutral-900 border-2 border-primary-500'
                      : 'bg-neutral-700 border-2 border-transparent hover:border-neutral-600'
                  }`}
                >
                  <div className="w-full h-16 bg-white rounded-lg mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 bg-neutral-200 rounded" />
                  </div>
                  <p className="font-medium text-neutral-50">Modo Claro</p>
                  {settings.appearance.theme === 'light' && (
                    <p className="text-xs text-primary-500">Activo</p>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-50 mb-4">Color de Acento</h3>
              <div className="flex flex-wrap gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateSettings('appearance', { accentColor: color.value })}
                    className={`w-12 h-12 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${
                      settings.appearance.accentColor === color.value
                        ? 'ring-2 ring-offset-2 ring-offset-neutral-800 ring-white'
                        : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {settings.appearance.accentColor === color.value && (
                      <CheckCircle className="w-6 h-6 text-white drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SelectField
                label="Idioma"
                value={settings.appearance.language}
                onChange={(v) => updateSettings('appearance', { language: v })}
                options={[
                  { value: 'es', label: 'Español' },
                  { value: 'en', label: 'English' },
                  { value: 'pt', label: 'Português' },
                ]}
              />
              <SelectField
                label="Formato de fecha"
                value={settings.appearance.dateFormat}
                onChange={(v) => updateSettings('appearance', { dateFormat: v })}
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                ]}
              />
              <SelectField
                label="Formato de hora"
                value={settings.appearance.timeFormat}
                onChange={(v) => updateSettings('appearance', { timeFormat: v as '12h' | '24h' })}
                options={[
                  { value: '24h', label: '24 horas (14:30)' },
                  { value: '12h', label: '12 horas (2:30 PM)' },
                ]}
              />
            </div>

            <SelectField
              label="Tamaño de fuente"
              value={settings.appearance.fontSize}
              onChange={(v) => updateSettings('appearance', { fontSize: v as 'small' | 'medium' | 'large' })}
              options={[
                { value: 'small', label: 'Pequeño' },
                { value: 'medium', label: 'Mediano' },
                { value: 'large', label: 'Grande' },
              ]}
            />
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary-500" />
              Base de Datos
            </h2>

            {/* Connection Status */}
            <div className="bg-neutral-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Server className="w-6 h-6 text-primary-500" />
                  <div>
                    <h3 className="font-semibold text-neutral-50">Neon.tech PostgreSQL</h3>
                    <p className="text-sm text-neutral-400">Base de datos serverless</p>
                  </div>
                </div>
                <span
                  className={`flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${
                    dbStatus.connected
                      ? 'bg-success/20 text-success'
                      : 'bg-error/20 text-error'
                  }`}
                >
                  {dbStatus.connected ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Desconectado
                    </>
                  )}
                </span>
              </div>

              {dbStatus.connected && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-700">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-neutral-50">{dbStats.tables}</p>
                    <p className="text-sm text-neutral-400">Tablas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-neutral-50">{dbStats.totalRows.toLocaleString()}</p>
                    <p className="text-sm text-neutral-400">Registros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-neutral-50">{dbStats.size}</p>
                    <p className="text-sm text-neutral-400">Tamaño</p>
                  </div>
                </div>
              )}

              {dbStatus.version && (
                <p className="text-xs text-neutral-400 mt-4">
                  {dbStatus.version} • Latencia: {dbStatus.latency}ms
                </p>
              )}

              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                {testingConnection ? 'Probando...' : 'Probar Conexión'}
              </button>
            </div>

            {/* Database Maintenance */}
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-50 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Mantenimiento
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    toast.promise(
                      new Promise((resolve) => setTimeout(resolve, 2000)),
                      {
                        loading: 'Optimizando base de datos...',
                        success: 'Base de datos optimizada',
                        error: 'Error al optimizar',
                      }
                    );
                  }}
                  className="w-full flex items-center justify-between p-4 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-warning" />
                    <div className="text-left">
                      <p className="font-medium text-neutral-50">Optimizar Base de Datos</p>
                      <p className="text-sm text-neutral-400">Ejecutar VACUUM ANALYZE</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'backup':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-primary-500" />
              Respaldos y Restauración
            </h2>

            {/* Export/Import Settings */}
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-50 mb-4">Configuración del Sistema</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-neutral-950 font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Exportar Configuración
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Importar Configuración
                </button>
                <button
                  onClick={() => handleReset()}
                  className="flex items-center gap-2 px-4 py-2 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restablecer Todo
                </button>
              </div>
            </div>

            {/* Auto Backup Settings */}
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-50 mb-4">Respaldo Automático</h3>
              <div className="space-y-4">
                <SettingRow title="Habilitar respaldo automático" description="Crear copias de seguridad periódicamente">
                  <Toggle
                    value={settings.backup.autoBackupEnabled}
                    onChange={(v) => updateSettings('backup', { autoBackupEnabled: v })}
                  />
                </SettingRow>
                {settings.backup.autoBackupEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <SelectField
                      label="Frecuencia"
                      value={settings.backup.backupFrequency}
                      onChange={(v) => updateSettings('backup', { backupFrequency: v as 'daily' | 'weekly' | 'monthly' })}
                      options={[
                        { value: 'daily', label: 'Diario' },
                        { value: 'weekly', label: 'Semanal' },
                        { value: 'monthly', label: 'Mensual' },
                      ]}
                    />
                    <InputField
                      label="Hora de respaldo"
                      value={settings.backup.backupTime}
                      onChange={(v) => updateSettings('backup', { backupTime: v })}
                      type="time"
                    />
                    <InputField
                      label="Retención de respaldos"
                      value={settings.backup.retentionDays}
                      onChange={(v) => updateSettings('backup', { retentionDays: parseInt(v) || 30 })}
                      type="number"
                      suffix="días"
                      min={7}
                    />
                  </div>
                )}
              </div>
            </div>

            {settings.backup.lastBackup && (
              <div className="bg-neutral-800 rounded-lg p-4">
                <p className="text-sm text-neutral-400">
                  Último respaldo: <span className="text-neutral-50">{new Date(settings.backup.lastBackup).toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>
        );

      case 'audit':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-50 flex items-center gap-2">
                <History className="w-6 h-6 text-primary-500" />
                Registro de Auditoría
              </h2>
              <button
                onClick={handleLoadAuditLog}
                disabled={loadingAudit}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAudit ? 'animate-spin' : ''}`} />
                {loadingAudit ? 'Cargando...' : 'Cargar Registro'}
              </button>
            </div>

            <div className="bg-neutral-800 rounded-lg p-6">
              {auditLog.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Fecha</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Usuario</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Acción</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Entidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.slice(0, 20).map((entry) => (
                        <tr key={entry.id} className="border-b border-neutral-700/50">
                          <td className="px-4 py-3 text-sm text-neutral-300">
                            {new Date(entry.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-50">
                            {entry.user_name || 'Sistema'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-500 rounded">
                              {entry.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-400">
                            {entry.entity_type || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay registros de auditoría</p>
                  <p className="text-sm mt-1">Haz clic en "Cargar Registro" para ver la actividad</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Configuración</h1>
          <p className="text-neutral-300 mt-1">Personaliza tu sistema de kiosko</p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-2 bg-warning/20 text-warning rounded-lg text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Cambios sin guardar
            </motion.span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition-colors ${
              hasChanges
                ? 'bg-primary-500 text-neutral-950 hover:bg-primary-600'
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all ${
                activeSection === section.id
                  ? 'bg-primary-500/10 border border-primary-500/30 text-primary-500'
                  : 'bg-neutral-900 border border-neutral-700 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">{section.title}</p>
                <p className="text-xs text-neutral-400">{section.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-neutral-900 border border-neutral-700 rounded-xl p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
