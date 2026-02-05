import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore'; // Import UI Store

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Use store instead of local state
  const { isSidebarOpen, closeSidebar } = useUIStore();

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar Component - No props needed now */}
      <Sidebar />

      {/* Main Content Area */}
      <div className={cn(
          "flex flex-col flex-1 transition-[margin-left] duration-300 ease-in-out",
          "lg:ml-64"
        )}>

        {/* Navbar Component - No props needed now */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

       {/* Mobile Overlay */}
        {isSidebarOpen && (
            <div
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={closeSidebar} // Use store action
                aria-hidden="true"
            ></div>
        )}
    </div>
  );
};

export default DashboardLayout;