import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
  PiggyBank,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
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
import { useAppStore } from '@/stores/useAppStore';

const monthlyData = [
  { name: 'Ene', ingresos: 12500, gastos: 8200, ganancia: 4300 },
  { name: 'Feb', ingresos: 14200, gastos: 9100, ganancia: 5100 },
  { name: 'Mar', ingresos: 13800, gastos: 8800, ganancia: 5000 },
  { name: 'Abr', ingresos: 15600, gastos: 9500, ganancia: 6100 },
  { name: 'May', ingresos: 16200, gastos: 10200, ganancia: 6000 },
  { name: 'Jun', ingresos: 18500, gastos: 11000, ganancia: 7500 },
];

const expenseCategories = [
  { name: 'Compras', value: 65, color: '#22D3EE' },
  { name: 'Servicios', value: 15, color: '#4ADE80' },
  { name: 'Personal', value: 12, color: '#FBBF24' },
  { name: 'Otros', value: 8, color: '#A78BFA' },
];

export function Finanzas() {
  const { sales, purchases, products } = useAppStore();

  const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + p.total, 0);
  const inventoryValue = products.reduce((acc, p) => acc + p.stock * p.cost, 0);
  const grossProfit = totalSales - (totalSales * 0.4); // Assuming 40% cost

  const cashSales = sales.filter((s) => s.paymentMethod === 'cash').reduce((acc, s) => acc + s.total, 0);
  const cardSales = sales.filter((s) => s.paymentMethod === 'card').reduce((acc, s) => acc + s.total, 0);
  const transferSales = sales.filter((s) => s.paymentMethod === 'transfer').reduce((acc, s) => acc + s.total, 0);

  const transactions = [
    { id: '1', type: 'income', description: 'Ventas del día', amount: 1250.00, date: '2024-12-09' },
    { id: '2', type: 'expense', description: 'Pago a proveedor', amount: 850.00, date: '2024-12-09' },
    { id: '3', type: 'income', description: 'Ventas del día', amount: 980.00, date: '2024-12-08' },
    { id: '4', type: 'expense', description: 'Servicios públicos', amount: 120.00, date: '2024-12-08' },
    { id: '5', type: 'income', description: 'Ventas del día', amount: 1450.00, date: '2024-12-07' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Finanzas</h1>
          <p className="text-neutral-300 mt-1">Resumen financiero del negocio</p>
        </div>
        <div className="flex gap-3">
          <select className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500">
            <option>Este mes</option>
            <option>Último mes</option>
            <option>Este año</option>
          </select>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -4, borderColor: '#4ADE80' }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-success bg-success/20 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-4 h-4" />
              12.5%
            </span>
          </div>
          <p className="text-neutral-300 text-sm mb-1">Ingresos Totales</p>
          <p className="text-3xl font-bold text-neutral-50">${totalSales.toFixed(2)}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, borderColor: '#F87171' }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-error/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-error" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-error bg-error/20 px-2 py-1 rounded-full">
              <ArrowDownRight className="w-4 h-4" />
              5.2%
            </span>
          </div>
          <p className="text-neutral-300 text-sm mb-1">Gastos Totales</p>
          <p className="text-3xl font-bold text-neutral-50">${totalPurchases.toFixed(2)}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, borderColor: '#22D3EE' }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-500" />
            </div>
          </div>
          <p className="text-neutral-300 text-sm mb-1">Ganancia Bruta</p>
          <p className="text-3xl font-bold text-primary-500">${grossProfit.toFixed(2)}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, borderColor: '#A78BFA' }}
          className="bg-neutral-900 border border-neutral-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#A78BFA]/20 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-[#A78BFA]" />
            </div>
          </div>
          <p className="text-neutral-300 text-sm mb-1">Valor Inventario</p>
          <p className="text-3xl font-bold text-neutral-50">${inventoryValue.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-neutral-50 mb-6">Ingresos vs Gastos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F87171" stopOpacity={0} />
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
              />
              <Area type="monotone" dataKey="ingresos" stroke="#4ADE80" strokeWidth={2} fill="url(#colorIngresos)" />
              <Area type="monotone" dataKey="gastos" stroke="#F87171" strokeWidth={2} fill="url(#colorGastos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Distribution */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-neutral-50 mb-6">Distribución de Gastos</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expenseCategories}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseCategories.map((entry, index) => (
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
            {expenseCategories.map((cat) => (
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
      </div>

      {/* Payment Methods & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-neutral-50 mb-6">Métodos de Pago</h2>
          <div className="space-y-4">
            {[
              { label: 'Efectivo', value: cashSales, icon: Banknote, color: '#4ADE80', percentage: (cashSales / totalSales) * 100 || 0 },
              { label: 'Tarjeta', value: cardSales, icon: CreditCard, color: '#22D3EE', percentage: (cardSales / totalSales) * 100 || 0 },
              { label: 'Transferencia', value: transferSales, icon: Smartphone, color: '#FBBF24', percentage: (transferSales / totalSales) * 100 || 0 },
            ].map((method) => (
              <div key={method.label} className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${method.color}20` }}
                >
                  <method.icon className="w-6 h-6" style={{ color: method.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-300">{method.label}</span>
                    <span className="font-semibold text-neutral-50">${method.value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${method.percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: method.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-50">Últimos Movimientos</h2>
            <Receipt className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-success/20' : 'bg-error/20'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-error" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-50">{tx.description}</p>
                    <p className="text-xs text-neutral-400">{tx.date}</p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    tx.type === 'income' ? 'text-success' : 'text-error'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
