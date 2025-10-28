// src/modules/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore'; // Corrected import path
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils'; // Import cn utility
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/modules/auth/authApi';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Import the new layout

// Import role-specific components
import MaintenanceDashboard from './components/MaintenanceDashboard';
import OfficeDashboard from './components/OfficeDashboard';
import SafetyDashboard from './components/SafetyDashboard';

// Define Navbar utility classes based on index.css
const roleNavbarClasses: { [key: string]: string } = {
    'SSE-Maintenance': 'navbar-maintenance',
    'SSE-Office': 'navbar-office',
    'Safety Officer': 'navbar-safety',
    'default': 'bg-gray-700' // Fallback Tailwind class
};


const DashboardPage = () => {
    const { user: authUser, isAuthenticated, setUser, logout } = useAuthStore(); // Added setUser
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Basic redirect if not logged in
    useEffect(() => {
        if (!isAuthenticated) {
            console.log("DashboardPage: Not authenticated, redirecting to /");
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Update time every second
    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timerId); // Cleanup interval on unmount
    }, []);

    // Fetch profile data using TanStack Query
    const { data: userProfile, isLoading, isError, error } = useQuery({
        queryKey: ['userProfile'], // Unique key for caching
        queryFn: getCurrentUserProfile, // The async function to fetch data
        enabled: !!isAuthenticated, // Only run if authenticated
        staleTime: 1000 * 60 * 15, // Cache profile for 15 mins
        retry: 1, // Retry once on initial error
        onSuccess: (fetchedUser) => { // Added onSuccess
            if (fetchedUser) {
                setUser(fetchedUser); // Update the global state with fresh user data
            }
        },
    });

    const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to landing page after logout
    };

    // Determine role name, prioritize freshly fetched profile data
    const getRoleNameForClass = (): string | undefined => {
        const roleName = userProfile?.role?.name || authUser?.role?.name;
        if (roleName?.startsWith('SSE-Maintenance')) {
            return 'SSE-Maintenance';
        }
        return roleName;
    }

    const navbarColorClass = roleNavbarClasses[getRoleNameForClass() || 'default'] || roleNavbarClasses['default'];

    const renderRoleDashboard = () => {
        const roleNameToUse = userProfile?.role?.name || authUser?.role?.name;

        // Display loading state while fetching profile
        if (isLoading) {
             // --- RESTORED SKELETON JSX ---
             return (
                 <div className="space-y-8 animate-pulse">
                   <Skeleton className="h-10 w-1/3 rounded" />
                   <Skeleton className="h-8 w-1/4 rounded" />
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
                     {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
                   </div>
                   <Skeleton className="h-64 w-full rounded-lg" />
                 </div>
             );
             // --- END RESTORED SKELETON ---
        }

        // Display error state
        if (isError) {
             // --- RESTORED ERROR JSX ---
             return (
                 <div className="text-center p-8 text-destructive border border-destructive/50 bg-destructive/10 rounded-md">
                     <p className="font-semibold text-lg">Error loading dashboard data:</p>
                     <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
                     <p className="text-sm mt-2 text-muted-foreground">(Please try refreshing or logging in again)</p>
                 </div>
             );
             // --- END RESTORED ERROR ---
        }

        // Render based on role
        if (userProfile || authUser) {
             console.log("Rendering dashboard for role:", roleNameToUse);
             switch (roleNameToUse) {
                 case 'SSE-Maintenance - MW':
                 case 'SSE-Maintenance - Substation':
                     return <MaintenanceDashboard />;
                 case 'SSE-Office':
                     return <OfficeDashboard />;
                 case 'Safety Officer':
                     return <SafetyDashboard />;
                 default:
                     return (
                         <div className="text-center p-8">
                             <p className="text-lg text-muted-foreground">
                                 Welcome! Your role ('{roleNameToUse || 'undefined'}') is not recognized.
                             </p>
                         </div>
                     );
             }
        }
        // Fallback message
        return <div className="text-center p-8">Initializing dashboard...</div>;
    };

    // If still checking auth state or loading initial profile, show a full-page loader
     if ((isLoading && !userProfile && !authUser) || (!isAuthenticated && !authUser)) {
         return (
            <div className="flex items-center justify-center min-h-screen text-lg font-medium text-muted-foreground">
                Loading Application...
            </div>
         );
     }

    // Wrap the content with DashboardLayout
    return (
        <DashboardLayout>
            {renderRoleDashboard()}
        </DashboardLayout>
    );
};

export default DashboardPage;