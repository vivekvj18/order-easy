import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ShieldAlert, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
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
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-red-50/50 rounded-2xl border border-red-100 h-full min-h-[220px] animate-fade-in">
    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-3">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="font-semibold text-gray-800 text-sm">Data Temporary Unavailable</h3>
    <p className="text-xs text-gray-500 mt-1 max-w-[240px]">{message || 'This service is currently unreachable.'}</p>
  </div>
);

// Individual Section Skeleton Loader
const SkeletonLoader = ({ className = 'h-[240px]' }) => (
  <div className={`w-full rounded-2xl bg-gray-50 animate-pulse border border-gray-100 flex items-center justify-center ${className}`}>
    <div className="flex flex-col items-center gap-2">
      <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
      <span className="text-xs text-gray-400 font-medium">Loading data...</span>
    </div>
  </div>
);

const StatCardSkeleton = () => (
  <div className="h-[120px] w-full rounded-2xl bg-gray-50 animate-pulse border border-gray-100 p-6 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
      <div className="h-6 w-2/3 bg-gray-200 rounded"></div>
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

      // Temporary local error log
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

      // Update Timestamp
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('en-IN', { hour12: false }));
    } catch (err) {
      console.error("Dashboard core fetching error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Poll intervals
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30); // auto-refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  // Pie chart helper
  const COLORS_PIE = {
    CONFIRMED: '#F59E0B',
    DELIVERED: '#10B981',
    CANCELLED: '#EF4444'
  };

  const getPieChartData = () => {
    if (!orderStatusBreakdown || orderStatusBreakdown.length === 0) return [];
    return orderStatusBreakdown.filter(item => COLORS_PIE[item.status] != null);
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
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8 animate-fade-in font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 backdrop-blur-md">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-7 h-7" />
            </span>
            Admin Analytics Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            Real-time Quick Commerce Insights Dashboard
            {lastUpdated && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                Last updated: {lastUpdated}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl shadow-sm font-semibold transition-all duration-200 disabled:opacity-50 text-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Sync Portal'}
          </button>
        </div>
      </div>

      {/* SECTION 1: KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <ErrorFallback message="Order-service analytics summary is currently down." />
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200 group">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400">Total Orders</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-1">{orderSummary?.totalOrders ?? 0}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50">
                      +{orderSummary?.todayOrders ?? 0} Today
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Card 2: Revenue */}
            {errors.orderSummary ? (
              <ErrorFallback message="Order-service revenue data is down." />
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200 group">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400">Total Revenue</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(orderSummary?.totalRevenue ?? 0)}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs font-bold text-amber-600 px-2 py-0.5 rounded-full bg-amber-50">
                      +{formatCurrency(orderSummary?.todayRevenue ?? 0)} Today
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Card 3: Total Users */}
            {errors.userSummary ? (
              <ErrorFallback message="Auth-service user summary is currently down." />
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200 group">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400">Total Users</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-1">{userSummary?.totalUsers ?? 0}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-semibold">
                    <span className="text-blue-600">{userSummary?.customers ?? 0} Cust</span>
                    <span>•</span>
                    <span className="text-indigo-600">{userSummary?.deliveryPartners ?? 0} Riders</span>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Card 4: Payments */}
            {errors.paymentSummary ? (
              <ErrorFallback message="Payment-service data is currently down." />
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200 group">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-400">Payments Collected</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(paymentSummary?.totalAmountCollected ?? 0)}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-semibold">
                    <span className="text-emerald-600">{paymentSummary?.successPayments ?? 0} Success</span>
                    <span>•</span>
                    <span className="text-red-500">{paymentSummary?.failedPayments ?? 0} Failed</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION 2 & 3: CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* SECTION 2: Orders by Status (Pie Chart) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Orders Status Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Ratio of current confirmed, delivered & cancelled orders</p>
          </div>

          <div className="flex-1 flex items-center justify-center my-6 min-h-[260px]">
            {loading ? (
              <SkeletonLoader className="h-[260px]" />
            ) : errors.orderStatusBreakdown ? (
              <ErrorFallback message="Order-service status-breakdown endpoint is offline." />
            ) : getPieChartData().length === 0 ? (
              <p className="text-slate-400 text-sm">No orders matching status criteria yet.</p>
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      nameKey="status"
                      dataKey="count"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PIE[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} Orders`, name]}
                      contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '12px', border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Custom Beautiful Grid Legend */}
                <div className="grid grid-cols-3 gap-4 w-full mt-4 text-center border-t border-slate-50 pt-4">
                  {getPieChartData().map((entry) => (
                    <div key={entry.status} className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 justify-center">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS_PIE[entry.status] }} />
                        {entry.status}
                      </span>
                      <span className="text-lg font-extrabold text-slate-700 mt-1">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Stock Levels (Horizontal Bar Chart) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-500" />
              Inventory Stock Levels
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Horizontal status indicating critical lowStock (&lt; 10) product items</p>
          </div>

          <div className="flex-1 my-4 min-h-[300px]">
            {loading ? (
              <SkeletonLoader className="h-[300px]" />
            ) : errors.stockSummary ? (
              <ErrorFallback message="Inventory-service stock-summary endpoint is down." />
            ) : stockSummary.length === 0 ? (
              <p className="text-slate-400 text-sm flex items-center justify-center h-full">No inventory products registered yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stockSummary}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis 
                    dataKey="productId" 
                    type="category" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickFormatter={(val) => `Prod ${val}`}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} Units (${props.payload.lowStock ? 'Low Stock' : 'Healthy'})`, 
                      'Available Quantity'
                    ]}
                    contentStyle={{ background: '#1e293b', color: '#fff', borderRadius: '12px', border: 'none' }}
                  />
                  <Bar dataKey="availableQuantity" radius={[0, 8, 8, 0]} barSize={16}>
                    {stockSummary.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.lowStock ? '#EF4444' : '#10B981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4 & 5: PARTNER & PAYMENT SUMMARY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* SECTION 4: Delivery Partner availability */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Truck className="w-5 h-5 text-slate-500" />
            Delivery Rider Availability
          </h3>

          {loading ? (
            <SkeletonLoader className="h-[120px]" />
          ) : errors.partnerSummary ? (
            <ErrorFallback message="Delivery-service partner availability tracker is down." />
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 bg-emerald-50 rounded-2xl text-center border border-emerald-100 hover:scale-[1.02] transition-all">
                <span className="text-xs font-semibold text-emerald-600 block">Available</span>
                <span className="text-3xl font-extrabold text-emerald-800 mt-1 block">{partnerSummary?.available ?? 0}</span>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl text-center border border-amber-100 hover:scale-[1.02] transition-all">
                <span className="text-xs font-semibold text-amber-600 block">Busy</span>
                <span className="text-3xl font-extrabold text-amber-800 mt-1 block">{partnerSummary?.busy ?? 0}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-200 hover:scale-[1.02] transition-all">
                <span className="text-xs font-semibold text-slate-500 block">Total Active</span>
                <span className="text-3xl font-extrabold text-slate-800 mt-1 block">{partnerSummary?.totalPartners ?? 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: Payment Summary Details */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-slate-500" />
            Transaction Summary Metrics
          </h3>

          {loading ? (
            <SkeletonLoader className="h-[120px]" />
          ) : errors.paymentSummary ? (
            <ErrorFallback message="Payment-service transaction logs are down." />
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div className="p-4 bg-indigo-50 rounded-2xl text-center border border-indigo-100 hover:scale-[1.02] transition-all">
                <span className="text-xs font-semibold text-indigo-600 block">Total Payments</span>
                <span className="text-3xl font-extrabold text-indigo-800 mt-1 block">{paymentSummary?.totalPayments ?? 0}</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl text-center border border-emerald-100 hover:scale-[1.02] transition-all">
                <span className="text-xs font-semibold text-emerald-600 block">Successful</span>
                <span className="text-3xl font-extrabold text-emerald-800 mt-1 block">{paymentSummary?.successPayments ?? 0}</span>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl text-center border border-rose-100 hover:scale-[1.02] transition-all">
                <span className="text-xs font-semibold text-rose-600 block">Failed Logs</span>
                <span className="text-3xl font-extrabold text-rose-800 mt-1 block">{paymentSummary?.failedPayments ?? 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 6: RECENT ORDERS TABLE */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-50 pb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              Recent Orders Audit Logs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Live status log of the last 10 placed orders</p>
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-56 pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-semibold text-slate-700 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="CREATED">Created</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {loading ? (
          <SkeletonLoader className="h-[320px]" />
        ) : errors.recentOrders ? (
          <ErrorFallback message="Order-service audit log is currently down." />
        ) : getFilteredOrders().length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm font-semibold">No recent orders matching filter criteria found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-4 px-6 rounded-l-2xl">Order ID</th>
                  <th className="py-4 px-6">Customer Email</th>
                  <th className="py-4 px-6">Total Amount</th>
                  <th className="py-4 px-6">Status Badge</th>
                  <th className="py-4 px-6 rounded-r-2xl">Placed Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {getFilteredOrders().map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-50/40 transition-all group">
                    <td className="py-4 px-6 font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                      #{order.orderId}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500 font-semibold">
                      {order.userEmail || `User ID: ${order.userId}`}
                    </td>
                    <td className="py-4 px-6 text-sm font-extrabold text-slate-800">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' :
                        order.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                        order.status === 'CONFIRMED' ? 'bg-amber-50 text-amber-600' :
                        order.status === 'OUT_FOR_DELIVERY' ? 'bg-sky-50 text-sky-600' :
                        order.status === 'SHIPPED' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status === 'DELIVERED' && <CheckCircle className="w-3.5 h-3.5" />}
                        {order.status === 'CANCELLED' && <XCircle className="w-3.5 h-3.5" />}
                        {order.status === 'CONFIRMED' && <Clock className="w-3.5 h-3.5" />}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-400">
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
