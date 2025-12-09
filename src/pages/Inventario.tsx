import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  History,
  X,
} from 'lucide-react';
import { useAppStore, type Product } from '@/stores/useAppStore';
import { DataTable } from '@/components/ui/DataTable';
import toast from 'react-hot-toast';

export function Inventario() {
  const { products, categories, updateProduct } = useAppStore();
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustment, setAdjustment] = useState({ type: 'add', quantity: '', reason: '' });

  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalValue = products.reduce((acc, p) => acc + p.stock * p.cost, 0);

  const handleAdjustStock = () => {
    if (!selectedProduct || !adjustment.quantity) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const qty = parseInt(adjustment.quantity);
    const newStock = adjustment.type === 'add'
      ? selectedProduct.stock + qty
      : Math.max(0, selectedProduct.stock - qty);

    updateProduct(selectedProduct.id, { stock: newStock });
    toast.success(`Stock actualizado: ${selectedProduct.name}`);
    setShowAdjustModal(false);
    setAdjustment({ type: 'add', quantity: '', reason: '' });
  };

  const columns = [
    {
      key: 'name',
      label: 'Producto',
      sortable: true,
      render: (product: Product) => {
        const category = categories.find((c) => c.id === product.categoryId);
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${category?.color}20` }}
            >
              <Package className="w-5 h-5" style={{ color: category?.color }} />
            </div>
            <div>
              <p className="font-medium text-neutral-50">{product.name}</p>
              <p className="text-xs text-neutral-400">{category?.name}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: 'Stock Actual',
      sortable: true,
      render: (product: Product) => {
        const percentage = (product.stock / (product.minStock * 3)) * 100;
        const color = product.stock === 0
          ? '#F87171'
          : product.stock <= product.minStock
          ? '#FBBF24'
          : '#4ADE80';
        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-neutral-50">{product.stock}</span>
              <span className="text-neutral-400 text-xs">/ mín: {product.minStock}</span>
            </div>
            <div className="w-24 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, percentage)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'value',
      label: 'Valor Inventario',
      render: (product: Product) => (
        <span className="text-neutral-50">${(product.stock * product.cost).toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (product: Product) => {
        if (product.stock === 0) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-error/20 text-error">
              Sin Stock
            </span>
          );
        }
        if (product.stock <= product.minStock) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning/20 text-warning flex items-center gap-1 w-fit">
              <AlertTriangle className="w-3 h-3" />
              Stock Bajo
            </span>
          );
        }
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-success/20 text-success">
            Normal
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Ajustar',
      render: (product: Product) => (
        <button
          onClick={() => {
            setSelectedProduct(product);
            setShowAdjustModal(true);
          }}
          className="px-3 py-1.5 text-sm bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 hover:text-neutral-50 transition-colors"
        >
          Ajustar
        </button>
      ),
    },
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
          <h1 className="text-3xl font-bold text-neutral-50">Inventario</h1>
          <p className="text-neutral-300 mt-1">Control y gestión de stock</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-neutral-300">Stock Total</span>
          </div>
          <p className="text-3xl font-bold text-neutral-50">{totalStock.toLocaleString()}</p>
          <p className="text-sm text-neutral-400 mt-1">unidades</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <span className="text-neutral-300">Valor Total</span>
          </div>
          <p className="text-3xl font-bold text-success">${totalValue.toFixed(2)}</p>
          <p className="text-sm text-neutral-400 mt-1">en inventario</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <span className="text-neutral-300">Stock Bajo</span>
          </div>
          <p className="text-3xl font-bold text-warning">{lowStockCount}</p>
          <p className="text-sm text-neutral-400 mt-1">productos</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-error" />
            </div>
            <span className="text-neutral-300">Sin Stock</span>
          </div>
          <p className="text-3xl font-bold text-error">{outOfStockCount}</p>
          <p className="text-sm text-neutral-400 mt-1">productos</p>
        </motion.div>
      </div>

      {/* Table */}
      <DataTable
        data={products}
        columns={columns}
        searchable
        searchKeys={['name']}
        pageSize={10}
      />

      {/* Adjust Modal */}
      <AnimatePresence>
        {showAdjustModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowAdjustModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">Ajustar Stock</h2>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-neutral-400">Producto</p>
                <p className="text-lg font-semibold text-neutral-50">{selectedProduct.name}</p>
                <p className="text-sm text-neutral-300">Stock actual: {selectedProduct.stock}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Tipo de ajuste
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAdjustment({ ...adjustment, type: 'add' })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                        adjustment.type === 'add'
                          ? 'border-success bg-success/10 text-success'
                          : 'border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <Plus className="w-5 h-5" />
                      Entrada
                    </button>
                    <button
                      onClick={() => setAdjustment({ ...adjustment, type: 'subtract' })}
                      className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                        adjustment.type === 'subtract'
                          ? 'border-error bg-error/10 text-error'
                          : 'border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <Minus className="w-5 h-5" />
                      Salida
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={adjustment.quantity}
                    onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-xl text-center focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    placeholder="Ej: Compra a proveedor"
                  />
                </div>

                {adjustment.quantity && (
                  <div className="bg-neutral-800 rounded-lg p-3 text-center">
                    <p className="text-sm text-neutral-400">Nuevo stock</p>
                    <p className="text-2xl font-bold text-primary-500">
                      {adjustment.type === 'add'
                        ? selectedProduct.stock + parseInt(adjustment.quantity || '0')
                        : Math.max(0, selectedProduct.stock - parseInt(adjustment.quantity || '0'))}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAdjustModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAdjustStock}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Confirmar Ajuste
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
