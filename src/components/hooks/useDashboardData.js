import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    activeSales: 0,
    activeRevenue: 0,
    pendingDeliveries: 0,
    lowStock: 0,
    totalCompanies: 0,
    averageOrderValue: 0,
    deliveredOrders: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    topProduct: null,
    salesVelocity: 0,
  });
  const [sales, setSales] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [availableBranches, setAvailableBranches] = useState([]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, deliveriesRes, productsRes, companiesRes, branchesRes] = await Promise.all([
        api.get('/sales'),
        api.get('/deliveries'),
        api.get('/products'),
        api.get('/companies'),
        api.get('/branches'),
      ]);

      const salesData = salesRes.success ? salesRes.data || [] : [];
      const deliveriesData = deliveriesRes.success ? deliveriesRes.data || [] : [];
      const productsData = productsRes.success ? productsRes.data || [] : [];
      const companiesData = companiesRes.success ? companiesRes.data || [] : [];
      const branchesData = branchesRes.success ? branchesRes.data || [] : [];

      setSales(salesData);
      setCompanies(companiesData);
      setBranches(branchesData);
      setProducts(productsData);
      setDeliveries(deliveriesData);

      // Process recent sales
      const sortedSales = [...salesData]
        .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
        .slice(0, 10);
      setRecentSales(sortedSales);

      // Calculate stats
      const activeSales = salesData.filter(s =>
        s.status === 'CONFIRMED' || s.status === 'INVOICED'
      );
      const pendingDeliveries = deliveriesData.filter(d => d.status === 'PENDING').length;
      const deliveredOrders = deliveriesData.filter(d => d.status === 'DELIVERED').length;
      const activeRevenue = activeSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const averageOrderValue = activeSales.length > 0 ? activeRevenue / activeSales.length : 0;

      const totalLeads = companiesData.length * 2;
      const conversionRate = salesData.length > 0 ? (activeSales.length / totalLeads * 100) : 0;

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

      const last30Days = salesData.filter(s => {
        const saleDate = new Date(s.createdAt || s.date);
        const daysDiff = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30 && (s.status === 'CONFIRMED' || s.status === 'INVOICED');
      });
      const salesVelocity = last30Days.length / 30;

      setStats({
        totalSales: salesData.length,
        activeSales: activeSales.length,
        activeRevenue,
        pendingDeliveries,
        lowStock: productsData.filter(p => p.quantity < 10).length,
        totalCompanies: companiesData.length,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        deliveredOrders,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        salesVelocity: parseFloat(salesVelocity.toFixed(2)),
      });

    } catch (err) {
      console.error('Failed to load dashboard data', err);
      toast.error('Failed to load dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (selectedCompany === 'all') {
      setAvailableBranches(branches);
      setSelectedBranch('all');
    } else {
      const companyBranches = [...new Set(
        sales
          .filter(s => s.company?.companyName === selectedCompany)
          .map(s => s.branch?.branchName)
          .filter(Boolean)
      )];
      const filteredBranches = branches.filter(b =>
        companyBranches.includes(b.branchName)
      );
      setAvailableBranches(filteredBranches);
      setSelectedBranch('all');
    }
  }, [selectedCompany, branches, sales]);

  // Get monthly sales data
  const getMonthlySalesData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => ({
      month,
      monthNumber: index + 1,
      activeRevenue: 0,
      count: 0
    }));

    const filteredSales = sales.filter(sale => {
      const saleYear = sale.year || new Date(sale.createdAt || sale.date).getFullYear();
      const yearMatch = saleYear === selectedYear;
      const statusMatch = (sale.status === 'CONFIRMED' || sale.status === 'INVOICED');
      const companyMatch = selectedCompany === 'all' || sale.company?.companyName === selectedCompany;
      const branchMatch = selectedBranch === 'all' || sale.branch?.branchName === selectedBranch;

      return yearMatch && statusMatch && companyMatch && branchMatch;
    });

    filteredSales.forEach(sale => {
      const monthIndex = sale.month ? sale.month - 1 : new Date(sale.createdAt || sale.date).getMonth();
      if (monthIndex >= 0 && monthIndex < 12) {
        const amount = sale.totalAmount || 0;
        monthlyData[monthIndex].count += 1;
        monthlyData[monthIndex].activeRevenue += amount;
      }
    });

    return monthlyData;
  }, [sales, selectedYear, selectedCompany, selectedBranch]);

  // Get sales by status
  const getSalesByStatus = useCallback(() => {
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
  }, [sales]);

  // Get available years
  const availableYears = [...new Set(sales
    .map(s => s.year || new Date(s.createdAt || s.date).getFullYear())
    .filter(year => !isNaN(year) && year > 1900)
  )].sort((a, b) => b - a);

  const monthlySalesData = getMonthlySalesData();
  const salesByStatus = getSalesByStatus();

  return {
    loading,
    stats,
    sales,
    companies,
    branches,
    products,
    deliveries,
    recentSales,
    monthlySalesData,
    salesByStatus,
    availableYears,
    selectedYear,
    setSelectedYear,
    selectedCompany,
    setSelectedCompany,
    selectedBranch,
    setSelectedBranch,
    availableBranches,
    loadStats
  };
};