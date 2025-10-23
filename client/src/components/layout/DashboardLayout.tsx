// src/components/layout/DashboardLayout.tsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    // Main flex container
    <div className="flex min-h-screen bg-gray-100"> {/* Light gray main background */}
      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileSidebarOpen} />

      {/* Main Content Area (takes remaining space) */}
      <div className={cn(
          "flex flex-col flex-1 transition-[margin-left] duration-300 ease-in-out",
          // Add margin-left on larger screens to accommodate fixed sidebar
          "lg:ml-64" // Adjust width (w-64) to match sidebar width
        )}>
        {/* Navbar */}
        <Navbar onToggleSidebar={toggleMobileSidebar} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

       {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
            <div
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={toggleMobileSidebar}
            ></div>
        )}
    </div>
  );
};

export default DashboardLayout;