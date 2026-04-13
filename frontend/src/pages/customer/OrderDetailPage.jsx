import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Package, AlertTriangle } from 'lucide-react';
import { getOrderById, cancelOrder } from '../../api/ordersApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency, formatDateTime, extractErrorMessage } from '../../utils/formatters';
import { ORDER_STATUSES, DELIVERY_SLOTS } from '../../utils/constants';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['CREATED', 'CONFIRMED', 'DELIVERED'];

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getOrderById(id);
        setOrder(res.data?.data || res.data);
      } catch (err) {
        toast.error(extractErrorMessage(err));
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(id);
      toast.success('Order cancelled');
      navigate('/orders');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  if (!order)  return null;

  const currentStep  = STATUS_STEPS.indexOf(order.status);
  const canCancel    = ['CREATED', 'CONFIRMED'].includes(order.status);
  const canTrack     = ['CONFIRMED', 'DELIVERED'].includes(order.status);
  const slotLabel    = DELIVERY_SLOTS.find((s) => s.value === order.deliverySlot)?.label || order.deliverySlot;

  return (
    <div className="page-container max-w-3xl">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-green mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> My Orders
      </button>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress bar */}
      {order.status !== 'CANCELLED' && (
        <div className="card p-5 mb-5">
          <h2 className="section-title">Order Progress</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, idx) => {
              const done    = idx <= currentStep;
              const current = idx === currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${done ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-400'}
                      ${current ? 'ring-4 ring-primary-100' : ''}
                    `}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 font-medium text-center leading-tight ${done ? 'text-brand-green' : 'text-gray-400'}`} style={{ maxWidth: 52 }}>
                      {ORDER_STATUSES.find((s) => s.value === step)?.label || step}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 rounded-full ${idx < currentStep ? 'bg-brand-green' : 'bg-gray-100'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Items */}
        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-green" /> Items Ordered
          </h2>
          <div className="flex flex-col gap-3">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.productName || item.name} × {item.quantity}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency((item.price || 0) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="text-brand-green">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Delivery info */}
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="section-title flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-green" /> Delivery Details
          </h2>
          {order.deliveryAddress && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Address</p>
              <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
            </div>
          )}
          {slotLabel && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-700">{slotLabel}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-2">
            {canTrack && (
              <button
                onClick={() => navigate(`/track/${order.id}`)}
                className="btn-secondary w-full"
              >
                <MapPin className="w-4 h-4" /> Track Order
              </button>
            )}
            {canCancel && (
              <button onClick={handleCancel} className="btn-danger w-full">
                <AlertTriangle className="w-4 h-4" /> Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
