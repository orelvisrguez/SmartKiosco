import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Percent,
  DollarSign,
  PauseCircle,
  PlayCircle,
  Clock,
  User,
  Receipt,
  TrendingUp,
  Calculator,
  ChevronRight,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  AlertCircle,
  ChevronLeft,
  ArrowLeft,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchProducts, type ProductWithCategory } from '@/lib/api/products';
import { fetchCategories, type DBCategory } from '@/lib/api/categories';
import {
  createSale,
  type CartItem as SaleCartItem,
  type HeldOrder,
  holdOrder,
  getHeldOrders,
  retrieveHeldOrder,
  deleteHeldOrder,
  getSessionStats,
  type SessionStats,
} from '@/lib/api/sales';
import { getBusinessSettings, getReceiptSettings, type BusinessSettings, type ReceiptSettings } from '@/lib/api/settings';
import ReceiptTicket, { type ReceiptData } from '@/components/pos/ReceiptTicket';

interface CartItem {
  product: ProductWithCategory;
  quantity: number;
}

type ViewMode = 'grid' | 'list';
type MobileView = 'products' | 'cart';

export function POS() {
  // Data state
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('products');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [lastReceiptData, setLastReceiptData] = useState<ReceiptData | null>(null);

  // Held orders
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [holdOrderName, setHoldOrderName] = useState('');

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, businessSettingsData, receiptSettingsData, stats] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        getBusinessSettings(),
        getReceiptSettings(),
        getSessionStats(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setBusinessSettings(businessSettingsData);
      setReceiptSettings(receiptSettingsData);
      setSessionStats(stats);
      setHeldOrders(getHeldOrders());
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

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        setShowPaymentModal(true);
      }
      if (e.key === 'Escape') {
        if (showPaymentModal) setShowPaymentModal(false);
        else if (showDiscountModal) setShowDiscountModal(false);
        else if (showHeldOrdersModal) setShowHeldOrdersModal(false);
        else if (showHoldModal) setShowHoldModal(false);
      }
      if (e.key === 'F5' && cart.length > 0) {
        e.preventDefault();
        setShowHoldModal(true);
      }
      if (e.key === 'F6') {
        e.preventDefault();
        setShowHeldOrdersModal(true);
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, showPaymentModal, showDiscountModal, showHeldOrdersModal, showHoldModal]);

  // Calculations
  const taxRate = businessSettings?.taxRate || 0;

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (cartSubtotal * discount) / 100;
    }
    return discount;
  }, [cartSubtotal, discount, discountType]);

  const taxableAmount = cartSubtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const cartTotal = taxableAmount + taxAmount;

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        (product.barcode && product.barcode.includes(search));
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      return matchesSearch && matchesCategory && product.active && product.stock > 0;
    });
  }, [products, search, selectedCategory]);

  // Cart operations
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
    setDiscount(0);
    setCustomerName('');
    setNotes('');
  };

  // Hold order
  const handleHoldOrder = () => {
    if (cart.length === 0) return;

    const items: SaleCartItem[] = cart.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      subtotal: item.product.price * item.quantity,
    }));

    holdOrder({
      name: holdOrderName || `Orden ${new Date().toLocaleTimeString()}`,
      items,
      subtotal: cartSubtotal,
      discount,
      discountType,
      customerName: customerName || undefined,
      notes: notes || undefined,
    });

    setHeldOrders(getHeldOrders());
    clearCart();
    setHoldOrderName('');
    setShowHoldModal(false);
    toast.success('Orden en espera guardada');
  };

  // Retrieve held order
  const handleRetrieveOrder = (orderId: string) => {
    const order = retrieveHeldOrder(orderId);
    if (!order) return;

    const newCart: CartItem[] = [];
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        newCart.push({ product, quantity: item.quantity });
      }
    }

    setCart(newCart);
    setDiscount(order.discount);
    setDiscountType(order.discountType);
    setCustomerName(order.customerName || '');
    setNotes(order.notes || '');
    setHeldOrders(getHeldOrders());
    setShowHeldOrdersModal(false);
    toast.success('Orden recuperada');
  };

  // Delete held order
  const handleDeleteHeldOrder = (orderId: string) => {
    deleteHeldOrder(orderId);
    setHeldOrders(getHeldOrders());
    toast.success('Orden eliminada');
  };

  // Complete sale
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

      const result = await createSale({
        total: cartTotal,
        subtotal: cartSubtotal,
        discount_amount: discountAmount,
        discount_percent: discountType === 'percent' ? discount : 0,
        tax_amount: taxAmount,
        payment_method: paymentMethod,
        customer_name: customerName || undefined,
        notes: notes || undefined,
        items: saleItems,
      });

      // Create receipt data for the ticket
      const receiptData: ReceiptData = {
        receiptNumber: (result as any).receipt_number || `${Date.now()}`,
        date: new Date(),
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          subtotal: item.product.price * item.quantity,
          barcode: item.product.barcode || undefined,
        })),
        subtotal: cartSubtotal,
        discountAmount: discountAmount,
        discountPercent: discountType === 'percent' ? discount : 0,
        taxAmount: taxAmount,
        taxRate: taxRate,
        total: cartTotal,
        paymentMethod: paymentMethod,
        cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : undefined,
        change: paymentMethod === 'cash' && parseFloat(cashReceived) > cartTotal
          ? parseFloat(cashReceived) - cartTotal
          : undefined,
        customerName: customerName || undefined,
        notes: notes || undefined,
      };

      setLastReceiptData(receiptData);
      clearCart();
      setShowPaymentModal(false);
      setCashReceived('');
      setShowSuccessModal(true);
      setMobileView('products');

      const stats = await getSessionStats();
      setSessionStats(stats);

      const productsData = await fetchProducts();
      setProducts(productsData);

      // Auto-print if configured
      if (receiptSettings?.printAutomatically) {
        // Will be handled by the ReceiptTicket component
      }
    } catch (error) {
      console.error('Error completing sale:', error);
      toast.error('Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const change = parseFloat(cashReceived) - cartTotal;

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto" />
          <p className="mt-4 text-neutral-400">Cargando punto de venta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-48px)] gap-4">
      {/* Mobile View Toggle - Only visible on mobile when in cart view */}
      {mobileView === 'cart' && (
        <div className="lg:hidden flex items-center gap-3 mb-2">
          <button
            onClick={() => setMobileView('products')}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 text-neutral-300 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Productos</span>
          </button>
          <h2 className="text-lg font-semibold text-neutral-50">Carrito</h2>
        </div>
      )}

      {/* Products Section - Hidden on mobile when viewing cart */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Top Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          {/* Session Stats Button */}
          <button
            onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <div className="text-left">
              <p className="text-[10px] sm:text-xs text-neutral-400">Hoy</p>
              <p className="text-xs sm:text-sm font-semibold text-neutral-50">
                {formatCurrency(sessionStats?.totalAmount || 0)}
              </p>
            </div>
          </button>

          {/* Search */}
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-9 sm:pr-12 py-2 sm:py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-sm sm:text-base text-neutral-50 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 transition-all"
            />
            <Barcode className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-neutral-500" />
          </div>

          {/* View Mode Toggle - Hidden on very small screens */}
          <div className="hidden sm:flex bg-neutral-900 border border-neutral-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-neutral-950' : 'text-neutral-400 hover:text-neutral-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-neutral-950' : 'text-neutral-400 hover:text-neutral-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Toggle - Hidden on mobile */}
          <button
            onClick={toggleFullscreen}
            className="hidden md:flex p-2 sm:p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 transition-colors"
            title="Pantalla completa (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-4 sm:w-5 h-4 sm:h-5" /> : <Maximize2 className="w-4 sm:w-5 h-4 sm:h-5" />}
          </button>

          {/* Refresh */}
          <button
            onClick={loadData}
            className="p-2 sm:p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>

        {/* Categories - Scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-3 mb-3 sm:mb-4 scrollbar-thin -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
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
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
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

        {/* Products Grid/List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-20 lg:pb-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-12">
              <Package className="w-12 sm:w-16 h-12 sm:h-16 mb-4 opacity-50" />
              <p className="text-base sm:text-lg">No se encontraron productos</p>
              <p className="text-xs sm:text-sm">Intenta con otra búsqueda</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.product.id === product.id);
                  const isLowStock = product.stock <= product.min_stock;
                  return (
                    <motion.button
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(product)}
                      className={`bg-neutral-900 border rounded-lg p-2 sm:p-3 text-left transition-all group relative ${
                        cartItem
                          ? 'border-primary-500 bg-primary-500/5'
                          : 'border-neutral-700 active:border-primary-500'
                      }`}
                    >
                      {cartItem && (
                        <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center z-10">
                          <span className="text-[10px] sm:text-xs font-bold text-neutral-950">
                            {cartItem.quantity}
                          </span>
                        </div>
                      )}
                      {isLowStock && (
                        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-warning" />
                        </div>
                      )}
                      <div
                        className="w-full aspect-square rounded-lg mb-1.5 sm:mb-2 flex items-center justify-center"
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
                            className="w-8 h-8 sm:w-10 sm:h-10"
                            style={{ color: product.category_color || '#6B7280' }}
                          />
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-neutral-50 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm sm:text-base font-bold text-primary-500">{formatCurrency(product.price)}</p>
                        <span className={`text-[10px] sm:text-xs ${isLowStock ? 'text-warning' : 'text-neutral-500'}`}>
                          {product.stock}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => {
                const cartItem = cart.find((item) => item.product.id === product.id);
                const isLowStock = product.stock <= product.min_stock;
                return (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => addToCart(product)}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-neutral-900 border rounded-lg transition-all ${
                      cartItem
                        ? 'border-primary-500 bg-primary-500/5'
                        : 'border-neutral-700 active:border-primary-500'
                    }`}
                  >
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: product.category_color ? `${product.category_color}15` : '#262626' }}
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: product.category_color || '#6B7280' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="text-xs sm:text-sm font-medium text-neutral-50 truncate">{product.name}</h3>
                      <p className="text-[10px] sm:text-xs text-neutral-400">{product.barcode || 'Sin código'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-primary-500">{formatCurrency(product.price)}</p>
                      <p className={`text-[10px] sm:text-xs ${isLowStock ? 'text-warning' : 'text-neutral-500'}`}>
                        Stock: {product.stock}
                      </p>
                    </div>
                    {cartItem && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold text-neutral-950">{cartItem.quantity}</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Bar - Quick Actions (Desktop) */}
        <div className="hidden lg:flex gap-2 mt-4 pt-4 border-t border-neutral-800">
          <button
            onClick={() => setShowHeldOrdersModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <PauseCircle className="w-4 h-4" />
            <span className="text-sm">En espera</span>
            {heldOrders.length > 0 && (
              <span className="px-1.5 py-0.5 bg-warning text-neutral-950 text-xs font-bold rounded-full">
                {heldOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCalculatorModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span className="text-sm">Calculadora</span>
          </button>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      <div className={`lg:hidden fixed bottom-4 right-4 z-40 ${mobileView === 'cart' ? 'hidden' : 'block'}`}>
        <button
          onClick={() => setMobileView('cart')}
          className="relative flex items-center gap-2 px-4 py-3 bg-primary-500 text-neutral-950 font-semibold rounded-full shadow-lg shadow-primary-500/30"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{formatCurrency(cartTotal)}</span>
          {cartItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-neutral-950 text-primary-500 rounded-full flex items-center justify-center text-xs font-bold">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Cart Section - Full screen on mobile, sidebar on desktop */}
      <div className={`lg:w-[380px] xl:w-[420px] bg-neutral-900 border border-neutral-700 rounded-lg flex flex-col ${mobileView === 'products' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Cart Header */}
        <div className="p-3 sm:p-4 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary-500" />
              <h2 className="text-base sm:text-lg font-semibold text-neutral-50">Venta Actual</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary-500/20 text-primary-500 text-xs sm:text-sm font-medium rounded-full">
                {cartItemsCount} items
              </span>
            </div>
          </div>

          {/* Customer Name */}
          <div className="mt-2 sm:mt-3 flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Cliente (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-xs sm:text-sm text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-neutral-400 py-8"
              >
                <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-50" />
                <p className="font-medium text-sm sm:text-base">Carrito vacío</p>
                <p className="text-xs sm:text-sm">Selecciona productos para agregar</p>
              </motion.div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-neutral-800 rounded-lg p-2 sm:p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-medium text-neutral-50 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-neutral-400">{formatCurrency(item.product.price)} c/u</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 sm:p-1.5 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-neutral-300 hover:bg-neutral-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val <= item.product.stock) {
                            updateCartQuantity(item.product.id, val);
                          }
                        }}
                        className="w-10 sm:w-12 text-center bg-neutral-700 border-none rounded-lg py-1 text-xs sm:text-sm text-neutral-50 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => {
                          if (item.quantity < item.product.stock) {
                            updateCartQuantity(item.product.id, item.quantity + 1);
                          } else {
                            toast.error('Stock insuficiente');
                          }
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-neutral-300 hover:bg-neutral-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-primary-500">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Cart Summary */}
        <div className="p-3 sm:p-4 border-t border-neutral-700 space-y-2 sm:space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-neutral-400">Subtotal</span>
            <span className="text-neutral-50">{formatCurrency(cartSubtotal)}</span>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <button
              onClick={() => setShowDiscountModal(true)}
              className="flex items-center gap-1 text-neutral-400 hover:text-primary-500 transition-colors"
            >
              <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Descuento</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className={discountAmount > 0 ? 'text-success' : 'text-neutral-50'}>
              {discountAmount > 0 ? `-${formatCurrency(discountAmount)}` : formatCurrency(0)}
            </span>
          </div>

          {/* Tax */}
          {taxRate > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-neutral-400">Impuesto ({taxRate}%)</span>
              <span className="text-neutral-50">{formatCurrency(taxAmount)}</span>
            </div>
          )}

          {/* Total */}
          <div className="h-px bg-neutral-700" />
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-semibold text-neutral-50">Total</span>
            <span className="text-xl sm:text-2xl font-bold text-primary-500">{formatCurrency(cartTotal)}</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
            >
              Limpiar
            </button>
            <button
              onClick={() => setShowHoldModal(true)}
              disabled={cart.length === 0}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-warning/20 text-warning font-medium rounded-lg hover:bg-warning/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm flex items-center justify-center gap-1"
            >
              <PauseCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Espera</span>
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
            >
              Cobrar
            </button>
          </div>

          {/* Mobile Quick Actions */}
          <div className="flex lg:hidden gap-2 pt-2">
            <button
              onClick={() => setShowHeldOrdersModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 text-neutral-300 rounded-lg"
            >
              <PauseCircle className="w-4 h-4" />
              <span className="text-xs">En espera</span>
              {heldOrders.length > 0 && (
                <span className="px-1.5 py-0.5 bg-warning text-neutral-950 text-[10px] font-bold rounded-full">
                  {heldOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowCalculatorModal(true)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-800 text-neutral-300 rounded-lg"
            >
              <Calculator className="w-4 h-4" />
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-50">Procesar Pago</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Total Display */}
              <div className="bg-neutral-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-center">
                <p className="text-xs sm:text-sm text-neutral-400 mb-1">Total a cobrar</p>
                <p className="text-3xl sm:text-4xl font-bold text-primary-500">{formatCurrency(cartTotal)}</p>
                <p className="text-[10px] sm:text-xs text-neutral-500 mt-2">{cartItemsCount} productos</p>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm font-medium text-neutral-300">Método de pago</p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: 'cash', label: 'Efectivo', icon: Banknote },
                    { id: 'card', label: 'Tarjeta', icon: CreditCard },
                    { id: 'transfer', label: 'Transfer.', icon: Smartphone },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setPaymentMethod(method.id as typeof paymentMethod);
                        if (method.id === 'cash') {
                          setTimeout(() => cashInputRef.current?.focus(), 100);
                        }
                      }}
                      className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      }`}
                    >
                      <method.icon
                        className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 ${
                          paymentMethod === method.id ? 'text-primary-500' : 'text-neutral-400'
                        }`}
                      />
                      <p
                        className={`text-[10px] sm:text-sm font-medium ${
                          paymentMethod === method.id ? 'text-primary-500' : 'text-neutral-300'
                        }`}
                      >
                        {method.label}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Cash Input */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-2">
                        Monto recibido
                      </label>
                      <input
                        ref={cashInputRef}
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 sm:py-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 text-xl sm:text-2xl text-center font-bold focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {[cartTotal, 5, 10, 20].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setCashReceived(amount.toString())}
                          className="py-2 sm:py-3 px-2 sm:px-4 bg-neutral-800 text-neutral-300 text-xs sm:text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                        >
                          {formatCurrency(amount)}
                        </button>
                      ))}
                    </div>
                    {parseFloat(cashReceived) >= cartTotal && (
                      <div className="bg-success/10 border border-success/30 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-neutral-300">Cambio a devolver</p>
                        <p className="text-2xl sm:text-3xl font-bold text-success">{formatCurrency(change)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleCompleteSale}
                  disabled={(paymentMethod === 'cash' && parseFloat(cashReceived) < cartTotal) || processing}
                  className="w-full py-3 sm:py-4 bg-primary-500 text-neutral-950 font-bold text-base sm:text-lg rounded-xl hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-4 sm:mt-6"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Venta
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discount Modal */}
      <AnimatePresence>
        {showDiscountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowDiscountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-50">Aplicar Descuento</h2>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiscountType('percent')}
                    className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium transition-colors ${
                      discountType === 'percent'
                        ? 'bg-primary-500 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    <Percent className="w-5 h-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => setDiscountType('fixed')}
                    className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium transition-colors ${
                      discountType === 'fixed'
                        ? 'bg-primary-500 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mx-auto" />
                  </button>
                </div>

                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'percent' ? '0 %' : '0.00'}
                  className="w-full px-4 py-3 sm:py-4 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-50 text-xl sm:text-2xl text-center font-bold focus:outline-none focus:border-primary-500"
                />

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {(discountType === 'percent' ? [5, 10, 15, 20] : [1, 2, 5, 10]).map((val) => (
                    <button
                      key={val}
                      onClick={() => setDiscount(val)}
                      className="py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors text-xs sm:text-sm font-medium"
                    >
                      {discountType === 'percent' ? `${val}%` : formatCurrency(val)}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 sm:gap-3 pt-2">
                  <button
                    onClick={() => {
                      setDiscount(0);
                      setShowDiscountModal(false);
                    }}
                    className="flex-1 py-2.5 sm:py-3 bg-neutral-800 text-neutral-300 font-medium rounded-lg hover:bg-neutral-700 transition-colors text-sm"
                  >
                    Quitar
                  </button>
                  <button
                    onClick={() => setShowDiscountModal(false)}
                    className="flex-1 py-2.5 sm:py-3 bg-primary-500 text-neutral-950 font-semibold rounded-lg hover:bg-primary-400 transition-colors text-sm"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hold Order Modal */}
      <AnimatePresence>
        {showHoldModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowHoldModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-50">Guardar en Espera</h2>
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-2">
                    Nombre de la orden
                  </label>
                  <input
                    type="text"
                    value={holdOrderName}
                    onChange={(e) => setHoldOrderName(e.target.value)}
                    placeholder="Ej: Mesa 5, Cliente Juan..."
                    className="w-full px-4 py-2.5 sm:py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-50 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="bg-neutral-800 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="text-neutral-400">Productos</span>
                    <span className="text-neutral-50">{cartItemsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400 text-sm">Total</span>
                    <span className="text-primary-500 font-bold">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleHoldOrder}
                  className="w-full py-2.5 sm:py-3 bg-warning text-neutral-950 font-semibold rounded-lg hover:bg-warning/90 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <PauseCircle className="w-5 h-5" />
                  Guardar en Espera
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Held Orders Modal */}
      <AnimatePresence>
        {showHeldOrdersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowHeldOrdersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-50">Órdenes en Espera</h2>
                <button
                  onClick={() => setShowHeldOrdersModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {heldOrders.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm sm:text-base">No hay órdenes en espera</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 overflow-y-auto flex-1">
                  {heldOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-neutral-800 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-sm sm:text-base text-neutral-50">{order.name}</h3>
                          <p className="text-[10px] sm:text-xs text-neutral-400">
                            {order.createdAt.toLocaleTimeString()} - {order.items.length} productos
                          </p>
                        </div>
                        <p className="text-primary-500 font-bold text-sm sm:text-base">{formatCurrency(order.subtotal)}</p>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-3">
                        <button
                          onClick={() => handleRetrieveOrder(order.id)}
                          className="flex-1 py-1.5 sm:py-2 bg-primary-500 text-neutral-950 font-medium rounded-lg hover:bg-primary-400 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Recuperar
                        </button>
                        <button
                          onClick={() => handleDeleteHeldOrder(order.id)}
                          className="py-1.5 sm:py-2 px-2.5 sm:px-3 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Stats Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowSessionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-50">Resumen del Día</h2>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-xl p-4 sm:p-6 text-center">
                  <p className="text-xs sm:text-sm text-neutral-300 mb-1">Total Vendido Hoy</p>
                  <p className="text-3xl sm:text-4xl font-bold text-primary-500">
                    {formatCurrency(sessionStats?.totalAmount || 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-2">
                    {sessionStats?.salesCount || 0} ventas
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-neutral-800 rounded-lg p-2.5 sm:p-4 text-center">
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-success mx-auto mb-1 sm:mb-2" />
                    <p className="text-[10px] sm:text-xs text-neutral-400">Efectivo</p>
                    <p className="text-xs sm:text-sm font-bold text-neutral-50">
                      {formatCurrency(sessionStats?.cashAmount || 0)}
                    </p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-2.5 sm:p-4 text-center">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                    <p className="text-[10px] sm:text-xs text-neutral-400">Tarjeta</p>
                    <p className="text-xs sm:text-sm font-bold text-neutral-50">
                      {formatCurrency(sessionStats?.cardAmount || 0)}
                    </p>
                  </div>
                  <div className="bg-neutral-800 rounded-lg p-2.5 sm:p-4 text-center">
                    <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1 sm:mb-2" />
                    <p className="text-[10px] sm:text-xs text-neutral-400">Transfer</p>
                    <p className="text-xs sm:text-sm font-bold text-neutral-50">
                      {formatCurrency(sessionStats?.transferAmount || 0)}
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Ticket Promedio</span>
                    <span className="text-neutral-50 font-medium">
                      {formatCurrency(sessionStats?.avgTicket || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calculator Modal */}
      <AnimatePresence>
        {showCalculatorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
            onClick={() => setShowCalculatorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-6 w-full max-w-xs"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-50">Calculadora</h2>
                <button
                  onClick={() => setShowCalculatorModal(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SimpleCalculator />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Receipt Modal */}
      <AnimatePresence>
        {showSuccessModal && lastReceiptData && businessSettings && receiptSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col"
            >
              <ReceiptTicket
                receiptData={lastReceiptData}
                businessSettings={businessSettings}
                receiptSettings={receiptSettings}
                onClose={() => setShowSuccessModal(false)}
                showActions={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple Calculator Component
function SimpleCalculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+': return prev + current;
      case '-': return prev - current;
      case '*': return prev * current;
      case '/': return current !== 0 ? prev / current : 0;
      default: return current;
    }
  };

  const equals = () => {
    if (previousValue === null || operation === null) return;
    const inputValue = parseFloat(display);
    const result = calculate(previousValue, inputValue, operation);
    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const buttons = [
    ['C', '/', '*', '-'],
    ['7', '8', '9', '+'],
    ['4', '5', '6', '='],
    ['1', '2', '3', '.'],
    ['0'],
  ];

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="bg-neutral-800 rounded-lg p-3 sm:p-4 text-right">
        <p className="text-xl sm:text-2xl font-mono text-neutral-50 truncate">{display}</p>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {buttons.flat().map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === 'C') clear();
              else if (btn === '=') equals();
              else if (btn === '.') inputDecimal();
              else if (['+', '-', '*', '/'].includes(btn)) performOperation(btn);
              else inputDigit(btn);
            }}
            className={`py-2.5 sm:py-3 rounded-lg font-medium text-base sm:text-lg transition-colors ${
              btn === '0' ? 'col-span-1' :
              btn === 'C' ? 'bg-error/20 text-error hover:bg-error/30' :
              btn === '=' ? 'row-span-2 bg-primary-500 text-neutral-950 hover:bg-primary-400' :
              ['+', '-', '*', '/'].includes(btn) ? 'bg-neutral-700 text-neutral-50 hover:bg-neutral-600' :
              'bg-neutral-800 text-neutral-50 hover:bg-neutral-700'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
