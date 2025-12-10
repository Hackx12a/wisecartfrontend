import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Package, Truck, ShoppingCart, Users, AlertCircle, TrendingUp, Calendar, 
  DollarSign, CreditCard, CheckCircle, Clock, Bell, TrendingDown, 
  RefreshCw, BarChart, Filter, Download, Eye, Zap, Battery, 
  ArrowUpRight, ArrowDownRight, Database, PieChart, Target, CheckSquare, FileCheck,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  AlertTriangle, Info, CheckCheck, Building, User as UserIcon, Layers, BarChart2
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
      ACTIVE: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: CheckCheck,
        label: 'Active'
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
    activeSales: 0,
    activeRevenue: 0,
    pendingDeliveries: 0,
    lowStock: 0,
    totalClients: 0,
    averageOrderValue: 0,
    deliveredOrders: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    topProduct: null,
    salesVelocity: 0,
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
  const [showInsights, setShowInsights] = useState(false);
  const [businessInsights, setBusinessInsights] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
  const [productChartType, setProductChartType] = useState('monthly');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [availableBranches, setAvailableBranches] = useState([]);

  // Simplified status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active (Confirmed/Invoiced)' },
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
      generateInsights();
      // Load product sales data
      const productAnalysis = getProductSalesAnalysis();
      setProductSalesData(productAnalysis);
      if (productAnalysis.length > 0 && !selectedProductId) {
        setSelectedProductId(productAnalysis[0].id);
      }
    }
  }, [sales]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
    }, 300000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
  if (selectedClient === 'all') {
    setAvailableBranches(branches);
    setSelectedBranch('all');
  } else {
    // Get branches that have sales for the selected client
    const clientBranches = [...new Set(
      sales
        .filter(s => s.client?.clientName === selectedClient)
        .map(s => s.branch?.branchName)
        .filter(Boolean)
    )];
    
    const filteredBranches = branches.filter(b => 
      clientBranches.includes(b.branchName)
    );
    
    setAvailableBranches(filteredBranches);
    setSelectedBranch('all');
  }
}, [selectedClient, branches, sales]);


  const loadAlerts = async () => {
    try {
      const alertsRes = await api.get('/alerts');
      const alertsData = alertsRes.success ? alertsRes.data || [] : [];
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (err) {
      console.error('Failed to load alerts', err);
      setAlerts([]);
    }
  };

  const loadPerformance = () => {
    try {
      // Calculate top products (only ACTIVE sales)
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
                margin: item.product?.margin || 0,
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

      // Calculate branch performance (only ACTIVE sales)
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
              averageOrderValue: 0,
            };
          }
          branchPerformance[key].revenue += sale.totalAmount || 0;
          branchPerformance[key].salesCount += 1;
          branchPerformance[key].averageOrderValue = 
            branchPerformance[key].revenue / branchPerformance[key].salesCount;
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

  const getProductSalesAnalysis = () => {
    const productAnalysis = {};
    
    sales.forEach(sale => {
      if (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') {
        sale.items?.forEach(item => {
          const productId = item.product?.id;
          const productName = item.product?.productName || 'Unknown Product';
          const branchName = sale.branch?.branchName || 'Unknown Branch';
          const clientName = sale.client?.clientName || 'Unknown Client';
          const saleDate = new Date(sale.createdAt || sale.date);
          const month = saleDate.toLocaleString('default', { month: 'short' });
          const year = saleDate.getFullYear();
          const monthYear = `${month} ${year}`;
          
          if (!productAnalysis[productId]) {
            productAnalysis[productId] = {
              id: productId,
              name: productName,
              totalRevenue: 0,
              totalQuantity: 0,
              byMonth: {},
              byBranch: {},
              byClient: {},
              salesCount: 0
            };
          }
          
          const product = productAnalysis[productId];
          product.totalRevenue += item.amount || 0;
          product.totalQuantity += item.quantity || 0;
          product.salesCount += 1;
          
          // Monthly analysis
          if (!product.byMonth[monthYear]) {
            product.byMonth[monthYear] = {
              revenue: 0,
              quantity: 0,
              count: 0
            };
          }
          product.byMonth[monthYear].revenue += item.amount || 0;
          product.byMonth[monthYear].quantity += item.quantity || 0;
          product.byMonth[monthYear].count += 1;
          
          // Branch analysis
          if (!product.byBranch[branchName]) {
            product.byBranch[branchName] = {
              revenue: 0,
              quantity: 0,
              count: 0
            };
          }
          product.byBranch[branchName].revenue += item.amount || 0;
          product.byBranch[branchName].quantity += item.quantity || 0;
          product.byBranch[branchName].count += 1;
          
          // Client analysis
          if (!product.byClient[clientName]) {
            product.byClient[clientName] = {
              revenue: 0,
              quantity: 0,
              count: 0
            };
          }
          product.byClient[clientName].revenue += item.amount || 0;
          product.byClient[clientName].quantity += item.quantity || 0;
          product.byClient[clientName].count += 1;
        });
      }
    });
    
    return Object.values(productAnalysis)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  };

  const getProductChartData = (productId, chartType) => {
    const product = productSalesData.find(p => p.id === productId);
    if (!product) return null;
    
    let labels = [];
    let revenueData = [];
    let quantityData = [];
    
    if (chartType === 'monthly') {
      // Sort months chronologically
      const sortedMonths = Object.keys(product.byMonth).sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA - dateB;
      });
      
      labels = sortedMonths;
      revenueData = sortedMonths.map(month => product.byMonth[month].revenue);
      quantityData = sortedMonths.map(month => product.byMonth[month].quantity);
    } else if (chartType === 'branch') {
      labels = Object.keys(product.byBranch).sort((a, b) => 
        product.byBranch[b].revenue - product.byBranch[a].revenue
      ).reverse();
      revenueData = labels.map(branch => product.byBranch[branch].revenue);
      quantityData = labels.map(branch => product.byBranch[branch].quantity);
    } else if (chartType === 'client') {
      labels = Object.keys(product.byClient).sort((a, b) => 
        product.byClient[b].revenue - product.byClient[a].revenue
      ).reverse().slice(0, 10); // Top 10 clients
      revenueData = labels.map(client => product.byClient[client].revenue);
      quantityData = labels.map(client => product.byClient[client].quantity);
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Quantity Sold',
          data: quantityData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10B981',
          borderWidth: 2,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const generateInsights = () => {
    const insights = [];
    const now = new Date();
    
    // 1. Sales velocity insight
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

    // 2. Top product insight
    const topProduct = performanceData.topProducts[0];
    if (topProduct && topProduct.revenue > 10000) {
      insights.push({
        type: 'info',
        title: 'Best Selling Product',
        message: `${topProduct.name} generated ${formatCurrency(topProduct.revenue)}`,
        icon: Package,
      });
    }

    // 3. Branch performance insight
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

    // 4. Time-based insight (morning/afternoon sales)
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

    setBusinessInsights(insights);
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

      const salesData = salesRes.success ? salesRes.data || [] : [];
      const deliveriesData = deliveriesRes.success ? deliveriesRes.data || [] : [];
      const productsData = productsRes.success ? productsRes.data || [] : [];
      const clientsData = clientsRes.success ? clientsRes.data || [] : [];
      const branchesData = branchesRes.success ? branchesRes.data || [] : [];

      console.log('📊 Dashboard Data Loaded:');
      console.log('Total Sales:', salesData.length);
      console.log('Sales Data Sample:', salesData.slice(0, 3));

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

      // Calculate metrics - Treat CONFIRMED and INVOICED as ACTIVE
      const activeSales = salesData.filter(s => 
        s.status === 'CONFIRMED' || s.status === 'INVOICED'
      );
      const pendingDeliveries = deliveriesData.filter(d => d.status === 'PENDING').length;
      const deliveredOrders = deliveriesData.filter(d => d.status === 'DELIVERED').length;
      
      // Calculate active revenue
      const activeRevenue = activeSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      
      // Calculate average order value
      const averageOrderValue = activeSales.length > 0 
        ? activeRevenue / activeSales.length 
        : 0;

      // Calculate conversion rate
      const totalLeads = clientsData.length * 2;
      const conversionRate = salesData.length > 0 
        ? (activeSales.length / totalLeads * 100) 
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

      // Calculate sales velocity (sales per day in last 30 days)
      const last30Days = salesData.filter(s => {
        const saleDate = new Date(s.createdAt || s.date);
        const daysDiff = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30 && (s.status === 'CONFIRMED' || s.status === 'INVOICED');
      });
      const salesVelocity = last30Days.length / 30;

      // Find top product
      const productAnalysis = getProductSalesAnalysis();
      setProductSalesData(productAnalysis);
      
      let topProduct = null;
      if (productAnalysis.length > 0) {
        topProduct = {
          name: productAnalysis[0].name,
          revenue: productAnalysis[0].totalRevenue,
          quantity: productAnalysis[0].totalQuantity
        };
        setSelectedProductId(productAnalysis[0].id);
      }

      setStats({
        totalSales: salesData.length,
        activeSales: activeSales.length,
        activeRevenue,
        pendingDeliveries,
        lowStock: productsData.filter(p => p.quantity < 10).length,
        totalClients: clientsData.length,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        deliveredOrders,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        topProduct,
        salesVelocity: parseFloat(salesVelocity.toFixed(2)),
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
      activeRevenue: 0,
      count: 0
    }));

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date);
      const saleYear = saleDate.getFullYear();
      const yearMatch = saleYear === selectedYear;
      
      const statusMatch = selectedStatus === 'all' || 
        (selectedStatus === 'ACTIVE' ? (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') : sale.status === selectedStatus);
      
      // Client filter
      const clientMatch = selectedClient === 'all' || sale.client?.clientName === selectedClient;
      
      // Branch filter
      const branchMatch = selectedBranch === 'all' || sale.branch?.branchName === selectedBranch;
      
      return yearMatch && statusMatch && clientMatch && branchMatch;
    });

    console.log(`Filtered Sales for ${selectedYear}:`, filteredSales.length);

    filteredSales.forEach(sale => {
      const saleDate = new Date(sale.createdAt || sale.date);
      const monthIndex = saleDate.getMonth();
      
      if (monthIndex >= 0 && monthIndex < 12) {
        const amount = sale.totalAmount || 0;
        monthlyData[monthIndex].count += 1;
        monthlyData[monthIndex].activeRevenue += amount;
      }
    });

    return monthlyData;
  };

  const getProductMonthlySales = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const productMonthlyData = {};

  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt || sale.date);
    const saleYear = saleDate.getFullYear();
    const yearMatch = saleYear === selectedYear;
    const statusMatch = selectedStatus === 'all' || 
      (selectedStatus === 'ACTIVE' ? (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') : sale.status === selectedStatus);
    const clientMatch = selectedClient === 'all' || sale.client?.clientName === selectedClient;
    const branchMatch = selectedBranch === 'all' || sale.branch?.branchName === selectedBranch;
    
    return yearMatch && statusMatch && clientMatch && branchMatch;
  });

  filteredSales.forEach(sale => {
    const saleDate = new Date(sale.createdAt || sale.date);
    const monthIndex = saleDate.getMonth();
    
    sale.items?.forEach(item => {
      const productName = item.product?.productName || 'Unknown';
      if (!productMonthlyData[productName]) {
        productMonthlyData[productName] = months.map(() => 0);
      }
      productMonthlyData[productName][monthIndex] += item.amount || 0;
    });
  });

  return { months, products: productMonthlyData };
};

  const getSalesByStatus = () => {
    // Convert CONFIRMED and INVOICED to ACTIVE for display
    const normalizedSales = sales.map(sale => ({
      ...sale,
      displayStatus: (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') ? 'ACTIVE' : sale.status
    }));

    const statusCounts = normalizedSales.reduce((acc, sale) => {
      acc[sale.displayStatus] = (acc[sale.displayStatus] || 0) + 1;
      return acc;
    }, {});

    const statusRevenue = normalizedSales.reduce((acc, sale) => {
      const amount = sale.totalAmount || 0;
      acc[sale.displayStatus] = (acc[sale.displayStatus] || 0) + amount;
      return acc;
    }, {});

    return {
      counts: statusCounts,
      revenues: statusRevenue
    };
  };

  const totalAlerts = alerts.length;

  const cards = [
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
      title: 'Active Revenue', 
      value: formatCurrency(stats.activeRevenue), 
      icon: DollarSign, 
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
      title: 'Top Product', 
      value: stats.topProduct ? (
        <div className="truncate hover:overflow-visible hover:whitespace-normal hover:max-w-none transition-all" 
             title={stats.topProduct.name}>
          {stats.topProduct.name}
        </div>
      ) : 'N/A', 
      icon: Package, 
      color: 'orange',
      description: stats.topProduct ? formatCurrency(stats.topProduct.revenue) : 'No data',
      subtitle: stats.topProduct ? `${formatNumber(stats.topProduct.quantity)} sold` : ''
    },
    { 
      title: 'Sales Velocity', 
      value: `${stats.salesVelocity.toFixed(1)}/day`, 
      icon: TrendingUpIcon, 
      color: 'green',
      description: 'Last 30 days average'
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

  // Main Chart data - Always monthly view
  const chartData = {
    labels: monthlySalesData.map(d => d.month),
    datasets: [
      {
        label: 'Active Revenue',
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

  // Status distribution chart data
  const statusChartData = {
    labels: Object.keys(salesByStatus.counts),
    datasets: [
      {
        label: 'Sales Count',
        data: Object.keys(salesByStatus.counts).map(status => salesByStatus.counts[status]),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // ACTIVE - green
          'rgba(245, 158, 11, 0.8)',  // PENDING - yellow
          'rgba(239, 68, 68, 0.8)',   // CANCELLED - red
        ],
        borderColor: [
          '#10B981',
          '#F59E0B',
          '#EF4444',
        ],
        borderWidth: 2,
      }
    ]
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
            <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-gray-600 mt-2">Active sales tracking (Confirmed & Invoiced combined)</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => setShowInsights(!showInsights)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition-all"
            >
              <Info size={18} />
              Business Insights
              {businessInsights.length > 0 && (
                <span className="bg-white text-purple-700 text-xs rounded-full px-2 py-1">
                  {businessInsights.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => loadStats()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
              card.trend < 0 ? <ArrowDownRight className="text-red-500" size={16} /> : null;

            return (
              <div key={i} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-5 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                      {card.trend !== undefined && trendIcon && (
                        <div className="flex items-center gap-1">
                          {trendIcon}
                          <span className={`text-xs font-medium ${card.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {card.trendLabel ? `${Math.abs(card.trend)} ${card.trendLabel}` : `${Math.abs(card.trend)}%`}
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
                      {card.subtitle && (
                        <p className="text-xs text-gray-500">{card.subtitle}</p>
                      )}
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

        {/* Business Insights Panel */}
        {showInsights && businessInsights.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-md p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                <Info className="text-purple-600" size={20} />
                Business Insights
              </h3>
              <button 
                onClick={() => setShowInsights(false)}
                className="text-purple-600 hover:text-purple-800"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessInsights.map((insight, idx) => {
                const Icon = insight.icon;
                const typeColors = {
                  positive: 'bg-green-100 border-green-300 text-green-800',
                  warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                  info: 'bg-blue-100 border-blue-300 text-blue-800',
                };
                
                return (
                  <div key={idx} className={`p-4 rounded-lg border ${typeColors[insight.type]}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        insight.type === 'positive' ? 'bg-green-200' :
                        insight.type === 'warning' ? 'bg-yellow-200' : 'bg-blue-200'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm mt-1">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  <div 
                    key={product.id || idx} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${
                        idx === 0 ? 'text-yellow-600' :
                        idx === 1 ? 'text-gray-400' :
                        idx === 2 ? 'text-amber-800' : 'text-gray-400'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate" title={product.name}>
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantity} units • {product.margin ? `${product.margin}% margin` : 'Margin N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
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

          {/* Product Sales Analysis */}
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart2 className="text-blue-600" size={20} />
                  Product Sales Analysis
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedClient !== 'all' && selectedBranch !== 'all' 
                    ? `${selectedClient} - ${selectedBranch}`
                    : selectedClient !== 'all' && selectedBranch === 'all'
                    ? `${selectedClient} - All Branches`
                    : selectedBranch !== 'all'
                    ? `All Clients - ${selectedBranch}`
                    : 'All Clients - All Branches'
                  }
                </p>
              </div>
              {selectedProductId && (
                <div className="flex items-center gap-2">
                  <select 
                    value={productChartType}
                    onChange={(e) => setProductChartType(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">By Month</option>
                    <option value="branch">By Branch</option>
                    <option value="client">By Client</option>
                  </select>
                </div>
              )}
            </div>
            
            {selectedProductId ? (
              <>
                {/* Product Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(productSalesData.find(p => p.id === selectedProductId)?.totalRevenue || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Quantity</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatNumber(productSalesData.find(p => p.id === selectedProductId)?.totalQuantity || 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total Sales</p>
                      <p className="text-lg font-bold text-purple-700">
                        {formatNumber(productSalesData.find(p => p.id === selectedProductId)?.salesCount || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Chart */}
                <div style={{ height: '300px' }}>
                  {(() => {
                    const chartData = getProductChartData(selectedProductId, productChartType);
                    return chartData ? (
                      <Bar 
                        data={chartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  if (context.dataset.label === 'Revenue') {
                                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                                  } else {
                                    return `${context.dataset.label}: ${context.parsed.y} units`;
                                  }
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              title: {
                                display: true,
                                text: 'Revenue (₱)',
                                color: '#3B82F6'
                              },
                              ticks: {
                                callback: function(value) {
                                  if (value >= 1000000) return '₱' + (value / 1000000).toFixed(1) + 'M';
                                  if (value >= 1000) return '₱' + (value / 1000).toFixed(0) + 'K';
                                  return '₱' + value;
                                }
                              }
                            },
                            y1: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: {
                                display: true,
                                text: 'Quantity Sold',
                                color: '#10B981'
                              },
                              grid: {
                                drawOnChartArea: false,
                              },
                            },
                            x: {
                              ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                              }
                            }
                          }
                        }} 
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <BarChart size={48} className="mb-4 opacity-50" />
                        <p className="text-lg">No sales data for this product</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Additional Product Metrics */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* Branch Performance */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Building size={16} /> Top Branches
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const product = productSalesData.find(p => p.id === selectedProductId);
                        if (!product?.byBranch) return <p className="text-sm text-gray-500">No branch data</p>;
                        
                        const topBranches = Object.entries(product.byBranch)
                          .sort((a, b) => b[1].revenue - a[1].revenue)
                          .slice(0, 3);
                        
                        return topBranches.map(([branchName, data], idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 truncate">{branchName}</span>
                            <div className="text-right">
                              <span className="text-sm font-semibold">{formatCurrency(data.revenue)}</span>
                              <div className="text-xs text-gray-500">{data.quantity} units</div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Client Performance */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Users size={16} /> Top Clients
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const product = productSalesData.find(p => p.id === selectedProductId);
                        if (!product?.byClient) return <p className="text-sm text-gray-500">No client data</p>;
                        
                        const topClients = Object.entries(product.byClient)
                          .sort((a, b) => b[1].revenue - a[1].revenue)
                          .slice(0, 3);
                        
                        return topClients.map(([clientName, data], idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 truncate">{clientName}</span>
                            <div className="text-right">
                              <span className="text-sm font-semibold">{formatCurrency(data.revenue)}</span>
                              <div className="text-xs text-gray-500">{data.quantity} units</div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <Package size={48} className="mb-4 opacity-50" />
                <p className="text-lg">Select a product to view analysis</p>
                <p className="text-sm mt-2">Click on any product from the list</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-blue-600" size={20} />
                  Active Revenue Trend ({selectedYear})
                </h3>
                <p className="text-sm text-gray-500 mt-1">Confirmed & Invoiced sales combined</p>
                {selectedClient !== 'all' && selectedBranch !== 'all' && (
                  <p className="text-sm text-blue-600 mt-1">
                    Showing data for Client: {selectedClient} at Branch: {selectedBranch}
                  </p>
                )}
                {selectedClient !== 'all' && selectedBranch === 'all' && (
                  <p className="text-sm text-blue-600 mt-1">
                    Showing data for Client: {selectedClient} across all branches
                  </p>
                )}
                {selectedClient === 'all' && selectedBranch !== 'all' && (
                  <p className="text-sm text-blue-600 mt-1">
                    Showing data for Branch: {selectedBranch} across all clients
                  </p>
                )}
                {selectedClient === 'all' && selectedBranch === 'all' && (
                  <p className="text-sm text-blue-600 mt-1">
                    Showing data for all clients and all branches
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Active Revenue</span>
                </div>
              </div>
            </div>
            
            {/* Chart Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={selectedClient === 'all' && availableBranches.length === 0}
              >
                <option value="all">
                  {selectedClient === 'all' ? 'All Branches' : 'All Branches (for this client)'}
                </option>
                {availableBranches.map(branch => (
                  <option key={branch.id} value={branch.branchName}>{branch.branchName}</option>
                ))}
              </select>
              
              <select 
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.clientName}>{client.clientName}</option>
                ))}
              </select>
              
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {sales.length > 0 ? (
              <div style={{ height: '350px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <TrendingUp size={48} className="mb-4 opacity-50" />
                <p className="text-lg">No sales data available for selected filters</p>
                <p className="text-sm mt-2">Try selecting different filters</p>
              </div>
            )}
          </div>

          {/* Product Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="text-purple-600" size={20} />
                  Product Sales by Month ({selectedYear})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedClient !== 'all' && selectedBranch !== 'all' 
                    ? `${selectedClient} - ${selectedBranch}`
                    : selectedClient !== 'all' && selectedBranch === 'all'
                    ? `${selectedClient} - All Branches`
                    : selectedBranch !== 'all'
                    ? `All Clients - ${selectedBranch}`
                    : 'All Clients - All Branches'
                  }
                </p>
              </div>
            </div>

            {(() => {
              const productData = getProductMonthlySales();
              const productList = Object.keys(productData.products).slice(0, 5); // Top 5 products
              
              if (productList.length === 0) {
                return (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <Package size={48} className="mb-4 opacity-50" />
                    <p className="text-lg">No product sales data for selected filters</p>
                  </div>
                );
              }

              const colors = [
                { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
                { border: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
                { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
                { border: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
                { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
              ];

              const productChartData = {
                labels: productData.months,
                datasets: productList.map((productName, idx) => ({
                  label: productName,
                  data: productData.products[productName],
                  borderColor: colors[idx % colors.length].border,
                  backgroundColor: colors[idx % colors.length].bg,
                  borderWidth: 2,
                  tension: 0.4,
                  fill: true,
                }))
              };

              return (
                <div style={{ height: '350px' }}>
                  <Line data={productChartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                      },
                      tooltip: {
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
                        ticks: {
                          callback: function(value) {
                            if (value >= 1000000) return '₱' + (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return '₱' + (value / 1000).toFixed(0) + 'K';
                            return '₱' + value;
                          }
                        }
                      }
                    }
                  }} />
                </div>
              );
            })()}
          </div>

          {/* Status Distribution & Recent Sales */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="text-blue-600" size={20} />
                Sales Status Overview
              </h3>
              {Object.keys(salesByStatus.counts).length > 0 ? (
                <>
                  <div style={{ height: '250px' }}>
                    <Bar data={statusChartData} options={statusChartOptions} />
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {Object.entries(salesByStatus.revenues).map(([status, revenue]) => (
                      <div key={status} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <StatusBadge status={status} />
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">{formatCurrency(revenue)}</span>
                            <div className="text-xs text-gray-500">
                              {salesByStatus.counts[status]} sales
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  <Database size={32} className="opacity-50" />
                  <span className="ml-3">No sales data</span>
                </div>
              )}
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
                          <StatusBadge 
                            status={
                              (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') 
                                ? 'ACTIVE' 
                                : sale.status || 'PENDING'
                            } 
                          />
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
                          {sale.items?.length || 0} item{(sale.items?.length || 0) !== 1 ? 's' : ''}
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
      </div>
    </div>
  );
};

export default Dashboard;