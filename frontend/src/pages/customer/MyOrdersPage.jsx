import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { getOrders } from '../../api/ordersApi';
import { cancelOrder } from '../../api/ordersApi';
import { useAuth } from '../../context/AuthContext';
import OrderCard from '../../components/OrderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

const MyOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getOrders({ userId: user?.id });
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.orders) ? res.data.orders : [];
      setOrders(data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await cancelOrder(orderId);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleTrack = (orderId) => navigate(`/track/${orderId}`);

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">My Orders</h1>
        <button
          onClick={fetchOrders}
          className="btn-ghost"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          type="orders"
          title="No orders yet"
          description="You haven't placed any orders. Start shopping!"
          action={
            <button onClick={() => navigate('/home')} className="btn-primary">
              Browse Products
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              showActions
              onCancel={handleCancel}
              onTrack={handleTrack}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
