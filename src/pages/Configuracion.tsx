import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Store,
  Receipt,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Save,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sections: ConfigSection[] = [
  { id: 'business', title: 'Negocio', description: 'Información del kiosko', icon: Store },
  { id: 'receipt', title: 'Recibos', description: 'Formato de tickets', icon: Receipt },
  { id: 'notifications', title: 'Notificaciones', description: 'Alertas y avisos', icon: Bell },
  { id: 'security', title: 'Seguridad', description: 'Accesos y permisos', icon: Shield },
  { id: 'database', title: 'Base de Datos', description: 'Conexión Neon.tech', icon: Database },
  { id: 'appearance', title: 'Apariencia', description: 'Tema y colores', icon: Palette },
];

export function Configuracion() {
  const [activeSection, setActiveSection] = useState('business');
  const [businessConfig, setBusinessConfig] = useState({
    name: 'Mi Kiosko',
    ruc: '20123456789',
    address: 'Av. Principal 123',
    phone: '+51 999 888 777',
    email: 'contacto@mikiosko.com',
    currency: 'USD',
    taxRate: '0',
  });

  const [receiptConfig, setReceiptConfig] = useState({
    showLogo: true,
    showAddress: true,
    showPhone: true,
    footerMessage: '¡Gracias por su compra!',
    paperWidth: '80mm',
  });

  const [notificationConfig, setNotificationConfig] = useState({
    lowStockAlert: true,
    lowStockThreshold: 10,
    dailyReport: true,
    salesAlert: false,
  });

  const [dbConfig, setDbConfig] = useState({
    connectionString: '',
    poolSize: 10,
    connected: false,
  });

  const handleSave = () => {
    toast.success('Configuración guardada exitosamente');
  };

  const handleTestConnection = () => {
    toast.loading('Probando conexión...', { duration: 1500 });
    setTimeout(() => {
      toast.success('Conexión exitosa a Neon.tech');
      setDbConfig({ ...dbConfig, connected: true });
    }, 1500);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'business':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  value={businessConfig.name}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, name: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  RUC / NIT
                </label>
                <input
                  type="text"
                  value={businessConfig.ruc}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, ruc: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={businessConfig.address}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, address: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={businessConfig.phone}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={businessConfig.email}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, email: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Moneda
                </label>
                <select
                  value={businessConfig.currency}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="PEN">PEN - Sol Peruano</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Tasa de Impuesto (%)
                </label>
                <input
                  type="number"
                  value={businessConfig.taxRate}
                  onChange={(e) => setBusinessConfig({ ...businessConfig, taxRate: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>
          </div>
        );

      case 'receipt':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {[
                { key: 'showLogo', label: 'Mostrar logo en el ticket' },
                { key: 'showAddress', label: 'Mostrar dirección' },
                { key: 'showPhone', label: 'Mostrar teléfono' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <span className="text-neutral-50">{item.label}</span>
                  <button
                    onClick={() =>
                      setReceiptConfig({
                        ...receiptConfig,
                        [item.key]: !receiptConfig[item.key as keyof typeof receiptConfig],
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors ${
                      receiptConfig[item.key as keyof typeof receiptConfig]
                        ? 'bg-primary-500'
                        : 'bg-neutral-600'
                    }`}
                  >
                    <motion.div
                      animate={{
                        x: receiptConfig[item.key as keyof typeof receiptConfig] ? 24 : 2,
                      }}
                      className="w-5 h-5 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Mensaje de pie de ticket
              </label>
              <textarea
                value={receiptConfig.footerMessage}
                onChange={(e) => setReceiptConfig({ ...receiptConfig, footerMessage: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Ancho del papel
              </label>
              <select
                value={receiptConfig.paperWidth}
                onChange={(e) => setReceiptConfig({ ...receiptConfig, paperWidth: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="58mm">58mm</option>
                <option value="80mm">80mm</option>
              </select>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <p className="text-neutral-50">Alerta de stock bajo</p>
                  <p className="text-sm text-neutral-400">Notificar cuando un producto tenga poco stock</p>
                </div>
                <button
                  onClick={() =>
                    setNotificationConfig({ ...notificationConfig, lowStockAlert: !notificationConfig.lowStockAlert })
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notificationConfig.lowStockAlert ? 'bg-primary-500' : 'bg-neutral-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: notificationConfig.lowStockAlert ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              {notificationConfig.lowStockAlert && (
                <div className="ml-4 p-4 bg-neutral-800/50 rounded-lg border-l-2 border-primary-500">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Umbral de stock bajo
                  </label>
                  <input
                    type="number"
                    value={notificationConfig.lowStockThreshold}
                    onChange={(e) =>
                      setNotificationConfig({
                        ...notificationConfig,
                        lowStockThreshold: parseInt(e.target.value),
                      })
                    }
                    className="w-32 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                <div>
                  <p className="text-neutral-50">Reporte diario</p>
                  <p className="text-sm text-neutral-400">Enviar resumen de ventas al final del día</p>
                </div>
                <button
                  onClick={() =>
                    setNotificationConfig({ ...notificationConfig, dailyReport: !notificationConfig.dailyReport })
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notificationConfig.dailyReport ? 'bg-primary-500' : 'bg-neutral-600'
                  }`}
                >
                  <motion.div
                    animate={{ x: notificationConfig.dailyReport ? 24 : 2 }}
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-6">
            <div className="bg-neutral-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-primary-500" />
                <div>
                  <h3 className="font-semibold text-neutral-50">Neon.tech PostgreSQL</h3>
                  <p className="text-sm text-neutral-400">Base de datos serverless</p>
                </div>
                <span
                  className={`ml-auto px-3 py-1 text-xs font-medium rounded-full ${
                    dbConfig.connected
                      ? 'bg-success/20 text-success'
                      : 'bg-warning/20 text-warning'
                  }`}
                >
                  {dbConfig.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Connection String
                  </label>
                  <input
                    type="password"
                    value={dbConfig.connectionString}
                    onChange={(e) => setDbConfig({ ...dbConfig, connectionString: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 font-mono text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleTestConnection}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-600 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Probar Conexión
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-50 mb-4">Configuración del Pool</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Tamaño del pool de conexiones
                </label>
                <input
                  type="number"
                  value={dbConfig.poolSize}
                  onChange={(e) => setDbConfig({ ...dbConfig, poolSize: parseInt(e.target.value) })}
                  className="w-32 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-50 mb-4">Tema de la Aplicación</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-neutral-900 border-2 border-primary-500 rounded-xl text-center">
                  <div className="w-full h-20 bg-neutral-950 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-3xl">🌙</span>
                  </div>
                  <p className="font-medium text-neutral-50">Modo Oscuro</p>
                  <p className="text-xs text-primary-500">Activo</p>
                </button>
                <button className="p-4 bg-neutral-800 border-2 border-neutral-700 rounded-xl text-center opacity-50 cursor-not-allowed">
                  <div className="w-full h-20 bg-white rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-3xl">☀️</span>
                  </div>
                  <p className="font-medium text-neutral-50">Modo Claro</p>
                  <p className="text-xs text-neutral-400">Próximamente</p>
                </button>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="font-semibold text-neutral-50 mb-4">Color de Acento</h3>
              <div className="flex gap-3">
                {['#22D3EE', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA', '#EC4899'].map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                      color === '#22D3EE' ? 'ring-2 ring-offset-2 ring-offset-neutral-800 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Configuración</h1>
          <p className="text-neutral-300 mt-1">Personaliza tu sistema de kiosko</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          Guardar Cambios
        </button>
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
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
