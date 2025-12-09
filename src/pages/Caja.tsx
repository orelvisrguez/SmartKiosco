import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  History,
  Calculator,
  Plus,
  Minus,
  X,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  ChevronRight,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCurrentCashRegister,
  openCashRegister,
  closeCashRegister,
  getCashRegisterHistory,
  addCashMovement,
  getCashMovements,
  getTodaySales,
  type CashRegisterWithSales,
  type DBCashMovement,
} from '@/lib/api/cashRegister';

type TabType = 'current' | 'history';

export function Caja() {
  // Data states
  const [currentRegister, setCurrentRegister] = useState<CashRegisterWithSales | null>(null);
  const [history, setHistory] = useState<CashRegisterWithSales[]>([]);
  const [movements, setMovements] = useState<DBCashMovement[]>([]);
  const [todaySales, setTodaySales] = useState<any[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showHistoryDetail, setShowHistoryDetail] = useState<CashRegisterWithSales | null>(null);

  // Form states
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [movementData, setMovementData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [registerData, historyData] = await Promise.all([
        getCurrentCashRegister(),
        getCashRegisterHistory(),
      ]);

      setCurrentRegister(registerData);
      setHistory(historyData);

      if (registerData) {
        const [movementsData, salesData] = await Promise.all([
          getCashMovements(registerData.id),
          getTodaySales(registerData.opened_at),
        ]);
        setMovements(movementsData);
        setTodaySales(salesData);
      } else {
        setMovements([]);
        setTodaySales([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate expected cash
  const expectedCash = currentRegister
    ? currentRegister.opening_amount +
      currentRegister.cash_sales +
      movements
        .filter((m) => m.type === 'income')
        .reduce((acc, m) => acc + m.amount, 0) -
      movements
        .filter((m) => m.type === 'expense')
        .reduce((acc, m) => acc + m.amount, 0)
    : 0;

  const difference = closingAmount ? parseFloat(closingAmount) - expectedCash : 0;

  // Handle open register
  const handleOpenRegister = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setSubmitting(true);
    try {
      await openCashRegister(amount);
      toast.success('Caja abierta exitosamente');
      setShowOpenModal(false);
      setOpeningAmount('');
      loadData();
    } catch (error: any) {
      console.error('Error opening register:', error);
      toast.error(error.message || 'Error al abrir la caja');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close register
  const handleCloseRegister = async () => {
    if (!currentRegister) return;

    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setSubmitting(true);
    try {
      await closeCashRegister(currentRegister.id, amount, expectedCash, closingNotes);
      toast.success('Caja cerrada exitosamente');
      setShowCloseModal(false);
      setClosingAmount('');
      setClosingNotes('');
      loadData();
    } catch (error) {
      console.error('Error closing register:', error);
      toast.error('Error al cerrar la caja');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle add movement
  const handleAddMovement = async () => {
    if (!currentRegister) return;

    const amount = parseFloat(movementData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (!movementData.description) {
      toast.error('Ingresa una descripción');
      return;
    }

    setSubmitting(true);
    try {
      await addCashMovement({
        cash_register_id: currentRegister.id,
        type: movementData.type,
        amount,
        description: movementData.description,
      });
      toast.success('Movimiento registrado');
      setShowMovementModal(false);
      setMovementData({ type: 'income', amount: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error adding movement:', error);
      toast.error('Error al registrar el movimiento');
    } finally {
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-400">Cargando caja...</p>
        </div>
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Caja</h1>
          <p className="text-neutral-400 mt-1">
            Gestión de apertura, cierre y movimientos de caja
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-700 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {currentRegister ? (
            <>
              <button
                onClick={() => setShowMovementModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Movimiento
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-error text-white font-semibold rounded-lg hover:bg-error/80 transition-colors"
              >
                <Lock className="w-5 h-5" />
                Cerrar Caja
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-success text-neutral-950 font-semibold rounded-lg hover:bg-success/80 transition-colors"
            >
              <Unlock className="w-5 h-5" />
              Abrir Caja
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-800">
        {[
          { key: 'current', label: 'Caja Actual', icon: Wallet },
          { key: 'history', label: 'Historial', icon: History },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.key
                ? 'text-primary-500 border-primary-500'
                : 'text-neutral-400 border-transparent hover:text-neutral-50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'current' ? (
        <>
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-xl border-2 ${
              currentRegister
                ? 'bg-success/10 border-success/30'
                : 'bg-neutral-900 border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    currentRegister ? 'bg-success/20' : 'bg-neutral-800'
                  }`}
                >
                  <Wallet
                    className={`w-8 h-8 ${
                      currentRegister ? 'text-success' : 'text-neutral-400'
                    }`}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-50">
                    Caja {currentRegister ? 'Abierta' : 'Cerrada'}
                  </h2>
                  {currentRegister ? (
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Clock className="w-4 h-4" />
                      <span>
                        Abierta a las {formatTime(currentRegister.opened_at)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-neutral-400">
                      No hay una caja abierta actualmente
                    </p>
                  )}
                </div>
              </div>
              {currentRegister && (
                <div className="text-right">
                  <p className="text-sm text-neutral-400">Fondo inicial</p>
                  <p className="text-3xl font-bold text-success">
                    ${currentRegister.opening_amount.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {currentRegister ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: 'Ventas Efectivo',
                    value: currentRegister.cash_sales,
                    icon: Banknote,
                    color: '#4ADE80',
                  },
                  {
                    label: 'Ventas Tarjeta',
                    value: currentRegister.card_sales,
                    icon: CreditCard,
                    color: '#22D3EE',
                  },
                  {
                    label: 'Transferencias',
                    value: currentRegister.transfer_sales,
                    icon: Smartphone,
                    color: '#FBBF24',
                  },
                  {
                    label: 'Total Ventas',
                    value: currentRegister.total_sales,
                    icon: TrendingUp,
                    color: '#A78BFA',
                    count: currentRegister.sales_count,
                  },
                  {
                    label: 'Efectivo Esperado',
                    value: expectedCash,
                    icon: Calculator,
                    color: '#22D3EE',
                    highlight: true,
                  },
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`rounded-xl p-4 ${
                      stat.highlight
                        ? 'bg-primary-500/10 border-2 border-primary-500/30'
                        : 'bg-neutral-900 border border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${stat.color}15` }}
                      >
                        <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                      </div>
                      <span className="text-sm text-neutral-400">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-neutral-50">
                      ${stat.value.toFixed(2)}
                    </p>
                    {stat.count !== undefined && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {stat.count} transacciones
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Two Columns: Movements & Sales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Movements */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-primary-500" />
                      <h3 className="font-semibold text-neutral-50">Movimientos de Caja</h3>
                    </div>
                    <button
                      onClick={() => setShowMovementModal(true)}
                      className="text-sm text-primary-500 hover:text-primary-400"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="divide-y divide-neutral-800 max-h-80 overflow-y-auto">
                    {movements.length === 0 ? (
                      <div className="p-8 text-center text-neutral-400">
                        <ArrowUpRight className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No hay movimientos registrados</p>
                      </div>
                    ) : (
                      movements.map((movement, idx) => (
                        <motion.div
                          key={movement.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="p-4 flex items-center justify-between hover:bg-neutral-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                movement.type === 'income'
                                  ? 'bg-success/20'
                                  : 'bg-error/20'
                              }`}
                            >
                              {movement.type === 'income' ? (
                                <ArrowDownLeft className="w-5 h-5 text-success" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-error" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-50">
                                {movement.description}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatTime(movement.created_at)}
                              </p>
                            </div>
                          </div>
                          <p
                            className={`font-bold ${
                              movement.type === 'income' ? 'text-success' : 'text-error'
                            }`}
                          >
                            {movement.type === 'income' ? '+' : '-'}${movement.amount.toFixed(2)}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Today's Sales */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-success" />
                      <h3 className="font-semibold text-neutral-50">Ventas de Hoy</h3>
                    </div>
                    <span className="text-sm text-neutral-400">
                      {todaySales.length} ventas
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-800 max-h-80 overflow-y-auto">
                    {todaySales.length === 0 ? (
                      <div className="p-8 text-center text-neutral-400">
                        <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No hay ventas registradas</p>
                      </div>
                    ) : (
                      todaySales.map((sale, idx) => (
                        <motion.div
                          key={sale.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="p-4 flex items-center justify-between hover:bg-neutral-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                sale.payment_method === 'cash'
                                  ? 'bg-success/20'
                                  : sale.payment_method === 'card'
                                  ? 'bg-primary-500/20'
                                  : 'bg-warning/20'
                              }`}
                            >
                              {sale.payment_method === 'cash' ? (
                                <Banknote className="w-5 h-5 text-success" />
                              ) : sale.payment_method === 'card' ? (
                                <CreditCard className="w-5 h-5 text-primary-500" />
                              ) : (
                                <Smartphone className="w-5 h-5 text-warning" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-50">
                                Venta #{sale.id.slice(-6)}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatTime(sale.created_at)} • {sale.items_count} productos
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-neutral-50">${sale.total.toFixed(2)}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
              <Wallet className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-50 mb-2">
                No hay una caja abierta
              </h3>
              <p className="text-neutral-400 mb-6">
                Abre una caja para comenzar a registrar ventas y movimientos
              </p>
              <button
                onClick={() => setShowOpenModal(true)}
                className="px-6 py-3 bg-success text-neutral-950 font-semibold rounded-lg hover:bg-success/80 transition-colors"
              >
                <Unlock className="w-5 h-5 inline-block mr-2" />
                Abrir Caja
              </button>
            </div>
          )}
        </>
      ) : (
        /* History Tab */
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-800">
            <h3 className="font-semibold text-neutral-50">Historial de Cajas</h3>
            <p className="text-sm text-neutral-400">
              Registro de aperturas y cierres de caja
            </p>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay historial de cajas</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {history.map((register, idx) => (
                <motion.div
                  key={register.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-4 hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  onClick={() => setShowHistoryDetail(register)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          register.status === 'open'
                            ? 'bg-success/20'
                            : register.difference && register.difference < 0
                            ? 'bg-error/20'
                            : register.difference && register.difference > 0
                            ? 'bg-warning/20'
                            : 'bg-neutral-800'
                        }`}
                      >
                        {register.status === 'open' ? (
                          <Unlock className="w-6 h-6 text-success" />
                        ) : (
                          <Lock
                            className={`w-6 h-6 ${
                              register.difference && register.difference < 0
                                ? 'text-error'
                                : register.difference && register.difference > 0
                                ? 'text-warning'
                                : 'text-neutral-400'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-neutral-50">
                            {formatDate(register.opened_at)}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              register.status === 'open'
                                ? 'bg-success/20 text-success'
                                : 'bg-neutral-700 text-neutral-400'
                            }`}
                          >
                            {register.status === 'open' ? 'Abierta' : 'Cerrada'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-400">
                          {formatTime(register.opened_at)}
                          {register.closed_at && ` - ${formatTime(register.closed_at)}`}
                          {' • '}{register.sales_count} ventas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">Total ventas</p>
                        <p className="font-bold text-neutral-50">
                          ${register.total_sales.toFixed(2)}
                        </p>
                      </div>
                      {register.status === 'closed' && register.difference !== null && (
                        <div className="text-right">
                          <p className="text-xs text-neutral-500">Diferencia</p>
                          <p
                            className={`font-bold ${
                              register.difference > 0
                                ? 'text-success'
                                : register.difference < 0
                                ? 'text-error'
                                : 'text-neutral-400'
                            }`}
                          >
                            {register.difference >= 0 ? '+' : ''}
                            ${register.difference.toFixed(2)}
                          </p>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-neutral-500" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Open Register Modal */}
      <AnimatePresence>
        {showOpenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowOpenModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-50">Abrir Caja</h2>
                  <p className="text-sm text-neutral-400">Ingresa el fondo inicial</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Monto inicial
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="number"
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-2xl text-center focus:outline-none focus:border-success focus:ring-2 focus:ring-success/30"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setOpeningAmount(amount.toString())}
                      className="py-2 bg-neutral-800 text-neutral-300 text-sm rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowOpenModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleOpenRegister}
                    disabled={submitting || !openingAmount}
                    className="flex-1 py-3 bg-success text-neutral-950 font-semibold rounded-lg hover:bg-success/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    Abrir Caja
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Register Modal */}
      <AnimatePresence>
        {showCloseModal && currentRegister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCloseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-error" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-50">Cerrar Caja</h2>
                  <p className="text-sm text-neutral-400">Realiza el arqueo de caja</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Fondo inicial</span>
                    <span className="text-neutral-50">
                      ${currentRegister.opening_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Ventas efectivo</span>
                    <span className="text-success">
                      +${currentRegister.cash_sales.toFixed(2)}
                    </span>
                  </div>
                  {movements.filter((m) => m.type === 'income').length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Entradas</span>
                      <span className="text-success">
                        +$
                        {movements
                          .filter((m) => m.type === 'income')
                          .reduce((acc, m) => acc + m.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  {movements.filter((m) => m.type === 'expense').length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Salidas</span>
                      <span className="text-error">
                        -$
                        {movements
                          .filter((m) => m.type === 'expense')
                          .reduce((acc, m) => acc + m.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="h-px bg-neutral-700" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-neutral-300">Efectivo esperado</span>
                    <span className="text-primary-500">${expectedCash.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Efectivo contado
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="number"
                      value={closingAmount}
                      onChange={(e) => setClosingAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-2xl text-center focus:outline-none focus:border-error focus:ring-2 focus:ring-error/30"
                      autoFocus
                    />
                  </div>
                </div>

                {closingAmount && (
                  <div
                    className={`rounded-lg p-4 text-center ${
                      difference > 0
                        ? 'bg-success/10 border border-success/30'
                        : difference < 0
                        ? 'bg-error/10 border border-error/30'
                        : 'bg-neutral-800 border border-neutral-700'
                    }`}
                  >
                    <p className="text-sm text-neutral-300">
                      {difference > 0 ? 'Sobrante' : difference < 0 ? 'Faltante' : 'Cuadrado'}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        difference > 0
                          ? 'text-success'
                          : difference < 0
                          ? 'text-error'
                          : 'text-neutral-50'
                      }`}
                    >
                      ${Math.abs(difference).toFixed(2)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Observaciones del cierre..."
                    rows={2}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-error focus:ring-2 focus:ring-error/30 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCloseRegister}
                    disabled={submitting || !closingAmount}
                    className="flex-1 py-3 bg-error text-white font-semibold rounded-lg hover:bg-error/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    Cerrar Caja
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Movement Modal */}
      <AnimatePresence>
        {showMovementModal && currentRegister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowMovementModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">Registrar Movimiento</h2>
                <button
                  onClick={() => setShowMovementModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Tipo de movimiento
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMovementData({ ...movementData, type: 'income' })}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        movementData.type === 'income'
                          ? 'border-success bg-success/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <ArrowDownLeft
                        className={`w-6 h-6 ${
                          movementData.type === 'income' ? 'text-success' : 'text-neutral-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          movementData.type === 'income' ? 'text-success' : 'text-neutral-300'
                        }`}
                      >
                        Entrada
                      </span>
                    </button>
                    <button
                      onClick={() => setMovementData({ ...movementData, type: 'expense' })}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        movementData.type === 'expense'
                          ? 'border-error bg-error/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <ArrowUpRight
                        className={`w-6 h-6 ${
                          movementData.type === 'expense' ? 'text-error' : 'text-neutral-400'
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          movementData.type === 'expense' ? 'text-error' : 'text-neutral-300'
                        }`}
                      >
                        Salida
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Monto
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="number"
                      value={movementData.amount}
                      onChange={(e) => setMovementData({ ...movementData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={movementData.description}
                    onChange={(e) =>
                      setMovementData({ ...movementData, description: e.target.value })
                    }
                    placeholder="Ej: Pago a proveedor, cambio, etc."
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowMovementModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddMovement}
                    disabled={submitting || !movementData.amount || !movementData.description}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                    Registrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Detail Modal */}
      <AnimatePresence>
        {showHistoryDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistoryDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        showHistoryDetail.status === 'open'
                          ? 'bg-success/20'
                          : 'bg-neutral-800'
                      }`}
                    >
                      {showHistoryDetail.status === 'open' ? (
                        <Unlock className="w-6 h-6 text-success" />
                      ) : (
                        <Lock className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-50">
                        Detalle de Caja
                      </h2>
                      <p className="text-sm text-neutral-400">
                        {formatDate(showHistoryDetail.opened_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistoryDetail(null)}
                    className="p-2 text-neutral-400 hover:text-neutral-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-xs text-neutral-500">Apertura</p>
                    <p className="text-lg font-bold text-neutral-50">
                      {formatDateTime(showHistoryDetail.opened_at)}
                    </p>
                  </div>
                  {showHistoryDetail.closed_at && (
                    <div className="bg-neutral-800 rounded-lg p-4">
                      <p className="text-xs text-neutral-500">Cierre</p>
                      <p className="text-lg font-bold text-neutral-50">
                        {formatDateTime(showHistoryDetail.closed_at)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Fondo inicial</span>
                    <span className="font-medium text-neutral-50">
                      ${showHistoryDetail.opening_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Ventas efectivo</span>
                    <span className="font-medium text-success">
                      +${showHistoryDetail.cash_sales.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Ventas tarjeta</span>
                    <span className="font-medium text-primary-500">
                      ${showHistoryDetail.card_sales.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Transferencias</span>
                    <span className="font-medium text-warning">
                      ${showHistoryDetail.transfer_sales.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-neutral-700" />
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Total ventas</span>
                    <span className="font-bold text-neutral-50">
                      ${showHistoryDetail.total_sales.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Transacciones</span>
                    <span className="font-medium text-neutral-50">
                      {showHistoryDetail.sales_count}
                    </span>
                  </div>
                </div>

                {showHistoryDetail.status === 'closed' && (
                  <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Efectivo esperado</span>
                      <span className="font-medium text-neutral-50">
                        ${showHistoryDetail.expected_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Efectivo contado</span>
                      <span className="font-medium text-neutral-50">
                        ${showHistoryDetail.closing_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="h-px bg-neutral-700" />
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Diferencia</span>
                      <span
                        className={`font-bold ${
                          showHistoryDetail.difference && showHistoryDetail.difference > 0
                            ? 'text-success'
                            : showHistoryDetail.difference && showHistoryDetail.difference < 0
                            ? 'text-error'
                            : 'text-neutral-50'
                        }`}
                      >
                        {showHistoryDetail.difference && showHistoryDetail.difference >= 0 ? '+' : ''}
                        ${showHistoryDetail.difference?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                )}

                {showHistoryDetail.notes && (
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <p className="text-xs text-neutral-500 mb-1">Notas</p>
                    <p className="text-neutral-300">{showHistoryDetail.notes}</p>
                  </div>
                )}

                <button
                  onClick={() => setShowHistoryDetail(null)}
                  className="w-full py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
