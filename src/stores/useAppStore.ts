import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Product {
  id: string;
  name: string;
  barcode: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  image?: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  date: string;
  cashierId: string;
}

export interface Supplier {
  id: string;
  name: string;
  ruc: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
}

export interface Purchase {
  id: string;
  supplierId: string;
  items: { productId: string; quantity: number; cost: number }[];
  total: number;
  date: string;
  status: 'pending' | 'received' | 'cancelled';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
  avatar?: string;
  active: boolean;
}

export interface CashRegister {
  id: string;
  openingAmount: number;
  closingAmount?: number;
  openedAt: string;
  closedAt?: string;
  cashierId: string;
  sales: Sale[];
  status: 'open' | 'closed';
}

interface AppState {
  // UI State
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Products & Categories
  products: Product[];
  categories: Category[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Cart (POS)
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Sales
  sales: Sale[];
  addSale: (sale: Sale) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Purchases
  purchases: Purchase[];
  addPurchase: (purchase: Purchase) => void;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => void;

  // Cash Register
  cashRegister: CashRegister | null;
  openCashRegister: (amount: number) => void;
  closeCashRegister: (amount: number) => void;

  // Users
  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

// Mock Data
const mockCategories: Category[] = [
  { id: '1', name: 'Bebidas', color: '#22D3EE', icon: 'coffee' },
  { id: '2', name: 'Snacks', color: '#FBBF24', icon: 'cookie' },
  { id: '3', name: 'Lácteos', color: '#4ADE80', icon: 'milk' },
  { id: '4', name: 'Panadería', color: '#F87171', icon: 'croissant' },
  { id: '5', name: 'Dulces', color: '#A78BFA', icon: 'candy' },
  { id: '6', name: 'Limpieza', color: '#FB923C', icon: 'spray-can' },
];

const mockProducts: Product[] = [
  { id: '1', name: 'Coca Cola 500ml', barcode: '7891234567890', categoryId: '1', price: 2.50, cost: 1.80, stock: 48, minStock: 12, active: true },
  { id: '2', name: 'Pepsi 500ml', barcode: '7891234567891', categoryId: '1', price: 2.30, cost: 1.60, stock: 36, minStock: 12, active: true },
  { id: '3', name: 'Agua Mineral 600ml', barcode: '7891234567892', categoryId: '1', price: 1.50, cost: 0.80, stock: 60, minStock: 24, active: true },
  { id: '4', name: 'Doritos 150g', barcode: '7891234567893', categoryId: '2', price: 3.50, cost: 2.50, stock: 24, minStock: 10, active: true },
  { id: '5', name: 'Lays Clásicas 150g', barcode: '7891234567894', categoryId: '2', price: 3.20, cost: 2.30, stock: 20, minStock: 10, active: true },
  { id: '6', name: 'Leche Entera 1L', barcode: '7891234567895', categoryId: '3', price: 1.80, cost: 1.20, stock: 30, minStock: 15, active: true },
  { id: '7', name: 'Yogurt Natural 1L', barcode: '7891234567896', categoryId: '3', price: 2.80, cost: 2.00, stock: 18, minStock: 8, active: true },
  { id: '8', name: 'Pan de Molde', barcode: '7891234567897', categoryId: '4', price: 2.20, cost: 1.50, stock: 15, minStock: 5, active: true },
  { id: '9', name: 'Croissant', barcode: '7891234567898', categoryId: '4', price: 1.50, cost: 0.90, stock: 20, minStock: 8, active: true },
  { id: '10', name: 'Chocolate Snickers', barcode: '7891234567899', categoryId: '5', price: 1.80, cost: 1.20, stock: 40, minStock: 15, active: true },
  { id: '11', name: 'Gomitas Haribo 100g', barcode: '7891234567800', categoryId: '5', price: 2.00, cost: 1.30, stock: 35, minStock: 12, active: true },
  { id: '12', name: 'Detergente 1L', barcode: '7891234567801', categoryId: '6', price: 4.50, cost: 3.20, stock: 12, minStock: 5, active: true },
];

const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Distribuidora Central', ruc: '20123456789', phone: '+51 999 888 777', email: 'ventas@central.com', address: 'Av. Industrial 123', active: true },
  { id: '2', name: 'Bebidas del Norte', ruc: '20987654321', phone: '+51 988 777 666', email: 'pedidos@bebidasnorte.com', address: 'Jr. Comercio 456', active: true },
  { id: '3', name: 'Lácteos Premium', ruc: '20456789123', phone: '+51 977 666 555', email: 'info@lacteospremium.com', address: 'Calle Lechera 789', active: true },
];

const mockUsers: User[] = [
  { id: '1', name: 'Admin Principal', email: 'admin@kiosko.com', role: 'admin', active: true },
  { id: '2', name: 'María García', email: 'maria@kiosko.com', role: 'cashier', active: true },
  { id: '3', name: 'Carlos López', email: 'carlos@kiosko.com', role: 'manager', active: true },
];

const mockSales: Sale[] = [
  { id: '1', items: [{ product: mockProducts[0], quantity: 2 }, { product: mockProducts[3], quantity: 1 }], total: 8.50, paymentMethod: 'cash', date: '2024-12-09T10:30:00', cashierId: '2' },
  { id: '2', items: [{ product: mockProducts[5], quantity: 3 }], total: 5.40, paymentMethod: 'card', date: '2024-12-09T11:15:00', cashierId: '2' },
  { id: '3', items: [{ product: mockProducts[9], quantity: 4 }, { product: mockProducts[2], quantity: 2 }], total: 10.20, paymentMethod: 'cash', date: '2024-12-09T12:00:00', cashierId: '2' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // UI State
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Auth
      currentUser: mockUsers[0],
      setCurrentUser: (user) => set({ currentUser: user }),

      // Products & Categories
      products: mockProducts,
      categories: mockCategories,
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, product) => set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      })),
      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, category) => set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      })),

      // Cart
      cart: [],
      addToCart: (product) => set((state) => {
        const existingItem = state.cart.find((item) => item.product.id === product.id);
        if (existingItem) {
          return {
            cart: state.cart.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        return { cart: [...state.cart, { product, quantity: 1 }] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.product.id !== productId),
      })),
      updateCartQuantity: (productId, quantity) => set((state) => ({
        cart: quantity <= 0
          ? state.cart.filter((item) => item.product.id !== productId)
          : state.cart.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
      })),
      clearCart: () => set({ cart: [] }),

      // Sales
      sales: mockSales,
      addSale: (sale) => set((state) => ({ sales: [...state.sales, sale] })),

      // Suppliers
      suppliers: mockSuppliers,
      addSupplier: (supplier) => set((state) => ({ suppliers: [...state.suppliers, supplier] })),
      updateSupplier: (id, supplier) => set((state) => ({
        suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...supplier } : s)),
      })),
      deleteSupplier: (id) => set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
      })),

      // Purchases
      purchases: [],
      addPurchase: (purchase) => set((state) => ({ purchases: [...state.purchases, purchase] })),
      updatePurchase: (id, purchase) => set((state) => ({
        purchases: state.purchases.map((p) => (p.id === id ? { ...p, ...purchase } : p)),
      })),

      // Cash Register
      cashRegister: null,
      openCashRegister: (amount) => set({
        cashRegister: {
          id: Date.now().toString(),
          openingAmount: amount,
          openedAt: new Date().toISOString(),
          cashierId: get().currentUser?.id || '',
          sales: [],
          status: 'open',
        },
      }),
      closeCashRegister: (amount) => set((state) => ({
        cashRegister: state.cashRegister
          ? { ...state.cashRegister, closingAmount: amount, closedAt: new Date().toISOString(), status: 'closed' }
          : null,
      })),

      // Users
      users: mockUsers,
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (id, user) => set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...user } : u)),
      })),
      deleteUser: (id) => set((state) => ({
        users: state.users.filter((u) => u.id !== id),
      })),
    }),
    {
      name: 'kiosk-storage',
    }
  )
);
