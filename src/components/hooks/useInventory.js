import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const useInventory = () => {
  const [inventories, setInventories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSummaries, setProductSummaries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [warehouseStocks, setWarehouseStocks] = useState([]);
  const [branchStocks, setBranchStocks] = useState([]);
  const [sales, setSales] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading inventory data...');
      
      const [
        invRes,
        prodRes,
        warehousesRes,
        branchesRes,
        warehouseStocksRes,
        branchStocksRes,
        salesRes,
        companiesRes,
        productVariationSummariesRes
      ] = await Promise.all([
        api.get('/inventories'),
        api.get('/products'),
        api.get('/warehouse'),
        api.get('/branches'),
        api.get('/stocks/warehouses'),
        api.get('/stocks/branches'),
        api.get('/sales'),
        api.get('/companies'),
        api.get('/transactions/products/summary/variations')
      ]);

      if (productVariationSummariesRes.success) {
        setProductSummaries(productVariationSummariesRes.data || []);
      }

      setInventories(invRes.success ? invRes.data || [] : []);
      setProducts(prodRes.success ? prodRes.data || [] : []);
      setWarehouses(warehousesRes.success ? warehousesRes.data || [] : []);
      setBranches(branchesRes.success ? branchesRes.data || [] : []);
      setWarehouseStocks(warehouseStocksRes.success ? warehouseStocksRes.data || [] : []);
      setBranchStocks(branchStocksRes.success ? branchStocksRes.data || [] : []);
      setSales(salesRes.success ? salesRes.data || [] : []);
      setCompanies(companiesRes.success ? companiesRes.data || [] : []);

      try {
        const summaryRes = await api.get('/inventories/products/summary');
        if (summaryRes.success) {
          setProductSummaries(summaryRes.data || []);
        }
      } catch (summaryErr) {
        console.warn('Could not load product summaries:', summaryErr);
        setProductSummaries([]);
      }

    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, []);

  useEffect(() => {
    loadData();
    window.loadData = loadData;

    return () => {
      delete window.loadData;
    };
  }, [loadData]);

  return {
    inventories,
    products,
    productSummaries,
    warehouses,
    branches,
    warehouseStocks,
    branchStocks,
    sales,
    companies,
    loading,
    actionLoading,
    loadingMessage,
    setActionLoading,
    setLoadingMessage,
    setInventories,
    setWarehouseStocks,
    setBranchStocks,
    setProductSummaries
  };
};