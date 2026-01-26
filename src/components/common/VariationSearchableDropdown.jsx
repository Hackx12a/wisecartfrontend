// src/components/common/VariationSearchableDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const VariationSearchableDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  formData, 
  index 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => {
    const searchLower = searchTerm.toLowerCase();
    return (
      option.name?.toLowerCase().includes(searchLower) ||
      option.subLabel?.toLowerCase().includes(searchLower) ||
      option.fullName?.toLowerCase().includes(searchLower) ||
      option.upc?.toLowerCase().includes(searchLower) ||
      option.sku?.toLowerCase().includes(searchLower)
    );
  });

  const selectedOption = options.find(opt => {
    if (opt.id === value) {
      return true;
    }

    const currentItem = formData?.items?.[index];
    if (currentItem) {
      const productMatch = currentItem.productId === opt.parentProductId;
      const variationMatch = currentItem.variationId === opt.variationId;
      return productMatch && variationMatch;
    }

    return false;
  });

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-left flex items-center justify-between bg-white"
      >
        <div className="flex-1 min-w-0">
          {selectedOption ? (
            <div className="text-gray-900 font-medium truncate">
              {selectedOption.name}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={20} className={`text-gray-400 transition-transform ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, UPC, SKU, or variation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="text-gray-500 text-sm mb-2">No products found</div>
                <div className="text-xs text-gray-400">Try searching by ID, UPC, SKU, or product name</div>
              </div>
            ) : (
              filteredOptions.map((option, optionIndex) => {
                const isAlreadySelected = formData?.items?.some(
                  (item, idx) => {
                    if (idx === index) return false;
                    return item.productId === option.parentProductId &&
                      item.variationId === option.variationId;
                  }
                );

                return (
                  <button
                    key={`${option.id}-${optionIndex}`}
                    type="button"
                    onClick={() => {
                      if (!isAlreadySelected) {
                        onChange(option.id);
                        setIsOpen(false);
                        setSearchTerm('');
                      }
                    }}
                    disabled={isAlreadySelected}
                    className={`w-full px-4 py-3 text-left border-b border-gray-100 transition text-sm ${
                      isAlreadySelected
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : value === option.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-900 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{option.name}</div>
                      {option.subLabel && option.subLabel !== 'No variations' && (
                        <div className="text-xs text-gray-600 mt-0.5">Variation: {option.subLabel}</div>
                      )}
                      {isAlreadySelected && (
                        <div className="text-xs text-red-500 mt-1">Already selected</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {selectedOption && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-gray-500">Product:</span>
                <span className="ml-2 font-medium">{selectedOption.fullName}</span>
              </div>
              {selectedOption.price && selectedOption.price > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ₱{selectedOption.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">SKU:</span>
                <span className="ml-2 font-medium">{selectedOption.sku || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">UPC:</span>
                <span className="ml-2 font-medium">{selectedOption.upc || 'N/A'}</span>
              </div>
            </div>

            {selectedOption.subLabel && selectedOption.subLabel !== 'No variations' && (
              <div>
                <span className="text-gray-500">Variation:</span>
                <span className="ml-2 font-medium text-blue-600">{selectedOption.subLabel}</span>
              </div>
            )}

            <div className="pt-1">
              {selectedOption.isVariation ? (
                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  Product with Variations
                </span>
              ) : (
                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                  Product (No Variations)
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariationSearchableDropdown;