// src/hooks/ui/usePaginationControl.js
import { useState } from 'react';

export const usePaginationControl = (itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const getPageItems = (items = []) => {
    const safeItems = Array.isArray(items) ? items : [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return safeItems.slice(indexOfFirstItem, indexOfLastItem);
  };

  const getTotalPages = (totalItems) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const getIndexOfFirstItem = () => {
    return (currentPage - 1) * itemsPerPage;
  };

  const getIndexOfLastItem = (totalItems) => {
    return Math.min(currentPage * itemsPerPage, totalItems);
  };

  const goToPage = (pageNumber, totalPages) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const nextPage = (totalPages) => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    setCurrentPage,
    getPageItems,
    getTotalPages,
    getIndexOfFirstItem,
    getIndexOfLastItem,
    goToPage,
    nextPage,
    prevPage,
    resetPagination
  };
};

export default usePaginationControl;