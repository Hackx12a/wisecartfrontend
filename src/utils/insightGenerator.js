import { TrendingUp as TrendingUpIcon, Package, AlertTriangle, Clock } from 'lucide-react';
import { formatCurrency } from './formatUtils';

export const generateInsights = (sales, performanceData) => {
  const insights = [];
  const now = new Date();
  
  // High sales velocity insight
  const last7DaysSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt || sale.date);
    const daysDiff = (now - saleDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7 && (sale.status === 'CONFIRMED' || sale.status === 'INVOICED');
  });

  const salesPerDay = last7DaysSales.length / 7;
  if (salesPerDay > 5) {
    insights.push({
      type: 'positive',
      title: 'High Sales Velocity',
      message: `Averaging ${salesPerDay.toFixed(1)} sales per day last week`,
      icon: TrendingUpIcon,
    });
  }

  // Best selling product
  const topProduct = performanceData.topProducts[0];
  if (topProduct && topProduct.revenue > 10000) {
    insights.push({
      type: 'info',
      title: 'Best Selling Product',
      message: `${topProduct.name} generated ${formatCurrency(topProduct.revenue)}`,
      icon: Package,
    });
  }

  // Branch performance gap
  if (performanceData.topBranches.length > 0) {
    const bestBranch = performanceData.topBranches[0];
    const worstBranch = performanceData.topBranches[performanceData.topBranches.length - 1];

    if (bestBranch && worstBranch && bestBranch.revenue > worstBranch.revenue * 3) {
      insights.push({
        type: 'warning',
        title: 'Branch Performance Gap',
        message: `${bestBranch.name} is outperforming ${worstBranch.name} by ${formatCurrency(bestBranch.revenue - worstBranch.revenue)}`,
        icon: AlertTriangle,
      });
    }
  }

  // Morning vs afternoon sales
  const morningSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt || sale.date);
    return saleDate.getHours() < 12;
  }).length;

  const afternoonSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt || sale.date);
    return saleDate.getHours() >= 12;
  }).length;

  if (morningSales > afternoonSales * 1.5) {
    insights.push({
      type: 'info',
      title: 'Morning Sales Peak',
      message: `${morningSales} sales in AM vs ${afternoonSales} in PM`,
      icon: Clock,
    });
  }

  return insights;
};