import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { KPICard } from '@/components/ui/KPICard';
import { useAppStore } from '@/stores/useAppStore';

const salesData = [
  { name: 'Lun', ventas: 1200, gastos: 400 },
  { name: 'Mar', ventas: 1900, gastos: 600 },
  { name: 'Mié', ventas: 1500, gastos: 500 },
  { name: 'Jue', ventas: 2100, gastos: 700 },
  { name: 'Vie', ventas: 2800, gastos: 800 },
  { name: 'Sáb', ventas: 3200, gastos: 900 },
  { name: 'Dom', ventas: 2400, gastos: 650 },
];

const topProducts = [
  { name: 'Coca Cola 500ml', ventas: 156, ingreso: 390 },
  { name: 'Doritos 150g', ventas: 98, ingreso: 343 },
  { name: 'Agua Mineral', ventas: 87, ingreso: 130 },
  { name: 'Leche Entera', ventas: 76, ingreso: 137 },
  { name: 'Pan de Molde', ventas: 65, ingreso: 143 },
];

const categoryData = [
  { name: 'Bebidas', value: 35, color: '#22D3EE' },
  { name: 'Snacks', value: 25, color: '#FBBF24' },
  { name: 'Lácteos', value: 20, color: '#4ADE80' },
  { name: 'Panadería', value: 12, color: '#F87171' },
  { name: 'Otros', value: 8, color: '#A78BFA' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Dashboard() {
  const { products, sales } = useAppStore();

  const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Dashboard</h1>
          <p className="text-neutral-300 mt-1">
            Resumen general del kiosco • {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors">
          <ArrowUpRight className="w-5 h-5" />
          Ver Reportes
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Ventas del Día"
          value={totalSales.toFixed(2)}
          prefix="$"
          change={12.5}
          icon={DollarSign}
          color="#4ADE80"
        />
        <KPICard
          title="Transacciones"
          value={sales.length}
          change={8.2}
          icon={ShoppingCart}
          color="#22D3EE"
        />
        <KPICard
          title="Productos Activos"
          value={products.filter((p) => p.active).length}
          icon={Package}
          color="#A78BFA"
        />
        <KPICard
          title="Stock Bajo"
          value={lowStockProducts.length}
          change={lowStockProducts.length > 0 ? -5 : 0}
          icon={AlertTriangle}
          color="#FBBF24"
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-neutral-900 rounded-lg border border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-50">Ventas Semanales</h2>
              <p className="text-neutral-300 text-sm">Comparativa de ingresos y gastos</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-neutral-300">Ventas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error" />
                <span className="text-neutral-300">Gastos</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} />
              <YAxis stroke="#a3a3a3" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fafafa' }}
              />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke="#22D3EE"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVentas)"
              />
              <Area
                type="monotone"
                dataKey="gastos"
                stroke="#F87171"
                strokeWidth={2}
                fillOpacity={0.1}
                fill="#F87171"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-700 p-6">
          <h2 className="text-xl font-semibold text-neutral-50 mb-2">Ventas por Categoría</h2>
          <p className="text-neutral-300 text-sm mb-4">Distribución porcentual</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-neutral-300">{cat.name}</span>
                </div>
                <span className="text-sm font-medium text-neutral-50">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-50">Productos Top</h2>
              <p className="text-neutral-300 text-sm">Los más vendidos esta semana</p>
            </div>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" horizontal={false} />
              <XAxis type="number" stroke="#a3a3a3" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#a3a3a3" fontSize={11} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="ventas" fill="#22D3EE" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-50">Alertas de Stock</h2>
              <p className="text-neutral-300 text-sm">Productos con stock bajo</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div className="space-y-3">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.slice(0, 5).map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-50">{product.name}</p>
                    <p className="text-xs text-neutral-400">Mínimo: {product.minStock} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-warning">{product.stock}</p>
                    <p className="text-xs text-neutral-400">en stock</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex items-center justify-center h-40 text-neutral-400">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Todos los productos tienen stock suficiente</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={item} className="bg-neutral-900 rounded-lg border border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-50">Transacciones Recientes</h2>
            <p className="text-neutral-300 text-sm">Últimas ventas del día</p>
          </div>
          <button className="text-primary-500 text-sm font-medium hover:text-primary-700 transition-colors">
            Ver todas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Productos</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Método</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Hora</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 5).map((sale, index) => (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-neutral-50 font-mono">#{sale.id.padStart(4, '0')}</td>
                  <td className="px-4 py-3 text-sm text-neutral-50">
                    {sale.items.map((item) => item.product.name).join(', ').slice(0, 40)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-50 font-semibold">${sale.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sale.paymentMethod === 'cash'
                          ? 'bg-success/20 text-success'
                          : sale.paymentMethod === 'card'
                          ? 'bg-primary-500/20 text-primary-500'
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta' : 'Transfer'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    {new Date(sale.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
