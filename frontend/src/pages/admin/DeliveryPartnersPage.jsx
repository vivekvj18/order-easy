import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Truck, AlertTriangle, CheckCircle, Clock, Calendar, ShieldCheck, UserCheck, Star } from 'lucide-react';
import { getPartnerSummary } from '../../api/analyticsApi';
import { getAllDeliveries } from '../../api/deliveryApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { formatDateTime, extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

// Reusable Count-Up Animated Number Component
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end) || end === 0) {
      setDisplayValue(value || 0);
      return;
    }
    const duration = 1200;
    const steps = 40;
    const increment = end / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{Math.ceil(displayValue).toLocaleString()}</>;
};

const DeliveryStatusBadge = ({ status }) => {
  const styles = {
    DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ASSIGNED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    PICKED_UP: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${styles[status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      <span className="text-[11px] mr-1">●</span>
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
      setLastUpdated(now.toLocaleTimeString('en-US', { hour12: false }));
      if (isManual) toast.success('Telemetry and courier logs synchronized');
    } catch (err) {
      toast.error('Failed to sync delivery database: ' + extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeliveryData(); }, [fetchDeliveryData]);

  // Dynamically map rider list from summary stats & active logs
  const getRidersList = () => {
    const ridersMap = {};
    const totalRiders = partnerStats?.totalPartners || 9;
    
    // Seed riders
    for (let i = 1; i <= totalRiders; i++) {
      ridersMap[i] = {
        id: i,
        status: 'AVAILABLE',
        lastOrderId: null
      };
    }
    
    // Set busy statuses and last orders
    deliveries.forEach(del => {
      if (!del.partnerId) return;
      const pId = del.partnerId;
      if (ridersMap[pId]) {
        if (del.status === 'ASSIGNED' || del.status === 'PICKED_UP') {
          ridersMap[pId].status = 'BUSY';
          ridersMap[pId].lastOrderId = del.orderId;
        } else if (del.status === 'DELIVERED' && !ridersMap[pId].lastOrderId) {
          ridersMap[pId].lastOrderId = del.orderId;
        }
      }
    });

    return Object.values(ridersMap);
  };

  const ridersList = getRidersList();

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8 animate-fade-in font-sans text-slate-100 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-[#1E293B] p-5 rounded-3xl border border-[#334155] shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <Truck className="w-5 h-5" />
            </span>
            Rider Operations Control Center
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium flex items-center gap-1.5">
            Live tracking and operations dispatch of quick commerce courier fleet
            {lastUpdated && (
              <span className="text-[10px] font-mono text-slate-500 ml-1">
                [LAST_SYNC: {lastUpdated}]
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => fetchDeliveryData(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 border border-[#334155] hover:border-emerald-500 text-emerald-400 rounded-xl shadow-lg font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Fleet
        </button>
      </div>

      {/* QUICK RIDER KPI STATS PANELS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6 animate-pulse">
          <div className="h-[95px] bg-[#1E293B] border border-[#334155] rounded-3xl"></div>
          <div className="h-[95px] bg-[#1E293B] border border-[#334155] rounded-3xl"></div>
          <div className="h-[95px] bg-[#1E293B] border border-[#334155] rounded-3xl"></div>
        </div>
      ) : errors.summary ? (
        <div className="w-full bg-[#1E293B] border border-rose-500/20 rounded-3xl p-5 text-center mb-6 shadow-glow-red">
          <p className="text-xs font-bold text-rose-500">Rider tracking telemetry summary is temporarily offline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          
          {/* Card 1: Total Fleet (Blue Glow) */}
          <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-glow-blue flex items-center gap-4 hover:border-blue-500 transition-all duration-300 group">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Audited Active Fleet</span>
              <p className="text-2xl font-black text-white mt-0.5">
                <AnimatedNumber value={partnerStats?.totalPartners ?? 0} /> Riders
              </p>
            </div>
          </div>

          {/* Card 2: Available Riders (Green Glow) */}
          <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-glow-green flex items-center gap-4 hover:border-emerald-500 transition-all duration-300 group">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Standby (Idle)</span>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">
                <AnimatedNumber value={partnerStats?.available ?? 0} /> Ready
              </p>
            </div>
          </div>

          {/* Card 3: Busy Riders (Amber Glow) */}
          <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-glow-amber flex items-center gap-4 hover:border-amber-500 transition-all duration-300 group">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Dispatched (Delivering)</span>
              <p className="text-2xl font-black text-amber-500 mt-0.5">
                <AnimatedNumber value={partnerStats?.busy ?? 0} /> Transits
              </p>
            </div>
          </div>

        </div>
      )}

      {/* 4. DYNAMIC VISUAL FLEET GRID MAP */}
      {!loading && ridersList.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Live Courier Fleet Grid</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ridersList.map((rider) => (
              <div 
                key={rider.id}
                className={`relative overflow-hidden bg-[#1E293B] border border-[#334155] p-4 rounded-3xl transition-all duration-300 hover:-translate-y-1 ${
                  rider.status === 'AVAILABLE' 
                    ? 'hover:border-emerald-500 shadow-glow-green' 
                    : 'hover:border-amber-500 shadow-glow-amber animate-pulse'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Circle avatar circle with ID initials */}
                    <div className={`w-10 h-10 rounded-full font-black text-xs flex items-center justify-center ${
                      rider.status === 'AVAILABLE' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      R{rider.id}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Rider Account #{rider.id}</h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-[9px] font-bold text-slate-400">4.9 Rating</span>
                      </div>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-wider ${
                    rider.status === 'AVAILABLE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {rider.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#334155]/60 flex justify-between items-center text-[9px] font-bold">
                  <span className="text-slate-500">LAST TRANSACT REF:</span>
                  <span className="text-slate-300 font-mono">
                    {rider.lastOrderId ? `ORDER #${rider.lastOrderId}` : 'NO TRANSIT YET'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT DELIVERIES HISTORY TABLE */}
      {loading ? (
        <div className="w-full bg-[#1E293B] rounded-3xl border border-[#334155] p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Synchronizing active logs...</span>
        </div>
      ) : errors.deliveries ? (
        <div className="w-full bg-[#1E293B] rounded-3xl border border-[#334155] p-16 flex flex-col items-center justify-center text-center shadow-glow-red">
          <div className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-300 text-sm">Delivery Service Offline</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">Failed to connect to the delivery-service microservice. Please retry.</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="w-full bg-[#1E293B] rounded-3xl border border-[#334155] p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-300 text-sm">No Delivery Logs Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">There are currently no active deliveries or courier histories logged.</p>
        </div>
      ) : (
        <div className="bg-[#1E293B] rounded-3xl border border-[#334155] shadow-2xl">
          <div className="p-5 border-b border-[#334155]/60">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              Active Dispatch Delivery Logs
            </h3>
            <p className="text-[10px] text-slate-400">Audit logs list of the placed deliveries and associated riders</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#334155] bg-[#0F172A] text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Delivery ID</th>
                  <th className="py-4 px-5">Order ID Reference</th>
                  <th className="py-4 px-5">Courier/Rider Account</th>
                  <th className="py-4 px-5">Delivery Status</th>
                  <th className="py-4 px-5">Assigned Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/20">
                {deliveries.map((delivery, index) => (
                  <tr 
                    key={delivery.deliveryId} 
                    className={`transition-colors duration-150 hover:bg-[#253249] ${
                      index % 2 === 0 ? 'bg-[#1E293B]' : 'bg-[#172033]'
                    }`}
                  >
                    <td className="py-4 px-5 font-black text-slate-200 hover:text-emerald-400 transition-colors text-xs">
                      #{delivery.deliveryId}
                    </td>
                    <td className="py-4 px-5 text-xs font-bold text-slate-400">
                      Order Reference #{delivery.orderId}
                    </td>
                    <td className="py-4 px-5 text-xs font-black text-slate-200">
                      Rider Account #{delivery.partnerId || '—'}
                    </td>
                    <td className="py-4 px-5">
                      <DeliveryStatusBadge status={delivery.status} />
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
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
