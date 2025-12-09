import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color?: string;
  prefix?: string;
  suffix?: string;
}

export function KPICard({ title, value, change, icon: Icon, color = '#22D3EE', prefix = '', suffix = '' }: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      whileHover={{ y: -4, borderColor: '#a3a3a3' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-neutral-900 rounded-lg border border-neutral-700 p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
              isPositive ? 'bg-success/20 text-success' : isNegative ? 'bg-error/20 text-error' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {isPositive ? <TrendingUp className="w-4 h-4" /> : isNegative ? <TrendingDown className="w-4 h-4" /> : null}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-neutral-300 text-sm mb-1">{title}</p>
      <p className="text-neutral-50 text-3xl font-bold">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
    </motion.div>
  );
}
