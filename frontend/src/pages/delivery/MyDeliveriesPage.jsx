import { useState, useEffect, useCallback } from 'react';
import { Package, MapPin, RefreshCw, Clock } from 'lucide-react';
import { getPartnerDeliveries } from '../../api/deliveryApi';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { formatCurrency, formatDateTime, extractErrorMessage } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyDeliveriesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading]       = useState(true);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getPartnerDeliveries(user?.id);
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.data) ? res.data.data : [];
      setDeliveries(data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">My Deliveries</h1>
        <button onClick={fetchDeliveries} disabled={loading} className="btn-ghost">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : deliveries.length === 0 ? (
        <EmptyState
          type="deliveries"
          title="No deliveries assigned"
          description="You don't have any assigned deliveries right now. Check back soon!"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id || delivery.orderId} className="card p-5 animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-brand-green" />
                    <span className="font-semibold text-gray-900 text-sm">
                      Order #{delivery.orderId || delivery.id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(delivery.createdAt)}</p>
                </div>
                <StatusBadge status={delivery.status || delivery.orderStatus} />
              </div>

              {delivery.deliveryAddress && (
                <div className="flex items-start gap-2 mb-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">{delivery.deliveryAddress}</p>
                </div>
              )}

              {delivery.deliverySlot && (
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{delivery.deliverySlot.replace('_', ' ')}</span>
                </div>
              )}

              {delivery.totalAmount && (
                <p className="text-sm font-bold text-brand-green">{formatCurrency(delivery.totalAmount)}</p>
              )}

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                <button
                  onClick={() => navigate(`/delivery/location?orderId=${delivery.orderId || delivery.id}`)}
                  className="btn-primary flex-1 text-xs py-2"
                  id={`update-location-${delivery.id}`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Update Location
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDeliveriesPage;
