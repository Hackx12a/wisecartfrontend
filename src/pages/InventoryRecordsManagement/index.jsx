// src/pages/InventoryRecordsManagement/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Check } from 'lucide-react';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import InventoryFilters from '../../components/filters/InventoryFilters';
import InventoryTable from '../../components/tables/InventoryTable';
import InventoryFormModal from '../../components/modals/InventoryFormModal';
import InventoryViewModal from '../../components/modals/InventoryViewModal';
import Pagination from '../../components/common/Pagination';
import useInventory from '../../hooks/data/useInventory';
import usePagination from '../../hooks/ui/usePagination';
import { getCurrentUser, isAdmin } from '../../utils/authUtils';
import { api } from '../../services/api';

const InventoryRecordsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [fromWarehouseFilter, setFromWarehouseFilter] = useState('');
  const [fromBranchFilter, setFromBranchFilter] = useState('');
  const [toWarehouseFilter, setToWarehouseFilter] = useState('');
  const [toBranchFilter, setToBranchFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  
  const [selectedProductForAdd, setSelectedProductForAdd] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);
  
  const [formData, setFormData] = useState({
    inventoryType: 'STOCK_IN',
    fromWarehouseId: '',
    toWarehouseId: '',
    fromBranchId: '',
    toBranchId: '',
    dateProcessed: new Date().toISOString().split('T')[0],
    processedBy: getCurrentUser(),
    remarks: '',
    status: 'PENDING',
    confirmedBy: '',
    items: []
  });

  // Custom hooks
  const {
    inventories,
    loading,
    canModifyStatus,
    warehouseStocks,
    branchStocks,
    loadingStocks,
    loadData,
    loadLocationStock,
    checkCanModify,
    confirmInventory,
    deleteInventory,
    updateInventory,
    createInventory,
    setWarehouseStocks,
    setBranchStocks
  } = useInventory();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setActionLoading(true);
        setLoadingMessage('Loading data...');
        
        const [productsRes, warehousesRes, branchesRes] = await Promise.all([
          api.get('/products'),
          api.get('/warehouse'),
          api.get('/branches')
        ]);

        const productsData = productsRes.success ? productsRes.data || [] : [];
        const warehousesData = warehousesRes.success ? warehousesRes.data || [] : [];
        const branchesData = branchesRes.success ? branchesRes.data || [] : [];

        setProducts(productsData);
        setWarehouses(warehousesData);
        setBranches(branchesData);
        
        await loadData();
      } catch (error) {
        console.error('Failed to load initial data', error);
        alert('Failed to load data: ' + error.message);
      } finally {
        setActionLoading(false);
        setLoadingMessage('');
      }
    };

    loadInitialData();
  }, [loadData]);

  // Memoized product options
  const productOptions = useMemo(() => {
    return products.flatMap(p => {
      const truncateProductName = (name) => {
        if (!name) return '';
        const words = name.trim().split(/\s+/);
        if (words.length <= 10) return name;
        return words.slice(0, 10).join(' ') + '...';
      };

      if (p.variations && p.variations.length > 0) {
        return p.variations.map(v => {
          const uniqueId = `${p.id}_${v.id}`;
          const truncatedName = truncateProductName(p.productName);
          const upc = v.upc || p.upc || 'No UPC';
          const sku = v.sku || p.sku || 'No SKU';
          const displayName = truncatedName;

          return {
            id: uniqueId,
            parentProductId: p.id,
            variationId: v.id,
            originalProductId: p.id,
            originalVariationId: v.id,
            name: displayName,
            subLabel: v.combinationDisplay || 'Variation',
            fullName: p.productName,
            upc: upc,
            sku: sku,
            price: v.price || p.price,
            isVariation: true
          };
        });
      } else {
        const uniqueId = `prod_${p.id}`;
        const truncatedName = truncateProductName(p.productName);
        const upc = p.upc || 'No UPC';
        const sku = p.sku || 'No SKU';
        const displayName = truncatedName;

        return [{
          id: uniqueId,
          parentProductId: p.id,
          variationId: null,
          originalProductId: p.id,
          originalVariationId: null,
          name: displayName,
          subLabel: 'No variations',
          fullName: p.productName,
          upc: upc,
          sku: sku,
          price: p.price,
          isVariation: false
        }];
      }
    });
  }, [products]);

  // Filter inventories
  const filteredInventories = inventories.filter(inventory => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      inventory.processedBy?.toLowerCase().includes(searchLower) ||
      inventory.remarks?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || inventory.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || inventory.inventoryType === typeFilter;

    const matchesFromWarehouse = !fromWarehouseFilter || inventory.fromWarehouse?.id === parseInt(fromWarehouseFilter);
    const matchesToWarehouse = !toWarehouseFilter || inventory.toWarehouse?.id === parseInt(toWarehouseFilter);
    const matchesFromBranch = !fromBranchFilter || inventory.fromBranch?.id === parseInt(fromBranchFilter);
    const matchesToBranch = !toBranchFilter || inventory.toBranch?.id === parseInt(toBranchFilter);

    const inventoryDate = new Date(inventory.dateProcessed);
    const matchesStartDate = !startDateFilter || inventoryDate >= new Date(startDateFilter);
    const matchesEndDate = !endDateFilter || inventoryDate <= new Date(endDateFilter + 'T23:59:59');

    return matchesSearch && matchesStatus && matchesType &&
      matchesFromWarehouse && matchesToWarehouse &&
      matchesFromBranch && matchesToBranch &&
      matchesStartDate && matchesEndDate;
  });

  // Sort by status (PENDING first, then CONFIRMED)
  const sortedInventories = [...filteredInventories].sort((a, b) => {
    const isAConfirmed = a.status === 'CONFIRMED' ? 1 : 0;
    const isBConfirmed = b.status === 'CONFIRMED' ? 1 : 0;
    if (isAConfirmed !== isBConfirmed) {
      return isAConfirmed - isBConfirmed;
    }
    return 0;
  });

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    currentItems: currentInventories,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    nextPage,
    prevPage
  } = usePagination(sortedInventories, 10);

  // Modal handlers
  const handleOpenModal = async (mode, inventory = null) => {
    setModalMode(mode);

    if (mode === 'create') {
      setSelectedInventory(null);
      setFormData({
        inventoryType: 'STOCK_IN',
        fromWarehouseId: '',
        toWarehouseId: '',
        fromBranchId: '',
        toBranchId: '',
        dateProcessed: new Date().toISOString().split('T')[0],
        processedBy: getCurrentUser(),
        remarks: '',
        status: 'PENDING',
        confirmedBy: '',
        items: []
      });
      setWarehouseStocks({});
      setBranchStocks({});
      setShowModal(true);
    } else if (mode === 'edit' && inventory) {
      if (inventory.status === 'CONFIRMED') {
        alert('⚠️ CONFIRMED INVENTORY CANNOT BE EDITED\n\n' +
          'Once an inventory is confirmed, it cannot be edited.\n\n' +
          'Stock changes have been applied to the system.\n\n' +
          'If you need to make changes:\n' +
          '1. Delete this record (admin only, if stock hasn\'t been used)\n' +
          '2. Create a new inventory record with the correct information\n\n' +
          'Contact your administrator for assistance.');
        return;
      }

      try {
        setActionLoading(true);
        setLoadingMessage('Loading inventory details...');

        const fullInventoryRes = await api.get(`/inventories/${inventory.id}`);
        if (!fullInventoryRes.success) {
          throw new Error(fullInventoryRes.error || 'Failed to load inventory');
        }

        const fullInventory = fullInventoryRes.data;
        setSelectedInventory(fullInventory);
        
        setFormData({
          inventoryType: fullInventory.inventoryType,
          fromWarehouseId: fullInventory.fromWarehouse?.id || '',
          toWarehouseId: fullInventory.toWarehouse?.id || '',
          fromBranchId: fullInventory.fromBranch?.id || '',
          toBranchId: fullInventory.toBranch?.id || '',
          dateProcessed: fullInventory.dateProcessed,
          processedBy: fullInventory.processedBy,
          remarks: fullInventory.remarks || '',
          status: 'PENDING',
          confirmedBy: fullInventory.confirmedBy || '',
          items: fullInventory.items.map(item => ({
            productId: item.product.id,
            variationId: item.variationId || null,
            quantity: item.quantity
          }))
        });

        setWarehouseStocks({});
        setBranchStocks({});

        // Load stock for each item
        for (let i = 0; i < fullInventory.items.length; i++) {
          const item = fullInventory.items[i];
          if (item.product?.id) {
            const locationType = fullInventory.fromWarehouse ? 'warehouse' : fullInventory.fromBranch ? 'branch' : 
                               fullInventory.toWarehouse ? 'warehouse' : 'branch';
            const locationId = fullInventory.fromWarehouse?.id || fullInventory.fromBranch?.id || 
                             fullInventory.toWarehouse?.id || fullInventory.toBranch?.id;
            
            if (locationId && locationType) {
              await loadLocationStock(
                item.product.id,
                item.variationId || null,
                i,
                locationId,
                locationType
              );
            }
          }
        }

        setActionLoading(false);
        setLoadingMessage('');
        setShowModal(true);
      } catch (error) {
        console.error('Failed to load inventory details');
        alert('Failed to load inventory details: ' + error.message);
        setActionLoading(false);
        setLoadingMessage('');
      }
    } else if (mode === 'view' && inventory) {
      try {
        setActionLoading(true);
        setLoadingMessage('Loading inventory details...');

        const fullInventoryRes = await api.get(`/inventories/${inventory.id}`);
        if (fullInventoryRes.success) {
          setSelectedInventory(fullInventoryRes.data);
        }

        setActionLoading(false);
        setLoadingMessage('');
        setShowModal(true);
      } catch (error) {
        console.error('Failed to load inventory details:', error);
        setActionLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInventory(null);
    setSelectedProductForAdd('');
    setWarehouseStocks({});
    setBranchStocks({});
  };

  // Form handlers
  const handleAddProductToTable = () => {
    if (!selectedProductForAdd) {
      alert('Please select a product first');
      return;
    }

    const selectedOption = productOptions.find(opt => opt.id === selectedProductForAdd);
    if (!selectedOption) {
      alert('Product not found');
      return;
    }

    const isDuplicate = formData.items.some((item) => {
      return (
        item.productId === selectedOption.parentProductId &&
        item.variationId === selectedOption.variationId
      );
    });

    if (isDuplicate) {
      alert('⚠️ This product variation is already added!\n\nPlease select a different variation or update the quantity of the existing item.');
      return;
    }

    // Check stock availability
    if (formData.inventoryType !== 'STOCK_IN') {
      const hasLocation = formData.fromWarehouseId || formData.fromBranchId ||
        formData.toWarehouseId || formData.toBranchId;

      if (hasLocation) {
        const stockInfo = getItemStockInfo(-1, selectedOption.parentProductId, selectedOption.variationId);
        if (stockInfo) {
          const availableQty = stockInfo.availableQuantity ?? stockInfo.quantity ?? 0;
          if (availableQty === 0) {
            alert('❌ Cannot add this product!\n\n' +
              `Product: ${selectedOption.fullName}\n` +
              `Available Stock: ${availableQty}\n\n` +
              'This product has no available stock at the selected location.\n' +
              'Please select a different product or location.');
            return;
          }
        }
      }
    }

    const newItem = {
      productId: selectedOption.parentProductId,
      variationId: selectedOption.variationId,
      quantity: 1
    };

    const newItems = [...formData.items, newItem];
    setFormData({ ...formData, items: newItems });

    const hasLocation = formData.fromWarehouseId || formData.fromBranchId ||
      formData.toWarehouseId || formData.toBranchId;

    if (hasLocation) {
      setTimeout(() => {
        const locationType = formData.fromWarehouseId ? 'warehouse' : formData.fromBranchId ? 'branch' :
                           formData.toWarehouseId ? 'warehouse' : 'branch';
        const locationId = formData.fromWarehouseId || formData.fromBranchId || 
                         formData.toWarehouseId || formData.toBranchId;
        
        loadLocationStock(
          selectedOption.originalProductId,
          selectedOption.originalVariationId,
          newItems.length - 1,
          locationId,
          locationType
        );
      }, 0);
    }

    setSelectedProductForAdd('');
  };

  const handleItemChange = async (index, field, value) => {
    const newItems = [...formData.items];

    if (field === 'productId') {
      const selectedOption = productOptions.find(opt => opt.id === value);
      if (selectedOption) {
        const isDuplicate = formData.items.some((item, idx) => {
          if (idx === index) return false;
          return (
            item.productId === selectedOption.parentProductId &&
            item.variationId === selectedOption.variationId
          );
        });

        if (isDuplicate) {
          alert('⚠️ This product variation is already added!\n\nPlease select a different variation or update the quantity of the existing item.');
          return;
        }

        newItems[index] = {
          ...newItems[index],
          productId: selectedOption.parentProductId,
          variationId: selectedOption.variationId,
        };

        setFormData({ ...formData, items: newItems });

        const hasLocation = formData.fromWarehouseId || formData.fromBranchId ||
          formData.toWarehouseId || formData.toBranchId;

        if (hasLocation) {
          setTimeout(() => {
            const locationType = formData.fromWarehouseId ? 'warehouse' : formData.fromBranchId ? 'branch' :
                               formData.toWarehouseId ? 'warehouse' : 'branch';
            const locationId = formData.fromWarehouseId || formData.fromBranchId || 
                             formData.toWarehouseId || formData.toBranchId;
            
            loadLocationStock(
              selectedOption.originalProductId,
              selectedOption.originalVariationId,
              index,
              locationId,
              locationType
            );
          }, 0);
        }
        return;
      }
    } else if (field === 'quantity') {
      const newQuantity = parseInt(value) || 1;

      // Validate quantity against available stock
      if (formData.inventoryType !== 'STOCK_IN') {
        const item = newItems[index];
        const stockInfo = getItemStockInfo(index, item.productId, item.variationId);
        if (stockInfo) {
          const availableQty = stockInfo.availableQuantity ?? stockInfo.quantity ?? 0;
          if (newQuantity > availableQty) {
            const selectedOption = productOptions.find(opt =>
              opt.originalProductId === item.productId &&
              opt.originalVariationId === item.variationId
            );

            alert('❌ Quantity Exceeds Available Stock!\n\n' +
              `Product: ${selectedOption?.fullName || 'Unknown'}\n` +
              `Available Stock: ${availableQty}\n` +
              `Requested Quantity: ${newQuantity}\n\n` +
              'Please enter a quantity that does not exceed the available stock.');
            return;
          }
        }
      }

      newItems[index][field] = newQuantity;
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });

    const newWarehouseStocks = { ...warehouseStocks };
    const newBranchStocks = { ...branchStocks };

    Object.keys(warehouseStocks).forEach(key => {
      if (key.startsWith(`${index}_`)) {
        delete newWarehouseStocks[key];
      }
    });

    Object.keys(branchStocks).forEach(key => {
      if (key.startsWith(`${index}_`)) {
        delete newBranchStocks[key];
      }
    });

    setWarehouseStocks(newWarehouseStocks);
    setBranchStocks(newBranchStocks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.processedBy) {
      alert('Please enter processed by name');
      return;
    }

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    // Check for duplicates
    const duplicates = formData.items.filter((item, index) =>
      formData.items.findIndex(i =>
        i.productId === item.productId &&
        i.variationId === item.variationId
      ) !== index
    );

    if (duplicates.length > 0) {
      alert('Error: Duplicate items detected!');
      return;
    }

    // Final validation for stock availability
    if (formData.inventoryType !== 'STOCK_IN') {
      const stockErrors = [];
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        const stockInfo = getItemStockInfo(i, item.productId, item.variationId);
        if (stockInfo) {
          const availableQty = stockInfo.availableQuantity ?? stockInfo.quantity ?? 0;
          if (item.quantity > availableQty) {
            const selectedOption = productOptions.find(opt =>
              opt.originalProductId === item.productId &&
              opt.originalVariationId === item.variationId
            );
            stockErrors.push({
              product: selectedOption?.fullName || `Product ${item.productId}`,
              requested: item.quantity,
              available: availableQty
            });
          }
        }
      }

      if (stockErrors.length > 0) {
        const errorMessage = '❌ Cannot submit - Stock availability issues:\n\n' +
          stockErrors.map(err =>
            `• ${err.product}\n  Requested: ${err.requested} | Available: ${err.available}`
          ).join('\n\n') +
          '\n\nPlease adjust quantities or remove items with insufficient stock.';
        alert(errorMessage);
        return;
      }
    }

    try {
      setActionLoading(true);
      setLoadingMessage(modalMode === 'create' ? 'Creating inventory record...' : 'Updating inventory record...');
      
      const payload = {
        ...formData,
        status: 'PENDING'
      };

      if (modalMode === 'create') {
        await createInventory(payload);
        alert('Inventory record created successfully as PENDING!');
      } else {
        await updateInventory(selectedInventory.id, payload);
        alert('Inventory record updated successfully!');
      }

      handleCloseModal();
      await loadData();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to save inventory:', error);
      alert('Failed to save inventory: ' + error.message);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleConfirmInventory = async (inventory, confirmedByUser = null) => {
    let locationInfo = '';
    if (inventory.inventoryType === 'STOCK_IN') {
      locationInfo = `\n📦 Adding stock to: ${inventory.toWarehouse?.warehouseName || inventory.toBranch?.branchName}`;
    } else if (inventory.inventoryType === 'TRANSFER') {
      const from = inventory.fromWarehouse?.warehouseName || inventory.fromBranch?.branchName;
      const to = inventory.toWarehouse?.warehouseName || inventory.toBranch?.branchName;
      locationInfo = `\n📦 Transfer from: ${from}\n📍 Transfer to: ${to}`;
    } else if (inventory.inventoryType === 'RETURN') {
      const from = inventory.fromBranch?.branchName;
      const to = inventory.toWarehouse?.warehouseName;
      locationInfo = `\n📦 Return from: ${from}\n📍 Return to: ${to}`;
    } else if (inventory.inventoryType === 'DAMAGE') {
      locationInfo = `\n📦 Mark damaged at: ${inventory.toWarehouse?.warehouseName || inventory.toBranch?.branchName}`;
    }

    const itemCount = inventory.items?.length || 0;
    const totalQty = inventory.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    const confirmMessage = `Are you sure you want to confirm this ${inventory.inventoryType} record?${locationInfo}\n\n📊 Items: ${itemCount}\n📦 Total Quantity: ${totalQty}\n\n⚠️ This will update stock levels and cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const currentUser = confirmedByUser || getCurrentUser() || 'System';

    try {
      setActionLoading(true);
      setLoadingMessage('Confirming inventory...');
      
      await confirmInventory(inventory.id, currentUser);
      
      alert(`✅ Inventory confirmed successfully!\n\n${inventory.inventoryType} record has been processed and stock levels have been updated.`);
      await loadData();
    } catch (error) {
      console.error('Failed to confirm inventory:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`❌ Failed to confirm inventory:\n\n${errorMsg}\n\nPlease check stock availability and try again.`);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDelete = async (id) => {
    const inventory = inventories.find(inv => inv.id === id);
    const userRole = localStorage.getItem('userRole') || 'USER';

    if (inventory && inventory.status === 'CONFIRMED') {
      if (userRole !== 'ADMIN') {
        alert('⚠️ PERMISSION DENIED\n\nOnly administrators can delete CONFIRMED inventory records.\n\nPlease contact your system administrator if you need to delete this record.');
        return;
      }

      try {
        setActionLoading(true);
        setLoadingMessage('Checking if inventory can be deleted...');

        const canModify = await checkCanModify(id);
        setActionLoading(false);
        setLoadingMessage('');

        if (!canModify) {
          alert('❌ Cannot delete this inventory record\n\nThe stock from this inventory has already been used in deliveries or sales.\n\nDeleting this would create stock inconsistencies.\n\nContact your administrator if you need to adjust this record.');
          return;
        }

        const confirmDelete = window.confirm(
          '⚠️ Warning: Deleting CONFIRMED Inventory\n\n' +
          'This inventory has been confirmed but the stock hasn\'t been used yet.\n\n' +
          'Deleting will:\n' +
          '• Permanently remove this inventory record\n' +
          '• Reverse all stock changes that were applied\n' +
          '• Cannot be undone\n\n' +
          'Are you absolutely sure you want to delete this record?'
        );

        if (!confirmDelete) {
          return;
        }
      } catch (error) {
        console.error('Error checking if can modify:', error);
        setActionLoading(false);
        setLoadingMessage('');
        alert('Failed to check if inventory can be deleted. Please try again.');
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this inventory record?')) {
        return;
      }
    }

    try {
      setActionLoading(true);
      setLoadingMessage('Deleting inventory record...');

      await deleteInventory(id);
      alert('✅ Inventory deleted successfully');
      await loadData();
      
      if (filteredInventories.length % 10 === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      alert('❌ Failed to delete: ' + error.message);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleInventoryTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      inventoryType: type,
      fromWarehouseId: (type === 'STOCK_IN' || type === 'DAMAGE') ? '' : prev.fromWarehouseId,
      fromBranchId: (type === 'STOCK_IN' || type === 'DAMAGE') ? '' : prev.fromBranchId,
      items: []
    }));
    setWarehouseStocks({});
    setBranchStocks({});
  };

  const handleLocationChange = async (type, val) => {
    const [locationType, locationId] = val ? val.split('|') : [null, null];
    const warehouseId = locationType === 'warehouse' ? (locationId ? parseInt(locationId, 10) : null) : null;
    const branchId = locationType === 'branch' ? (locationId ? parseInt(locationId, 10) : null) : null;

    const newFormData = {
      ...formData,
      [`${type}WarehouseId`]: warehouseId,
      [`${type}BranchId`]: branchId
    };

    setFormData(newFormData);
    setWarehouseStocks({});
    setBranchStocks({});

    if (newFormData.items.length > 0 && (warehouseId || branchId)) {
      for (let i = 0; i < newFormData.items.length; i++) {
        const item = newFormData.items[i];
        if (item.productId) {
          setTimeout(() => {
            loadLocationStock(
              item.productId,
              item.variationId,
              i,
              warehouseId || branchId,
              warehouseId ? 'warehouse' : 'branch'
            );
          }, 100);
        }
      }
    }
  };

  const getItemStockInfo = (itemIndex, productId, variationId) => {
    let locationId = null;
    const actualProductId = productId;

    const createStockKey = (locId) => {
      return variationId
        ? `${itemIndex}_${actualProductId}_${variationId}_${locId}`
        : `${itemIndex}_${actualProductId}_${locId}`;
    };

    if (formData.fromWarehouseId) {
      locationId = formData.fromWarehouseId;
      const warehouseKey = createStockKey(locationId);
      return warehouseStocks[warehouseKey];
    } else if (formData.fromBranchId) {
      locationId = formData.fromBranchId;
      const branchKey = createStockKey(locationId);
      return branchStocks[branchKey];
    } else if (formData.toWarehouseId) {
      locationId = formData.toWarehouseId;
      const warehouseKey = createStockKey(locationId);
      return warehouseStocks[warehouseKey];
    } else if (formData.toBranchId) {
      locationId = formData.toBranchId;
      const branchKey = createStockKey(locationId);
      return branchStocks[branchKey];
    }

    return null;
  };

  const clearAllFilters = () => {
    setTypeFilter('ALL');
    setFromWarehouseFilter('');
    setToWarehouseFilter('');
    setFromBranchFilter('');
    setToBranchFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  return (
    <>
      <LoadingOverlay show={loading || actionLoading} message={loadingMessage || ''} />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="p-6 max-w-full mx-auto px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Records Management</h1>
            <p className="text-gray-600">Track and manage inventory movements</p>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => handleOpenModal('create')}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus size={20} />
              <span>New Inventory Record</span>
            </button>
          </div>

          {/* Filters */}
          <InventoryFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            fromWarehouseFilter={fromWarehouseFilter}
            setFromWarehouseFilter={setFromWarehouseFilter}
            toWarehouseFilter={toWarehouseFilter}
            setToWarehouseFilter={setToWarehouseFilter}
            fromBranchFilter={fromBranchFilter}
            setFromBranchFilter={setFromBranchFilter}
            toBranchFilter={toBranchFilter}
            setToBranchFilter={setToBranchFilter}
            startDateFilter={startDateFilter}
            setStartDateFilter={setStartDateFilter}
            endDateFilter={endDateFilter}
            setEndDateFilter={setEndDateFilter}
            warehouses={warehouses}
            branches={branches}
            onClearFilters={clearAllFilters}
          />

          {/* Table */}
          <InventoryTable
            inventories={currentInventories}
            onView={(inventory) => handleOpenModal('view', inventory)}
            onEdit={(inventory) => handleOpenModal('edit', inventory)}
            onDelete={handleDelete}
            onConfirm={handleConfirmInventory}
            actionLoading={actionLoading}
            canModifyStatus={canModifyStatus}
            indexOfFirstItem={indexOfFirstItem}
            indexOfLastItem={indexOfLastItem}
          />

          {/* Pagination */}
          {sortedInventories.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onNextPage={nextPage}
              onPrevPage={prevPage}
              showingStart={indexOfFirstItem + 1}
              showingEnd={Math.min(indexOfLastItem, sortedInventories.length)}
              totalItems={sortedInventories.length}
            />
          )}

          {/* Modals */}
          {showModal && (modalMode === 'create' || modalMode === 'edit') && (
            <InventoryFormModal
              showModal={showModal}
              modalMode={modalMode}
              selectedInventory={selectedInventory}
              formData={formData}
              setFormData={setFormData}
              products={products}
              warehouses={warehouses}
              branches={branches}
              loadingStocks={loadingStocks}
              warehouseStocks={warehouseStocks}
              branchStocks={branchStocks}
              onClose={handleCloseModal}
              onSubmit={handleSubmit}
              onAddProduct={handleAddProductToTable}
              onRemoveItem={handleRemoveItem}
              onItemChange={handleItemChange}
              onInventoryTypeChange={handleInventoryTypeChange}
              onLocationChange={handleLocationChange}
              selectedProductForAdd={selectedProductForAdd}
              setSelectedProductForAdd={setSelectedProductForAdd}
              tempQuantity={tempQuantity}
              setTempQuantity={setTempQuantity}
              onConfirmInventory={handleConfirmInventory}
            />
          )}

          {showModal && modalMode === 'view' && selectedInventory && (
            <InventoryViewModal
              selectedInventory={selectedInventory}
              onClose={handleCloseModal}
              onConfirm={handleConfirmInventory}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryRecordsManagement;