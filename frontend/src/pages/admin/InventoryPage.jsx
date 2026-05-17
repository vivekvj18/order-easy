import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Package, AlertTriangle, AlertCircle, ShoppingCart } from 'lucide-react';
import { getStockSummary } from '../../api/analyticsApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import toast from 'react-hot-toast';

const StockStatusBadge = ({ lowStock }) => {
  if (lowStock) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider animate-pulse">
        <AlertTriangle className="w-2.5 h-2.5" />
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
      In Stock
    </span>
  );
};

const InventoryPage = () => {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchStock = useCallback(async (isManual = false) => {
    setLoading(true);
    try {
      const res = await getStockSummary();
      setStockList(res.data || []);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('en-IN', { hour12: false }));
      if (isManual) toast.success('Inventory audited and synced');
    } catch (err) {
      toast.error('Failed to sync inventory: ' + (err.message || 'Service down'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100/80 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
            Real-time Inventory Stock Audit
          </h1>
          <p className="text-slate-400 text-xs mt-0.5 font-medium flex items-center gap-1.5">
            Live stock audits connected directly to inventory-service
            {lastUpdated && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                Synced: {lastUpdated}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => fetchStock(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Stock
        </button>
      </div>

      {/* QUICK STATS MINI PANELS */}
      {!loading && stockList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Product Lines</p>
              <p className="text-xl font-black text-slate-800 mt-0.5">{stockList.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Warnings</p>
              <p className="text-xl font-black text-rose-600 mt-0.5">
                {stockList.filter(item => item.lowStock).length}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reserved in Carts</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">
                {stockList.reduce((sum, item) => sum + (item.reservedQuantity || 0), 0)} Units
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STOCK INVENTORY AUDIT TABLE */}
      {loading ? (
        <div className="w-full bg-white rounded-2xl border border-slate-100/80 p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Syncing real-time stock levels...</span>
        </div>
      ) : stockList.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-slate-100/80 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No Stock Records Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">There is currently no inventory stock logged in the microservice.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100/80 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Product ID</th>
                <th className="py-3.5 px-5">Product Label</th>
                <th className="py-3.5 px-5">Available Quantity</th>
                <th className="py-3.5 px-5">Reserved Quantity</th>
                <th className="py-3.5 px-5">Total Stock Quantity</th>
                <th className="py-3.5 px-5">Status Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stockList.map((item) => (
                <tr key={item.productId} className="hover:bg-emerald-50/20 transition-colors group">
                  <td className="py-4 px-5 font-bold text-slate-700 group-hover:text-emerald-600 transition-colors text-xs">
                    #{item.productId}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Package className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">Prod {item.productId}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-extrabold text-slate-800 text-xs">
                    {item.availableQuantity} Units
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-400 font-bold">
                    {item.reservedQuantity ?? 0} Reserved
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-600 font-bold">
                    {item.quantity} Units
                  </td>
                  <td className="py-4 px-5">
                    <StockStatusBadge lowStock={item.lowStock} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
