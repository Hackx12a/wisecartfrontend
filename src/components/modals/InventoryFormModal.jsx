// src/components/modals/InventoryFormModal.jsx
import React from 'react';
import { X, Check } from 'lucide-react';
import InventoryForm from '../forms/InventoryForm';

const InventoryFormModal = ({
  showModal,
  modalMode,
  selectedInventory,
  formData,
  setFormData,
  products,
  warehouses,
  branches,
  loadingStocks,
  warehouseStocks,
  branchStocks,
  onClose,
  onSubmit,
  onAddProduct,
  onRemoveItem,
  onItemChange,
  onInventoryTypeChange,
  onLocationChange,
  selectedProductForAdd,
  setSelectedProductForAdd,
  tempQuantity,
  setTempQuantity,
  onConfirmInventory
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {modalMode === 'create' ? 'Create New Inventory Record' : 'Edit Inventory Record'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <InventoryForm
          formData={formData}
          setFormData={setFormData}
          modalMode={modalMode}
          selectedInventory={selectedInventory}
          products={products}
          warehouses={warehouses}
          branches={branches}
          loadingStocks={loadingStocks}
          warehouseStocks={warehouseStocks}
          branchStocks={branchStocks}
          onAddProduct={onAddProduct}
          onRemoveItem={onRemoveItem}
          onItemChange={onItemChange}
          onInventoryTypeChange={onInventoryTypeChange}
          onLocationChange={onLocationChange}
          selectedProductForAdd={selectedProductForAdd}
          setSelectedProductForAdd={setSelectedProductForAdd}
          tempQuantity={tempQuantity}
          setTempQuantity={setTempQuantity}
        />

        <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200 p-8">
          <div>
            {modalMode === 'edit' && selectedInventory && selectedInventory.status === 'PENDING' && (
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await onConfirmInventory(selectedInventory, formData.confirmedBy);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg transition shadow-sm font-medium"
              >
                <Check size={18} />
                <span>Confirm Inventory</span>
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
            >
              {modalMode === 'create' ? 'Create Record' : 'Update Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryFormModal;