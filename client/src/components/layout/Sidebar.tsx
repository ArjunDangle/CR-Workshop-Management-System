import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Wrench, FileText, AlertTriangle, 
  Users, Briefcase, Zap, Map as MapIcon, ClipboardCheck, 
  ChevronLeft, ChevronRight, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/modules/auth/authStore';
// Import the logo
import irLogo from '@/assets/images/indian_railways_logo_train.png';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/machines', label: 'Machines', Icon: Wrench },
  { href: '/permits', label: 'Permits', Icon: FileText },
  { href: '/incidents', label: 'Incidents', Icon: AlertTriangle },
  { href: '/contractors', label: 'Contractors', Icon: Users },
  { href: '/projects', label: 'Projects', Icon: Briefcase },
  { href: '/power', label: 'Power Grid', Icon: Zap },
  { href: '/mapping', label: 'Site Map', Icon: MapIcon },
  { href: '/compliance', label: 'Compliance', Icon: ClipboardCheck },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isSidebarOpen, isCollapsed, toggleCollapse } = useUIStore();
  const { logout } = useAuthStore();

  return (
    <aside className={cn(
        "bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out z-40",
        "fixed inset-y-0 left-0",
        isCollapsed ? "w-20" : "w-72",
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    )}>
      {/* Header with Logo Only */}
      <div className={cn(
        "h-24 flex items-center justify-center transition-all duration-300",
        isCollapsed ? "px-2" : "px-8"
      )}>
         <img 
            src={irLogo} 
            alt="Indian Railways" 
            className={cn("transition-all duration-300 object-contain", isCollapsed ? "h-10 w-10" : "h-16 w-auto")} 
         />
      </div>

      {/* Main Nav */}
      <nav className="flex-grow px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center rounded-2xl text-sm font-semibold transition-all duration-200 group",
                isCollapsed ? "justify-center px-0 h-12 w-12 mx-auto" : "px-5 py-3.5",
                isActive 
                  ? 'bg-black text-white shadow-xl shadow-black/20' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.Icon 
                className={cn("flex-shrink-0 transition-colors", isCollapsed ? "h-6 w-6" : "mr-4 h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-gray-900")} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className={cn("p-4 border-t border-gray-50 space-y-2", isCollapsed ? "items-center" : "")}>
        <button 
          onClick={toggleCollapse}
          className={cn(
            "w-full flex items-center text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors",
            isCollapsed ? "justify-center h-12" : "px-5 py-3"
          )}
        >
            {isCollapsed ? <ChevronRight className="h-6 w-6" /> : <><ChevronLeft className="mr-4 h-5 w-5" /> Collapse</>}
        </button>
        <button 
          onClick={logout}
          className={cn(
            "w-full flex items-center text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors",
            isCollapsed ? "justify-center h-12 w-12 mx-auto" : "px-5 py-3"
          )}
        >
            <LogOut className={cn(isCollapsed ? "h-6 w-6" : "mr-4 h-5 w-5")} />
            {!isCollapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;