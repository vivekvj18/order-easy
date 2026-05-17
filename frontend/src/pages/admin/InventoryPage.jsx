import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Package, AlertTriangle, AlertCircle, ShoppingCart, Activity } from 'lucide-react';
import { getStockSummary } from '../../api/analyticsApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
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

// Circular Progress Health Indicator Component
const CircularHealthScore = ({ score }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = 'text-emerald-500';
  let bgColor = 'bg-emerald-500/10';
  if (score < 50) {
    strokeColor = 'text-rose-500';
    bgColor = 'bg-rose-500/10';
  } else if (score < 80) {
    strokeColor = 'text-amber-500';
    bgColor = 'bg-amber-500/10';
  }

  return (
    <div className="flex items-center gap-4 bg-[#1E293B] border border-[#334155] p-4 rounded-3xl shadow-glow-blue flex-1 md:flex-none">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="32" 
            cy="32" 
            r={radius} 
            className="text-slate-800" 
            strokeWidth="5" 
            stroke="currentColor" 
            fill="transparent" 
          />
          <circle 
            cx="32" 
            cy="32" 
            r={radius} 
            className={`${strokeColor} transition-all duration-500`} 
            strokeWidth="5" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            stroke="currentColor" 
            fill="transparent" 
          />
        </svg>
        <span className="absolute text-xs font-black text-white">{score}%</span>
      </div>
      <div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Stock Health Index</span>
        <span className="text-sm font-black text-slate-200 mt-0.5 block">
          {score > 80 ? 'Excellent Stocking' : score >= 50 ? 'Warning: Low Levels' : 'Critical Depletion'}
        </span>
      </div>
    </div>
  );
};

// Available Quantity mini progress bar
const MiniProgressBar = ({ available, total }) => {
  const percent = total > 0 ? Math.min(100, Math.round((available / total) * 100)) : 0;
  
  let barColor = 'bg-emerald-500';
  if (percent < 20) {
    barColor = 'bg-rose-500 animate-pulse';
  } else if (percent < 50) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="flex flex-col gap-1 w-24">
      <div className="flex items-center justify-between text-[8px] font-bold text-slate-400">
        <span>{percent}% AVAIL</span>
        <span>{available}/{total}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
};

const StockStatusBadge = ({ lowStock }) => {
  if (lowStock) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider animate-pulse">
        <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
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
      setLastUpdated(now.toLocaleTimeString('en-US', { hour12: false }));
      if (isManual) toast.success('Stock telemetry synchronized');
    } catch (err) {
      toast.error('Failed to sync stock levels: ' + (err.message || 'Service down'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  // Stock health calculations
  const totalCount = stockList.length;
  const lowStockCount = stockList.filter(item => item.lowStock).length;
  const healthyStockCount = totalCount - lowStockCount;
  const stockHealthScore = totalCount > 0 ? Math.round((healthyStockCount / totalCount) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8 animate-fade-in font-sans text-slate-100 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-[#1E293B] p-5 rounded-3xl border border-[#334155] shadow-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <Package className="w-5 h-5" />
            </span>
            Real-time Inventory Audit
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium flex items-center gap-1.5">
            Live warehouses telemetry logs connected to inventory-service
            {lastUpdated && (
              <span className="text-[10px] font-mono text-slate-500 ml-1">
                [SYNC_TIME: {lastUpdated}]
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => fetchStock(true)}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 border border-[#334155] hover:border-emerald-500 text-emerald-400 rounded-xl shadow-lg font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Stock
        </button>
      </div>

      {/* QUICK METRICS GRID */}
      {!loading && stockList.length > 0 && (
        <div className="flex flex-col md:flex-row gap-5 mb-6 animate-fade-in-up items-stretch">
          
          {/* KPI Card 1: Total Lines */}
          <div className="flex-1 bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-glow-blue flex items-center gap-4 group">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Audited Lines</span>
              <p className="text-2xl font-black text-white mt-0.5">
                <AnimatedNumber value={totalCount} />
              </p>
            </div>
          </div>

          {/* KPI Card 2: Low Stock warnings */}
          <div className="flex-1 bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-glow-red flex items-center gap-4 group">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Low Stock Warnings</span>
              <p className={`text-2xl font-black mt-0.5 ${lowStockCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
                <AnimatedNumber value={lowStockCount} />
              </p>
            </div>
          </div>

          {/* KPI Card 3: Reserved Items */}
          <div className="flex-1 bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-glow-amber flex items-center gap-4 group">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Reserved In Carts</span>
              <p className="text-2xl font-black text-white mt-0.5">
                <AnimatedNumber value={stockList.reduce((sum, item) => sum + (item.reservedQuantity || 0), 0)} /> Units
              </p>
            </div>
          </div>

          {/* Circular Health Score Card */}
          <CircularHealthScore score={stockHealthScore} />

        </div>
      )}

      {/* STOCK LEVEL AUDIT TABLE */}
      {loading ? (
        <div className="w-full bg-[#1E293B] rounded-3xl border border-[#334155] p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Synchronizing stock telemetry levels...</span>
        </div>
      ) : stockList.length === 0 ? (
        <div className="w-full bg-[#1E293B] rounded-3xl border border-[#334155] p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-300 text-sm">No Stock Records Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">No inventory stock levels logged in the microservice.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#334155] bg-[#1E293B] shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#334155] bg-[#0F172A] text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Product ID</th>
                <th className="py-4 px-5">Product Label</th>
                <th className="py-4 px-5">Ratio meter (Avail/Total)</th>
                <th className="py-4 px-5">Available Quantity</th>
                <th className="py-4 px-5">Reserved Quantity</th>
                <th className="py-4 px-5">Total Warehoused Stock</th>
                <th className="py-4 px-5">Status Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/20">
              {stockList.map((item, idx) => (
                <tr 
                  key={item.productId} 
                  className={`transition-all duration-200 group ${
                    item.lowStock ? 'bg-rose-500/[0.04]' : idx % 2 === 0 ? 'bg-[#1E293B]' : 'bg-[#172033]'
                  } hover:bg-[#253249]`}
                >
                  <td className="py-4 px-5 font-black text-slate-200 group-hover:text-emerald-400 transition-colors text-xs">
                    #{item.productId}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Package className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">Prod {item.productId}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <MiniProgressBar available={item.availableQuantity} total={item.quantity} />
                  </td>
                  <td className="py-4 px-5 font-black text-white text-xs">
                    {item.availableQuantity} Units
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-500 font-black">
                    {item.reservedQuantity ?? 0} Reserved
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-300 font-bold">
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
