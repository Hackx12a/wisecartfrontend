// components/layout/Sidebar.jsx
import React from 'react';
import { Package, Truck, Warehouse, ShoppingCart, Users, Home, FileText, UserPlus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/warehouse', label: 'Warehouse', icon: Warehouse },
  { to: '/branches', label: 'Branches & Clients', icon: Users },
  { to: '/warehouseinventory', label: 'Warehouse Inventory', icon: Package },
  { to: '/products', label: 'Products', icon: Package },
];

const Sidebar = ({ isOpen, toggle }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={toggle} />
      )}

      {/* Sidebar - fixed on desktop, slides in on mobile */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white transform transition-transform duration-300 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold">WiseCart</h2>
          <p className="text-sm text-gray-400 mt-1">ERP System</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => window.innerWidth < 1024 && toggle()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          
          {/* User Management - Only for ADMIN */}
          {isAdmin && (
            <NavLink
              to="/users"
              onClick={() => window.innerWidth < 1024 && toggle()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                }`
              }
            >
              <UserPlus size={20} />
              <span>User Management</span>
            </NavLink>
          )}
        </nav>
      </aside>

      {/* Spacer div to push content on desktop - only visible on lg screens and up */}
      <div className="hidden lg:block w-64 flex-shrink-0"></div>
    </>
  );
};

export default Sidebar;