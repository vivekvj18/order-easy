import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Truck, TrendingUp, RefreshCw } from 'lucide-react';
import { getOrders } from '../../api/ordersApi';
import { getProducts } from '../../api/inventoryApi';
import { getAllPartners } from '../../api/deliveryApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card p-6 flex items-center gap-5 animate-fade-in">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-brand-green font-medium mt-1">{sub}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats]   = useState({ orders: 0, products: 0, partners: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecent] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [ordersRes, productsRes, partnersRes] = await Promise.allSettled([
          getOrders({ page: 0, size: 5, sortBy: 'createdAt', direction: 'desc' }),
          getProducts(),
          getAllPartners(),
        ]);

        const orders   = ordersRes.status === 'fulfilled'
          ? (Array.isArray(ordersRes.value.data) ? ordersRes.value.data :
             ordersRes.value.data?.content || []) : [];
        const products = productsRes.status === 'fulfilled'
          ? (Array.isArray(productsRes.value.data) ? productsRes.value.data :
             productsRes.value.data?.content || []) : [];
        const partners = partnersRes.status === 'fulfilled'
          ? (Array.isArray(partnersRes.value.data) ? partnersRes.value.data : []) : [];

        const revenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

        setStats({
          orders: orders.length,
          products: products.length,
          partners: partners.length,
          revenue,
        });
        setRecent(orders.slice(0, 5));
      } catch {
        // fallback to zeros
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Total Orders"
          value={stats.orders}
          icon={ShoppingCart}
          color="bg-brand-green"
          sub="All time"
        />
        <StatCard
          label="Total Products"
          value={stats.products}
          icon={Package}
          color="bg-blue-500"
          sub="In inventory"
        />
        <StatCard
          label="Delivery Partners"
          value={stats.partners}
          icon={Truck}
          color="bg-purple-500"
          sub="Registered"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.revenue)}
          icon={TrendingUp}
          color="bg-orange-500"
          sub="From fetched orders"
        />
      </div>

      {/* Recent orders table */}
      <div className="card p-6">
        <h2 className="section-title">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No orders yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">#{order.id}</td>
                    <td>{order.userEmail || order.userId || '—'}</td>
                    <td className="font-semibold text-brand-green">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'DELIVERED' ? 'badge-green' :
                        order.status === 'CANCELLED' ? 'badge-red'  :
                        order.status === 'OUT_FOR_DELIVERY' ? 'badge-orange' :
                        order.status === 'CONFIRMED' ? 'badge-yellow' : 'badge-blue'
                      }`}>{order.status}</span>
                    </td>
                    <td className="text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
