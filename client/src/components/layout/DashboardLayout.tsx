import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isSidebarOpen, isCollapsed, closeSidebar } = useUIStore();

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans selection:bg-black selection:text-white">
      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={cn(
          "flex flex-col flex-1 transition-all duration-300 ease-in-out",
          // Dynamic margin based on collapse state
          isCollapsed ? "lg:ml-20" : "lg:ml-72"
        )}>

        {/* Navbar Component */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

       {/* Mobile Overlay */}
        {isSidebarOpen && (
            <div
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={closeSidebar}
                aria-hidden="true"
            ></div>
        )}
    </div>
  );
};

export default DashboardLayout;