import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  MapPin, 
  ToggleRight, 
  Package2,
  UserCheck
} from 'lucide-react';
import { ROLES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard Center',   icon: LayoutDashboard },
  { to: '/admin/orders',    label: 'All Orders Audit',   icon: ShoppingCart     },
  { to: '/admin/inventory', label: 'Stock Audit Logs',   icon: Package          },
  { to: '/admin/partners',  label: 'Rider Operations',   icon: Users            },
];

const deliveryLinks = [
  { to: '/delivery/deliveries',   label: 'My Deliveries',    icon: Truck        },
  { to: '/delivery/location',     label: 'Update Location',  icon: MapPin       },
  { to: '/delivery/availability', label: 'Availability',     icon: ToggleRight  },
];

const Sidebar = () => {
  const { role, user } = useAuth();
  const links = role === ROLES.ADMIN ? adminLinks : deliveryLinks;

  const isAdmin = role === ROLES.ADMIN;

  return (
    <aside className={`w-64 min-h-screen flex flex-col py-6 px-4 shadow-xl border-r transition-all duration-300 ${
      isAdmin ? 'bg-[#0F172A] border-slate-800 text-slate-300' : 'bg-white border-slate-100 text-slate-600'
    }`}>
      {/* Brand row logo in sidebar */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
          isAdmin ? 'bg-emerald-500 text-white' : 'bg-green-gradient text-white'
        }`}>
          <Package2 className="w-5 h-5" />
        </div>
        <span className={`text-lg font-black tracking-tight ${isAdmin ? 'text-white' : 'text-slate-800'}`}>
          Order<span className="text-emerald-500 font-extrabold">Easy</span>
        </span>
      </div>

      {/* Nav Link Lists */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive 
                  ? isAdmin
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 border-l-4 border-emerald-400 scale-[1.02]'
                    : 'bg-primary-50 text-brand-green border-l-4 border-brand-green font-semibold'
                  : isAdmin
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-green'
              }`
            }
          >
            <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform ${
              isAdmin ? 'text-slate-400 group-hover:text-white' : ''
            }`} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Admin / Courier profile badge at bottom */}
      <div className={`px-3 pt-4 border-t flex items-center gap-3 ${
        isAdmin ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isAdmin ? 'bg-slate-800 text-emerald-400' : 'bg-primary-50 text-brand-green'
        }`}>
          <UserCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className={`text-[9px] font-black uppercase tracking-wider ${
            isAdmin ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {role?.replace('_', ' ')}
          </p>
          <p className={`text-xs font-black truncate max-w-[140px] ${
            isAdmin ? 'text-white' : 'text-slate-700'
          }`}>
            {user?.name || user?.email || 'Administrator'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
