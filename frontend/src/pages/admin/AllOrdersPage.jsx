import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw, ShoppingBag, Eye, Calendar, User, Sliders, Sparkles } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../api/ordersApi';
import { formatCurrency, formatDateTime, extractErrorMessage } from '../../utils/formatters';
import { ORDER_STATUSES } from '../../utils/constants';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// Premium Pill status badges with leading colored dot
const OrderStatusBadge = ({ status }) => {
  const styles = {
    DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 dot-emerald',
    CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20 dot-rose',
    CONFIRMED: 'bg-amber-500/10 text-amber-400 border-amber-500/20 dot-amber',
    OUT_FOR_DELIVERY: 'bg-sky-500/10 text-sky-400 border-sky-500/20 dot-sky',
    SHIPPED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 dot-indigo',
    CREATED: 'bg-slate-500/10 text-slate-400 border-slate-500/20 dot-slate',
  };

  const dots = {
    DELIVERED: 'text-emerald-400',
    CANCELLED: 'text-rose-400',
    CONFIRMED: 'text-amber-400',
    OUT_FOR_DELIVERY: 'text-sky-400',
    SHIPPED: 'text-indigo-400',
    CREATED: 'text-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.CREATED}`}>
      <span className={`text-[12px] leading-none ${dots[status] || dots.CREATED}`}>●</span>
      {status}
    </span>
  );
};

const AllOrdersPage = () => {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(1);
  const [filters, setFilters]     = useState({ status: '', userId: '' });
  const [updating, setUpdating]   = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchOrders = useCallback(async (isManual = false) => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'createdAt',
        direction: 'desc',
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.userId ? { userId: filters.userId } : {}),
      };
      const res  = await getOrders(params);
      const data = res.data;
      if (Array.isArray(data)) {
        setOrders(data);
        setTotal(1);
      } else {
        setOrders(data?.orders || []);
        setTotal(data?.totalPages || 1);
      }
      
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('en-US', { hour12: false }));
      if (isManual) toast.success('Orders logs synchronized');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId} status transitioned to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  // Border mapping based on order status
  const getRowLeftBorder = (status) => {
    switch (status) {
      case 'DELIVERED': return 'border-l-4 border-emerald-500';
      case 'CANCELLED': return 'border-l-4 border-rose-500';
      case 'CONFIRMED': return 'border-l-4 border-amber-500';
      case 'OUT_FOR_DELIVERY': return 'border-l-4 border-sky-500';
      case 'SHIPPED': return 'border-l-4 border-indigo-500';
      default: return 'border-l-4 border-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8 animate-fade-in font-sans text-slate-100 select-none">
      
      {/* HEADER ROW WITH COUNTER BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-[#1E293B] p-5 rounded-3xl border border-[#334155] shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <ShoppingBag className="w-5 h-5" />
              </span>
              All Orders Audit
            </h1>
            {/* Dynamic Total Order counter in header */}
            {!loading && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                {orders.length} ACTIVE RECORDS
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1 font-medium flex items-center gap-1.5">
            Real-time audit log of customer microservice orders
            {lastUpdated && (
              <span className="text-[10px] font-mono text-slate-500 ml-1">
                [LAST_SYNC: {lastUpdated}]
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 border border-[#334155] hover:border-emerald-500 text-emerald-400 rounded-xl shadow-lg font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Log
        </button>
      </div>

      {/* DYNAMIC FILTER OVERLAY CARD */}
      <div className="bg-[#1E293B] p-5 rounded-3xl border border-[#334155] shadow-2xl mb-6 flex flex-col md:flex-row gap-4 items-end">
        
        <div className="w-full md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3 h-3 text-emerald-400" />
              Filter by Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-[#334155] bg-[#0F172A] rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              id="filter-status"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* User ID Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3 h-3 text-emerald-400" />
              Filter by User ID
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                placeholder="Type User ID here..."
                className="w-full pl-10 pr-3.5 py-2.5 border border-[#334155] bg-[#0F172A] rounded-xl text-xs font-bold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                id="filter-user-id"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => { setPage(0); fetchOrders(); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-950/20 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Filter className="w-3.5 h-3.5" /> Apply
          </button>
          
          <button
            onClick={() => { setFilters({ status: '', userId: '' }); setPage(0); }}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-900 border border-[#334155] text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* OBSIDIAN AUDIT TABLE PANEL */}
      {loading ? (
        <div className="w-full bg-[#1E293B] rounded-3xl border border-[#334155] p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Synchronizing audit ledgers...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="w-full bg-[#1E293B] rounded-3xl border border-[#334155] p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-300 text-sm">No Transactions Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">No transaction matches your queries. Adjust filters to search.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-[#334155] bg-[#1E293B] shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#334155] bg-[#0F172A] text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-5">Order ID</th>
                  <th className="py-4 px-5">Customer Account</th>
                  <th className="py-4 px-5">Total Items</th>
                  <th className="py-4 px-5">Grand Total</th>
                  <th className="py-4 px-5">Delivery Slot</th>
                  <th className="py-4 px-5">Placed Date</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Transition Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/20">
                {orders.map((order, index) => (
                  <tr 
                    key={order.orderId} 
                    className={`transition-all duration-200 group ${getRowLeftBorder(order.status)} ${
                      index % 2 === 0 ? 'bg-[#1E293B]' : 'bg-[#172033]'
                    } hover:bg-[#253249] hover:shadow-emerald-950/5`}
                  >
                    <td className="py-4 px-5 font-black text-slate-200 group-hover:text-emerald-400 transition-colors text-xs">
                      #{order.orderId}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-bold text-slate-400 truncate max-w-[140px]">
                          {order.userEmail || order.userId || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-400 font-bold">
                      {order.items?.length ?? '—'} units
                    </td>
                    <td className="py-4 px-5 text-xs font-black text-white">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {order.deliverySlot?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 font-mono">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-5">
                      {updating === order.orderId ? (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold">
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                          className="text-[10px] font-black border border-[#334155] rounded-xl px-2.5 py-1.5 bg-[#0F172A] text-slate-300 hover:border-emerald-500 hover:text-white transition-colors outline-none cursor-pointer"
                          id={`status-select-${order.orderId}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION PANEL */}
          <div className="flex items-center justify-between mt-5 bg-[#1E293B] border border-[#334155] p-4 rounded-3xl shadow-2xl">
            <p className="text-xs text-slate-400 font-bold">
              Page <span className="text-emerald-400 font-extrabold">{page + 1}</span> of <span className="text-slate-200">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center justify-center p-2 bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] hover:border-emerald-500 rounded-xl disabled:opacity-30 transition-all text-slate-400 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center justify-center p-2 bg-[#0F172A] hover:bg-[#1E293B] border border-[#334155] hover:border-emerald-500 rounded-xl disabled:opacity-30 transition-all text-slate-400 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AllOrdersPage;
