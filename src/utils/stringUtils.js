export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return '-';
  }
};

export const getDaysSinceCreation = (dateString) => {
  if (!dateString) return null;
  try {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return null;
  }
};

export const validateUPC = (upc) => {
  if (!upc) return { valid: false, message: 'UPC is required' };
  if (upc.length !== 13) return { valid: false, message: 'UPC must be exactly 13 digits' };
  if (!/^\d+$/.test(upc)) return { valid: false, message: 'UPC must contain only numbers' };
  return { valid: true, message: '' };
};

export const formatDimensions = (length, width, height) => {
  if (!length && !width && !height) return '-';
  const l = length || '0';
  const w = width || '0';
  const h = height || '0';
  return `${l}×${w}×${h} cm`;
};