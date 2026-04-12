import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar  from './components/Navbar';
import Sidebar from './components/Sidebar';

// Route guards
import CustomerRoute  from './routes/CustomerRoute';
import AdminRoute     from './routes/AdminRoute';
import DeliveryRoute  from './routes/DeliveryRoute';
import ProtectedRoute from './routes/ProtectedRoute';

// Auth pages
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Customer pages
import HomePage          from './pages/customer/HomePage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage          from './pages/customer/CartPage';
import PlaceOrderPage    from './pages/customer/PlaceOrderPage';
import MyOrdersPage      from './pages/customer/MyOrdersPage';
import OrderDetailPage   from './pages/customer/OrderDetailPage';
import TrackOrderPage    from './pages/customer/TrackOrderPage';

// Admin pages
import AdminDashboard       from './pages/admin/AdminDashboard';
import AllOrdersPage        from './pages/admin/AllOrdersPage';
import InventoryPage        from './pages/admin/InventoryPage';
import DeliveryPartnersPage from './pages/admin/DeliveryPartnersPage';

// Delivery partner pages
import MyDeliveriesPage   from './pages/delivery/MyDeliveriesPage';
import UpdateLocationPage from './pages/delivery/UpdateLocationPage';
import AvailabilityPage   from './pages/delivery/AvailabilityPage';

import { useAuth } from './context/AuthContext';
import { ROLES }   from './utils/constants';

// Layout wrapper — shows Sidebar for admin/delivery, Navbar for customer/public
const Layout = ({ children }) => {
  const { role, isAuthenticated } = useAuth();
  const hasSidebar = isAuthenticated &&
    (role === ROLES.ADMIN || role === ROLES.DELIVERY_PARTNER);

  if (hasSidebar) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

// Unauthorized page
const Unauthorized = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
    <div className="text-6xl mb-4">🚫</div>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
    <p className="text-gray-500 mb-6">You don't have permission to view this page.</p>
    <a href="/" className="btn-primary">Go Home</a>
  </div>
);

// Root redirect based on role
const RootRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === ROLES.ADMIN)            return <Navigate to="/admin/dashboard" replace />;
  if (role === ROLES.DELIVERY_PARTNER) return <Navigate to="/delivery/deliveries" replace />;
  return <Navigate to="/home" replace />;
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      {/* Root */}
      <Route path="/"            element={<RootRedirect />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Customer */}
      <Route path="/home"           element={<CustomerRoute><HomePage /></CustomerRoute>} />
      <Route path="/products/:id"   element={<CustomerRoute><ProductDetailPage /></CustomerRoute>} />
      <Route path="/cart"           element={<CustomerRoute><CartPage /></CustomerRoute>} />
      <Route path="/place-order"    element={<CustomerRoute><PlaceOrderPage /></CustomerRoute>} />
      <Route path="/orders"         element={<CustomerRoute><MyOrdersPage /></CustomerRoute>} />
      <Route path="/orders/:id"     element={<CustomerRoute><OrderDetailPage /></CustomerRoute>} />
      <Route path="/track/:orderId" element={<CustomerRoute><TrackOrderPage /></CustomerRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/orders"    element={<AdminRoute><AllOrdersPage /></AdminRoute>} />
      <Route path="/admin/inventory" element={<AdminRoute><InventoryPage /></AdminRoute>} />
      <Route path="/admin/partners"  element={<AdminRoute><DeliveryPartnersPage /></AdminRoute>} />

      {/* Delivery */}
      <Route path="/delivery/deliveries"   element={<DeliveryRoute><MyDeliveriesPage /></DeliveryRoute>} />
      <Route path="/delivery/location"     element={<DeliveryRoute><UpdateLocationPage /></DeliveryRoute>} />
      <Route path="/delivery/availability" element={<DeliveryRoute><AvailabilityPage /></DeliveryRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <div className="text-7xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
          <a href="/" className="btn-primary">Go Home</a>
        </div>
      } />
    </Routes>
  </Layout>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: '#1a6b3c', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
