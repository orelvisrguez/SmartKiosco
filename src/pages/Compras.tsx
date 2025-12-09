import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Plus,
  Package,
  Calendar,
  X,
  Check,
  Clock,
  XCircle,
} from 'lucide-react';
import { useAppStore, type Product, type Purchase } from '@/stores/useAppStore';
import { DataTable } from '@/components/ui/DataTable';
import toast from 'react-hot-toast';

export function Compras() {
  const { purchases, suppliers, products, addPurchase, updatePurchase, updateProduct } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; quantity: number; cost: number }[]>([]);

  const handleAddItem = () => {
    setPurchaseItems([...purchaseItems, { productId: '', quantity: 1, cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...purchaseItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].cost = product.cost;
      }
    }

    setPurchaseItems(updated);
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((acc, item) => acc + item.quantity * item.cost, 0);
  };

  const handleSubmit = () => {
    if (!selectedSupplier || purchaseItems.length === 0) {
      toast.error('Selecciona un proveedor y agrega productos');
      return;
    }

    const purchase: Purchase = {
      id: Date.now().toString(),
      supplierId: selectedSupplier,
      items: purchaseItems,
      total: calculateTotal(),
      date: new Date().toISOString(),
      status: 'pending',
    };

    addPurchase(purchase);
    toast.success('Orden de compra creada');
    setShowModal(false);
    setSelectedSupplier('');
    setPurchaseItems([]);
  };

  const handleReceivePurchase = (purchase: Purchase) => {
    // Update stock for each item
    purchase.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        updateProduct(product.id, { stock: product.stock + item.quantity });
      }
    });

    updatePurchase(purchase.id, { status: 'received' });
    toast.success('Compra recibida y stock actualizado');
  };

  const handleCancelPurchase = (purchaseId: string) => {
    if (confirm('¿Estás seguro de cancelar esta orden?')) {
      updatePurchase(purchaseId, { status: 'cancelled' });
      toast.success('Orden cancelada');
    }
  };

  const getSupplierName = (supplierId: string) => {
    return suppliers.find((s) => s.id === supplierId)?.name || 'Desconocido';
  };

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || 'Desconocido';
  };

  const columns = [
    {
      key: 'id',
      label: 'Orden',
      render: (purchase: Purchase) => (
        <span className="font-mono text-primary-500">#{purchase.id.slice(-6)}</span>
      ),
    },
    {
      key: 'supplierId',
      label: 'Proveedor',
      render: (purchase: Purchase) => (
        <span className="text-neutral-50">{getSupplierName(purchase.supplierId)}</span>
      ),
    },
    {
      key: 'items',
      label: 'Productos',
      render: (purchase: Purchase) => (
        <span className="text-neutral-300">{purchase.items.length} items</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (purchase: Purchase) => (
        <span className="font-semibold text-neutral-50">${purchase.total.toFixed(2)}</span>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      render: (purchase: Purchase) => (
        <span className="text-neutral-400">
          {new Date(purchase.date).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (purchase: Purchase) => {
        const statusConfig = {
          pending: { label: 'Pendiente', color: 'warning', icon: Clock },
          received: { label: 'Recibido', color: 'success', icon: Check },
          cancelled: { label: 'Cancelado', color: 'error', icon: XCircle },
        };
        const config = statusConfig[purchase.status];
        const Icon = config.icon;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-${config.color}/20 text-${config.color}`}
            style={{
              backgroundColor: config.color === 'warning' ? 'rgba(251, 191, 36, 0.2)'
                : config.color === 'success' ? 'rgba(74, 222, 128, 0.2)'
                : 'rgba(248, 113, 113, 0.2)',
              color: config.color === 'warning' ? '#FBBF24'
                : config.color === 'success' ? '#4ADE80'
                : '#F87171',
            }}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (purchase: Purchase) => (
        <div className="flex items-center gap-2">
          {purchase.status === 'pending' && (
            <>
              <button
                onClick={() => handleReceivePurchase(purchase)}
                className="px-3 py-1.5 text-xs bg-success/20 text-success rounded-lg hover:bg-success/30 transition-colors"
              >
                Recibir
              </button>
              <button
                onClick={() => handleCancelPurchase(purchase.id)}
                className="px-3 py-1.5 text-xs bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
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
          <h1 className="text-3xl font-bold text-neutral-50">Compras</h1>
          <p className="text-neutral-300 mt-1">
            Gestión de órdenes de compra a proveedores
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Compra
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Órdenes', value: purchases.length, color: '#22D3EE' },
          { label: 'Pendientes', value: purchases.filter((p) => p.status === 'pending').length, color: '#FBBF24' },
          { label: 'Recibidas', value: purchases.filter((p) => p.status === 'received').length, color: '#4ADE80' },
          { label: 'Monto Total', value: `$${purchases.reduce((acc, p) => acc + p.total, 0).toFixed(2)}`, color: '#A78BFA' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -4 }}
            className="bg-neutral-900 border border-neutral-700 rounded-lg p-6"
          >
            <p className="text-neutral-400 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={purchases}
        columns={columns}
        searchable={false}
        pageSize={10}
      />

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">Nueva Orden de Compra</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Proveedor
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-neutral-300">Productos</label>
                    <button
                      onClick={handleAddItem}
                      className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {purchaseItems.map((item, index) => (
                      <div key={index} className="flex gap-3 items-center bg-neutral-800 p-3 rounded-lg">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 focus:outline-none focus:border-primary-500"
                        >
                          <option value="">Seleccionar producto</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 text-center focus:outline-none focus:border-primary-500"
                          placeholder="Cant"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.cost}
                          onChange={(e) => handleItemChange(index, 'cost', parseFloat(e.target.value) || 0)}
                          className="w-24 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-50 text-center focus:outline-none focus:border-primary-500"
                          placeholder="Costo"
                        />
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-neutral-400 hover:text-error transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {purchaseItems.length === 0 && (
                      <div className="text-center py-8 text-neutral-400">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Agrega productos a la orden</p>
                      </div>
                    )}
                  </div>
                </div>

                {purchaseItems.length > 0 && (
                  <div className="bg-neutral-800 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-neutral-300">Total de la orden</span>
                    <span className="text-2xl font-bold text-primary-500">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Crear Orden
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
