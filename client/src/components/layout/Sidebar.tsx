// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, // Main Dashboard
    Settings,       // Services & Tasks / Settings (bottom)
    Users,          // Staff
    BarChart3,      // Reports (using BarChart as placeholder)
    MessageSquare,  // Feedbacks (using MessageSquare as placeholder)
    History,        // History
    // Import other icons if needed
} from 'lucide-react';
import { cn } from '@/lib/utils';
// --- IMPORT THE LOGO IMAGE ---
import rwmsLogo from '@/assets/images/indian-logo-white.png';

// Define navigation items based on the target image
const navItems = [
  { href: '/dashboard', label: 'Main Dashboard', Icon: LayoutDashboard },
  { href: '/services', label: 'Services & Tasks', Icon: Settings },
  { href: '/staff', label: 'Staff', Icon: Users },
  { href: '/history', label: 'History', Icon: History },
];

// Define bottom navigation items
const bottomNavItems = [
    { href: '/settings', label: 'Settings', Icon: Settings },
]

interface SidebarProps {
    isMobileOpen: boolean;
    closeSidebar: () => void; // Function to close sidebar (used by NavLink clicks on mobile)
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, closeSidebar }) => {
  const location = useLocation();

  const handleLinkClick = () => {
    // Close the sidebar when a link is clicked on mobile
    if (window.innerWidth < 1024) { // Tailwind's lg breakpoint
        closeSidebar();
    }
  };

  return (
    // Sidebar container: Fixed position, applies gradient, handles mobile transform
    <aside className={cn(
        "w-64 bg-sidebar-gradient text-[hsl(var(--sidebar-foreground))] flex flex-col",
        "fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full' // Mobile open/close transition and shadow
    )}>
       {/* --- UPDATED LOGO AREA --- */}
      <div className="h-16 flex items-center justify-center border-b border-[hsl(var(--sidebar-border))] px-4 flex-shrink-0">
         <img src={rwmsLogo} alt="Indian Railways Logo" className="h-16 w-auto" />
      </div>

      {/* Main Navigation */}
      <nav className="flex-grow px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          // Check if the current path exactly matches or starts with the item's path
          // Special case for dashboard to only match exactly
          const baseIsActive = item.href === '/dashboard'
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.href === '/dashboard'} // Ensures exact match for root dashboard
              onClick={handleLinkClick} // Close sidebar on mobile click
              // Apply styles based on isActive state provided by NavLink
              className={({ isActive = baseIsActive }) => // Use NavLink's isActive
                cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 group relative", // Added relative for potential ::before pseudo-element
                  isActive
                    ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))] font-semibold shadow-inner' // Active state: white bg, purple text, bold
                    : 'text-[hsl(var(--sidebar-icon))] hover:text-white hover:bg-[hsl(var(--sidebar-hover-bg))]' // Inactive state: light icon/text, purple hover
                )
              }
            >
              {/* Render icon and label, adjusting color based on active state */}
              {({ isActive = baseIsActive }) => (
                <>
                  <item.Icon className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-[hsl(var(--sidebar-active-foreground))]" // Purple icon when active
                        : "text-[hsl(var(--sidebar-icon))] group-hover:text-white" // Light icon, white on hover
                    )}
                    strokeWidth={isActive ? 2 : 1.5} // Make icon slightly bolder when active
                  />
                  <span className={cn(
                      isActive
                        ? "text-[hsl(var(--sidebar-active-foreground))]" // Purple text when active
                        : "text-white" // White text when inactive
                    )}
                  >
                      {item.label}
                  </span>
                  {/* Optional: Add badge like in target image */}
                  {item.label === 'Feedbacks' && (
                     <span className="ml-auto inline-block py-0.5 px-2 text-xs rounded bg-red-500 text-white">2</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

        {/* Bottom Navigation (Settings) */}
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