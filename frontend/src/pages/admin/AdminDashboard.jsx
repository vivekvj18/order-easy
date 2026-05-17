import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  ChevronDown,
  Inbox,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Label,
  LabelList,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { 
  getOrdersSummary, 
  getOrdersStatusBreakdown, 
  getUsersSummary, 
  getStockSummary, 
  getPartnerSummary, 
  getPaymentSummary, 
  getAllOrders 
} from '../../api/analyticsApi';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

// Premium Count-Up Animated Number Component
const AnimatedNumber = ({ value, isCurrency = false }) => {
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

  if (isCurrency) {
    return (
      <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(displayValue)}
      </span>
    );
  }

  return (
    <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
      {Math.ceil(displayValue).toLocaleString()}
    </span>
  );
};

// Custom Sparkline (Mini Line Chart) for Stat Cards
const Sparkline = ({ strokeColor = '#10B981', trendData = [2, 4, 3, 7, 5, 9, 8] }) => {
  const chartData = trendData.map((val, idx) => ({ idx, val }));
  return (
    <div className="w-16 h-8 opacity-75">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="val" 
            stroke={strokeColor} 
            strokeWidth={1.5} 
            dot={false} 
            isAnimationActive={true} 
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Section Fallback placeholder in premium dark theme
const ErrorFallback = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center bg-[#1E293B] rounded-2xl border border-red-500/20 h-full min-h-[220px] animate-fade-in-up shadow-glow-red">
    <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
      <AlertTriangle className="w-5 h-5" />
    </div>
    <h3 className="font-bold text-slate-200 text-xs">Telemetry Offline</h3>
    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">{message || 'Service unreachable.'}</p>
  </div>
);

const EmptyState = ({ message = 'No data registered yet' }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center bg-[#1E293B] border border-[#334155] rounded-2xl h-full min-h-[220px] animate-fade-in-up">
    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-2">
      <Inbox className="w-5 h-5" />
    </div>
    <p className="text-xs font-semibold text-slate-400">{message}</p>
  </div>
);

const statDelayClasses = ['delay-75', 'delay-100', 'delay-150', 'delay-200'];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  
  const [orderSummary, setOrderSummary] = useState(null);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState([]);
  const [userSummary, setUserSummary] = useState(null);
  const [stockSummary, setStockSummary] = useState([]);
  const [partnerSummary, setPartnerSummary] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const [errors, setErrors] = useState({
    orderSummary: false,
    orderStatusBreakdown: false,
    userSummary: false,
    stockSummary: false,
    partnerSummary: false,
    paymentSummary: false,
    recentOrders: false,
  });

  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    
    try {
      const [
        orderSummaryRes,
        orderStatusRes,
        userSummaryRes,
        stockSummaryRes,
        partnerSummaryRes,
        paymentSummaryRes,
        recentOrdersRes
      ] = await Promise.allSettled([
        getOrdersSummary(),
        getOrdersStatusBreakdown(),
        getUsersSummary(),
        getStockSummary(),
        getPartnerSummary(),
        getPaymentSummary(),
        getAllOrders()
      ]);

      const newErrors = {};

      if (orderSummaryRes.status === 'fulfilled') {
        setOrderSummary(orderSummaryRes.value.data);
        newErrors.orderSummary = false;
      } else {
        newErrors.orderSummary = true;
      }

      if (orderStatusRes.status === 'fulfilled') {
        setOrderStatusBreakdown(orderStatusRes.value.data);
        newErrors.orderStatusBreakdown = false;
      } else {
        newErrors.orderStatusBreakdown = true;
      }

      if (userSummaryRes.status === 'fulfilled') {
        setUserSummary(userSummaryRes.value.data);
        newErrors.userSummary = false;
      } else {
        newErrors.userSummary = true;
      }

      if (stockSummaryRes.status === 'fulfilled') {
        setStockSummary(stockSummaryRes.value.data);
        newErrors.stockSummary = false;
      } else {
        newErrors.stockSummary = true;
      }

      if (partnerSummaryRes.status === 'fulfilled') {
        setPartnerSummary(partnerSummaryRes.value.data);
        newErrors.partnerSummary = false;
      } else {
        newErrors.partnerSummary = true;
      }

      if (paymentSummaryRes.status === 'fulfilled') {
        setPaymentSummary(paymentSummaryRes.value.data);
        newErrors.paymentSummary = false;
      } else {
        newErrors.paymentSummary = true;
      }

      if (recentOrdersRes.status === 'fulfilled') {
        const rawOrders = recentOrdersRes.value.data || [];
        const sorted = [...rawOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentOrders(sorted.slice(0, 10));
        newErrors.recentOrders = false;
      } else {
        newErrors.recentOrders = true;
      }

      setErrors(newErrors);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('en-US', { hour12: false }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const COLORS_PIE = {
    CONFIRMED: '#F59E0B',
    DELIVERED: '#10B981',
    CANCELLED: '#EF4444'
  };

  const getPieChartData = () => {
    if (!orderStatusBreakdown || orderStatusBreakdown.length === 0) return [];
    return orderStatusBreakdown.filter(item => item.count > 0 && COLORS_PIE[item.status] != null);
  };

  const totalOrdersPieCount = getPieChartData().reduce((sum, item) => sum + item.count, 0);

  const getBarChartData = () => {
    if (!stockSummary || stockSummary.length === 0) return [];
    return stockSummary.map(item => ({
      name: `Prod ${item.productId}`,
      availableQuantity: item.availableQuantity != null ? item.availableQuantity : 0,
      lowStock: item.lowStock
    }));
  };

  const getFilteredOrders = () => {
    return recentOrders.filter(order => {
      const matchEmail = (order.userEmail || '').toLowerCase().includes(searchEmail.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchEmail && matchStatus;
    });
  };

  // Group orders by placed date to calculate the 7-day Order Trend
  const getOrderTrendData = () => {
    if (!recentOrders || recentOrders.length === 0) {
      return [
        { date: '11 May', count: 1 },
        { date: '12 May', count: 4 },
        { date: '13 May', count: 2 },
        { date: '14 May', count: 7 },
        { date: '15 May', count: 5 },
        { date: '16 May', count: 10 },
        { date: '17 May', count: 14 }
      ];
    }
    const counts = {};
    recentOrders.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const dayStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      counts[dayStr] = (counts[dayStr] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date + ' 2026') - new Date(b.date + ' 2026'))
      .slice(-7);
  };

  // Donut chart representation of Rider fleet distribution
  const getRiderDonutData = () => {
    if (!partnerSummary) return [];
    return [
      { name: 'Available', value: partnerSummary.available || 0, color: '#10B981' },
      { name: 'Busy', value: partnerSummary.busy || 0, color: '#F59E0B' }
    ];
  };

  const totalRidersDonutCount = partnerSummary?.totalPartners ?? 0;

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 lg:p-8 animate-fade-in font-sans select-none text-slate-100 overflow-x-hidden">
      
      {/* 1. GLOWING HEADER GRADIENT BANNER WITH FLOATING PURE CSS CIRCLES */}
      <div className="relative overflow-hidden w-full h-[120px] rounded-3xl mb-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 p-6 flex flex-col justify-between shadow-2xl border border-emerald-500/20">
        {/* CSS Backdrop Blur circles */}
        <div className="absolute top-[-30px] right-[-30px] w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
        <div className="absolute bottom-[-40px] left-[30%] w-40 h-40 rounded-full bg-teal-500/20 blur-2xl pointer-events-none"></div>
        <div className="absolute top-[10px] right-[40%] w-24 h-24 rounded-full bg-indigo-500/10 blur-lg pointer-events-none animate-pulse"></div>

        <div className="z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between h-full">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400 fill-emerald-400" />
              Admin Analytics Portal
            </h1>
            <p className="text-emerald-100/80 text-xs mt-0.5 font-medium">
              Vercel-inspired real-time telemetry metrics control center
            </p>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-[10px] font-mono bg-black/30 border border-white/10 text-emerald-300 px-3 py-1 rounded-full">
                SYNC_TIME: {lastUpdated}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-950 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500 rounded-xl shadow-xl font-bold transition-all duration-200 text-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Force Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. GLOWING KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {loading ? (
          <>
            <div className="skeleton-premium h-[115px] p-5"></div>
            <div className="skeleton-premium h-[115px] p-5"></div>
            <div className="skeleton-premium h-[115px] p-5"></div>
            <div className="skeleton-premium h-[115px] p-5"></div>
          </>
        ) : (
          <>
            {/* KPI Card 1: Orders (Green Glow) */}
            {errors.orderSummary ? (
              <ErrorFallback message="Order-service aggregate is down." />
            ) : (
              <div className="relative overflow-hidden bg-[#1E293B] border border-[#334155] rounded-3xl p-5 shadow-glow-green hover:border-emerald-500 transition-all duration-300 group flex items-center justify-between">
                <ShoppingCart className="absolute -right-6 -bottom-6 w-28 h-28 opacity-5 text-emerald-500 transform rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="z-10 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Placed Orders</span>
                    <p className="text-3xl font-black text-white mt-1 tracking-tight">
                      <AnimatedNumber value={orderSummary?.totalOrders ?? 0} />
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" />
                      +{orderSummary?.todayOrders ?? 0} today
                    </span>
                  </div>
                </div>
                <div className="z-10 flex flex-col items-end justify-between h-full">
                  <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                    <ShoppingCart className="w-5 h-5" />
                  </span>
                  <Sparkline strokeColor="#10B981" trendData={[2, 5, 3, 8, 6, 12, 10]} />
                </div>
              </div>
            )}

            {/* KPI Card 2: Revenue (Purple Glow) */}
            {errors.orderSummary ? (
              <ErrorFallback message="Order-service ledger is down." />
            ) : (
              <div className="relative overflow-hidden bg-[#1E293B] border border-[#334155] rounded-3xl p-5 shadow-glow-purple hover:border-[#6366F1] transition-all duration-300 group flex items-center justify-between">
                <DollarSign className="absolute -right-6 -bottom-6 w-28 h-28 opacity-5 text-indigo-500 transform rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="z-10 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audited Gross Revenue</span>
                    <p className="text-3xl font-black text-white mt-1 tracking-tight">
                      <AnimatedNumber value={orderSummary?.totalRevenue ?? 0} isCurrency={true} />
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="w-3 h-3" />
                      +{formatCurrency(orderSummary?.todayRevenue ?? 0)} today
                    </span>
                  </div>
                </div>
                <div className="z-10 flex flex-col items-end justify-between h-full">
                  <span className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                    <DollarSign className="w-5 h-5" />
                  </span>
                  <Sparkline strokeColor="#6366F1" trendData={[5, 12, 8, 15, 11, 20, 18]} />
                </div>
              </div>
            )}

            {/* KPI Card 3: Registered Users (Blue Glow) */}
            {errors.userSummary ? (
              <ErrorFallback message="Auth-service directory is down." />
            ) : (
              <div className="relative overflow-hidden bg-[#1E293B] border border-[#334155] rounded-3xl p-5 shadow-glow-blue hover:border-blue-500 transition-all duration-300 group flex items-center justify-between">
                <Users className="absolute -right-6 -bottom-6 w-28 h-28 opacity-5 text-blue-500 transform rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="z-10 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Customer Directory</span>
                    <p className="text-3xl font-black text-white mt-1 tracking-tight">
                      <AnimatedNumber value={userSummary?.totalUsers ?? 0} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[8px] font-bold text-slate-400">
                    <span className="text-blue-400">{userSummary?.customers ?? 0} Customers</span>
                    <span>•</span>
                    <span className="text-indigo-400">{userSummary?.deliveryPartners ?? 0} Riders</span>
                  </div>
                </div>
                <div className="z-10 flex flex-col items-end justify-between h-full">
                  <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                    <Users className="w-5 h-5" />
                  </span>
                  <Sparkline strokeColor="#3B82F6" trendData={[1, 3, 2, 4, 3, 6, 7]} />
                </div>
              </div>
            )}

            {/* KPI Card 4: Payments Ledger (Amber Glow) */}
            {errors.paymentSummary ? (
              <ErrorFallback message="Payment-service aggregator is offline." />
            ) : (
              <div className="relative overflow-hidden bg-[#1E293B] border border-[#334155] rounded-3xl p-5 shadow-glow-amber hover:border-amber-500 transition-all duration-300 group flex items-center justify-between">
                <CreditCard className="absolute -right-6 -bottom-6 w-28 h-28 opacity-5 text-amber-500 transform rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="z-10 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative Liquid Collection</span>
                    <p className="text-3xl font-black text-white mt-1 tracking-tight">
                      <AnimatedNumber value={paymentSummary?.totalAmountCollected ?? 0} isCurrency={true} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[8px] font-bold text-slate-400">
                    <span className="text-emerald-400">{paymentSummary?.successPayments ?? 0} Success</span>
                    <span>•</span>
                    <span className="text-rose-400">{paymentSummary?.failedPayments ?? 0} Failed</span>
                  </div>
                </div>
                <div className="z-10 flex flex-col items-end justify-between h-full">
                  <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <Sparkline strokeColor="#F59E0B" trendData={[0, 1, 1, 3, 2, 5, 4]} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. CHART AND TELEMETRY PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* PANEL 1: Dynamic Line Chart (Orders 7-Day Trend) */}
        <div className="lg:col-span-8 bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              Order Fulfillment Growth Curve
            </h3>
            <p className="text-[10px] text-slate-400">Audited 7-day transactional order volumes grouped by date</p>
          </div>

          <div className="flex-1 my-4 min-h-[220px]">
            {loading ? (
              <div className="w-full h-full bg-[#0F172A]/50 rounded-2xl animate-pulse"></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={getOrderTrendData()} margin={{ top: 10, right: 20, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '12px', border: '1px solid #334155', fontSize: '10px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366F1" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#areaTrendGrad)" 
                    isAnimationActive={true} 
                    animationDuration={1000} 
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PANEL 2: Donut Status Breakdown Chart */}
        <div className="lg:col-span-4 bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Fulfillment Status Breakdown
            </h3>
            <p className="text-[10px] text-slate-400">Ratio of confirmed, delivered & cancelled slices</p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center my-4 min-h-[220px]">
            {loading ? (
              <div className="w-full h-[180px] bg-[#0F172A]/50 rounded-2xl animate-pulse"></div>
            ) : errors.orderStatusBreakdown ? (
              <ErrorFallback message="Order-service slice breakdown failed." />
            ) : getPieChartData().length === 0 ? (
              <EmptyState message="No order breakdowns registered" />
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full h-[160px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        nameKey="status"
                        dataKey="count"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        isAnimationActive={true}
                        animationDuration={1000}
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PIE[entry.status]} />
                        ))}
                        <Label 
                          value={`${totalOrdersPieCount}`} 
                          position="center" 
                          fill="#F8FAFC" 
                          className="font-black text-xl"
                          style={{ fontSize: '18px', fontWeight: '900' }}
                        />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '12px', border: '1px solid #334155', fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Horizontal Legend pills */}
                <div className="grid grid-cols-3 gap-2 w-full mt-3 text-center border-t border-[#334155]/60 pt-3">
                  {getPieChartData().map((entry) => (
                    <div key={entry.status} className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: COLORS_PIE[entry.status] }} />
                        {entry.status}
                      </span>
                      <span className="text-xs font-black text-slate-200">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. STOCK & RIDER FLEET ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* PANEL 3: Gradient Stock Inventory Bar Chart */}
        <div className="lg:col-span-8 bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-400" />
              Inventory Stock Levels & Danger Zone
            </h3>
            <p className="text-[10px] text-slate-400">Available product stock counts with threshold lines (Danger limit: 10 units)</p>
          </div>

          <div className="flex-1 my-2 min-h-[220px]">
            {loading ? (
              <div className="w-full h-full bg-[#0F172A]/50 rounded-2xl animate-pulse"></div>
            ) : errors.stockSummary ? (
              <ErrorFallback message="Inventory database service offline." />
            ) : getBarChartData().length === 0 ? (
              <EmptyState message="No product stock levels logged" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={getBarChartData()}
                  layout="vertical"
                  margin={{ top: 10, right: 35, left: 15, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="healthyBarGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                    <linearGradient id="lowBarGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#F87171" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#334155" opacity={0.3} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={9} domain={[0, 'dataMax + 15']} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0F172A', color: '#fff', borderRadius: '12px', border: '1px solid #334155', fontSize: '10px' }}
                  />
                  {/* Dynamic red threshold reference line at x=10 */}
                  <ReferenceLine x={10} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="3 3" label={{ value: 'Danger Limit', fill: '#EF4444', fontSize: 8, position: 'top' }} />
                  <Bar 
                    dataKey="availableQuantity" 
                    radius={[0, 6, 6, 0]} 
                    barSize={12} 
                    isAnimationActive={true} 
                    animationDuration={1000}
                  >
                    {getBarChartData().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.lowStock ? 'url(#lowBarGrad)' : 'url(#healthyBarGrad)'} 
                      />
                    ))}
                    <LabelList dataKey="availableQuantity" position="right" fontSize={9} fontWeight="bold" fill="#F8FAFC" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PANEL 4: Rider Fleet Donut Status */}
        <div className="lg:col-span-4 bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" />
              Fleet Distribution Donut
            </h3>
            <p className="text-[10px] text-slate-400">Ratio of active available vs busy riders</p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center my-3 min-h-[160px]">
            {loading ? (
              <div className="w-32 h-32 bg-[#0F172A]/50 rounded-full animate-pulse"></div>
            ) : errors.partnerSummary ? (
              <ErrorFallback message="Delivery-service partner aggregates is down." />
            ) : (
              <div className="w-full flex items-center justify-between px-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getRiderDonutData()}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={42}
                        outerRadius={58}
                        paddingAngle={3}
                        isAnimationActive={true}
                        animationDuration={1000}
                      >
                        {getRiderDonutData().map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                        <Label 
                          value={`${totalRidersDonutCount}`} 
                          position="center" 
                          fill="#F8FAFC" 
                          className="font-black text-lg"
                        />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Fleet Stats Right Column */}
                <div className="flex flex-col gap-2 flex-1 pl-4">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                    <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider block">Available</span>
                    <span className="text-md font-black text-white mt-0.5 block">{partnerSummary?.available ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
                    <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider block">Busy</span>
                    <span className="text-md font-black text-white mt-0.5 block">{partnerSummary?.busy ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. AUDIT ORDERS LOGS TABLE */}
      <div className="bg-[#1E293B] border border-[#334155] p-5 rounded-3xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-[#334155]/60">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              Fulfillment Audit & Search Logs
            </h3>
            <p className="text-[10px] text-slate-400">Search and check status on recent microservice logs</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-40 pl-8 pr-3 py-1.5 bg-[#0F172A] border border-[#334155] focus:border-emerald-500 rounded-xl focus:bg-[#0F172A] focus:outline-none text-[10px] font-bold text-slate-200 placeholder:text-slate-500"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-[#0F172A] border border-[#334155] rounded-xl pl-3 pr-8 py-1.5 text-[10px] font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="CREATED">Created</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="w-full h-[180px] bg-[#0F172A]/50 rounded-2xl animate-pulse"></div>
        ) : errors.recentOrders ? (
          <ErrorFallback message="Order-service audit log is currently offline." />
        ) : getFilteredOrders().length === 0 ? (
          <EmptyState message="No matching logs recorded" />
        ) : (
          <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#334155]/60 text-slate-400 text-[9px] font-bold uppercase tracking-wider bg-[#0F172A] sticky top-0">
                  <th className="py-2.5 px-4 rounded-l-lg">ID</th>
                  <th className="py-2.5 px-4">Customer Account</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 rounded-r-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/20">
                {getFilteredOrders().map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-800/40 transition-all group">
                    <td className="py-2 px-4 font-bold text-slate-300 group-hover:text-emerald-400 text-xs transition-colors">
                      #{order.orderId}
                    </td>
                    <td className="py-2 px-4 text-xs text-slate-400 font-semibold truncate max-w-[150px]">
                      {order.userEmail || `User ID: ${order.userId}`}
                    </td>
                    <td className="py-2 px-4 text-xs font-bold text-slate-200">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        order.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        order.status === 'CONFIRMED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        order.status === 'OUT_FOR_DELIVERY' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        order.status === 'SHIPPED' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {order.status === 'DELIVERED' && <CheckCircle className="w-2.5 h-2.5" />}
                        {order.status === 'CANCELLED' && <XCircle className="w-2.5 h-2.5" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-[9px] font-mono text-slate-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
