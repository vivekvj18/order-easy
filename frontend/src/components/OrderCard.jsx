import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const OrderCard = ({ order, showActions = false, onCancel, onTrack }) => {
  const navigate = useNavigate();

  const canCancel = ['CREATED', 'CONFIRMED'].includes(order.status);
  const canTrack  = ['CONFIRMED', 'DELIVERED'].includes(order.status);

  return (
    <div
      className="card p-5 hover:shadow-card-hover transition-all duration-200 cursor-pointer animate-fade-in"
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">
              Order #{order.id}
            </p>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-500 mb-2">{formatDateTime(order.createdAt)}</p>
          <p className="text-xs text-gray-500">
            {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''} · {' '}
            <span className="font-semibold text-gray-700">{formatCurrency(order.totalAmount)}</span>
          </p>
          {order.deliverySlot && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">
                {order.deliverySlot.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
      </div>

      {showActions && (canCancel || canTrack) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
          {canTrack && (
            <button
              onClick={() => onTrack?.(order.id)}
              className="btn-secondary text-xs px-3 py-2 flex-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              Track Order
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel?.(order.id)}
              className="btn-danger text-xs px-3 py-2 flex-1"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
