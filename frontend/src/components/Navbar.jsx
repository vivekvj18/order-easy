import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, User, Menu, X, Package } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ROLES } from '../utils/constants';
import { getInitials } from '../utils/formatters';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, role, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const customerLinks = [
    { to: '/home',         label: 'Shop'       },
    { to: '/orders',       label: 'My Orders'  },
    { to: '/cart',         label: 'Cart'       },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard'          },
    { to: '/admin/orders',    label: 'Orders'             },
    { to: '/admin/inventory', label: 'Inventory'          },
    { to: '/admin/partners',  label: 'Delivery Partners'  },
  ];

  const deliveryLinks = [
    { to: '/delivery/deliveries',  label: 'My Deliveries' },
    { to: '/delivery/location',    label: 'Update Location' },
    { to: '/delivery/availability',label: 'Availability'  },
  ];

  const links =
    role === ROLES.ADMIN            ? adminLinks    :
    role === ROLES.DELIVERY_PARTNER ? deliveryLinks :
    role === ROLES.CUSTOMER         ? customerLinks : [];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-9 h-9 rounded-xl bg-green-gradient flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Order<span className="text-brand-green">Easy</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-brand-green hover:bg-primary-50 transition-all no-underline"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Cart badge — customer only */}
                {role === ROLES.CUSTOMER && (
                  <Link
                    to="/cart"
                    className="relative p-2 rounded-xl hover:bg-primary-50 text-gray-600 hover:text-brand-green transition-all no-underline"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-green text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </Link>
                )}

                {/* User avatar */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-gradient flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {getInitials(user?.name || user?.email || 'U')}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-semibold text-gray-800 leading-tight">
                      {user?.name || 'User'}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-tight capitalize">
                      {role?.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="hidden sm:flex btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm px-4 py-2">
                Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && isAuthenticated && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-slide-up">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-brand-green hover:bg-primary-50 transition-all no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
