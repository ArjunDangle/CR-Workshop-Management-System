import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    Users,
    History,
    Wrench,        // Import
    FileText,      // Import
    AlertTriangle  
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore'; // Import UI Store
import rwmsLogo from '@/assets/images/indian-logo-white.png';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/machines', label: 'Machines', Icon: Wrench }, // Changed
  { href: '/permits', label: 'Permits', Icon: FileText }, // Changed
  { href: '/incidents', label: 'Incidents', Icon: AlertTriangle }, // Changed
  { href: '/contractors', label: 'Contractors', Icon: Users }, // Changed
];


const bottomNavItems = [
    { href: '/settings', label: 'Settings', Icon: Settings },
]

const Sidebar: React.FC = () => { // Removed props interface
  const location = useLocation();
  const { isSidebarOpen, closeSidebar } = useUIStore(); // Use UI Store

  const handleLinkClick = () => {
    // Close the sidebar when a link is clicked on mobile
    if (window.innerWidth < 1024) { 
        closeSidebar();
    }
  };

  return (
    <aside className={cn(
        "w-64 bg-sidebar-gradient text-[hsl(var(--sidebar-foreground))] flex flex-col",
        "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full' // Use store state
    )}>
      <div className="h-16 flex items-center justify-center border-b border-[hsl(var(--sidebar-border))] px-4 flex-shrink-0">
         <img src={rwmsLogo} alt="Indian Railways Logo" className="h-16 w-auto" />
      </div>

      <nav className="flex-grow px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const baseIsActive = item.href === '/dashboard'
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.href === '/dashboard'}
              onClick={handleLinkClick} 
              className={({ isActive = baseIsActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 group relative",
                  isActive
                    ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))] font-semibold shadow-inner'
                    : 'text-[hsl(var(--sidebar-icon))] hover:text-white hover:bg-[hsl(var(--sidebar-hover-bg))]'
                )
              }
            >
              {({ isActive = baseIsActive }) => (
                <>
                  <item.Icon className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-[hsl(var(--sidebar-active-foreground))]"
                        : "text-[hsl(var(--sidebar-icon))] group-hover:text-white"
                    )}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className={cn(
                      isActive
                        ? "text-[hsl(var(--sidebar-active-foreground))]"
                        : "text-white"
                    )}
                  >
                      {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

        <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))] mt-auto flex-shrink-0">
             {bottomNavItems.map((item) => {
                 const baseIsActive = location.pathname.startsWith(item.href);
                 return (
                    <NavLink
                        key={item.label}
                        to={item.href}
                        onClick={handleLinkClick}
                        className={({ isActive = baseIsActive }) =>
                            cn(
                              "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 group",
                              isActive
                                ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))] font-semibold shadow-inner'
                                : 'text-[hsl(var(--sidebar-icon))] hover:text-white hover:bg-[hsl(var(--sidebar-hover-bg))]'
                            )
                          }
                    >
                         {({ isActive = baseIsActive }) => (
                            <>
                                <item.Icon className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-[hsl(var(--sidebar-active-foreground))]" : "text-[hsl(var(--sidebar-icon))] group-hover:text-white")} strokeWidth={isActive ? 2 : 1.5} />
                                <span className={cn(isActive ? "text-[hsl(var(--sidebar-active-foreground))]" : "text-white")}>{item.label}</span>
                            </>
                         )}
                    </NavLink>
                 );
             })}
        </div>
    </aside>
  );
};

export default Sidebar;