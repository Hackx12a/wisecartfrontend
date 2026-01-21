import React, { useMemo } from 'react';
import { ShoppingCart, Bell, PesoSign, CreditCard, TrendingUpIcon } from 'lucide-react';
import StatCard from './StatCard';
import { AlertBadge } from '../alerts/AlertBadge';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const StatCards = ({ stats, totalAlerts }) => {
  const cards = useMemo(() => [
    {
      title: 'Active Sales',
      value: formatNumber(stats.activeSales),
      icon: ShoppingCart,
      color: 'green',
      description: `Total: ${formatNumber(stats.totalSales)} sales`,
      trend: stats.salesVelocity,
      trendLabel: 'sales/day'
    },
    {
      title: 'Active Alerts',
      value: totalAlerts,
      icon: Bell,
      color: totalAlerts > 0 ? 'red' : 'green',
      description: totalAlerts > 0 ? 'Requires attention' : 'All good',
      badge: totalAlerts > 0 ? <AlertBadge count={totalAlerts} type="danger" /> : null
    },
    {
      title: 'Active Sales',
      value: formatCurrency(stats.activeRevenue),
      icon: PesoSign,
      color: 'blue',
      description: `Growth: ${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`,
      trend: stats.revenueGrowth
    },
    {
      title: 'Avg. Order Value',
      value: formatCurrency(stats.averageOrderValue),
      icon: CreditCard,
      color: 'purple',
      description: 'Based on active sales'
    },
    {
      title: 'Sales Velocity',
      value: `${stats.salesVelocity.toFixed(1)}/day`,
      icon: TrendingUpIcon,
      color: 'green',
      description: 'Last 30 days average'
    },
  ], [stats, totalAlerts]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <StatCard key={i} card={card} />
      ))}
    </div>
  );
};

export default StatCards;