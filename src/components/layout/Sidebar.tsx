import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Package,
  Warehouse,
  Users,
  Truck,
  ShoppingBag,
  DollarSign,
  FolderTree,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pos', icon: ShoppingCart, label: 'Punto de Venta' },
  { path: '/caja', icon: Wallet, label: 'Caja' },
  { path: '/productos', icon: Package, label: 'Productos' },
  { path: '/inventario', icon: Warehouse, label: 'Inventario' },
  { path: '/categorias', icon: FolderTree, label: 'Categorías' },
  { path: '/proveedores', icon: Truck, label: 'Proveedores' },
  { path: '/compras', icon: ShoppingBag, label: 'Compras' },
  { path: '/finanzas', icon: DollarSign, label: 'Finanzas' },
  { path: '/reportes', icon: BarChart3, label: 'Reportes' },
  { path: '/usuarios', icon: Users, label: 'Usuarios' },
  { path: '/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentUser } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-neutral-900 border-r border-neutral-700 z-50 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-neutral-700">
        <motion.div
          className="flex items-center gap-3"
          animate={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Store className="w-6 h-6 text-neutral-950" />
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <h1 className="text-lg font-bold text-neutral-50">KioskPro</h1>
              <p className="text-xs text-neutral-300">Sistema de Gestión</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-neutral-800 text-primary-500'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-neutral-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
                      />
                    )}
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-neutral-700">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-neutral-950 font-bold text-sm">
            {currentUser?.name.charAt(0).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-medium text-neutral-50 truncate">{currentUser?.name}</p>
              <p className="text-xs text-neutral-300 capitalize">{currentUser?.role}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 hover:text-primary-500 hover:border-primary-500 transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
