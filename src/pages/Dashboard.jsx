
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Package, Truck, ShoppingCart, Users, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingDeliveries: 0,
    lowStock: 0,
    totalClients: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [sales, deliveries, products, clients] = await Promise.all([
          api.get('/sales'),
          api.get('/deliveries'),
          api.get('/products'),
          api.get('/clients'),
        ]);

        const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING').length;
        const monthlyRevenue = sales
          .filter(s => s.status === 'INVOICED')
          .reduce((sum, s) => sum + s.totalAmount, 0);

        setStats({
          totalSales: sales.length,
          pendingDeliveries,
          lowStock: products.filter(p => p.quantity < 10).length,
          totalClients: clients.length,
          monthlyRevenue,
        });
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const cards = [
    { title: 'Total Sales', value: stats.totalSales, icon: ShoppingCart, color: 'blue' },
    { title: 'Pending Deliveries', value: stats.pendingDeliveries, icon: Truck, color: 'yellow' },
    { title: 'Low Stock Items', value: stats.lowStock, icon: AlertCircle, color: 'red' },
    { title: 'Total Clients', value: stats.totalClients, icon: Users, color: 'green' },
    {
    title: 'Monthly Revenue',
    value: `₱${stats.monthlyRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    icon: TrendingUp,
    color: 'green'
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-xl">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          const bgColor = {
            blue: 'bg-blue-100 text-blue-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            red: 'bg-red-100 text-red-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
          }[card.color];

          return (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${bgColor}`}>
                  <Icon size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-gray-500">Coming soon...</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
              + Create New Sale
            </button>
            <button className="w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
              + Add Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;