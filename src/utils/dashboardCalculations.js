export const calculateDashboardStats = (sales, deliveries, products, companies) => {
  const activeSales = sales.filter(s =>
    s.status === 'CONFIRMED' || s.status === 'INVOICED'
  );
  const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING').length;
  const deliveredOrders = deliveries.filter(d => d.status === 'DELIVERED').length;
  const activeRevenue = activeSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const averageOrderValue = activeSales.length > 0 ? activeRevenue / activeSales.length : 0;
  
  const totalLeads = companies.length * 2;
  const conversionRate = sales.length > 0 ? (activeSales.length / totalLeads * 100) : 0;

  const currentMonth = new Date().getMonth();
  const thisMonthSales = sales.filter(s => {
    const saleDate = new Date(s.createdAt || s.date);
    return saleDate.getMonth() === currentMonth &&
      (s.status === 'CONFIRMED' || s.status === 'INVOICED');
  });
  const prevMonthSales = sales.filter(s => {
    const saleDate = new Date(s.createdAt || s.date);
    return saleDate.getMonth() === (currentMonth - 1 + 12) % 12 &&
      (s.status === 'CONFIRMED' || s.status === 'INVOICED');
  });
  const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const prevMonthRevenue = prevMonthSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const revenueGrowth = prevMonthRevenue > 0
    ? ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100)
    : thisMonthRevenue > 0 ? 100 : 0;

  const last30Days = sales.filter(s => {
    const saleDate = new Date(s.createdAt || s.date);
    const daysDiff = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30 && (s.status === 'CONFIRMED' || s.status === 'INVOICED');
  });
  const salesVelocity = last30Days.length / 30;

  return {
    totalSales: sales.length,
    activeSales: activeSales.length,
    activeRevenue,
    pendingDeliveries,
    lowStock: products.filter(p => p.quantity < 10).length,
    totalCompanies: companies.length,
    averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
    deliveredOrders,
    conversionRate: parseFloat(conversionRate.toFixed(1)),
    revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
    salesVelocity: parseFloat(salesVelocity.toFixed(2)),
  };
};

export const getMonthlySalesData = (sales, selectedYear, selectedCompany, selectedBranch) => {
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
};

export const getSalesByStatus = (sales) => {
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