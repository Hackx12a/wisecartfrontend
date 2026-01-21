import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/currencyutils';
import PesoIcon from '../components/common/PesoIcon';
import {
  ShoppingCart,
  Bell,
  CreditCard,
  TrendingUp as TrendingUpIcon,
  CheckCheck,
  Clock,
  AlertCircle,
  Package,
  AlertTriangle,
  Users,
  Building
} from 'lucide-react';  

export const useDashboardData = () => {
  // State declarations
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
  const [alerts, setAlerts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    topProducts: [],
    topBranches: [],
    topCompanies: []
  });
  const [businessInsights, setBusinessInsights] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Selection states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedCompanyForBranches, setSelectedCompanyForBranches] = useState(null);
  const [selectedCompanyForTopBranches, setSelectedCompanyForTopBranches] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [performanceYear, setPerformanceYear] = useState(new Date().getFullYear());
  const [performanceView, setPerformanceView] = useState('year');
  const [performanceMonth, setPerformanceMonth] = useState(new Date().getMonth() + 1);

  // Load data functions
  const loadAlerts = useCallback(async () => {
    try {
      setActionLoading(true);
      setLoadingMessage('Loading alerts...');
      const alertsRes = await api.get('/alerts');

      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data || []);
        setActionLoading(false);
        setLoadingMessage('');
        return;
      }
    } catch (err) {
      console.error('Failed to load from /alerts, trying separate endpoints...', err);
    }

    try {
      const [activeRes, resolvedRes] = await Promise.all([
        api.get('/alerts').catch(() => ({ success: false, data: [] })),
        api.get('/alerts/resolved').catch(() => ({ success: false, data: [] }))
      ]);

      const activeAlerts = (activeRes.success ? activeRes.data || [] : []);
      const resolvedAlerts = (resolvedRes.success ? resolvedRes.data || [] : []);
      const allAlerts = [...activeAlerts, ...resolvedAlerts];

      setAlerts(allAlerts);
    } catch (separateErr) {
      console.error('Failed to load alerts from all endpoints', separateErr);
      setAlerts([]);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setActionLoading(true);
      setLoadingMessage('Loading stats...');
      
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

      // Sort recent sales
      const sortedSales = [...salesData]
        .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
        .slice(0, 10);
      setRecentSales(sortedSales);

      // Calculate stats
      const activeSales = salesData.filter(sale =>
        sale.status === 'CONFIRMED' || sale.status === 'INVOICED'
      );
      const pendingDeliveries = deliveriesData.filter(d => d.status === 'PENDING').length;
      const deliveredOrders = deliveriesData.filter(d => d.status === 'DELIVERED').length;
      const activeRevenue = activeSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const averageOrderValue = activeSales.length > 0 ? activeRevenue / activeSales.length : 0;

      const totalLeads = companiesData.length * 2;
      const conversionRate = salesData.length > 0 ? (activeSales.length / totalLeads * 100) : 0;

      const currentMonth = new Date().getMonth();
      const thisMonthSales = salesData.filter(sale => {
        const saleDate = new Date(sale.createdAt || sale.date);
        return saleDate.getMonth() === currentMonth &&
          (sale.status === 'CONFIRMED' || sale.status === 'INVOICED');
      });
      const prevMonthSales = salesData.filter(sale => {
        const saleDate = new Date(s.createdAt || sale.date);
        return saleDate.getMonth() === (currentMonth - 1 + 12) % 12 &&
          (sale.status === 'CONFIRMED' || sale.status === 'INVOICED');
      });
      
      const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const prevMonthRevenue = prevMonthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const revenueGrowth = prevMonthRevenue > 0
        ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100)
        : thisMonthRevenue > 0 ? 100 : 0;

      const last30Days = salesData.filter(sale => {
        const saleDate = new Date(sale.createdAt || sale.date);
        const daysDiff = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30 && (sale.status === 'CONFIRMED' || sale.status === 'INVOICED');
      });
      const salesVelocity = last30Days.length / 30;

      // Load product sales analysis
      const productAnalysis = getProductSalesAnalysis(salesData, performanceView, performanceYear, performanceMonth);
      setProductSalesData(productAnalysis);

      let topProduct = null;
      if (productAnalysis.length > 0) {
        topProduct = {
          name: productAnalysis[0].name,
          revenue: productAnalysis[0].totalRevenue,
          quantity: productAnalysis[0].totalQuantity
        };
        if (!selectedProductId) {
          setSelectedProductId(productAnalysis[0].id);
        }
      }

      // Set categories
      if (productsData.length > 0) {
        const categories = [...new Set(
          productsData
            .filter(p => p.category && p.category.trim() !== '')
            .map(p => p.category)
            .sort()
        )];
        setProductCategories(categories);
      }

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
        topProduct,
        salesVelocity: parseFloat(salesVelocity.toFixed(2)),
      });

      // Load performance data
      loadPerformance(salesData, productsData);

    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  }, [performanceView, performanceYear, performanceMonth, selectedProductId]);

  // Helper functions
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

  const getProductMonthlySales = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const productMonthlyData = {};
    const productQuantityData = {};
    const productSalesCount = {};

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

      sale.items?.forEach(item => {
        const variationId = item.variation?.id || 'base';
        const uniqueKey = `${item.product?.id}_${variationId}`;

        if (!productMonthlyData[uniqueKey]) {
          productMonthlyData[uniqueKey] = months.map(() => 0);
          productQuantityData[uniqueKey] = 0;
          productSalesCount[uniqueKey] = 0;
        }
        productMonthlyData[uniqueKey][monthIndex] += item.amount || 0;
        productQuantityData[uniqueKey] += item.quantity || 0;
      });
    });

    // Count unique transactions per product
    filteredSales.forEach(sale => {
      const productsInSale = new Set();
      sale.items?.forEach(item => {
        const variationId = item.variation?.id || 'base';
        const uniqueKey = `${item.product?.id}_${variationId}`;
        productsInSale.add(uniqueKey);
      });
      productsInSale.forEach(uniqueKey => {
        if (productSalesCount[uniqueKey] !== undefined) {
          productSalesCount[uniqueKey] += 1;
        }
      });
    });

    return {
      months,
      products: productMonthlyData,
      quantities: productQuantityData,
      salesCounts: productSalesCount
    };
  }, [sales, selectedYear, selectedCompany, selectedBranch]);

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

  const generateInsights = useCallback(() => {
    const insights = [];
    const now = new Date();
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

    const topProduct = performanceData.topProducts[0];
    if (topProduct && topProduct.revenue > 10000) {
      insights.push({
        type: 'info',
        title: 'Best Selling Product',
        message: `${topProduct.name} generated ${formatCurrency(topProduct.revenue)}`,
        icon: Package,
      });
    }

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

    setBusinessInsights(insights);
  }, [sales, performanceData]);

  const loadPerformance = useCallback((salesData, productsData) => {
    try {
      const filteredSales = salesData.filter(sale => {
        const statusMatch = sale.status === 'CONFIRMED' || sale.status === 'INVOICED';

        if (performanceView === 'overall') {
          return statusMatch;
        }

        const saleYear = sale.year || new Date(sale.createdAt || sale.date).getFullYear();
        const saleMonth = sale.month || (new Date(sale.createdAt || sale.date).getMonth() + 1);

        const yearMatch = saleYear === performanceYear;
        const monthMatch = performanceView === 'month' ? saleMonth === performanceMonth : true;

        return yearMatch && monthMatch && statusMatch;
      });

      // Calculate product performance
      const productPerformance = {};
      filteredSales.forEach(sale => {
        if (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') {
          sale.items?.forEach(item => {
            const variationId = item.variation?.id || 'base';
            const uniqueKey = `${item.product?.id}_${variationId}`;

            const variationName = item.variation?.combinationDisplay ||
              item.variation?.variationValue ||
              (variationId !== 'base' ? 'Default Variation' : null);

            const displayName = variationId !== 'base' && variationName
              ? `${item.product?.productName || 'Unknown Product'} (${variationName})`
              : item.product?.productName || 'Unknown Product';

            if (!productPerformance[uniqueKey]) {
              const fullProduct = productsData.find(p => p.id === item.product?.id);
              productPerformance[uniqueKey] = {
                id: uniqueKey,
                productId: item.product?.id,
                variationId: variationId !== 'base' ? variationId : null,
                name: displayName,
                baseProductName: item.product?.productName || 'Unknown Product',
                variationName: variationName,
                category: fullProduct?.category || item.product?.category || 'Uncategorized',
                revenue: 0,
                quantity: 0,
                margin: item.product?.margin || 0,
              };
            }
            productPerformance[uniqueKey].revenue += item.amount || 0;
            productPerformance[uniqueKey].quantity += item.quantity || 0;
          });
        }
      });

      const topProducts = Object.values(productPerformance)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      // Calculate branch performance
      const branchPerformance = {};
      filteredSales.forEach(sale => {
        if (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') {
          let hasSelectedProduct = !selectedProductId;

          if (selectedProductId) {
            const [selectedProductIdNum, selectedVariationIdStr] = selectedProductId.split('_');
            const selectedVariationId = selectedVariationIdStr !== 'base' ? selectedVariationIdStr : null;

            hasSelectedProduct = sale.items?.some(item => {
              const itemProductId = item.product?.id;
              const itemVariationId = item.variation?.id || null;

              if (selectedVariationId) {
                return itemProductId == selectedProductIdNum &&
                  itemVariationId == selectedVariationId;
              } else {
                return itemProductId == selectedProductIdNum;
              }
            });
          }

          if (!hasSelectedProduct) return;

          const key = sale.branch?.id;
          if (!branchPerformance[key]) {
            branchPerformance[key] = {
              id: key,
              name: sale.branch?.branchName || 'Unknown Branch',
              code: sale.branch?.branchCode || 'N/A',
              revenue: 0,
              salesCount: 0,
              quantity: 0,
              averageOrderValue: 0,
            };
          }

          if (selectedProductId) {
            const [selectedProductIdNum, selectedVariationIdStr] = selectedProductId.split('_');
            const selectedVariationId = selectedVariationIdStr !== 'base' ? selectedVariationIdStr : null;

            sale.items?.forEach(item => {
              const itemProductId = item.product?.id;
              const itemVariationId = item.variation?.id || null;

              if (selectedVariationId) {
                if (itemProductId == selectedProductIdNum && itemVariationId == selectedVariationId) {
                  branchPerformance[key].revenue += item.amount || 0;
                  branchPerformance[key].quantity += item.quantity || 0;
                }
              } else {
                if (itemProductId == selectedProductIdNum) {
                  branchPerformance[key].revenue += item.amount || 0;
                  branchPerformance[key].quantity += item.quantity || 0;
                }
              }
            });
            branchPerformance[key].salesCount += 1;
          } else {
            branchPerformance[key].revenue += sale.totalAmount || 0;
            branchPerformance[key].salesCount += 1;
            sale.items?.forEach(item => {
              branchPerformance[key].quantity += item.quantity || 0;
            });
          }

          branchPerformance[key].averageOrderValue =
            branchPerformance[key].salesCount > 0
              ? branchPerformance[key].revenue / branchPerformance[key].salesCount
              : 0;
        }
      });

      const topBranches = Object.values(branchPerformance)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate company performance
      const companyPerformance = {};
      filteredSales.forEach(sale => {
        if (sale.status === 'CONFIRMED' || sale.status === 'INVOICED') {
          let hasSelectedProduct = !selectedProductId;

          if (selectedProductId) {
            const [selectedProductIdNum, selectedVariationIdStr] = selectedProductId.split('_');
            const selectedVariationId = selectedVariationIdStr !== 'base' ? selectedVariationIdStr : null;

            hasSelectedProduct = sale.items?.some(item => {
              const itemProductId = item.product?.id;
              const itemVariationId = item.variation?.id || null;

              if (selectedVariationId) {
                return itemProductId == selectedProductIdNum &&
                  itemVariationId == selectedVariationId;
              } else {
                return itemProductId == selectedProductIdNum;
              }
            });
          }

          if (!hasSelectedProduct) return;

          const key = sale.company?.id;
          if (!companyPerformance[key]) {
            companyPerformance[key] = {
              id: key,
              name: sale.company?.companyName || 'Unknown Company',
              revenue: 0,
              salesCount: 0,
              averageOrderValue: 0,
            };
          }

          if (selectedProductId) {
            const [selectedProductIdNum, selectedVariationIdStr] = selectedProductId.split('_');
            const selectedVariationId = selectedVariationIdStr !== 'base' ? selectedVariationIdStr : null;

            sale.items?.forEach(item => {
              const itemProductId = item.product?.id;
              const itemVariationId = item.variation?.id || null;

              if (selectedVariationId) {
                if (itemProductId == selectedProductIdNum && itemVariationId == selectedVariationId) {
                  companyPerformance[key].revenue += item.amount || 0;
                }
              } else {
                if (itemProductId == selectedProductIdNum) {
                  companyPerformance[key].revenue += item.amount || 0;
                }
              }
            });
            companyPerformance[key].salesCount += 1;
          } else {
            companyPerformance[key].revenue += sale.totalAmount || 0;
            companyPerformance[key].salesCount += 1;
          }

          companyPerformance[key].averageOrderValue =
            companyPerformance[key].salesCount > 0
              ? companyPerformance[key].revenue / companyPerformance[key].salesCount
              : 0;
        }
      });

      const topCompanies = Object.values(companyPerformance)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setPerformanceData({ topProducts, topBranches, topCompanies });
    } catch (err) {
      console.error('Failed to load performance data', err);
    }
  }, [performanceView, performanceYear, performanceMonth, selectedProductId]);

  const getProductSalesAnalysis = useCallback((salesData, view, year, month) => {
    const productAnalysis = {};

    const filteredSales = salesData.filter(sale => {
      const statusMatch = sale.status === 'CONFIRMED' || sale.status === 'INVOICED';

      if (view === 'overall') {
        return statusMatch;
      }

      const saleYear = sale.year || new Date(sale.createdAt || sale.date).getFullYear();
      const saleMonth = sale.month || (new Date(sale.createdAt || sale.date).getMonth() + 1);

      const yearMatch = saleYear === year;
      const monthMatch = view === 'month' ? saleMonth === month : true;

      return statusMatch && yearMatch && monthMatch;
    });

    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        const variationId = item.variation?.id || 'base';
        const productId = item.product?.id;
        const uniqueKey = `${productId}_${variationId}`;

        const productName = item.product?.productName || 'Unknown Product';
        const variationName = item.variation?.combinationDisplay ||
          item.variation?.variationValue ||
          (variationId !== 'base' ? 'Default Variation' : null);

        const displayName = variationId !== 'base' && variationName
          ? `${productName} (${variationName})`
          : productName;

        const branchName = sale.branch?.branchName || 'Unknown Branch';
        const companyName = sale.company?.companyName || 'Unknown Company';

        let month, saleYear;
        if (sale.month && sale.year) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          month = monthNames[sale.month - 1];
          saleYear = sale.year;
        } else {
          const saleDate = new Date(sale.createdAt || sale.date);
          month = saleDate.toLocaleString('default', { month: 'short' });
          saleYear = saleDate.getFullYear();
        }
        const monthYear = `${month} ${saleYear}`;

        if (!productAnalysis[uniqueKey]) {
          productAnalysis[uniqueKey] = {
            id: uniqueKey,
            productId: productId,
            variationId: variationId !== 'base' ? variationId : null,
            name: displayName,
            baseProductName: productName,
            variationName: variationName,
            totalRevenue: 0,
            totalQuantity: 0,
            byMonth: {},
            byBranch: {},
            byCompany: {},
            salesCount: 0
          };
        }

        const product = productAnalysis[uniqueKey];
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

        // Company analysis
        if (!product.byCompany[companyName]) {
          product.byCompany[companyName] = {
            revenue: 0,
            quantity: 0,
            count: 0
          };
        }
        product.byCompany[companyName].revenue += item.amount || 0;
        product.byCompany[companyName].quantity += item.quantity || 0;
        product.byCompany[companyName].count += 1;
      });
    });

    return Object.values(productAnalysis)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, []);

  const getSelectedProductStats = useCallback(() => {
    if (!selectedProductId) return null;

    const product = productSalesData.find(p => p.id === selectedProductId);
    if (!product) return null;

    const filteredSales = sales.filter(sale => {
      const statusMatch = sale.status === 'CONFIRMED' || sale.status === 'INVOICED';

      if (performanceView === 'overall') {
        return statusMatch;
      }

      const saleYear = sale.year || new Date(sale.createdAt || sale.date).getFullYear();
      const saleMonth = sale.month || (new Date(sale.createdAt || sale.date).getMonth() + 1);

      const yearMatch = saleYear === performanceYear;
      const monthMatch = performanceView === 'month' ? saleMonth === performanceMonth : true;

      return statusMatch && yearMatch && monthMatch;
    });

    const transactionsWithProduct = new Set();
    let totalRevenue = 0;
    let totalQuantity = 0;

    filteredSales.forEach(sale => {
      const hasProduct = sale.items?.some(item => {
        const itemVariationId = item.variation?.id || 'base';
        const itemKey = `${item.product?.id}_${itemVariationId}`;
        return itemKey === selectedProductId;
      });

      if (hasProduct) {
        transactionsWithProduct.add(sale.id);

        sale.items?.forEach(item => {
          const itemVariationId = item.variation?.id || 'base';
          const itemKey = `${item.product?.id}_${itemVariationId}`;
          if (itemKey === selectedProductId) {
            totalRevenue += item.amount || 0;
            totalQuantity += item.quantity || 0;
          }
        });
      }
    });

    return {
      totalRevenue,
      totalQuantity,
      transactions: transactionsWithProduct.size,
      avgPerUnit: totalQuantity > 0 ? totalRevenue / totalQuantity : 0
    };
  }, [selectedProductId, productSalesData, sales, performanceView, performanceYear, performanceMonth]);

  const getProductChartData = useCallback((productKey) => {
    if (!productKey) return null;

    const [productId, variationIdStr] = productKey.split('_');
    const variationId = variationIdStr !== 'base' ? variationIdStr : null;

    const filteredSales = sales.filter(sale => {
      const statusMatch = sale.status === 'CONFIRMED' || sale.status === 'INVOICED';

      if (performanceView === 'overall') {
        return statusMatch;
      }

      const saleYear = sale.year || new Date(sale.createdAt || sale.date).getFullYear();
      const saleMonth = sale.month || (new Date(sale.createdAt || sale.date).getMonth() + 1);

      const yearMatch = saleYear === performanceYear;
      const monthMatch = performanceView === 'month' ? saleMonth === performanceMonth : true;

      return statusMatch && yearMatch && monthMatch;
    });

    const companyData = {};

    filteredSales.forEach(sale => {
      const companyName = sale.company?.companyName || 'Unknown Company';
      sale.items?.forEach(item => {
        const itemVariationId = item.variation?.id || 'base';
        const itemKey = `${item.product?.id}_${itemVariationId}`;

        if (itemKey === productKey) {
          if (!companyData[companyName]) {
            companyData[companyName] = {
              revenue: 0,
              quantity: 0
            };
          }
          companyData[companyName].revenue += item.amount || 0;
          companyData[companyName].quantity += item.quantity || 0;
        }
      });
    });

    const companies = Object.keys(companyData).sort((a, b) =>
      companyData[b].revenue - companyData[a].revenue
    );

    if (companies.length === 0) return null;

    const labels = companies;
    const salesData = companies.map(company => companyData[company].revenue);
    const quantityData = companies.map(company => companyData[company].quantity);

    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: salesData,
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
  }, [sales, performanceView, performanceYear, performanceMonth]);

  const getCompanyBranchBreakdown = useCallback((companyName) => {
    const product = productSalesData.find(p => p.id === selectedProductId);
    if (!product) return [];

    const [selectedProductIdNum, selectedVariationIdStr] = selectedProductId.split('_');
    const selectedVariationId = selectedVariationIdStr !== 'base' ? selectedVariationIdStr : null;

    const companySales = sales.filter(sale => {
      const statusMatch = sale.status === 'CONFIRMED' || sale.status === 'INVOICED';
      const companyMatch = sale.company?.companyName === companyName;

      const hasProduct = sale.items?.some(item => {
        const itemProductId = item.product?.id;
        const itemVariationId = item.variation?.id || null;

        if (selectedVariationId) {
          return itemProductId == selectedProductIdNum &&
            itemVariationId == selectedVariationId;
        } else {
          return itemProductId == selectedProductIdNum;
        }
      });
      if (!hasProduct) return false;

      if (performanceView === 'overall') {
        return statusMatch && companyMatch;
      }

      const saleYear = sale.year || new Date(sale.createdAt || sale.date).getFullYear();
      const saleMonth = sale.month || (new Date(sale.createdAt || sale.date).getMonth() + 1);

      const yearMatch = saleYear === performanceYear;
      const monthMatch = performanceView === 'month' ? saleMonth === performanceMonth : true;

      return statusMatch && companyMatch && yearMatch && monthMatch;
    });

    const branchData = {};
    const salesByBranch = {};

    companySales.forEach(sale => {
      const branchName = sale.branch?.branchName || 'Unknown Branch';

      sale.items?.forEach(item => {
        const itemProductId = item.product?.id;
        const itemVariationId = item.variation?.id || null;

        let matches = false;
        if (selectedVariationId) {
          matches = itemProductId == selectedProductIdNum &&
            itemVariationId == selectedVariationId;
        } else {
          matches = itemProductId == selectedProductIdNum;
        }

        if (matches) {
          if (!branchData[branchName]) {
            branchData[branchName] = {
              branchName: branchName,
              branchCode: sale.branch?.branchCode || 'N/A',
              sales: 0,
              quantity: 0,
              salesCount: 0
            };
            salesByBranch[branchName] = new Set();
          }
          branchData[branchName].sales += item.amount || 0;
          branchData[branchName].quantity += item.quantity || 0;
          salesByBranch[branchName].add(sale.id);
        }
      });
    });

    Object.keys(branchData).forEach(branchName => {
      branchData[branchName].salesCount = salesByBranch[branchName].size;
    });

    return Object.values(branchData).sort((a, b) => b.sales - a.sales);
  }, [selectedProductId, productSalesData, sales, performanceView, performanceYear, performanceMonth]);

  const getFilteredAlerts = useMemo(() => {
    // For now, return all alerts
    // You can implement filtering logic here based on your needs
    return alerts;
  }, [alerts]);

  // Derived data
  const cards = useMemo(() => {
    const totalAlerts = alerts.length;
    return [
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
      },
      {
        title: 'Active Sales',
        value: formatCurrency(stats.activeRevenue),
        icon: PesoIcon,
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
    ];
  }, [stats, alerts]);

  const chartData = useMemo(() => {
    const data = getMonthlySalesData();
    return {
      labels: data.map(d => d.month),
      datasets: [
        {
          label: 'Active Revenue',
          data: data.map(d => d.activeRevenue),
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
  }, [getMonthlySalesData]);

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

  useEffect(() => {
    if (sales.length > 0) {
      loadPerformance(sales, products);
      generateInsights();
    }
  }, [sales, products, performanceView, performanceYear, performanceMonth, selectedProductId]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAlerts();
    }, 300000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  useEffect(() => {
    loadStats();
    loadAlerts();
  }, []);

  return {
    stats,
    alerts,
    cards,
    businessInsights,
    recentSales,
    performanceData,
    productSalesData,
    monthlySalesData: getMonthlySalesData(),
    salesByStatus: getSalesByStatus(),
    productMonthlyData: getProductMonthlySales(),
    filteredTopProducts: performanceData.topProducts || [],

    // State
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
    selectedCompanyForBranches,
    setSelectedCompanyForBranches,
    selectedCompanyForTopBranches,
    setSelectedCompanyForTopBranches,
    selectedProduct,
    setSelectedProduct,
    performanceYear,
    setPerformanceYear,
    performanceView,
    setPerformanceView,
    performanceMonth,
    setPerformanceMonth,

    loadStats,
    loadAlerts,
    generateInsights,
    getMonthlySalesData,
    getProductMonthlySales,
    getCompanyBranchBreakdown,
    getProductChartData,
    getSelectedProductStats,
    getFilteredAlerts,
    chartData,
    availableBranches,
    availableYears: useMemo(() => 
      [...new Set(sales
        .map(s => s.year || new Date(s.createdAt || s.date).getFullYear())
        .filter(year => !isNaN(year) && year > 1900)
      )].sort((a, b) => b - a),
      [sales]
    ),
    productCategories,
    companies,
    sales,
    products,
    actionLoading,
    loadingMessage
  };
};