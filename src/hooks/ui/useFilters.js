import { useState } from 'react';

export const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    setFilters(initialFilters);
  };
  
  return {
    filters,
    updateFilter,
    clearFilters,
    setFilters
  };
};

export const useTransactionFilters = () => {
  return useFilters({
    type: 'ALL',
    verifiedBy: '',
    startDate: '',
    endDate: '',
    minItems: '',
    maxItems: ''
  });
};

export const useWarehouseFilters = () => {
  return useFilters({
    warehouse: '',
    minQty: '',
    maxQty: '',
    startDate: '',
    endDate: ''
  });
};

export const useBranchFilters = () => {
  return useFilters({
    branch: '',
    minQty: '',
    maxQty: '',
    startDate: '',
    endDate: ''
  });
};