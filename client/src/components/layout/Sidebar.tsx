// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Video, Settings, LifeBuoy, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import indianRailwaysLogoTrain from '@/assets/images/indian_railways_logo_train.png'; // Example logo path

// Define navigation items
const navItems = [
  { href: '/dashboard', label: 'Main Dashboard', Icon: LayoutDashboard },
  { href: '/services', label: 'Services & Tasks', Icon: Settings }, // Example, adjust routes
  { href: '/staff', label: 'Staff', Icon: Users },
  { href: '/reports', label: 'Reports', Icon: Video }, // Using Video as placeholder icon
  { href: '/feedbacks', label: 'Feedbacks', Icon: LifeBuoy }, // Placeholder
  // Add other items...
];

const bottomNavItems = [
    { href: '/settings', label: 'Settings', Icon: Settings },
]

interface SidebarProps {
    isMobileOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen }) => {
  const location = useLocation();

  return (
    <aside className={cn(
        "w-64 bg-sidebar-gradient text-[hsl(var(--sidebar-foreground))] flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileOpen ? 'translate-x-0' : '-translate-x-full' // Mobile open/close
    )}>
       {/* Logo Area */}
      <div className="h-16 flex items-center justify-between border-b border-white/20 px-4 flex-shrink-0">
         {/* Use your logo */}
         <img src={indianRailwaysLogoTrain} alt="Indian Railways" className="h-8 w-auto invert brightness-0" />
         {/* Placeholder for collapse button if needed */}
         {/* <button className="text-[hsl(var(--sidebar-icon))] hover:text-white lg:block hidden">
            <ChevronLeft />
         </button> */}
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive: navIsActive }) => // Use NavLink's isActive
                cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 group",
                  navIsActive
                    ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))] shadow-inner'
                    : 'text-[hsl(var(--sidebar-icon))] hover:text-white hover:bg-[hsl(var(--sidebar-hover-bg))]'
                )
              }
            >
              <item.Icon className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", navIsActive ? "text-[hsl(var(--sidebar-active-foreground))]" : "text-[hsl(var(--sidebar-icon))] group-hover:text-white")} />
              <span className={cn(navIsActive ? "text-[hsl(var(--sidebar-active-foreground))]" : "text-white")}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

        {/* Bottom Navigation */}
        <div className="px-4 py-4 border-t border-white/20 mt-auto flex-shrink-0">
             {bottomNavItems.map((item) => {
                 const isActive = location.pathname.startsWith(item.href);
                 return (
                    <NavLink
                        key={item.label}
                        to={item.href}
                         className={({ isActive: navIsActive }) =>
                            cn(
                              "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 group",
                              navIsActive
                                ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))] shadow-inner'
                                : 'text-[hsl(var(--sidebar-icon))] hover:text-white hover:bg-[hsl(var(--sidebar-hover-bg))]'
                            )
                          }
                    >
                         <item.Icon className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", navIsActive ? "text-[hsl(var(--sidebar-active-foreground))]" : "text-[hsl(var(--sidebar-icon))] group-hover:text-white")} />
                         <span className={cn(navIsActive ? "text-[hsl(var(--sidebar-active-foreground))]" : "text-white")}>{item.label}</span>
                    </NavLink>
                 );
             })}
        </div>
    </aside>
  );
};

export default Sidebar;