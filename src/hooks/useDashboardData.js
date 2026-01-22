import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api.js';
import { calculateDashboardStats } from '../utils/dashboardCalculations';

export const useDashboardData = () => {
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
  const [alerts, setAlerts] = useState([]);
  const [businessInsights, setBusinessInsights] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    topProducts: [],
    topBranches: [],
    topCompanies: []
  });
  const [productSalesData, setProductSalesData] = useState([]);
  
  // State variables
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productCategories, setProductCategories] = useState([]);
  const [performanceYear, setPerformanceYear] = useState(new Date().getFullYear());
  const [performanceView, setPerformanceView] = useState('year');
  const [performanceMonth, setPerformanceMonth] = useState(new Date().getMonth() + 1);
  const [selectedCompanyForBranches, setSelectedCompanyForBranches] = useState(null);
  const [selectedCompanyForTopBranches, setSelectedCompanyForTopBranches] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Load dashboard data
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading dashboard data...');
      
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


      const sortedSales = [...salesData]
        .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
        .slice(0, 10);
      setRecentSales(sortedSales);


      const calculatedStats = calculateDashboardStats(
        salesData,
        deliveriesData,
        productsData,
        companiesData
      );
      setStats(calculatedStats);

      if (productsData.length > 0) {
        const categories = [...new Set(
          productsData
            .filter(p => p.category && p.category.trim() !== '')
            .map(p => p.category)
            .sort()
        )];
        setProductCategories(categories);
      }

    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const alertsRes = await api.get('/alerts');
      if (alertsRes.success) {
        setAlerts(alertsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load alerts', err);
    }
  }, []);

  const availableYears = useMemo(() => {
    return [...new Set(sales
      .map(s => {
        if (s.year) return s.year;
        const date = new Date(s.createdAt || s.date);
        return date.getFullYear();
      })
      .filter(year => !isNaN(year) && year > 1900)
    )].sort((a, b) => b - a);
  }, [sales]);


  const availableBranches = useMemo(() => {
    if (selectedCompany === 'all') {
      return branches;
    }
    
    const companyBranches = [...new Set(
      sales
        .filter(s => s.company?.companyName === selectedCompany)
        .map(s => s.branch?.branchName)
        .filter(Boolean)
    )];

    return branches.filter(b =>
      companyBranches.includes(b.branchName)
    );
  }, [selectedCompany, branches, sales]);


  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined) return '₱0.00';
    return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);



  const formatNumber = useCallback((num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-PH');
  }, []);



  useEffect(() => {
    loadStats();
    loadAlerts();
  }, [loadStats, loadAlerts]);

  return {
    stats,
    sales,
    companies,
    branches,
    products,
    deliveries,
    recentSales,
    alerts,
    businessInsights,
    performanceData,
    productSalesData,
    
    loading,
    loadingMessage,
    selectedYear,
    setSelectedYear,
    selectedCompany,
    setSelectedCompany,
    selectedBranch,
    setSelectedBranch,
    selectedStatus,
    setSelectedStatus,
    selectedProductId,
    setSelectedProductId,
    selectedCategory,
    setSelectedCategory,
    productCategories,
    setProductCategories,
    performanceYear,
    setPerformanceYear,
    performanceView,
    setPerformanceView,
    performanceMonth,
    setPerformanceMonth,
    selectedCompanyForBranches,
    setSelectedCompanyForBranches,
    selectedCompanyForTopBranches,
    setSelectedCompanyForTopBranches,
    
    loadStats,
    loadAlerts,
    
    availableYears,
    availableBranches,
    
    formatCurrency,
    formatNumber
  };
};