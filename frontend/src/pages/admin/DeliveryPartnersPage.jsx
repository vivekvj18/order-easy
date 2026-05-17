import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Truck, AlertTriangle, CheckCircle, Clock, Calendar, ShieldCheck } from 'lucide-react';
import { getPartnerSummary } from '../../api/analyticsApi';
import { getAllDeliveries } from '../../api/deliveryApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { formatDateTime, extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

const DeliveryStatusBadge = ({ status }) => {
  const styles = {
    DELIVERED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    ASSIGNED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    PICKED_UP: 'bg-sky-50 text-sky-600 border-sky-100',
    CANCELLED: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status?.replace('_', ' ') || 'PENDING'}
    </span>
  );
};

const DeliveryPartnersPage = () => {
  const [partnerStats, setPartnerStats] = useState(null);
  const [deliveries, setDeliveries]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState('');

  const [errors, setErrors] = useState({
    summary: false,
    deliveries: false,
  });

  const fetchDeliveryData = useCallback(async (isManual = false) => {
    setLoading(true);
    try {
      const [summaryRes, deliveriesRes] = await Promise.allSettled([
        getPartnerSummary(),
        getAllDeliveries()
      ]);

      const newErrors = {};

      if (summaryRes.status === 'fulfilled') {
        setPartnerStats(summaryRes.value.data);
        newErrors.summary = false;
      } else {
        newErrors.summary = true;
      }

      if (deliveriesRes.status === 'fulfilled') {
        setDeliveries(deliveriesRes.value.data || []);
        newErrors.deliveries = false;
      } else {
        newErrors.deliveries = true;
      }

      setErrors(newErrors);

      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('en-IN', { hour12: false }));
      if (isManual) toast.success('Delivery tracking sync completed');
    } catch (err) {
      toast.error('Failed to sync delivery database: ' + extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeliveryData(); }, [fetchDeliveryData]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100/80 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            Rider Operations Control Center
          </h1>
          <p className="text-slate-400 text-xs mt-0.5 font-medium flex items-center gap-1.5">
            Active tracking and performance audit of the quick commerce rider fleet
            {lastUpdated && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                Synced: {lastUpdated}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => fetchDeliveryData(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Fleet
        </button>
      </div>

      {/* QUICK RIDER KPI STATS PANELS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6 animate-pulse">
          <div className="h-[95px] bg-slate-100 rounded-2xl border border-slate-200"></div>
          <div className="h-[95px] bg-slate-100 rounded-2xl border border-slate-200"></div>
          <div className="h-[95px] bg-slate-100 rounded-2xl border border-slate-200"></div>
        </div>
      ) : errors.summary ? (
        <div className="w-full bg-rose-50/50 rounded-2xl border border-rose-100 p-5 text-center mb-6">
          <p className="text-xs font-bold text-rose-600">Rider tracking telemetry summary is temporary offline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          
          {/* Card 1: Total Fleet */}
          <div className="bg-white p-5 rounded-2xl border-t-4 border-t-indigo-500 border-x border-b border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Fleet</p>
              <p className="text-2xl font-black text-slate-800 mt-0.5">{partnerStats?.totalPartners ?? 0}</p>
            </div>
          </div>

          {/* Card 2: Available Riders */}
          <div className="bg-white p-5 rounded-2xl border-t-4 border-t-emerald-500 border-x border-b border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Fleet (Idle)</p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">{partnerStats?.available ?? 0}</p>
            </div>
          </div>

          {/* Card 3: Busy Riders */}
          <div className="bg-white p-5 rounded-2xl border-t-4 border-t-amber-500 border-x border-b border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Busy Fleet (Delivering)</p>
              <p className="text-2xl font-black text-amber-500 mt-0.5">{partnerStats?.busy ?? 0}</p>
            </div>
          </div>

        </div>
      )}

      {/* RECENT DELIVERIES HISTORY TABLE */}
      {loading ? (
        <div className="w-full bg-white rounded-2xl border border-slate-100/80 p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Syncing active courier logs...</span>
        </div>
      ) : errors.deliveries ? (
        <div className="w-full bg-white rounded-2xl border border-slate-100/80 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Delivery Service Unreachable</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Failed to connect to the delivery-service microservice. Please retry.</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-slate-100/80 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No Delivery Logs Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">There are currently no active deliveries or courier histories logged.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm">
          <div className="p-5 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Active Fleet Delivery Logs
            </h3>
            <p className="text-[10px] text-slate-400">Audit logs list of the placed deliveries and associated riders</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Delivery ID</th>
                  <th className="py-3.5 px-5">Order ID Reference</th>
                  <th className="py-3.5 px-5">Courier/Rider ID</th>
                  <th className="py-3.5 px-5">Delivery Status</th>
                  <th className="py-3.5 px-5">Assigned Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id || delivery.deliveryId} className="hover:bg-emerald-50/20 transition-colors group">
                    <td className="py-3.5 px-5 font-bold text-slate-700 group-hover:text-emerald-600 transition-colors text-xs">
                      #{delivery.deliveryId}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-semibold text-slate-500">
                      Order Reference #{delivery.orderId}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-extrabold text-slate-800">
                      Rider Account #{delivery.partnerId || '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <DeliveryStatusBadge status={delivery.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        {delivery.assignedAt ? formatDateTime(delivery.assignedAt) : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPartnersPage;
