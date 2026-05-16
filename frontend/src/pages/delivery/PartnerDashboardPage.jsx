import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bike, 
  MapPin, 
  Package, 
  CheckCircle, 
  User, 
  LogOut, 
  Power,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const PartnerDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isOnline, setIsOnline] = useState(true);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for initial visualization
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      // Simulating API call to delivery-service
      setTimeout(() => {
        setAssignedOrders([
          { 
            id: 'ORD-8821', 
            status: 'PICKUP_PENDING', 
            customer: 'Vivek Joshi',
            address: 'HSR Layout, Sector 7, Bangalore',
            items: 4,
            time: '10 mins ago'
          },
          { 
            id: 'ORD-9910', 
            status: 'OUT_FOR_DELIVERY', 
            customer: 'Ankit Sharma',
            address: 'Indiranagar, 12th Main, Bangalore',
            items: 2,
            time: '25 mins ago'
          }
        ]);
        setLoading(false);
      }, 1000);
    };
    fetchOrders();
  }, []);

  const handleStatusToggle = () => {
    setIsOnline(!isOnline);
    toast.success(isOnline ? 'You are now OFFLINE' : 'You are now ONLINE');
  };

  const handleAction = (orderId, currentStatus) => {
    if (currentStatus === 'PICKUP_PENDING') {
      toast.success(`Order ${orderId} marked as Picked Up!`);
    } else {
      toast.success(`Order ${orderId} delivered!`);
    }
    // In real app, this would call delivery-service API
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
              <User className="w-6 h-6 text-brand-green" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Partner Dashboard</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Status Bar */}
      <div className="px-6 py-4">
        <div className={`p-4 rounded-2xl flex items-center justify-between transition-colors ${isOnline ? 'bg-green-50 border border-green-100' : 'bg-gray-100 border border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className={`font-bold ${isOnline ? 'text-green-700' : 'text-gray-600'}`}>
              {isOnline ? 'Online - Taking Orders' : 'Offline - On Break'}
            </span>
          </div>
          <button 
            onClick={handleStatusToggle}
            className={`p-2 rounded-xl flex items-center gap-2 transition-all ${isOnline ? 'bg-white text-gray-700 shadow-sm' : 'bg-brand-green text-white shadow-brand'}`}
          >
            <Power className="w-4 h-4" />
            <span className="text-sm font-bold">{isOnline ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bike className="w-5 h-5 text-brand-green" />
            Active Tasks
          </h2>
          <span className="badge-green">{assignedOrders.length} active</span>
        </div>

        <div className="space-y-4">
          {assignedOrders.map((order) => (
            <div key={order.id} className="card p-5 animate-fade-in">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-brand-green uppercase tracking-wider">{order.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${order.status === 'PICKUP_PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                      {order.status === 'PICKUP_PENDING' ? 'PENDING PICKUP' : 'IN TRANSIT'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{order.customer}</h3>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Clock className="w-3 h-3" />
                    {order.time}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{order.items} items</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-snug">{order.address}</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(order.id, order.status)}
                  className="flex-1 btn-primary py-3"
                >
                  {order.status === 'PICKUP_PENDING' ? (
                    <>
                      <Package className="w-4 h-4" />
                      Pick Up Order
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark Delivered
                    </>
                  )}
                </button>
                <button className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {assignedOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold">No active tasks</h3>
              <p className="text-sm text-gray-500">Wait for new orders to be assigned.</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Nav (Minimal for Partner) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-4 flex justify-around items-center z-20">
        <div className="flex flex-col items-center gap-1 text-brand-green">
          <Bike className="w-6 h-6" />
          <span className="text-[10px] font-bold">Tasks</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-400">
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-bold">History</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-gray-400">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">Profile</span>
        </div>
      </nav>
    </div>
  );
};

export default PartnerDashboardPage;
