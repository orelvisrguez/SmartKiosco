import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  Printer,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAppStore } from '@/stores/useAppStore';
import toast from 'react-hot-toast';

const salesByHour = [
  { hour: '08:00', ventas: 12 },
  { hour: '09:00', ventas: 25 },
  { hour: '10:00', ventas: 38 },
  { hour: '11:00', ventas: 45 },
  { hour: '12:00', ventas: 65 },
  { hour: '13:00', ventas: 78 },
  { hour: '14:00', ventas: 52 },
  { hour: '15:00', ventas: 48 },
  { hour: '16:00', ventas: 55 },
  { hour: '17:00', ventas: 70 },
  { hour: '18:00', ventas: 85 },
  { hour: '19:00', ventas: 62 },
  { hour: '20:00', ventas: 40 },
];

const weeklyTrend = [
  { day: 'Lun', actual: 1200, anterior: 1100 },
  { day: 'Mar', actual: 1450, anterior: 1200 },
  { day: 'Mié', actual: 1380, anterior: 1350 },
  { day: 'Jue', actual: 1600, anterior: 1400 },
  { day: 'Vie', actual: 1850, anterior: 1700 },
  { day: 'Sáb', actual: 2200, anterior: 2000 },
  { day: 'Dom', actual: 1900, anterior: 1800 },
];

const reportTypes = [
  {
    id: 'ventas',
    title: 'Reporte de Ventas',
    description: 'Detalle de todas las ventas del período',
    icon: ShoppingCart,
    color: '#22D3EE',
  },
  {
    id: 'productos',
    title: 'Reporte de Productos',
    description: 'Productos más vendidos y stock',
    icon: Package,
    color: '#4ADE80',
  },
  {
    id: 'finanzas',
    title: 'Reporte Financiero',
    description: 'Ingresos, gastos y utilidades',
    icon: DollarSign,
    color: '#FBBF24',
  },
  {
    id: 'inventario',
    title: 'Reporte de Inventario',
    description: 'Estado actual del inventario',
    icon: Package,
    color: '#A78BFA',
  },
];

export function Reportes() {
  const { sales, products, categories } = useAppStore();
  const [dateRange, setDateRange] = useState('today');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
  const totalTransactions = sales.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const topProducts = products
    .map((product) => {
      const soldCount = sales.reduce((acc, sale) => {
        const item = sale.items.find((i) => i.product.id === product.id);
        return acc + (item?.quantity || 0);
      }, 0);
      return { ...product, soldCount };
    })
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 5);

  const handleGenerateReport = (reportId: string) => {
    setSelectedReport(reportId);
    toast.success('Generando reporte...');
    setTimeout(() => {
      toast.success('Reporte generado exitosamente');
    }, 1500);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    toast.success(`Exportando a ${format.toUpperCase()}...`);
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
          <h1 className="text-3xl font-bold text-neutral-50">Reportes</h1>
          <p className="text-neutral-300 mt-1">Analiza el rendimiento de tu negocio</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
          >
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="year">Este año</option>
          </select>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <span className="text-neutral-300">Ventas Totales</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">${totalSales.toFixed(2)}</p>
          <p className="text-sm text-success mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +15% vs período anterior
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-neutral-300">Transacciones</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">{totalTransactions}</p>
          <p className="text-sm text-primary-500 mt-1">ventas completadas</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-warning" />
            </div>
            <span className="text-neutral-300">Ticket Promedio</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">${averageTicket.toFixed(2)}</p>
          <p className="text-sm text-warning mt-1">por transacción</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#A78BFA]/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#A78BFA]" />
            </div>
            <span className="text-neutral-300">Productos Vendidos</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">
            {sales.reduce((acc, s) => acc + s.items.reduce((a, i) => a + i.quantity, 0), 0)}
          </p>
          <p className="text-sm text-[#A78BFA] mt-1">unidades</p>
        </motion.div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report, index) => (
          <motion.button
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, borderColor: report.color }}
            onClick={() => handleGenerateReport(report.id)}
            className={`bg-neutral-900 border rounded-xl p-5 text-left transition-all ${
              selectedReport === report.id ? 'border-primary-500' : 'border-neutral-700'
            }`}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: `${report.color}20` }}
            >
              <report.icon className="w-6 h-6" style={{ color: report.color }} />
            </div>
            <h3 className="font-semibold text-neutral-50 mb-1">{report.title}</h3>
            <p className="text-sm text-neutral-400">{report.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Hour */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-neutral-50 mb-6">Ventas por Hora</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="hour" stroke="#a3a3a3" fontSize={11} />
              <YAxis stroke="#a3a3a3" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="ventas" fill="#22D3EE" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-neutral-50 mb-6">Tendencia Semanal</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="day" stroke="#a3a3a3" fontSize={12} />
              <YAxis stroke="#a3a3a3" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="actual" stroke="#4ADE80" strokeWidth={2} dot={{ fill: '#4ADE80' }} />
              <Line type="monotone" dataKey="anterior" stroke="#a3a3a3" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#a3a3a3' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-neutral-300">Semana actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-500" />
              <span className="text-sm text-neutral-300">Semana anterior</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-50">Productos Más Vendidos</h2>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Producto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Categoría</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Vendidos</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-300">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => {
                const category = categories.find((c) => c.id === product.categoryId);
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-neutral-800"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-warning text-neutral-950'
                            : index === 1
                            ? 'bg-neutral-400 text-neutral-950'
                            : index === 2
                            ? 'bg-orange-600 text-neutral-50'
                            : 'bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category?.color}20` }}
                        >
                          <Package className="w-5 h-5" style={{ color: category?.color }} />
                        </div>
                        <span className="font-medium text-neutral-50">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${category?.color}20`,
                          color: category?.color,
                        }}
                      >
                        {category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-50">{product.soldCount}</td>
                    <td className="px-4 py-3 font-semibold text-success">
                      ${(product.soldCount * product.price).toFixed(2)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
