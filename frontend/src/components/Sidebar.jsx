import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Truck, MapPin, ToggleRight, Package2 } from 'lucide-react';
import { ROLES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/admin/orders',    label: 'All Orders',         icon: ShoppingCart     },
  { to: '/admin/inventory', label: 'Inventory',          icon: Package          },
  { to: '/admin/partners',  label: 'Delivery Partners',  icon: Users            },
];

const deliveryLinks = [
  { to: '/delivery/deliveries',   label: 'My Deliveries',    icon: Truck        },
  { to: '/delivery/location',     label: 'Update Location',  icon: MapPin       },
  { to: '/delivery/availability', label: 'Availability',     icon: ToggleRight  },
];

const Sidebar = () => {
  const { role, user } = useAuth();
  const links = role === ROLES.ADMIN ? adminLinks : deliveryLinks;

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-3">
      {/* Brand row in sidebar */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-green-gradient flex items-center justify-center">
          <Package2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">
          Order<span className="text-brand-green">Easy</span>
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? 'nav-link-active' : 'nav-link'
            }
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Role chip at bottom */}
      <div className="px-3 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 font-medium capitalize">
          {role?.toLowerCase().replace('_', ' ')}
        </p>
        <p className="text-sm font-semibold text-gray-700 truncate">
          {user?.name || user?.email || 'User'}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
