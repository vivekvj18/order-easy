import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Package, 
  CheckCircle, 
  RefreshCw,
  Clock,
  ChevronRight,
  Power,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getDeliveriesByAuthUser, 
  updateDeliveryStatus, 
  updatePartnerAvailability 
} from '../../api/deliveryApi';
import { updateOrderStatus } from '../../api/ordersApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

const MyDeliveriesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isOnline, setIsOnline] = useState(true);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchOrders = useCallback(async (showSilent = false) => {
    if (!user?.id) return;
    if (!showSilent) setLoading(true);
    else setSyncing(true);

    try {
      const res = await getDeliveriesByAuthUser(user.id);
      setAssignedOrders(res.data || []);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusToggle = async () => {
    const newStatus = isOnline ? 'OFFLINE' : 'AVAILABLE';
    try {
      await updatePartnerAvailability(user.id, newStatus);
      setIsOnline(!isOnline);
      toast.success(`Status updated to ${newStatus.toLowerCase()}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleAction = async (deliveryId, currentStatus, orderId) => {
    let nextDeliveryStatus = '';
    let nextOrderStatus = '';

    if (currentStatus === 'ASSIGNED') {
      nextDeliveryStatus = 'PICKED_UP';
      nextOrderStatus = 'SHIPPED';
    } else if (currentStatus === 'PICKED_UP' || currentStatus === 'OUT_FOR_DELIVERY') {
      nextDeliveryStatus = 'DELIVERED';
      nextOrderStatus = 'DELIVERED';
    }

    if (!nextDeliveryStatus) return;

    try {
      // Run both updates in parallel for efficiency
      await Promise.all([
        updateDeliveryStatus(deliveryId, nextDeliveryStatus),
        updateOrderStatus(orderId, nextOrderStatus)
      ]);
      
      toast.success(`Order ${orderId} is now ${nextDeliveryStatus.replace('_', ' ').toLowerCase()}!`);
      fetchOrders(true); // Silent refresh
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="page-container max-w-4xl mx-auto pb-20 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Active Deliveries</h1>
          <p className="text-sm text-gray-500 font-medium">Real-time task management for {user?.name}</p>
        </div>
        <button 
          onClick={() => fetchOrders(true)}
          disabled={syncing}
          className="p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm text-gray-400 hover:text-brand-green transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin text-brand-green' : ''}`} />
        </button>
      </div>

      {/* Online Status Toggle */}
      <div className={`mb-8 p-5 rounded-3xl flex items-center justify-between transition-all duration-500 shadow-sm border ${isOnline ? 'bg-green-50/50 border-green-100' : 'bg-gray-100 border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'bg-gray-400 text-white shadow-inner'}`}>
              <Bike className="w-6 h-6" />
            </div>
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          </div>
          <div>
            <h3 className={`font-bold ${isOnline ? 'text-green-800' : 'text-gray-700'}`}>
              {isOnline ? 'Ready for Pickup' : 'Currently Offline'}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {isOnline ? 'New orders will be assigned here' : 'Switch online to receive tasks'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleStatusToggle}
          className={`px-6 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-sm transition-all shadow-sm ${isOnline ? 'bg-white text-gray-700 hover:bg-gray-50' : 'bg-brand-green text-white hover:opacity-90 shadow-brand'}`}
        >
          <Power className="w-4 h-4" />
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-gray-900">Your Tasks ({assignedOrders.length})</h2>
          <span className="text-xs font-bold text-brand-green bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">Live</span>
        </div>

        {assignedOrders.map((delivery) => (
          <div key={delivery.deliveryId} className="card overflow-hidden group hover:border-brand-green/30 transition-all duration-300 border-gray-100 shadow-premium bg-white">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                    <Package className="w-6 h-6 text-gray-400 group-hover:text-brand-green transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-brand-green tracking-tighter uppercase">ID: {delivery.orderId}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${delivery.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                        {delivery.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Order Shipment</h3>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-medium mb-1">
                    <Clock className="w-3 h-3" />
                    {new Date(delivery.assignedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <span className="text-sm font-bold text-gray-700">Priority Delivery</span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl mb-6 border border-gray-50 group-hover:bg-white group-hover:border-gray-100 transition-all">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <MapPin className="w-4 h-4 text-brand-green" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Delivery Hub</p>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {delivery.deliveryLatitude && delivery.deliveryLongitude
                      ? `${delivery.deliveryLatitude.toFixed(5)}, ${delivery.deliveryLongitude.toFixed(5)}`
                      : 'Customer destination pending'}
                  </p>
                  {delivery.assignmentDistanceKm && (
                    <p className="text-xs text-gray-400 mt-1">
                      Assigned from {delivery.assignmentDistanceKm.toFixed(2)} km away
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {delivery.status !== 'DELIVERED' && (
                  <button 
                    onClick={() => handleAction(delivery.deliveryId, delivery.status, delivery.orderId)}
                    className="flex-1 btn-primary py-4 rounded-2xl shadow-brand text-sm tracking-wide font-black uppercase"
                  >
                    {delivery.status === 'ASSIGNED' ? (
                      <>
                        <Package className="w-4 h-4" />
                        Confirm Pick Up
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Finish Delivery
                      </>
                    )}
                  </button>
                )}
                
                <button 
                  onClick={() => navigate(`/delivery/location?orderId=${delivery.orderId}&partnerId=${delivery.partnerId}`)}
                  className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all group-hover:bg-brand-green group-hover:text-white"
                  title="Update Location"
                >
                  <Navigation className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {assignedOrders.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 shadow-inner">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No active tasks</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">You're all caught up! New assignments will pop up here live.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDeliveriesPage;
