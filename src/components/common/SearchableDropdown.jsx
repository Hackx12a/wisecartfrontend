import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const SearchableDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  displayKey = "name",
  valueKey = "id",
  required = false,
  disabled = false,
  searchable = true,
  className = "",
  showSelected = true,
  loading = false,
  error = false,
  errorMessage = "",
  clearable = true,
  onSearchChange,
  renderOption,
  noResultsText = "No results found",
  showCheckmark = true,
  containerClassName = "",
  showCount = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchable]);

  // Handle search term changes
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (onSearchChange) {
      onSearchChange(newSearchTerm);
    }
  };

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    
    return options.filter(option => {
      const displayValue = option[displayKey]?.toString().toLowerCase() || '';
      const searchText = option.searchText?.toString().toLowerCase() || '';
      
      return displayValue.includes(searchTerm.toLowerCase()) ||
             searchText.includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm, displayKey]);

  const selectedOption = options.find(opt => opt[valueKey] === value);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onChange('');
    setSearchTerm('');
  };

  const handleToggle = (e) => {
    e.preventDefault();
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const handleContainerClick = (e) => {
    // Prevent clicks on clear button from triggering toggle
    if (!e.target.closest('button[aria-label="Clear selection"]')) {
      handleToggle(e);
    }
  };

  const renderCustomOption = (option, isSelected) => {
    if (renderOption) {
      return renderOption(option, isSelected);
    }
    
    return (
      <>
        <div className="flex items-center justify-between">
          <div className="font-medium">{option[displayKey]}</div>
          {showCheckmark && isSelected && (
            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>
          )}
        </div>
        {option.subLabel && (
          <div className="text-xs text-gray-500 mt-1">{option.subLabel}</div>
        )}
        {option.description && (
          <div className="text-xs text-gray-400 mt-0.5">{option.description}</div>
        )}
      </>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${containerClassName}`}>
      {/* Dropdown trigger - using div instead of button */}
      <div
        onClick={handleContainerClick}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-left flex items-center justify-between group cursor-pointer ${className} ${
          disabled || loading
            ? 'bg-gray-100 cursor-not-allowed opacity-60 border-gray-300'
            : error
            ? 'border-red-500 bg-white hover:border-red-600'
            : isOpen
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/20'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle(e);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-500">Loading...</span>
            </div>
          ) : selectedOption ? (
            showSelected ? (
              <span className="text-gray-900 truncate">
                {selectedOption[displayKey]}
              </span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {clearable && !required && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
              aria-label="Clear selection"
              style={{ minWidth: '24px', minHeight: '24px' }}
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
          
          {!loading && (
            <ChevronDown 
              size={20} 
              className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`} 
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* Error message */}
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
      )}

      {/* Dropdown menu */}
      {isOpen && !disabled && !loading && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden"
          role="listbox"
          style={{
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header with search and count */}
          {(searchable || showCount) && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              {searchable && (
                <div className="relative mb-2">
                  <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                    size={16} 
                    aria-hidden="true"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    aria-label="Search options"
                  />
                </div>
              )}
              
              {showCount && (
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Showing {filteredOptions.length} of {options.length}</span>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Options list */}
          <div className="overflow-y-auto max-h-60" role="listbox">
            {/* Clear option */}
            {clearable && !required && filteredOptions.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-gray-500 text-sm border-b border-gray-100 flex items-center gap-2"
                role="option"
                aria-selected={!value}
              >
                <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                  {!value && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                </div>
                <span>Clear selection</span>
              </button>
            )}
            
            {/* No results */}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Search size={24} className="mx-auto" />
                </div>
                <p className="text-gray-500 text-sm">{noResultsText}</p>
                {searchTerm && (
                  <p className="text-gray-400 text-xs mt-1">
                    Try different keywords
                  </p>
                )}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option[valueKey];
                return (
                  <button
                    key={option[valueKey]}
                    type="button"
                    onClick={() => handleSelect(option[valueKey])}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors text-sm border-b border-gray-100 last:border-b-0 group/option ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-900'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-start gap-3">
                      {showCheckmark && (
                        <div className={`w-4 h-4 border rounded flex-shrink-0 mt-0.5 flex items-center justify-center ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-600' 
                            : 'border-gray-300 group-hover/option:border-blue-400'
                        }`}>
                          {isSelected && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        {renderCustomOption(option, isSelected)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Remove jsx attribute from style tag */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SearchableDropdown;