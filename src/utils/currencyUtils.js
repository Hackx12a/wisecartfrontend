export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₱0.00';
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-PH');
};

export const formatPercentage = (num) => {
  if (num === null || num === undefined) return '0%';
  return `${Number(num).toFixed(1)}%`;
};