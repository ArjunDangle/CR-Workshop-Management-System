// src/modules/dashboard/DashboardPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/authStore';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query'; // Keep useQuery
import { getCurrentUserProfile } from '@/modules/auth/authApi'; // Keep API import
import { Skeleton } from '@/components/ui/skeleton'; // Keep Skeleton

// Import role-specific components
import MaintenanceDashboard from './components/MaintenanceDashboard';
import OfficeDashboard from './components/OfficeDashboard';
import SafetyDashboard from './components/SafetyDashboard';

const DashboardPage = () => {
    // Keep authUser for displaying logged-in email, but don't rely on it for role logic initially
    const { user: authUser, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();

    // Keep redirect logic
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Keep profile fetching logic
    const { data: userProfile, isLoading, isError, error } = useQuery({
        queryKey: ['userProfile'],
        queryFn: getCurrentUserProfile,
        enabled: !!isAuthenticated,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });


    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const renderRoleDashboard = () => {
        // --- Use userProfile for role check ---
        const roleName = userProfile?.role?.name; // Get role name from fetched profile data
        // ---

        // Display loading state while fetching profile
        if (isLoading) {
             return (
                 <div className="text-center p-8 space-y-3">
                    <Skeleton className="h-8 w-1/2 mx-auto" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <p className="text-sm text-muted-foreground pt-2">Loading user data...</p>
                 </div>
             );
        }

        // Display error if fetching failed
        if (isError) {
             return (
                 <div className="text-center p-8 text-destructive">
                     <p className="font-semibold">Error loading dashboard data:</p>
                     <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
                 </div>
             );
        }

        // Only proceed if profile is loaded
        if (userProfile) {
            console.log("User Profile loaded:", userProfile); // Debugging
            console.log("Role name being checked:", roleName); // Debugging

            switch (roleName) {
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
                                Welcome! Your role ('{roleName || 'Unknown'}') is not recognized by the dashboard.
                            </p>
                        </div>
                    );
            }
        }

        // Fallback message if profile hasn't loaded for some reason (should be covered by isLoading)
        return (
             <div className="text-center p-8">
                 <p className="text-lg text-muted-foreground">Initializing dashboard...</p>
             </div>
        );
    };

    // Keep this check
    if (!isAuthenticated && !authUser) {
        return null;
    }

    // --- Update Header to use userProfile if available ---
    const displayEmail = userProfile?.email || authUser?.email || 'N/A';
    const displayRole = userProfile?.role?.name || authUser?.role?.name || 'Loading...';
    // ---

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <header className="bg-background shadow-sm p-4 rounded mb-4 flex justify-between items-center">
                <h1 className="text-xl font-semibold">RWMS Dashboard</h1>
                <div>
                     <span className="mr-4 text-sm text-muted-foreground">
                         Logged in as: {displayEmail} ({displayRole})
                       </span>
                     <Button onClick={handleLogout} variant="outline" size="sm">
                         Logout
                     </Button>
                </div>
            </header>

            <main className="bg-background p-6 rounded shadow-sm min-h-[200px]"> {/* Added min-height */}
                {renderRoleDashboard()}
            </main>
        </div>
    );
};

export default DashboardPage;