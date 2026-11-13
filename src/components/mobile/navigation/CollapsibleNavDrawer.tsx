import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  Bell,
  Package,
  Layers,
  Search,
  FileText,
  ShoppingCart,
  Clock,
  RotateCcw,
  CreditCard,
  History,
  Gauge,
  CalendarClock,
  Cpu,
  Wrench,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Phone,
  MessageSquare,
  User,
  Users,
  KeyRound,
  LogOut,
  Shield,
  CheckCircle2,
  Lock,
  Tag
} from 'lucide-react';
import { CustomerRole } from '../customerAppTypes';

export interface CollapsibleNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: CustomerRole;
  userName: string;
  labName: string;
  activeItem?: string;
  onSelectMenu: (group: string, item: string) => void;
  onLogout: () => void;
}

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  rolesAllowed?: CustomerRole[]; // If specified, only these roles can access
  badge?: string;
}

interface MenuGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultExpanded?: boolean;
  items: SubMenuItem[];
}

export const CollapsibleNavDrawer: React.FC<CollapsibleNavDrawerProps> = ({
  isOpen,
  onClose,
  userRole,
  userName,
  labName,
  activeItem = 'Dashboard',
  onSelectMenu,
  onLogout
}) => {
  // Key for remembering expanded state in localStorage
  const STORAGE_KEY = 'diag_nav_expanded_groups_v1';

  // Expanded sections state: collapsed by default unless saved or active
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Keep submenu groups collapsed by default
    return {
      home: false,
      products: false,
      orders: false,
      payments: false,
      equipment: false,
      support: false,
      account: false
    };
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Auto-expand the submenu group that contains the currently active page
  useEffect(() => {
    if (!activeItem) return;
    const target = activeItem.toLowerCase();
    const matched = menuGroups.find(g =>
      g.items.some(it => it.label.toLowerCase() === target || it.id.toLowerCase() === target)
    );
    if (matched) {
      setExpandedGroups(prev => {
        if (prev[matched.id]) return prev;
        const next = { ...prev, [matched.id]: true };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }, [activeItem]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Define the 7 simple menu sections strictly matching Requirement 3
  const menuGroups: MenuGroup[] = [
    {
      id: 'home',
      title: 'Home',
      icon: Building2,
      defaultExpanded: true,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Building2 },
        { id: 'alerts', label: 'Alerts', icon: Bell, badge: 'Live' }
      ]
    },
    {
      id: 'products',
      title: 'Products',
      icon: Package,
      defaultExpanded: true,
      items: [
        { id: 'all_products', label: 'All Products', icon: Package },
        { id: 'shop_by_company', label: 'Shop by Company', icon: Tag },
        { id: 'categories', label: 'Categories', icon: Layers },
        { id: 'search_products', label: 'Search Products', icon: Search },
        { id: 'price_list', label: 'Price List', icon: FileText }
      ]
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: ShoppingCart,
      items: [
        // Viewer is read-only and cannot place orders
        { id: 'place_order', label: 'Place Order', icon: ShoppingCart, rolesAllowed: ['OWNER', 'ADMIN'] },
        { id: 'my_orders', label: 'My Orders', icon: Clock },
        { id: 'order_history', label: 'Order History', icon: History },
        { id: 'reorder', label: 'Reorder', icon: RotateCcw, rolesAllowed: ['OWNER', 'ADMIN'] }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Credit',
      icon: CreditCard,
      items: [
        { id: 'outstanding_balance', label: 'Outstanding Balance', icon: CreditCard },
        { id: 'payment_history', label: 'Payment History', icon: History },
        { id: 'credit_limit', label: 'Credit Limit', icon: Gauge },
        // Extensions only for Owner and Admin
        { id: 'payment_extensions', label: 'Payment Extensions', icon: CalendarClock, rolesAllowed: ['OWNER', 'ADMIN'] }
      ]
    },
    {
      id: 'equipment',
      title: 'Equipment & Service',
      icon: Cpu,
      items: [
        { id: 'my_equipment', label: 'My Equipment', icon: Cpu },
        { id: 'preventive_maintenance', label: 'Preventive Maintenance', icon: Wrench },
        // Service requests creation requires operational permission (Owner or Admin)
        { id: 'service_requests', label: 'Service Requests', icon: FileText, rolesAllowed: ['OWNER', 'ADMIN'] },
        { id: 'warranty', label: 'Warranty', icon: ShieldCheck }
      ]
    },
    {
      id: 'support',
      title: 'Support',
      icon: HelpCircle,
      items: [
        { id: 'raise_complaint', label: 'Raise a Complaint', icon: AlertCircle, rolesAllowed: ['OWNER', 'ADMIN'] },
        { id: 'my_complaints', label: 'My Complaints', icon: Clock },
        { id: 'help_faqs', label: 'Help & FAQs', icon: HelpCircle },
        { id: 'contact_support', label: 'Contact Support', icon: Phone },
        { id: 'chat_support', label: 'Chat Support', icon: MessageSquare, badge: 'AI' }
      ]
    },
    {
      id: 'account',
      title: 'Account',
      icon: User,
      items: [
        { id: 'my_profile', label: 'My Profile', icon: User },
        { id: 'my_laboratory', label: 'My Laboratory', icon: Building2 },
        // Requirement 3 & 6: Manage Users (Owner-authorized only)
        { id: 'manage_users', label: 'Manage Users', icon: Users, rolesAllowed: ['OWNER'], badge: 'Owner' },
        { id: 'change_password', label: 'Change Password', icon: KeyRound },
        { id: 'sign_out', label: 'Sign Out', icon: LogOut }
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Application Navigation Menu"
    >
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-[#0E1035]/70 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Drawer Container */}
      <aside 
        className="relative w-[85%] max-w-[320px] h-full bg-[#FFFFFF] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 border-r border-[#D0DEE5]"
      >
        {/* ------------------------------------------------------------------ */}
        {/* DRAWER HEADER: Dark Navy Branding with Logo & Close Button */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-[#0E1035] text-white p-4 pt-6 border-b border-[#15253F] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-md border border-[#D0DEE5]/30 flex items-center justify-center shrink-0">
                <img 
                  src="/logo.jpeg" 
                  alt="Diagnostic Services Logo" 
                  className="w-full h-full object-contain rounded-lg" 
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-white tracking-tight leading-tight truncate">
                  Diagnostic Services
                </h2>
                <p className="text-[10px] text-[#D0DEE5] font-semibold truncate">
                  Institutional Customer Portal
                </p>
              </div>
            </div>

            {/* Clear Close Button */}
            <button
              id="btn-close-nav-drawer"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#D0DEE5] hover:text-white transition cursor-pointer"
              title="Close Navigation Menu"
              aria-label="Close Navigation Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile & Role Banner */}
          <div className="mt-3.5 p-2 rounded-xl bg-[#15253F] border border-[#2B3D5B] flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <div className="text-[11px] font-bold text-white truncate leading-tight">
                {userName || 'Clinical Director'}
              </div>
              <div className="text-[9px] text-[#D0DEE5]/80 truncate mt-0.5">
                {labName || 'Apex Clinical Laboratories'}
              </div>
            </div>

            {/* Role Badge (Owner, Admin, Viewer) */}
            <span 
              className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                userRole === 'OWNER'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : userRole === 'ADMIN'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                  : 'bg-slate-500/20 text-slate-300 border-slate-400/40'
              }`}
            >
              {userRole === 'OWNER' ? '👑 Owner' : userRole === 'ADMIN' ? '🛡️ Admin' : '👁️ Viewer'}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DRAWER BODY: Collapsible Menu Accordion Groups */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          {menuGroups.map(group => {
            const isExpanded = !!expandedGroups[group.id];
            const GroupIcon = group.icon;

            // Filter items based on actual backend-authorized role
            const visibleItems = group.items.filter(item => {
              if (!item.rolesAllowed) return true;
              return item.rolesAllowed.includes(userRole);
            });

            // If a group has no visible items for the user role, omit it
            if (visibleItems.length === 0) return null;

            return (
              <div 
                key={group.id} 
                className="rounded-2xl border border-transparent hover:border-[#D0DEE5]/60 transition overflow-hidden"
              >
                {/* Group Accordion Header */}
                <button
                  id={`btn-nav-group-${group.id}`}
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-bold text-xs transition cursor-pointer ${
                    isExpanded 
                      ? 'bg-[#0E1035]/5 text-[#0E1035]' 
                      : 'text-[#15253F] hover:bg-slate-100/80'
                  }`}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${isExpanded ? 'bg-[#0E1035] text-white' : 'bg-slate-100 text-[#15253F]'}`}>
                      <GroupIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-extrabold tracking-tight">{group.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[10px] font-semibold text-slate-400">{visibleItems.length}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#0E1035]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>

                {/* Submenu Items List */}
                {isExpanded && (
                  <div className="pl-9 pr-1 py-1 space-y-0.5 animate-in slide-in-from-top-1 duration-150">
                    {visibleItems.map(item => {
                      const ItemIcon = item.icon;
                      const isItemActive = activeItem.toLowerCase() === item.label.toLowerCase() ||
                                           activeItem.toLowerCase() === item.id.toLowerCase();

                      return (
                        <button
                          key={item.id}
                          id={`btn-nav-sub-${item.id}`}
                          onClick={() => {
                            if (item.id === 'sign_out') {
                              onClose();
                              onLogout();
                            } else {
                              onSelectMenu(group.title, item.label);
                              onClose();
                            }
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                            isItemActive
                              ? 'bg-[#0E1035] text-white font-bold shadow-xs'
                              : 'text-slate-700 hover:text-[#0E1035] hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isItemActive ? 'text-[#D0DEE5]' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                              item.badge === 'Live'
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : item.badge === 'Owner'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DRAWER FOOTER: Quick Sign Out & Version Info */}
        {/* ------------------------------------------------------------------ */}
        <div className="p-3 border-t border-[#D0DEE5] bg-slate-50 shrink-0">
          <button
            id="btn-nav-sign-out"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Sign Out of Laboratory</span>
          </button>
          <div className="mt-2 text-center text-[10px] text-slate-400 font-semibold">
            Diagnostic Services Mobile v2.4 &bull; 2026
          </div>
        </div>
      </aside>
    </div>
  );
};
