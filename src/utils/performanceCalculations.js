export const calculateRevenueGrowth = (sales) => {
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
  
  if (prevMonthRevenue === 0) return thisMonthRevenue > 0 ? 100 : 0;
  return ((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100);
};

export const calculateSalesVelocity = (sales, days = 30) => {
  const recentSales = sales.filter(s => {
    const saleDate = new Date(s.createdAt || s.date);
    const daysDiff = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= days && (s.status === 'CONFIRMED' || s.status === 'INVOICED');
  });
  
  return recentSales.length / days;
};

export const normalizeStatus = (status) => {
  return (status === 'CONFIRMED' || status === 'INVOICED') ? 'ACTIVE' : status;
};