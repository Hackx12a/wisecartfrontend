export const getTransactionDisplayInfo = (transaction) => {
  const isTransfer = transaction.inventoryType === 'TRANSFER';
  const hasFromLocation = transaction.fromWarehouse || transaction.fromBranch;
  const hasToLocation = transaction.toWarehouse || transaction.toBranch;

  let type = transaction.inventoryType;
  let typeLabel = type ? type.replace('_', ' ') : 'UNKNOWN';
  let typeColor = '';

  if (transaction.inventoryType === 'DELIVERY') {
    typeLabel = 'DELIVERY';
    typeColor = 'bg-purple-100 text-purple-700';
  }

  if (isTransfer) {
    if (hasToLocation && !hasFromLocation) {
      type = 'TRANSFER_IN';
      typeLabel = 'Transfer In';
      typeColor = 'bg-teal-100 text-teal-700';
    } else if (hasFromLocation && !hasToLocation) {
      type = 'TRANSFER_OUT';
      typeLabel = 'Transfer Out';
      typeColor = 'bg-orange-100 text-orange-700';
    } else if (hasFromLocation && hasToLocation) {
      type = 'TRANSFER_COMPLETE';
      typeLabel = 'Transfer';
      typeColor = 'bg-blue-100 text-blue-700';
    } else {
      typeColor = 'bg-blue-100 text-blue-700';
    }
  } else {
    switch (type) {
      case 'STOCK_IN': typeColor = 'bg-green-100 text-green-700'; break;
      case 'RETURN': typeColor = 'bg-yellow-100 text-yellow-700'; break;
      case 'DAMAGE': typeColor = 'bg-red-100 text-red-700'; break;
      case 'DELIVERY': typeColor = 'bg-purple-100 text-purple-700'; break;
      case 'SALE': typeColor = 'bg-pink-100 text-pink-700'; break;
      default: typeColor = 'bg-gray-100 text-gray-700';
    }
  }

  return { type, typeLabel, typeColor };
};

export const calculateTotalQuantity = (items) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((total, item) => total + (item.quantity || 0), 0);
};

export const getQuantityDisplay = (transaction) => {
  const quantity = transaction.quantity || 0;
  const action = transaction.action;

  const isPositive = action === 'ADD' || action === 'RESERVE';

  return {
    quantity: Math.abs(quantity),
    sign: isPositive ? '+' : '-',
    colorClass: isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  };
};