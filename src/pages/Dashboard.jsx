import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Package, Truck, ShoppingCart, Users, AlertCircle, TrendingUp, Calendar, 
  DollarSign, CreditCard, CheckCircle, Clock, Bell, TrendingDown, 
  RefreshCw, BarChart, Filter, Download, Eye, Zap, Battery, 
  ArrowUpRight, ArrowDownRight, Database, PieChart, Target, CheckSquare, FileCheck
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₱0.00';
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-PH');
};

const AlertBadge = ({ count, type = 'warning' }) => {
  if (!count || count === 0) return null;
  
  const colors = {
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[type]}`}>
      <AlertCircle size={12} className="mr-1" />
      {count} alert{count !== 1 ? 's' : ''}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      CONFIRMED: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: CheckSquare,
        label: 'Confirmed'
      },
      INVOICED: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: FileCheck,
        label: 'Invoiced'
      },
      PENDING: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: Clock,
        label: 'Pending'
      },
      CANCELLED: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        icon: AlertCircle,
        label: 'Cancelled'
      }
    };
    
    return configs[status] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      icon: Clock,
      label: status
    };
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingDeliveries: 0,
    lowStock: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0,
    deliveredOrders: 0,
    pendingPayments: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    confirmedSales: 0,
    confirmedRevenue: 0,
    invoicedSales: 0,
    invoicedRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [recentSales, setRecentSales] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    topProducts: [],
    topBranches: [],
  });

  // Status options for filter (removed PAID)
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'INVOICED', label: 'Invoiced' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  useEffect(() => {
    loadStats();
    loadAlerts();
  }, []);

  useEffect(() => {
    if (sales.length > 0) {
      loadPerformance();
    }
  }, [sales]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
  try {
    const alertsRes = await api.get('/alerts');
    // Ensure alerts is always an array
    const alertsData = alertsRes.success ? alertsRes.data || [] : [];
    setAlerts(Array.isArray(alertsData) ? alertsData : []);
  } catch (err) {
    console.error('Failed to load alerts', err);
    setAlerts([]);
  }
};

  const loadPerformance = () => {
    try {
      // Calculate top products (only CONFIRMED and INVOICED)
      const productPerformance = {};
      sales.forEach(sale => {
        if (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') {
          sale.items?.forEach(item => {
            const key = item.product?.id;
            if (!productPerformance[key]) {
              productPerformance[key] = {
                id: key,
                name: item.product?.productName || 'Unknown Product',
                revenue: 0,
                quantity: 0,
              };
            }
            productPerformance[key].revenue += item.amount || 0;
            productPerformance[key].quantity += item.quantity || 0;
          });
        }
      });

      const topProducts = Object.values(productPerformance)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate branch performance (only CONFIRMED and INVOICED)
      const branchPerformance = {};
      sales.forEach(sale => {
        if (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') {
          const key = sale.branch?.id;
          if (!branchPerformance[key]) {
            branchPerformance[key] = {
              id: key,
              name: sale.branch?.branchName || 'Unknown Branch',
              revenue: 0,
              salesCount: 0,
            };
          }
          branchPerformance[key].revenue += sale.totalAmount || 0;
          branchPerformance[key].salesCount += 1;
        }
      });

      const topBranches = Object.values(branchPerformance)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setPerformanceData({ topProducts, topBranches });
    } catch (err) {
      console.error('Failed to load performance data', err);
    }
  };

  const loadStats = async () => {
  try {
    const [salesRes, deliveriesRes, productsRes, clientsRes, branchesRes] = await Promise.all([
      api.get('/sales'),
      api.get('/deliveries'),
      api.get('/products'),
      api.get('/clients'),
      api.get('/branches'),
    ]);

    // Access the data property from each response
    const salesData = salesRes.success ? salesRes.data || [] : [];
    const deliveriesData = deliveriesRes.success ? deliveriesRes.data || [] : [];
    const productsData = productsRes.success ? productsRes.data || [] : [];
    const clientsData = clientsRes.success ? clientsRes.data || [] : [];
    const branchesData = branchesRes.success ? branchesRes.data || [] : [];

    console.log('📊 Dashboard Data Loaded:');
    console.log('Total Sales:', salesData.length);
    console.log('Sales by Status:', 
      salesData.reduce((acc, sale) => {
        acc[sale.status] = (acc[sale.status] || 0) + 1;
        return acc;
      }, {})
    );

    setSales(salesData);
    setClients(clientsData);
    setBranches(branchesData);
    setProducts(productsData);
    setDeliveries(deliveriesData);

    // Get recent sales (last 10)
    const sortedSales = [...salesData]
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 10);
    setRecentSales(sortedSales);

    // Calculate metrics
    const pendingDeliveries = deliveriesData.filter(d => d.status === 'PENDING').length;
    const deliveredOrders = deliveriesData.filter(d => d.status === 'DELIVERED').length;
    
    // Separate sales by status (CONFIRMED and INVOICED only - PAID merged into INVOICED)
    const confirmedSales = salesData.filter(s => s.status === 'CONFIRMED');
    const invoicedSales = salesData.filter(s => s.status === 'INVOICED');
    const pendingSales = salesData.filter(s => s.status === 'PENDING');
    
    // Calculate revenues
    const confirmedRevenue = confirmedSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const invoicedRevenue = invoicedSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    
    // Use CONFIRMED + INVOICED for dashboard metrics
    const monthlyRevenue = confirmedRevenue + invoicedRevenue;
    
    // Calculate average order value based on confirmed + invoiced sales
    const totalActiveSales = confirmedSales.length + invoicedSales.length;
    const averageOrderValue = totalActiveSales > 0 
      ? (confirmedRevenue + invoicedRevenue) / totalActiveSales 
      : 0;

    // Calculate pending payments (CONFIRMED + INVOICED)
    const pendingPayments = confirmedSales.length + invoicedSales.length;
    
    // Calculate conversion rate
    const totalLeads = clientsData.length * 2;
    const conversionRate = salesData.length > 0 
      ? (salesData.length / totalLeads * 100) 
      : 0;

    // Calculate revenue growth (this month vs last month)
    const currentMonth = new Date().getMonth();
    const thisMonthSales = salesData.filter(s => {
      const saleDate = new Date(s.createdAt || s.date);
      return saleDate.getMonth() === currentMonth && 
             (s.status === 'CONFIRMED' || s.status === 'INVOICED');
    });
    const prevMonthSales = salesData.filter(s => {
      const saleDate = new Date(s.createdAt || s.date);
      return saleDate.getMonth() === (currentMonth - 1 + 12) % 12 && 
             (s.status === 'CONFIRMED' || s.status === 'INVOICED');
    });
    const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const prevMonthRevenue = prevMonthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const revenueGrowth = prevMonthRevenue > 0 
      ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100) 
      : thisMonthRevenue > 0 ? 100 : 0;

    setStats({
      totalSales: salesData.length,
      pendingDeliveries,
      lowStock: productsData.filter(p => p.quantity < 10).length,
      totalClients: clientsData.length,
      monthlyRevenue,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      deliveredOrders,
      pendingPayments,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
      confirmedSales: confirmedSales.length,
      confirmedRevenue,
      invoicedSales: invoicedSales.length,
      invoicedRevenue,
    });
  } catch (err) {
    console.error('Failed to load dashboard data', err);
    alert('Failed to load dashboard data: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  const getMonthlySalesData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => ({
      month,
      monthNumber: index + 1,
      activeRevenue: 0, // Combined CONFIRMED + INVOICED
      count: 0
    }));

    const filteredSales = sales.filter(sale => {
      const yearMatch = sale.year === selectedYear;
      const clientMatch = selectedClient === 'all' || sale.client?.clientName === selectedClient;
      const branchMatch = selectedBranch === 'all' || sale.branch?.branchName === selectedBranch;
      const statusMatch = selectedStatus === 'all' || sale.status === selectedStatus;
      
      // Include only active statuses (CONFIRMED and INVOICED)
      const isActiveSale = sale.status === 'CONFIRMED' || sale.status === 'INVOICED';
      return yearMatch && clientMatch && branchMatch && statusMatch && isActiveSale;
    });

    filteredSales.forEach(sale => {
      const monthIndex = sale.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        const amount = sale.totalAmount || 0;
        monthlyData[monthIndex].count += 1;
        monthlyData[monthIndex].activeRevenue += amount;
      }
    });

    return monthlyData;
  };

  const getSalesByStatus = () => {
    const statusCounts = sales.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {});

    const statusRevenue = sales.reduce((acc, sale) => {
      const amount = sale.totalAmount || 0;
      acc[sale.status] = (acc[sale.status] || 0) + amount;
      return acc;
    }, {});

    return {
      counts: statusCounts,
      revenues: statusRevenue
    };
  };

  const getSalesPerformance = () => {
    const filteredSales = sales.filter(sale => {
      const yearMatch = sale.year === selectedYear;
      const clientMatch = selectedClient === 'all' || sale.client?.clientName === selectedClient;
      const branchMatch = selectedBranch === 'all' || sale.branch?.branchName === selectedBranch;
      const statusMatch = selectedStatus === 'all' || sale.status === selectedStatus;
      const isActiveSale = sale.status === 'CONFIRMED' || sale.status === 'INVOICED';
      return yearMatch && clientMatch && branchMatch && statusMatch && isActiveSale;
    });

    if (filteredSales.length === 0) return null;

    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const avgOrderValue = totalRevenue / filteredSales.length;
    
    // Find best performing month
    const monthlyData = getMonthlySalesData();
    const bestMonth = monthlyData.reduce((best, current) => 
      current.activeRevenue > best.activeRevenue ? current : best
    );

    // Calculate status distribution
    const statusDistribution = getSalesByStatus();

    return {
      bestMonth,
      avgOrderValue,
      totalOrders: filteredSales.length,
      statusDistribution,
    };
  };

  const totalAlerts = alerts.length;

  const cards = [
    { 
      title: 'Total Sales', 
      value: stats.totalSales, 
      icon: ShoppingCart, 
      color: 'blue',
      description: 'All time',
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
      title: 'Total Revenue', 
      value: formatCurrency(stats.monthlyRevenue), 
      icon: DollarSign, 
      color: 'green',
      description: `Growth: ${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`,
      trend: stats.revenueGrowth
    },
    { 
      title: 'Avg. Order Value', 
      value: formatCurrency(stats.averageOrderValue), 
      icon: CreditCard, 
      color: 'purple',
      description: 'Active orders (Confirmed + Invoiced)'
    },
    { 
      title: 'Pending Deliveries', 
      value: formatNumber(stats.pendingDeliveries), 
      icon: Truck, 
      color: 'orange',
      description: `${stats.deliveredOrders} delivered`
    },
    { 
      title: 'Conversion Rate', 
      value: `${stats.conversionRate}%`, 
      icon: Target, 
      color: 'blue',
      description: 'Leads to confirmed sales'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Loading Dashboard...</div>
      </div>
    );
  }

  const monthlySalesData = getMonthlySalesData();
  const salesByStatus = getSalesByStatus();
  const availableYears = [...new Set(sales.map(s => s.year))].sort((a, b) => b - a);

  // Chart.js data configurations - Single line for active revenue (Confirmed + Invoiced)
  const monthlyChartData = {
    labels: monthlySalesData.map(d => d.month),
    datasets: [
      {
        label: 'Active Revenue (Confirmed + Invoiced)',
        data: monthlySalesData.map(d => d.activeRevenue),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  // Status distribution chart data (removed PAID status)
  const statusChartData = {
    labels: Object.keys(salesByStatus.counts).filter(status => status !== 'PAID'),
    datasets: [
      {
        label: 'Sales Count',
        data: Object.keys(salesByStatus.counts)
          .filter(status => status !== 'PAID')
          .map(status => salesByStatus.counts[status]),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // CONFIRMED - green
          'rgba(59, 130, 246, 0.8)',  // INVOICED - blue
          'rgba(245, 158, 11, 0.8)',  // PENDING - yellow
          'rgba(239, 68, 68, 0.8)',   // CANCELLED - red
        ],
        borderColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444',
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: '#6b7280',
          callback: function(value) {
            if (value >= 1000000) {
              return '₱' + (value / 1000000).toFixed(1) + 'M';
            }
            if (value >= 1000) {
              return '₱' + (value / 1000).toFixed(0) + 'K';
            }
            return '₱' + value.toFixed(0);
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: '#6b7280',
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const revenue = salesByStatus.revenues[context.label] || 0;
            return `${label}: ${value} sales (${formatCurrency(revenue)})`;
          }
        }
      }
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Status Dashboard</h1>
            <p className="text-gray-600 mt-2">Tracking sales from Confirmed → Invoiced (PAID merged into Invoiced)</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => loadStats()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
              Refresh Data
            </button>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Bell size={18} />
              Alerts
              {totalAlerts > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {totalAlerts}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            const bgColor = {
              blue: 'bg-blue-500',
              yellow: 'bg-yellow-500',
              red: 'bg-red-500',
              green: 'bg-green-500',
              orange: 'bg-orange-500',
              purple: 'bg-purple-500',
            }[card.color];

            const trendIcon = card.trend > 0 ? 
              <ArrowUpRight className="text-green-500" size={16} /> : 
              <ArrowDownRight className="text-red-500" size={16} />;

            return (
              <div key={i} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-5 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                      {card.trend && (
                        <div className="flex items-center gap-1">
                          {trendIcon}
                          <span className={`text-xs font-medium ${card.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(card.trend)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      {card.badge}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">{card.description}</p>
                    </div>
                  </div>
                  <div className={`ml-4 p-3 rounded-xl ${bgColor} bg-opacity-10`}>
                    <Icon size={24} className={`text-${card.color}-600`} />
                  </div>
                </div>
                <div className={`mt-4 h-1 rounded-full ${bgColor} bg-opacity-20`}>
                  <div className={`h-full rounded-full ${bgColor}`} style={{ width: '100%' }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="text-green-600" size={20} />
              Top Performing Products
            </h3>
            <div className="space-y-3">
              {performanceData.topProducts.length > 0 ? (
                performanceData.topProducts.map((product, idx) => (
                  <div key={product.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Package size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No product data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Branches */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              Top Performing Branches
            </h3>
            <div className="space-y-3">
              {performanceData.topBranches.length > 0 ? (
                performanceData.topBranches.map((branch, idx) => (
                  <div key={branch.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{branch.name}</p>
                        <p className="text-xs text-gray-500">{branch.salesCount} sales</p>
                      </div>
                    </div>
                    <p className="font-bold text-blue-600">{formatCurrency(branch.revenue)}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Truck size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No branch data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="text-blue-600" size={20} />
              <span className="text-sm font-semibold text-gray-700">Filter Sales Data</span>
            </div>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
            >
              {availableYears.length > 0 ? (
                availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              )}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.clientName}>{client.clientName}</option>
              ))}
            </select>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.branchName}>{branch.branchName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={20} />
                  Sales Status Progression ({selectedYear})
                </h3>
                <p className="text-sm text-gray-500 mt-1">Active revenue (Confirmed + Invoiced)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Active Revenue</span>
                </div>
              </div>
            </div>
            {monthlySalesData.some(d => d.activeRevenue > 0) ? (
              <div style={{ height: '350px' }}>
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <TrendingUp size={48} className="mb-4 opacity-50" />
                <p className="text-lg">No sales data available for selected filters</p>
                <p className="text-sm mt-2">Try selecting different filters</p>
              </div>
            )}
          </div>

          {/* Status Distribution & Recent Sales */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="text-blue-600" size={20} />
                Sales Status Distribution
              </h3>
              {Object.keys(salesByStatus.counts).filter(status => status !== 'PAID').length > 0 ? (
                <div style={{ height: '300px' }}>
                  <Bar data={statusChartData} options={statusChartOptions} />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  <Database size={32} className="opacity-50" />
                  <span className="ml-3">No sales data</span>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {Object.entries(salesByStatus.revenues)
                  .filter(([status]) => status !== 'PAID')
                  .map(([status, revenue]) => (
                  <div key={status} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <StatusBadge status={status} />
                      <span className="font-semibold text-gray-900">{formatCurrency(revenue)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {salesByStatus.counts[status]} sales
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="text-gray-600" size={20} />
                  Recent Sales Activity
                </h3>
                <span className="text-sm text-gray-500">
                  {sales.length} total sales
                </span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentSales.length > 0 ? (
                  recentSales.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {sale.client?.clientName || 'Unknown Client'}
                          </p>
                          <StatusBadge status={sale.status || 'PENDING'} />
                        </div>
                        <p className="text-xs text-gray-500">
                          {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'No date'}
                          {sale.branch?.branchName && ` • ${sale.branch.branchName}`}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900">{formatCurrency(sale.totalAmount || 0)}</p>
                        <p className="text-xs text-gray-500">
                          {sale.products?.length || sale.items?.length || 0} item{(sale.products?.length || sale.items?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart size={32} className="mx-auto mb-3 opacity-50" />
                    <p>No recent sales</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Active Alerts</h2>
                    <p className="text-blue-100 mt-1">Real-time system notifications</p>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)} 
                    className="text-white hover:text-gray-200 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto text-green-500" size={48} />
                    <h3 className="text-xl font-semibold text-gray-900 mt-4">No Active Alerts</h3>
                    <p className="text-gray-600 mt-2">All systems operating normally</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert, index) => (
                      <div key={alert.id || index} className={`border rounded-lg p-4 ${
                        alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-300' :
                        alert.severity === 'HIGH' ? 'bg-orange-50 border-orange-300' :
                        alert.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-300' :
                        'bg-blue-50 border-blue-300'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                                alert.severity === 'HIGH' ? 'bg-orange-600 text-white' :
                                alert.severity === 'MEDIUM' ? 'bg-yellow-600 text-white' :
                                'bg-blue-600 text-white'
                              }`}>
                                {alert.severity || 'INFO'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {alert.alertType ? alert.alertType.replace('_', ' ') : 'Alert'}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900">{alert.title || 'Untitled Alert'}</h4>
                            <p className="text-sm text-gray-700 mt-1">{alert.message || 'No message provided'}</p>
                            {alert.branch && (
                              <p className="text-xs text-gray-500 mt-2">
                                Branch: {alert.branch.branchName}
                              </p>
                            )}
                            {alert.product && (
                              <p className="text-xs text-gray-500">
                                Product: {alert.product.productName}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              if (alert.id) {
                                api.put(`/alerts/${alert.id}/resolve`, { resolvedBy: 'User' })
                                  .then(() => loadAlerts());
                              }
                            }}
                            className="ml-4 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t p-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
                  </span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;