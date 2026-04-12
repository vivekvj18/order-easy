import { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updatePartnerAvailability } from '../../api/deliveryApi';
import { AvailabilityBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

const AvailabilityPage = () => {
  const { user } = useAuth();
  const [status, setStatus]   = useState('AVAILABLE');
  const [loading, setLoading] = useState(false);

  const isAvailable = status === 'AVAILABLE';

  const handleToggle = async () => {
    const newStatus = isAvailable ? 'BUSY' : 'AVAILABLE';
    setLoading(true);
    try {
      await updatePartnerAvailability(user?.id, newStatus);
      setStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-md">
      <h1 className="page-title">Availability</h1>
      <p className="text-gray-500 text-sm mb-8">
        Toggle your availability status to receive new delivery assignments.
      </p>

      <div className="card p-8 flex flex-col items-center gap-8 text-center">
        {/* Status indicator */}
        <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
          isAvailable
            ? 'bg-green-100 ring-8 ring-green-100 animate-pulse-green'
            : 'bg-orange-100 ring-8 ring-orange-100'
        }`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isAvailable ? 'bg-green-500' : 'bg-orange-400'
          }`}>
            {isAvailable ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isAvailable ? 'You are Available' : 'You are Busy'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isAvailable
              ? 'You will receive new delivery assignments.'
              : 'You will not receive new assignments while busy.'}
          </p>
        </div>

        <div className="w-full">
          <AvailabilityBadge status={status} />
        </div>

        {/* Toggle button */}
        <button
          onClick={handleToggle}
          disabled={loading}
          id="toggle-availability-btn"
          className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 ${
            isAvailable
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200'
              : 'bg-brand-green hover:bg-primary-700 text-white shadow-lg shadow-green-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : isAvailable ? (
            <><ToggleLeft className="w-5 h-5" /> Mark as Busy</>
          ) : (
            <><ToggleRight className="w-5 h-5" /> Mark as Available</>
          )}
        </button>

        <p className="text-xs text-gray-400">
          Current Partner ID: <span className="font-mono font-semibold">{user?.id || '—'}</span>
        </p>
      </div>
    </div>
  );
};

export default AvailabilityPage;
