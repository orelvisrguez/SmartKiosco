import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/stores/useAppStore';
import { Toaster } from 'react-hot-toast';

export function MainLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-neutral-950">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#171717',
            color: '#fafafa',
            border: '1px solid #404040',
          },
          success: {
            iconTheme: {
              primary: '#4ADE80',
              secondary: '#171717',
            },
          },
          error: {
            iconTheme: {
              primary: '#F87171',
              secondary: '#171717',
            },
          },
        }}
      />
      <Sidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 72 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        <div className="p-6 max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
