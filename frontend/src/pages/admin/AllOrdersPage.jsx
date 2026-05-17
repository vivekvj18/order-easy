import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, RefreshCw, ShoppingBag, Eye, Calendar, User, Sliders } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../api/ordersApi';
import { formatCurrency, formatDateTime, extractErrorMessage } from '../../utils/formatters';
import { ORDER_STATUSES } from '../../utils/constants';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// Premium Pill status badges
const OrderStatusBadge = ({ status }) => {
  const styles = {
    DELIVERED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    CANCELLED: 'bg-rose-50 text-rose-600 border-rose-100',
    CONFIRMED: 'bg-amber-50 text-amber-600 border-amber-100',
    OUT_FOR_DELIVERY: 'bg-sky-50 text-sky-600 border-sky-100',
    SHIPPED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    CREATED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.CREATED}`}>
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
      setLastUpdated(now.toLocaleTimeString('en-IN', { hour12: false }));
      if (isManual) toast.success('Orders refreshed');
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
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100/80 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </span>
            All Orders Audit Portal
          </h1>
          <p className="text-slate-400 text-xs mt-0.5 font-medium flex items-center gap-1.5">
            Audit and transition customer microservice orders
            {lastUpdated && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                Synced: {lastUpdated}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Portal
        </button>
      </div>

      {/* FILTER CONTROL CARD */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/80 mb-6 flex flex-col md:flex-row gap-4 items-end">
        
        <div className="w-full md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3 h-3" />
              Filter by Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-slate-100 bg-slate-50 rounded-xl focus:bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 cursor-pointer"
              id="filter-status"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* User Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3 h-3" />
              Filter by User ID
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
                placeholder="Type User ID here..."
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-100 bg-slate-50 rounded-xl focus:bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                id="filter-user-id"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => { setPage(0); fetchOrders(); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Filter className="w-3.5 h-3.5" /> Apply Filters
          </button>
          
          <button
            onClick={() => { setFilters({ status: '', userId: '' }); setPage(0); }}
            className="flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ORDERS DATA AUDIT LIST TABLE */}
      {loading ? (
        <div className="w-full bg-white rounded-2xl border border-slate-100/80 p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Syncing orders data logs...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-slate-100/80 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No Orders Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">No transactions matched your filtering criteria. Try adjusting filters.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-100/80 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Order ID</th>
                  <th className="py-3.5 px-5">Customer Account</th>
                  <th className="py-3.5 px-5">Total Items</th>
                  <th className="py-3.5 px-5">Grand Total</th>
                  <th className="py-3.5 px-5">Delivery Slot</th>
                  <th className="py-3.5 px-5">Placed Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Update Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-emerald-50/20 transition-colors group">
                    {/* Fixed order.id references to order.orderId */}
                    <td className="py-3.5 px-5 font-bold text-slate-700 group-hover:text-emerald-600 transition-colors text-xs">
                      #{order.orderId}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500 truncate max-w-[140px]">
                          {order.userEmail || order.userId || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-500 font-semibold">
                      {order.items?.length ?? '—'} items
                    </td>
                    <td className="py-3.5 px-5 text-xs font-black text-slate-800">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[10px] font-bold text-slate-400 capitalize">
                        {order.deliverySlot?.replace('_', ' ') || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-5">
                      {updating === order.orderId ? (
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                          className="text-[10px] font-bold border border-slate-100 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 hover:border-emerald-500 hover:bg-white transition-colors outline-none cursor-pointer"
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
          <div className="flex items-center justify-between mt-5 bg-white p-4 rounded-2xl border border-slate-100/80 shadow-sm">
            <p className="text-xs text-slate-400 font-bold">
              Page <span className="text-slate-700">{page + 1}</span> of <span className="text-slate-700">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl disabled:opacity-40 transition-all text-slate-600 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl disabled:opacity-40 transition-all text-slate-600 cursor-pointer"
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
