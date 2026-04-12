import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { getAllPartners } from '../../api/deliveryApi';
import { AvailabilityBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { extractErrorMessage, getInitials } from '../../utils/formatters';
import toast from 'react-hot-toast';

const DeliveryPartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getAllPartners();
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.data) ? res.data.data : [];
      setPartners(data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const available = partners.filter((p) => p.availabilityStatus === 'AVAILABLE').length;
  const busy      = partners.filter((p) => p.availabilityStatus === 'BUSY').length;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Delivery Partners</h1>
        <button onClick={fetchPartners} className="btn-ghost" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Partners</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{available}</p>
          <p className="text-xs text-gray-500 mt-1">Available</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">{busy}</p>
          <p className="text-xs text-gray-500 mt-1">Busy</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : partners.length === 0 ? (
        <EmptyState
          type="partners"
          title="No delivery partners yet"
          description="Delivery partners will appear here once they register."
        />
      ) : (
        <div className="table-wrapper card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Deliveries</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(partner.name || partner.email)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{partner.name || '—'}</p>
                        <p className="text-xs text-gray-400">ID: {partner.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600 text-sm">{partner.email || '—'}</td>
                  <td className="text-gray-600 text-sm">{partner.phone || '—'}</td>
                  <td><AvailabilityBadge status={partner.availabilityStatus} /></td>
                  <td className="font-semibold text-gray-700">{partner.totalDeliveries ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeliveryPartnersPage;
