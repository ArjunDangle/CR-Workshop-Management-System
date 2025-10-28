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

  // Function to toggle the sidebar visibility on mobile
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    // Main container using flexbox
    <div className="flex min-h-screen bg-gray-100"> {/* Light gray background for the main area */}

      {/* Sidebar Component */}
      {/* Pass the mobile open state and potentially a close function */}
      <Sidebar isMobileOpen={isMobileSidebarOpen} closeSidebar={() => setIsMobileSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className={cn(
          "flex flex-col flex-1 transition-[margin-left] duration-300 ease-in-out",
          // Apply margin-left on large screens to offset the fixed sidebar width (w-64 = 16rem)
          "lg:ml-64"
        )}>

        {/* Navbar Component */}
        {/* Pass the toggle function to the Navbar for the mobile menu button */}
        <Navbar onToggleSidebar={toggleMobileSidebar} />

        {/* Page Content passed as children */}
        {/* Added padding for content spacing */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

       {/* Mobile Overlay */}
       {/* Renders a semi-transparent overlay when the mobile sidebar is open */}
        {isMobileSidebarOpen && (
            <div
                // Fixed position, covers the screen, appears above content but below sidebar (z-30)
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                // Closes the sidebar when the overlay is clicked
                onClick={toggleMobileSidebar}
                aria-hidden="true" // Hide from screen readers
            ></div>
        )}
    </div>
  );
};

export default DashboardLayout;