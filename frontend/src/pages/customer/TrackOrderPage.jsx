import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, RefreshCw, Navigation } from 'lucide-react';
import { getLatestTracking, getTrackingHistory } from '../../api/trackingApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDateTime, extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

const TrackOrderPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [latest, setLatest]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [autoRefresh, setAuto]  = useState(true);

  const fetchTracking = useCallback(async () => {
    try {
      const [latRes, histRes] = await Promise.allSettled([
        getLatestTracking(orderId),
        getTrackingHistory(orderId),
      ]);
      if (latRes.status === 'fulfilled') {
        setLatest(latRes.value.data?.data || latRes.value.data);
      }
      if (histRes.status === 'fulfilled') {
        const h = histRes.value.data;
        setHistory(Array.isArray(h) ? h : Array.isArray(h?.data) ? h.data : []);
      }
    } catch (err) {
      // silently fail on tracking
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchTracking, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchTracking]);

  return (
    <div className="page-container max-w-2xl">
      <button
        onClick={() => navigate(`/orders/${orderId}`)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-green mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Order Details
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Track Order #{orderId}</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAuto(e.target.checked)}
              className="accent-brand-green w-4 h-4 rounded"
              id="auto-refresh"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => { setLoading(true); fetchTracking(); }}
            className="btn-ghost"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Latest location card */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-brand-green animate-pulse" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Current Location</h2>
                <p className="text-xs text-gray-500">Updates every 10 seconds</p>
              </div>
            </div>

            {latest ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Latitude</p>
                    <p className="text-base font-bold text-gray-900">{latest.latitude ?? '—'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Longitude</p>
                    <p className="text-base font-bold text-gray-900">{latest.longitude ?? '—'}</p>
                  </div>
                </div>

                {latest.address && (
                  <div className="flex items-start gap-2 p-3 bg-primary-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-brand-green font-medium mb-0.5">Current address</p>
                      <p className="text-sm text-gray-700">{latest.address}</p>
                    </div>
                  </div>
                )}

                {latest.timestamp && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    Last updated: {formatDateTime(latest.timestamp)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tracking data available yet.</p>
                <p className="text-xs mt-1">Tracking begins once your order is out for delivery.</p>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card p-6">
              <h2 className="section-title flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-green" /> Location History
              </h2>
              <div className="flex flex-col gap-3">
                {history.map((h, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-green mt-1 flex-shrink-0" />
                      {idx < history.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1 mb-1 min-h-[24px]" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-gray-700">
                        {h.address || `${h.latitude}, ${h.longitude}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(h.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackOrderPage;
