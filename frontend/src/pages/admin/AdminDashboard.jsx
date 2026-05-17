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
  Inbox
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
  CartesianGrid 
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

// Individual Section Error Boundary Placeholder
const ErrorFallback = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-rose-50/50 rounded-2xl border border-rose-100/60 h-full min-h-[220px] animate-fade-in">
    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-2">
      <AlertTriangle className="w-5 h-5" />
    </div>
    <h3 className="font-bold text-slate-800 text-xs">Service Temporary Down</h3>
    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">{message || 'This service is currently unreachable.'}</p>
  </div>
);

// Individual Section No Data Placeholder
const EmptyState = ({ message = 'No data available yet' }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-2xl border border-slate-100/80 h-full min-h-[220px] animate-fade-in">
    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
      <Inbox className="w-5 h-5" />
    </div>
    <p className="text-xs font-semibold text-slate-500">{message}</p>
  </div>
);

// Individual Section Skeleton Loader
const SkeletonLoader = ({ className = 'h-[220px]' }) => (
  <div className={`w-full rounded-2xl bg-slate-50/50 animate-pulse border border-slate-100 flex flex-col items-center justify-center ${className}`}>
    <RefreshCw className="w-5 h-5 text-slate-300 animate-spin mb-1.5" />
    <span className="text-[10px] text-slate-400 font-semibold">Syncing details...</span>
  </div>
);

const StatCardSkeleton = () => (
  <div className="h-[105px] w-full rounded-2xl bg-slate-50/50 animate-pulse border border-slate-100 p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-slate-200/80"></div>
    <div className="flex-1 space-y-1.5">
      <div className="h-3 w-1/3 bg-slate-200 rounded"></div>
      <div className="h-5 w-2/3 bg-slate-200 rounded"></div>
    </div>
  </div>
);

const AdminDashboard = () => {
  // Global States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Data States
  const [orderSummary, setOrderSummary] = useState(null);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState([]);
  const [userSummary, setUserSummary] = useState(null);
  const [stockSummary, setStockSummary] = useState([]);
  const [partnerSummary, setPartnerSummary] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  // Section Failure States
  const [errors, setErrors] = useState({
    orderSummary: false,
    orderStatusBreakdown: false,
    userSummary: false,
    stockSummary: false,
    partnerSummary: false,
    paymentSummary: false,
    recentOrders: false,
  });

  // Table Search and Filtering
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetching Data Block
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

      // 1. Order Summary
      if (orderSummaryRes.status === 'fulfilled') {
        setOrderSummary(orderSummaryRes.value.data);
        newErrors.orderSummary = false;
      } else {
        newErrors.orderSummary = true;
      }

      // 2. Order Status Breakdown
      if (orderStatusRes.status === 'fulfilled') {
        setOrderStatusBreakdown(orderStatusRes.value.data);
        newErrors.orderStatusBreakdown = false;
      } else {
        newErrors.orderStatusBreakdown = true;
      }

      // 3. User Summary
      if (userSummaryRes.status === 'fulfilled') {
        setUserSummary(userSummaryRes.value.data);
        newErrors.userSummary = false;
      } else {
        newErrors.userSummary = true;
      }

      // 4. Stock Summary
      if (stockSummaryRes.status === 'fulfilled') {
        setStockSummary(stockSummaryRes.value.data);
        newErrors.stockSummary = false;
      } else {
        newErrors.stockSummary = true;
      }

      // 5. Partner Summary
      if (partnerSummaryRes.status === 'fulfilled') {
        setPartnerSummary(partnerSummaryRes.value.data);
        newErrors.partnerSummary = false;
      } else {
        newErrors.partnerSummary = true;
      }

      // 6. Payment Summary
      if (paymentSummaryRes.status === 'fulfilled') {
        setPaymentSummary(paymentSummaryRes.value.data);
        newErrors.paymentSummary = false;
      } else {
        newErrors.paymentSummary = true;
      }

      // 7. Recent Orders (Sort by createdAt descending and keep last 10)
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
      setLastUpdated(now.toLocaleTimeString('en-IN', { hour12: false }));
    } catch (err) {
      console.error("Dashboard core fetching error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Polling every 30 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  // Recharts color maps
  const COLORS_PIE = {
    CONFIRMED: '#F59E0B',
    DELIVERED: '#10B981',
    CANCELLED: '#EF4444'
  };

  // Pie Chart Data mapping (filter out count <= 0 entries to avoid Recharts crashes)
  const getPieChartData = () => {
    if (!orderStatusBreakdown || orderStatusBreakdown.length === 0) return [];
    return orderStatusBreakdown.filter(item => item.count > 0 && COLORS_PIE[item.status] != null);
  };

  const totalOrdersPieCount = getPieChartData().reduce((sum, item) => sum + item.count, 0);

  // Bar Chart Data mapping
  const getBarChartData = () => {
    if (!stockSummary || stockSummary.length === 0) return [];
    return stockSummary.map(item => ({
      name: `Prod ${item.productId}`,
      availableQuantity: item.availableQuantity != null ? item.availableQuantity : 0,
      lowStock: item.lowStock
    }));
  };

  // Filtered orders list
  const getFilteredOrders = () => {
    return recentOrders.filter(order => {
      const matchEmail = (order.userEmail || '').toLowerCase().includes(searchEmail.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchEmail && matchStatus;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100/80 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </span>
            OrderEasy Admin Analytics
          </h1>
          <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5 font-medium">
            Real-time Quick Commerce Management Center
            {lastUpdated && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                Last updated: {lastUpdated}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm font-bold transition-all duration-200 disabled:opacity-50 text-xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Sync Portal'}
          </button>
        </div>
      </div>

      {/* SECTION 1: KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* KPI Card 1: Orders */}
            {errors.orderSummary ? (
              <ErrorFallback message="Order-service summary is down." />
            ) : (
              <div className="bg-white p-5 rounded-2xl border-t-4 border-t-emerald-500 border-x border-b border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200 group">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Total Orders</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{orderSummary?.totalOrders ?? 0}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50">
                      +{orderSummary?.todayOrders ?? 0} Today
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Card 2: Revenue */}
            {errors.orderSummary ? (
              <ErrorFallback message="Order-service revenue logs are down." />
            ) : (
              <div className="bg-white p-5 rounded-2xl border-t-4 border-t-blue-500 border-x border-b border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200 group">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Total Revenue</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{formatCurrency(orderSummary?.totalRevenue ?? 0)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded-full bg-blue-50">
                      +{formatCurrency(orderSummary?.todayRevenue ?? 0)} Today
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Card 3: Total Users */}
            {errors.userSummary ? (
              <ErrorFallback message="Auth-service user log is down." />
            ) : (
              <div className="bg-white p-5 rounded-2xl border-t-4 border-t-purple-500 border-x border-b border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200 group">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Registered Users</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{userSummary?.totalUsers ?? 0}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-bold">
                    <span className="text-blue-500">{userSummary?.customers ?? 0} Customers</span>
                    <span>•</span>
                    <span className="text-purple-600">{userSummary?.deliveryPartners ?? 0} Riders</span>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Card 4: Payments */}
            {errors.paymentSummary ? (
              <ErrorFallback message="Payment-service logs are down." />
            ) : (
              <div className="bg-white p-5 rounded-2xl border-t-4 border-t-amber-500 border-x border-b border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200 group">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Total Payments</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{formatCurrency(paymentSummary?.totalAmountCollected ?? 0)}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-bold">
                    <span className="text-emerald-600">{paymentSummary?.successPayments ?? 0} Success</span>
                    <span>•</span>
                    <span className="text-rose-500">{paymentSummary?.failedPayments ?? 0} Failed</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION 2 & 3: CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* SECTION 2: Orders by Status (Pie Chart) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Orders Status Breakdown
            </h3>
            <p className="text-[10px] text-slate-400">Ratio of active confirmed, delivered & cancelled orders</p>
          </div>

          <div className="flex-1 flex items-center justify-center my-4 min-h-[220px]">
            {loading ? (
              <SkeletonLoader className="h-[220px]" />
            ) : errors.orderStatusBreakdown ? (
              <ErrorFallback message="Order-service breakdown endpoint is unreachable." />
            ) : getPieChartData().length === 0 ? (
              <EmptyState message="No order records found" />
            ) : (
              <div className="w-full flex flex-col justify-center items-center">
                <div className="relative w-full h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        nameKey="status"
                        dataKey="count"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PIE[entry.status]} />
                        ))}
                        {/* Native Donut Center Label showing cumulative orders */}
                        <Label 
                          value={`${totalOrdersPieCount}`} 
                          position="center" 
                          fill="#1e293b" 
                          className="font-black text-xl"
                          style={{ fontSize: '18px', fontWeight: '900' }}
                        />
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} Orders`, name]}
                        contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend Breakdown Grid */}
                <div className="grid grid-cols-3 gap-2 w-full mt-3 text-center border-t border-slate-50 pt-3">
                  {getPieChartData().map((entry) => (
                    <div key={entry.status} className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: COLORS_PIE[entry.status] }} />
                        {entry.status}
                      </span>
                      <span className="text-sm font-black text-slate-700">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Stock Levels (Horizontal Bar Chart) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-500" />
              Inventory Stock Levels
            </h3>
            <p className="text-[10px] text-slate-400">Available stock count per Product ID (lowStock &lt; 10 warning)</p>
          </div>

          <div className="flex-1 my-2 min-h-[220px]">
            {loading ? (
              <SkeletonLoader className="h-[220px]" />
            ) : errors.stockSummary ? (
              <ErrorFallback message="Inventory-service is offline." />
            ) : getBarChartData().length === 0 ? (
              <EmptyState message="No inventory products loaded" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={getBarChartData()}
                  layout="vertical"
                  margin={{ top: 10, right: 35, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} domain={[0, 'dataMax + 15']} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#94a3b8" 
                    fontSize={9} 
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} Units (${props.payload.lowStock ? 'Low Stock Warning' : 'Healthy'})`, 
                      'Available Quantity'
                    ]}
                    contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '11px' }}
                  />
                  <Bar dataKey="availableQuantity" radius={[0, 6, 6, 0]} barSize={12}>
                    {getBarChartData().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.lowStock ? '#EF4444' : '#10B981'} 
                      />
                    ))}
                    {/* Native Label inside the bar showing the actual number */}
                    <LabelList dataKey="availableQuantity" position="right" fontSize={9} fontWeight="bold" fill="#475569" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4 & 5: DYNAMIC STATUS & AUDIT LOGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECTION 4: DELIVERY & TRANSACTION SUMMARY (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Rider Availability Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <Truck className="w-4 h-4 text-slate-500" />
              Rider Status Availability
            </h3>

            {loading ? (
              <SkeletonLoader className="h-[95px]" />
            ) : errors.partnerSummary ? (
              <ErrorFallback message="Delivery-service partner tracking is down." />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-center border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 block">Available</span>
                  <span className="text-xl font-black text-emerald-800 mt-0.5 block">{partnerSummary?.available ?? 0}</span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl text-center border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-600 block">Busy</span>
                  <span className="text-xl font-black text-amber-800 mt-0.5 block">{partnerSummary?.busy ?? 0}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl text-center border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block">Total</span>
                  <span className="text-xl font-black text-slate-800 mt-0.5 block">{partnerSummary?.totalPartners ?? 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status Summary Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
              <CreditCard className="w-4 h-4 text-slate-500" />
              Transactions Logs Summary
            </h3>

            {loading ? (
              <SkeletonLoader className="h-[95px]" />
            ) : errors.paymentSummary ? (
              <ErrorFallback message="Payment-service metrics is down." />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-center border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-600 block">Total</span>
                  <span className="text-xl font-black text-indigo-800 mt-0.5 block">{paymentSummary?.totalPayments ?? 0}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl text-center border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 block">Success</span>
                  <span className="text-xl font-black text-emerald-800 mt-0.5 block">{paymentSummary?.successPayments ?? 0}</span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl text-center border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-600 block">Failed</span>
                  <span className="text-xl font-black text-rose-800 mt-0.5 block">{paymentSummary?.failedPayments ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: RECENT ORDERS AUDIT LOGS TABLE (8 columns) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-50">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Recent Orders Audit Logs
              </h3>
              <p className="text-[10px] text-slate-400">Audit logs list of the last 10 placed orders</p>
            </div>

            {/* Filter inputs */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="w-40 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-[10px] font-semibold text-slate-600 placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-100 rounded-lg pl-3 pr-8 py-1.5 text-[10px] font-semibold text-slate-600 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CREATED">Created</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader className="h-[220px]" />
          ) : errors.recentOrders ? (
            <ErrorFallback message="Order-service audit logs endpoint is offline." />
          ) : getFilteredOrders().length === 0 ? (
            <EmptyState message="No matching recent orders found" />
          ) : (
            <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider bg-slate-50/50 sticky top-0">
                    <th className="py-2.5 px-4 rounded-l-lg">ID</th>
                    <th className="py-2.5 px-4">Customer Email</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 rounded-r-lg">Placed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getFilteredOrders().map((order) => (
                    <tr key={order.orderId} className="hover:bg-slate-50/30 transition-all group">
                      <td className="py-2 px-4 font-bold text-slate-700 group-hover:text-emerald-600 text-xs transition-colors">
                        #{order.orderId}
                      </td>
                      <td className="py-2 px-4 text-xs text-slate-500 font-semibold truncate max-w-[150px]">
                        {order.userEmail || `User ID: ${order.userId}`}
                      </td>
                      <td className="py-2 px-4 text-xs font-black text-slate-800">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                          order.status === 'CONFIRMED' ? 'bg-amber-50 text-amber-600' :
                          order.status === 'OUT_FOR_DELIVERY' ? 'bg-sky-50 text-sky-600' :
                          order.status === 'SHIPPED' ? 'bg-indigo-50 text-indigo-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status === 'DELIVERED' && <CheckCircle className="w-2.5 h-2.5" />}
                          {order.status === 'CANCELLED' && <XCircle className="w-2.5 h-2.5" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-[10px] font-semibold text-slate-400">
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
    </div>
  );
};

export default AdminDashboard;
