import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  DollarSign,
  Clock,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  History,
  Calculator,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import toast from 'react-hot-toast';

export function Caja() {
  const {
    cashRegister,
    openCashRegister,
    closeCashRegister,
    sales,
    currentUser,
  } = useAppStore();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');

  const todaySales = sales.filter((sale) => {
    const saleDate = new Date(sale.date).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  });

  const totalCashSales = todaySales
    .filter((sale) => sale.paymentMethod === 'cash')
    .reduce((acc, sale) => acc + sale.total, 0);

  const totalCardSales = todaySales
    .filter((sale) => sale.paymentMethod === 'card')
    .reduce((acc, sale) => acc + sale.total, 0);

  const totalTransferSales = todaySales
    .filter((sale) => sale.paymentMethod === 'transfer')
    .reduce((acc, sale) => acc + sale.total, 0);

  const expectedCash = (cashRegister?.openingAmount || 0) + totalCashSales;

  const handleOpenRegister = () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    openCashRegister(amount);
    setShowOpenModal(false);
    setOpeningAmount('');
    toast.success('Caja abierta exitosamente');
  };

  const handleCloseRegister = () => {
    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    closeCashRegister(amount);
    setShowCloseModal(false);
    setClosingAmount('');
    toast.success('Caja cerrada exitosamente');
  };

  const difference = cashRegister?.closingAmount
    ? cashRegister.closingAmount - expectedCash
    : parseFloat(closingAmount) - expectedCash;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-50">Caja</h1>
          <p className="text-neutral-300 mt-1">
            Gestión de apertura y cierre de caja
          </p>
        </div>
        {!cashRegister || cashRegister.status === 'closed' ? (
          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-success text-neutral-950 font-semibold rounded-lg hover:bg-success/80 transition-colors"
          >
            <Unlock className="w-5 h-5" />
            Abrir Caja
          </button>
        ) : (
          <button
            onClick={() => setShowCloseModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-error text-neutral-50 font-semibold rounded-lg hover:bg-error/80 transition-colors"
          >
            <Lock className="w-5 h-5" />
            Cerrar Caja
          </button>
        )}
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-xl border-2 ${
          cashRegister?.status === 'open'
            ? 'bg-success/10 border-success/30'
            : 'bg-neutral-900 border-neutral-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                cashRegister?.status === 'open' ? 'bg-success/20' : 'bg-neutral-800'
              }`}
            >
              <Wallet
                className={`w-8 h-8 ${
                  cashRegister?.status === 'open' ? 'text-success' : 'text-neutral-400'
                }`}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-50">
                Caja {cashRegister?.status === 'open' ? 'Abierta' : 'Cerrada'}
              </h2>
              {cashRegister?.status === 'open' && (
                <p className="text-neutral-300">
                  Abierta por {currentUser?.name} a las{' '}
                  {new Date(cashRegister.openedAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
          {cashRegister?.status === 'open' && (
            <div className="text-right">
              <p className="text-sm text-neutral-400">Fondo inicial</p>
              <p className="text-2xl font-bold text-success">
                ${cashRegister.openingAmount.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-success" />
            </div>
            <span className="text-neutral-300">Ventas Efectivo</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">${totalCashSales.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-neutral-300">Ventas Tarjeta</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">${totalCardSales.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-warning" />
            </div>
            <span className="text-neutral-300">Transferencias</span>
          </div>
          <p className="text-2xl font-bold text-neutral-50">${totalTransferSales.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-neutral-300">Efectivo Esperado</span>
          </div>
          <p className="text-2xl font-bold text-primary-500">${expectedCash.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Transactions History */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg">
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-neutral-50">Movimientos del Día</h2>
          </div>
        </div>
        <div className="divide-y divide-neutral-800">
          {todaySales.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay transacciones hoy</p>
            </div>
          ) : (
            todaySales.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      sale.paymentMethod === 'cash'
                        ? 'bg-success/20'
                        : sale.paymentMethod === 'card'
                        ? 'bg-primary-500/20'
                        : 'bg-warning/20'
                    }`}
                  >
                    <ArrowDownLeft
                      className={`w-5 h-5 ${
                        sale.paymentMethod === 'cash'
                          ? 'text-success'
                          : sale.paymentMethod === 'card'
                          ? 'text-primary-500'
                          : 'text-warning'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-50">Venta #{sale.id.slice(-4)}</p>
                    <p className="text-sm text-neutral-400">
                      {new Date(sale.date).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {sale.items.length} productos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-50">${sale.total.toFixed(2)}</p>
                  <p className="text-xs text-neutral-400 capitalize">
                    {sale.paymentMethod === 'cash'
                      ? 'Efectivo'
                      : sale.paymentMethod === 'card'
                      ? 'Tarjeta'
                      : 'Transferencia'}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Open Register Modal */}
      <AnimatePresence>
        {showOpenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
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
                      className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-xl focus:outline-none focus:border-success focus:ring-2 focus:ring-success/30"
                    />
                  </div>
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
                    className="flex-1 py-3 bg-success text-neutral-950 font-semibold rounded-lg hover:bg-success/80 transition-colors"
                  >
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
        {showCloseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
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
                    <span className="text-neutral-50">${cashRegister?.openingAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Ventas efectivo</span>
                    <span className="text-success">+${totalCashSales.toFixed(2)}</span>
                  </div>
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
                      className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-xl focus:outline-none focus:border-error focus:ring-2 focus:ring-error/30"
                    />
                  </div>
                </div>

                {closingAmount && (
                  <div
                    className={`rounded-lg p-3 text-center ${
                      difference >= 0
                        ? 'bg-success/10 border border-success/30'
                        : 'bg-error/10 border border-error/30'
                    }`}
                  >
                    <p className="text-sm text-neutral-300">
                      {difference >= 0 ? 'Sobrante' : 'Faltante'}
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        difference >= 0 ? 'text-success' : 'text-error'
                      }`}
                    >
                      ${Math.abs(difference).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCloseRegister}
                    className="flex-1 py-3 bg-error text-neutral-50 font-semibold rounded-lg hover:bg-error/80 transition-colors"
                  >
                    Cerrar Caja
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
