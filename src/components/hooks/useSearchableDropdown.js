// src/hooks/useSearchableDropdown.js
import { useState, useRef, useCallback } from 'react';

export const useSearchableDropdown = ({
  initialValue = '',
  onValueChange,
  onSearch
}) => {
  const [value, setValue] = useState(initialValue);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleValueChange = useCallback((newValue) => {
    setValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  }, [onValueChange]);

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
    if (onSearch) {
      onSearch(term);
    }
  }, [onSearch]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
    setSearchTerm('');
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  return {
    value,
    searchTerm,
    isOpen,
    dropdownRef,
    setValue: handleValueChange,
    setSearchTerm: handleSearchChange,
    setIsOpen,
    handleToggle,
    handleClose
  };
};