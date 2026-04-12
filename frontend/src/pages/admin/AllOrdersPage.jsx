import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../../api/ordersApi';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { formatCurrency, formatDateTime, extractErrorMessage } from '../../utils/formatters';
import { ORDER_STATUSES } from '../../utils/constants';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const AllOrdersPage = () => {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(1);
  const [filters, setFilters]     = useState({ status: '', userId: '' });
  const [updating, setUpdating]   = useState(null);

  const fetchOrders = useCallback(async () => {
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
        setOrders(data?.content || []);
        setTotal(data?.totalPages || 1);
      }
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
      toast.success(`Status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">All Orders</h1>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="form-group flex-1 min-w-[160px]">
          <label className="form-label">Filter by Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="form-select"
            id="filter-status"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group flex-1 min-w-[160px]">
          <label className="form-label">Filter by User ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))}
              placeholder="User ID…"
              className="form-input pl-9"
              id="filter-user-id"
            />
          </div>
        </div>
        <button
          onClick={() => { setPage(0); fetchOrders(); }}
          className="btn-primary h-[46px]"
        >
          <Filter className="w-4 h-4" /> Apply
        </button>
        <button
          onClick={() => { setFilters({ status: '', userId: '' }); setPage(0); }}
          className="btn-ghost h-[46px]"
        >
          Clear
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <EmptyState type="orders" title="No orders found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="table-wrapper card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>User</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Slot</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-semibold">#{order.id}</td>
                    <td className="text-gray-600 text-xs max-w-[120px] truncate">
                      {order.userEmail || order.userId || '—'}
                    </td>
                    <td>{order.items?.length ?? '—'}</td>
                    <td className="font-semibold text-brand-green">{formatCurrency(order.totalAmount)}</td>
                    <td className="text-xs text-gray-500">{order.deliverySlot?.replace('_', ' ') || '—'}</td>
                    <td className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      {updating === order.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 hover:border-brand-green transition-colors outline-none cursor-pointer"
                          id={`status-select-${order.id}`}
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

          {/* Pagination */}
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary px-3 py-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary px-3 py-2 disabled:opacity-40"
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
