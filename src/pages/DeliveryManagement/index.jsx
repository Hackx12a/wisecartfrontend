// src/pages/DeliveryManagement/index.jsx
import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import DeliveryTable from '../../components/tables/DeliveryTable';
import DeliveryFilters from '../../components/filters/DeliveryFilters';
import DeliveryFormModal from '../../components/modals/DeliveryFormModal';
import DeliveryViewModal from '../../components/modals/DeliveryViewModal';
import DeliveryReceiptModal from '../../components/modals/DeliveryReceiptModal';
import  {useDeliveries}  from '../../hooks/useDeliveries';
import { api } from '../../services/api';
import '../../styles/deliveryReceipt.css'

const DeliveryManagement = () => {
  const {
    deliveries,
    branches,
    products,
    warehouses,
    companies,
    loading,
    loadData,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    saveReceiptDetails,
    getDeliveryDetails,
    validateDeliveryForm,
    prepareProductOptions,
    sortDeliveriesByStatus,
    filterDeliveries
  } = useDeliveries();

  const [modalState, setModalState] = useState({
    show: false,
    mode: null,
    delivery: null
  });
  const [receiptModalState, setReceiptModalState] = useState({
    show: false,
    receiptData: null
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterData, setFilterData] = useState({
    companyId: '',
    branchId: '',
    warehouseId: '',
    status: '',
    startDate: '',
    endDate: '',
    receiptNumber: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const filteredDeliveries = sortDeliveriesByStatus(
    filterDeliveries(deliveries, filterData)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeliveries = filteredDeliveries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

  const handleOpenModal = (mode, delivery = null) => {
    if (mode === 'edit' && delivery?.status === 'DELIVERED') {
      alert('Cannot edit a delivery that has already been DELIVERED.');
      return;
    }
    
    setModalState({ show: true, mode, delivery });
  };

  const handleCloseModal = () => {
    setModalState({ show: false, mode: null, delivery: null });
  };

  const handleViewDelivery = async (delivery) => {
    try {
      setActionLoading(true);
      setLoadingMessage('Loading delivery details...');
      
      const response = await getDeliveryDetails(delivery.id);
      if (response.success) {
        setModalState({ 
          show: true, 
          mode: 'view', 
          delivery: response.data 
        });
      } else {
        alert(response.error || 'Failed to load delivery details');
      }
    } catch (error) {
      alert('Failed to load delivery details: ' + error.message);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSaveDelivery = async (formData) => {
    const errors = validateDeliveryForm(formData, products, warehouses);
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    try {
      setActionLoading(true);
      setLoadingMessage(modalState.mode === 'create' ? 'Creating delivery...' : 'Updating delivery...');

      const deliveryData = {
        ...formData,
        date: formData.datePrepared || null,
        datePrepared: formData.datePrepared || null,
        dateDelivered: formData.status === 'DELIVERED' && formData.dateDelivered
          ? formData.dateDelivered
          : null
      };

      if (formData.status !== 'DELIVERED') {
        delete deliveryData.dateDelivered;
      }

      // Stock validation
      for (const item of formData.items) {
        const stockResponse = await api.get(
          item.variationId
            ? `/stocks/warehouses/${item.warehouseId}/products/${item.productId}/variations/${item.variationId}`
            : `/stocks/warehouses/${item.warehouseId}/products/${item.productId}`
        );

        const quantityNeeded = item.preparedQty || 0;
        const originalReserved = item.originalPreparedQty || 0;
        const effectiveAvailableStock = (stockResponse.data?.availableQuantity || 0) + originalReserved;

        if (!stockResponse.success || effectiveAvailableStock < quantityNeeded) {
          const product = products.find(p => p.id === item.productId);
          const warehouse = warehouses.find(w => w.id === item.warehouseId);

          let productName = product?.productName || 'Unknown Product';
          if (item.variationId && product?.variations) {
            const variation = product.variations.find(v => v.id === item.variationId);
            if (variation) {
              productName = `${productName} (${variation.combinationDisplay || 'Variation'})`;
            }
          }

          alert(`Insufficient stock for product "${productName}" in warehouse "${warehouse?.warehouseName}".\n\nAvailable (including reserved): ${effectiveAvailableStock}\nRequested: ${quantityNeeded}`);
          return;
        }
      }

      let result;
      if (modalState.mode === 'create') {
        result = await createDelivery(deliveryData);
      } else {
        result = await updateDelivery(modalState.delivery.id, deliveryData);
      }

      if (result.success) {
        alert(`Delivery ${modalState.mode === 'create' ? 'created' : 'updated'} successfully!`);
        handleCloseModal();
        setCurrentPage(1);
      } else {
        alert(result.error || 'Failed to save delivery');
      }
    } catch (error) {
      alert('Failed to save delivery: ' + error.message);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleDeleteDelivery = async (id) => {
    const delivery = deliveries.find(d => d.id === id);
    const userRole = localStorage.getItem('userRole') || 'USER';

    let confirmMessage = 'Are you sure you want to delete this delivery?';

    if (delivery?.status === 'DELIVERED') {
      if (userRole !== 'ADMIN') {
        alert('⚠️ PERMISSION DENIED\n\nOnly administrators can delete delivered deliveries.\n\nPlease contact your system administrator.');
        return;
      }
      confirmMessage = '⚠️ ADMIN ACTION REQUIRED\n\nYou are about to delete a DELIVERED delivery.\nThis action will reverse all stock movements.\n\nAre you sure you want to proceed?';
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      setLoadingMessage('Deleting delivery...');

      const result = await deleteDelivery(id);
      if (result.success) {
        alert('Delivery deleted successfully');
        if (filteredDeliveries.length % itemsPerPage === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        alert(result.error || 'Failed to delete delivery');
      }
    } catch (error) {
      alert(error.message || 'Failed to delete delivery');
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateReceipt = async (delivery) => {
    try {
      setActionLoading(true);
      setLoadingMessage('Generating receipt...');

      const response = await getDeliveryDetails(delivery.id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load delivery');
      }

      const fullDelivery = response.data;
      const receipt = {
        id: fullDelivery.id,
        deliveryReceiptNumber: fullDelivery.deliveryReceiptNumber || '',
        deliveryReceiptNumberDisplay: '',
        date: new Date(fullDelivery.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        branchName: fullDelivery.branch?.branchName || delivery.branchName,
        companyName: fullDelivery.company?.companyName || delivery.companyName,
        companyTin: fullDelivery.branch?.tin || fullDelivery.company?.tin || 'N/A',
        branchAddress: `${fullDelivery.branch?.address || ''}, ${fullDelivery.branch?.city || ''}, ${fullDelivery.branch?.province || ''}`.trim(),
        preparedBy: fullDelivery.preparedBy || localStorage.getItem('fullName') || '',
        purchaseOrderNumber: fullDelivery.purchaseOrderNumber || '',
        termsOfPayment: fullDelivery.termsOfPayment || '',
        businessStyle: fullDelivery.businessStyle || '',
        remarks: fullDelivery.remarks || '',
        items: fullDelivery.items?.map(item => ({
          ...item,
          warehouseName: item.warehouse?.warehouseName || 'N/A',
          warehouseCode: item.warehouse?.warehouseCode || 'N/A'
        })) || [],
        extraHeader: fullDelivery.extraHeader || 'EXTRA',
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
      };

      setReceiptModalState({ show: true, receiptData: receipt });
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt: ' + error.message);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSaveReceipt = async (receiptData) => {
    try {
      const result = await saveReceiptDetails(receiptData.id, receiptData);
      if (result.success) {
        alert('Receipt details saved successfully!');
        await loadData();
      } else {
        alert(result.error || 'Failed to save receipt details');
      }
    } catch (error) {
      alert('Failed to save receipt details: ' + error.message);
    }
  };

  const handleFilterChange = (updates) => {
    setFilterData(prev => ({ ...prev, ...updates }));
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setFilterData({
      companyId: '',
      branchId: '',
      warehouseId: '',
      status: '',
      startDate: '',
      endDate: '',
      receiptNumber: ''
    });
    setCurrentPage(1);
  };

  const productOptions = prepareProductOptions(products);

  return (
    <>
      <LoadingOverlay show={actionLoading} message={loadingMessage || 'Loading...'} />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Management</h1>
            <p className="text-gray-600">Track and manage product deliveries to branches</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => handleOpenModal('create')}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus size={20} />
              <span>New Delivery</span>
            </button>
          </div>

          <DeliveryFilters
            filterData={filterData}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilter}
            companies={companies}
            branches={branches}
            warehouses={warehouses}
          />

          <DeliveryTable
            deliveries={currentDeliveries}
            onView={handleViewDelivery}
            onEdit={(delivery) => handleOpenModal('edit', delivery)}
            onDelete={handleDeleteDelivery}
            onPrint={handleGenerateReceipt}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredDeliveries.length}
            isLoading={loading}
          />

          {/* Modals */}
          {modalState.show && modalState.mode === 'view' && modalState.delivery && (
            <DeliveryViewModal
              delivery={modalState.delivery}
              onClose={handleCloseModal}
              onEdit={() => {
                handleCloseModal();
                setTimeout(() => handleOpenModal('edit', modalState.delivery), 100);
              }}
              onPrint={handleGenerateReceipt}
              isLoading={actionLoading}
            />
          )}

          {modalState.show && (modalState.mode === 'create' || modalState.mode === 'edit') && (
            <DeliveryFormModal
              mode={modalState.mode}
              delivery={modalState.delivery}
              onClose={handleCloseModal}
              onSave={handleSaveDelivery}
              branches={branches}
              products={products}
              warehouses={warehouses}
              companies={companies}
              isLoading={actionLoading}
            />
          )}

          {receiptModalState.show && receiptModalState.receiptData && (
            <DeliveryReceiptModal
              receiptData={receiptModalState.receiptData}
              onClose={() => setReceiptModalState({ show: false, receiptData: null })}
              onSave={handleSaveReceipt}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default DeliveryManagement;