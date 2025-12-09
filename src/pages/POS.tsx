import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  ShoppingCart,
  Barcode,
  Loader2,
  Package,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProducts, type ProductWithCategory } from '@/lib/api/products';
import { fetchCategories, type DBCategory } from '@/lib/api/categories';
import { createSale, type CartItem as SaleCartItem } from '@/lib/api/sales';

interface CartItem {
  product: ProductWithCategory;
  quantity: number;
}

export function POS() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [cashReceived, setCashReceived] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.barcode && product.barcode.includes(search));
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory && product.active && product.stock > 0;
  });

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const addToCart = (product: ProductWithCategory) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('No hay suficiente stock');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} agregado`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setProcessing(true);
    try {
      const saleItems: SaleCartItem[] = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));

      await createSale({
        total: cartTotal,
        payment_method: paymentMethod,
        items: saleItems,
      });

      setLastSaleTotal(cartTotal);
      clearCart();
      setShowPaymentModal(false);
      setCashReceived('');
      setShowSuccessModal(true);

      // Reload products to get updated stock
      loadData();

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error('Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  const change = parseFloat(cashReceived) - cartTotal;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-400">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-48px)] gap-6">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        {/* Search & Categories */}
        <div className="mb-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar producto o escanear código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-50 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 transition-all text-lg"
              />
              <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            </div>
            <button
              onClick={loadData}
              className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 transition-colors"
              title="Actualizar productos"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-primary-500 text-neutral-950'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'text-neutral-950'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No se encontraron productos</p>
              <p className="text-sm">Intenta con otra búsqueda o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.product.id === product.id);
                  return (
                    <motion.button
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(product)}
                      className={`bg-neutral-900 border rounded-lg p-4 text-left transition-all group relative ${
                        cartItem
                          ? 'border-primary-500 bg-primary-500/5'
                          : 'border-neutral-700 hover:border-primary-500'
                      }`}
                    >
                      {cartItem && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-neutral-950">
                            {cartItem.quantity}
                          </span>
                        </div>
                      )}
                      <div
                        className="w-full aspect-square rounded-lg mb-3 flex items-center justify-center"
                        style={{ backgroundColor: product.category_color ? `${product.category_color}15` : '#262626' }}
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package
                            className="w-12 h-12"
                            style={{ color: product.category_color || '#6B7280' }}
                          />
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-neutral-50 truncate group-hover:text-primary-500 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-lg font-bold text-primary-500">${product.price.toFixed(2)}</p>
                        <span className={`text-xs ${product.stock <= product.min_stock ? 'text-warning' : 'text-neutral-400'}`}>
                          {product.stock} uds
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-neutral-900 border border-neutral-700 rounded-lg flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-neutral-50">Carrito</h2>
            </div>
            <span className="px-2 py-1 bg-primary-500/20 text-primary-500 text-sm font-medium rounded-full">
              {cartItemsCount} items
            </span>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-neutral-400"
              >
                <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                <p>El carrito está vacío</p>
                <p className="text-sm">Selecciona productos para agregar</p>
              </motion.div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-neutral-800 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-neutral-50 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-neutral-400">${item.product.price.toFixed(2)} c/u</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-neutral-400 hover:text-error transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-neutral-300 hover:bg-neutral-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-neutral-50 font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (item.quantity < item.product.stock) {
                            updateCartQuantity(item.product.id, item.quantity + 1);
                          } else {
                            toast.error('Stock insuficiente');
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-neutral-300 hover:bg-neutral-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-primary-500">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-neutral-700 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-neutral-50">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Impuestos (0%)</span>
              <span className="text-neutral-50">$0.00</span>
            </div>
            <div className="h-px bg-neutral-700" />
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-neutral-50">Total</span>
              <span className="text-2xl font-bold text-primary-500">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="px-4 py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="px-4 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cobrar
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-50">Procesar Pago</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-neutral-400">Total a pagar</p>
                <p className="text-3xl font-bold text-primary-500">${cartTotal.toFixed(2)}</p>
                <p className="text-xs text-neutral-500 mt-1">{cartItemsCount} productos</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-neutral-300">Método de pago</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cash', label: 'Efectivo', icon: Banknote },
                    { id: 'card', label: 'Tarjeta', icon: CreditCard },
                    { id: 'transfer', label: 'Transfer', icon: Smartphone },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <method.icon
                        className={`w-6 h-6 mx-auto mb-2 ${
                          paymentMethod === method.id ? 'text-primary-500' : 'text-neutral-400'
                        }`}
                      />
                      <p
                        className={`text-xs font-medium ${
                          paymentMethod === method.id ? 'text-primary-500' : 'text-neutral-300'
                        }`}
                      >
                        {method.label}
                      </p>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'cash' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-neutral-300">
                      Monto recibido
                    </label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-50 text-xl text-center focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {[cartTotal, 5, 10, 20].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setCashReceived(amount.toString())}
                          className="py-2 px-3 bg-neutral-800 text-neutral-300 text-sm rounded-lg hover:bg-neutral-700 transition-colors"
                        >
                          ${amount.toFixed(2)}
                        </button>
                      ))}
                    </div>
                    {parseFloat(cashReceived) >= cartTotal && (
                      <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
                        <p className="text-sm text-neutral-300">Cambio a devolver</p>
                        <p className="text-2xl font-bold text-success">${change.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleCompleteSale}
                  disabled={(paymentMethod === 'cash' && parseFloat(cashReceived) < cartTotal) || processing}
                  className="w-full py-4 bg-primary-500 text-neutral-950 font-bold text-lg rounded-lg hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {processing && <Loader2 className="w-5 h-5 animate-spin" />}
                  {processing ? 'Procesando...' : 'Confirmar Venta'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-neutral-900 border border-success/30 rounded-xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-50 mb-2">¡Venta Completada!</h2>
              <p className="text-neutral-400 mb-4">La venta se ha registrado correctamente</p>
              <p className="text-3xl font-bold text-primary-500">${lastSaleTotal.toFixed(2)}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
