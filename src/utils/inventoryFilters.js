import { parseDate } from './dateUtils';

export const filterProductSummaries = (productSummaries, productSearchTerm, showVariationFilter) => {
  return productSummaries.filter(product => {
    const searchLower = productSearchTerm.toLowerCase();
    const matchesSearch =
      product.productName?.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower) ||
      product.upc?.toLowerCase().includes(searchLower) ||
      (product.variationSku && product.variationSku.toLowerCase().includes(searchLower)) ||
      (product.variationName && product.variationName.toLowerCase().includes(searchLower)) ||
      (product.combinationDisplay && product.combinationDisplay.toLowerCase().includes(searchLower));

    const isVariation = product.isVariation === true || product.variationId;
    const matchesVariationFilter =
      showVariationFilter === 'ALL' ||
      (showVariationFilter === 'BASE_ONLY' && !isVariation) ||
      (showVariationFilter === 'VARIATION_ONLY' && isVariation);

    return matchesSearch && matchesVariationFilter;
  });
};

export const filterWarehouseStocks = (warehouseStocks, stockSearchTerm, warehouseFilters) => {
  return warehouseStocks.filter(stock => {
    const matchesSearch =
      stock.productName?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      stock.warehouseName?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      stock.sku?.toLowerCase().includes(stockSearchTerm.toLowerCase());

    const matchesWarehouse = !warehouseFilters.warehouse ||
      stock.warehouseName === warehouseFilters.warehouse;

    const matchesMinQty = !warehouseFilters.minQty || (stock.quantity || 0) >= parseInt(warehouseFilters.minQty);
    const matchesMaxQty = !warehouseFilters.maxQty || (stock.quantity || 0) <= parseInt(warehouseFilters.maxQty);

    const stockDate = parseDate(stock.lastUpdated);
    const matchesStartDate = !warehouseFilters.startDate || (stockDate && stockDate >= new Date(warehouseFilters.startDate));
    const matchesEndDate = !warehouseFilters.endDate || (stockDate && stockDate <= new Date(warehouseFilters.endDate + 'T23:59:59'));

    return matchesSearch && matchesWarehouse && matchesMinQty && matchesMaxQty &&
      matchesStartDate && matchesEndDate;
  });
};

export const filterBranchStocks = (branchStocks, stockSearchTerm, branchFilters) => {
  return branchStocks.filter(stock => {
    const matchesSearch =
      stock.productName?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      stock.branchName?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
      stock.sku?.toLowerCase().includes(stockSearchTerm.toLowerCase());

    const matchesBranch = !branchFilters.branch ||
      stock.branchName === branchFilters.branch;

    const matchesMinQty = !branchFilters.minQty || (stock.quantity || 0) >= parseInt(branchFilters.minQty);
    const matchesMaxQty = !branchFilters.maxQty || (stock.quantity || 0) <= parseInt(branchFilters.maxQty);

    const stockDate = parseDate(stock.lastUpdated);
    const matchesStartDate = !branchFilters.startDate || (stockDate && stockDate >= new Date(branchFilters.startDate));
    const matchesEndDate = !branchFilters.endDate || (stockDate && stockDate <= new Date(branchFilters.endDate + 'T23:59:59'));

    return matchesSearch && matchesBranch && matchesMinQty && matchesMaxQty &&
      matchesStartDate && matchesEndDate;
  });
};

export const filterInventories = (inventories, searchTerm, transactionFilters, warehouses, branches) => {
  if (!inventories || inventories.length === 0) return [];

  const filtered = inventories.filter(inv => {
    const searchLower = searchTerm.toLowerCase();
    const isDeleted = inv.isDeleted === true;
    const deletedText = isDeleted ? "deleted" : "";

    const matchesSearch =
      inv.inventoryType?.toLowerCase().includes(searchLower) ||
      inv.verifiedBy?.toLowerCase().includes(searchLower) ||
      inv.remarks?.toLowerCase().includes(searchLower) ||
      deletedText.includes(searchLower) ||
      (inv.fromWarehouse?.warehouseName?.toLowerCase().includes(searchLower)) ||
      (inv.fromBranch?.branchName?.toLowerCase().includes(searchLower)) ||
      (inv.toWarehouse?.warehouseName?.toLowerCase().includes(searchLower)) ||
      (inv.toBranch?.branchName?.toLowerCase().includes(searchLower));

    let matchesType = true;
    if (transactionFilters.type !== 'ALL') {
      if (inv.inventoryType === 'TRANSFER') {
        const hasFrom = inv.fromWarehouse || inv.fromBranch;
        const hasTo = inv.toWarehouse || inv.toBranch;

        if (transactionFilters.type === 'TRANSFER_IN') {
          matchesType = hasTo && !hasFrom;
        } else if (transactionFilters.type === 'TRANSFER_OUT') {
          matchesType = hasFrom && !hasTo;
        } else if (transactionFilters.type === 'TRANSFER') {
          matchesType = true;
        } else {
          matchesType = false;
        }
      } else {
        matchesType = inv.inventoryType === transactionFilters.type;
      }
    }

    const matchesVerifiedBy = !transactionFilters.verifiedBy ||
      inv.verifiedBy?.toLowerCase().includes(transactionFilters.verifiedBy.toLowerCase());

    const transactionDate = parseDate(inv.verificationDate || inv.date || inv.transactionDate || inv.createdAt);
    const matchesStartDate = !transactionFilters.startDate || (transactionDate && transactionDate >= new Date(transactionFilters.startDate));
    const matchesEndDate = !transactionFilters.endDate || (transactionDate && transactionDate <= new Date(transactionFilters.endDate + 'T23:59:59'));

    const itemCount = inv.items?.length || 0;
    const matchesMinItems = !transactionFilters.minItems || itemCount >= parseInt(transactionFilters.minItems);
    const matchesMaxItems = !transactionFilters.maxItems || itemCount <= parseInt(transactionFilters.maxItems);

    return matchesSearch && matchesType && matchesVerifiedBy && matchesStartDate && matchesEndDate && matchesMinItems && matchesMaxItems;
  });

  // Sort: deleted items go to the end
  return filtered.sort((a, b) => {
    if (a.isDeleted && !b.isDeleted) return 1;
    if (!a.isDeleted && b.isDeleted) return -1;
    return 0;
  });
};