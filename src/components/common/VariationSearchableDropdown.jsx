// src/components/common/VariationSearchableDropdown.jsx
import React from 'react';
import SearchableDropdown from './SearchableDropdown';

const VariationSearchableDropdown = ({
  variations = [],
  selectedVariationId,
  onVariationChange,
  productName = '',
  disabled = false,
  loading = false,
  ...props
}) => {
  // Transform variations to dropdown options
  const variationOptions = variations.map(variation => ({
    id: variation.id,
    name: variation.name,
    subLabel: variation.sku || `SKU: ${variation.sku}`,
    description: `${variation.quantity || 0} in stock`,
    searchText: `${variation.name} ${variation.sku} ${productName}`.toLowerCase()
  }));

  return (
    <SearchableDropdown
      options={variationOptions}
      value={selectedVariationId}
      onChange={onVariationChange}
      placeholder="Select variation"
      disabled={disabled || loading}
      loading={loading}
      showCount={true}
      displayKey="name"
      valueKey="id"
      {...props}
    />
  );
};

export default VariationSearchableDropdown;