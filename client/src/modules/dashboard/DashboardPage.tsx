import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/authStore';
import { getCurrentUserProfile } from '@/modules/auth/authApi';
import DashboardLayout from '@/components/layout/DashboardLayout'; // Import restored

// Import role-specific components
import MaintenanceDashboard from './components/MaintenanceDashboard';
import OfficeDashboard from './components/OfficeDashboard';
import SafetyDashboard from './components/SafetyDashboard';

const DashboardPage = () => {
    const { user: authUser, isAuthenticated, setUser } = useAuthStore();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                if (authUser?.role) {
                    setUserProfile(authUser);
                    setIsLoading(false);
                    return;
                }
                const profile = await getCurrentUserProfile();
                setUser(profile);
                setUserProfile(profile);
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [isAuthenticated, navigate, setUser, authUser]);

    const renderRoleDashboard = () => {
        if (!userProfile) return null;

        const roleName = userProfile.role?.name || userProfile.role;

        switch (roleName) {
            case 'SSE-Maintenance': 
            case 'SSE-Maintenance - MW':
            case 'SSE-Maintenance - Substation':
                return <MaintenanceDashboard />;
            
            case 'SSE-Office':
                return <OfficeDashboard />;
            
            case 'Safety Officer':
                return <SafetyDashboard />;
            
            default:
                return (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <h2 className="text-4xl font-bold text-gray-900">Welcome, {userProfile.full_name}</h2>
                        <p className="text-xl text-gray-400 mt-4 max-w-md">
                            Your role (<strong>{roleName}</strong>) does not have a dashboard configured.
                        </p>
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">Loading ERP</span>
                </div>
            </div>
        );
    }

    // Wrap in DashboardLayout to bring back Sidebar and Navbar
    return (
        <DashboardLayout>
            <div className="animate-in fade-in duration-700 ease-out">
                <div className="max-w-[1600px] mx-auto py-4 px-4 md:px-8">
                    {renderRoleDashboard()}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DashboardPage;