// src/components/layout/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react'; // Removed Settings icon for now
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Ensure correct path to your auth store
import { useAuthStore } from '@/modules/auth/authStore';
import { cn } from '@/lib/utils'; // Import cn
import { IncidentReportButton } from '@/modules/incident/components/widgets/IncidentReportButton';

interface NavbarProps {
    onToggleSidebar: () => void; // Prop for mobile sidebar toggle
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
    // Get user and logout function from the Zustand store
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    // Logout handler
    const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to landing/login after logout
    };

    // Helper to get initials for Avatar fallback
    const getInitials = (name?: string | null) => { // Allow null
        // Get first letter of first name and first letter of last name
        const names = name?.split(' ');
        if (names && names.length > 1) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        } else if (names && names.length === 1 && names[0].length > 0) {
            return names[0][0].toUpperCase();
        }
        return '?';
    }

    // Get user's role name, default to 'User Role'
    const roleName = user?.role?.name || 'User Role';

  return (
    // Navbar container: White background, bottom border, flex layout
    <header className="h-16 bg-[hsl(var(--navbar-bg))] border-b border-[hsl(var(--navbar-border))] flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-30">

        {/* Left Side: Mobile Sidebar Toggle & Potentially Search */}
        <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[hsl(var(--navbar-muted-foreground))] hover:text-[hsl(var(--navbar-foreground))]" // Only show on mobile/tablet
                onClick={onToggleSidebar}
                aria-label="Toggle Sidebar"
            >
                <Menu className="h-6 w-6" />
            </Button>

             {/* Search Input - Can be added back if needed, styled like target */}
             {/* <div className="relative hidden md:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-9 pr-4 h-9 w-64 lg:w-80 bg-gray-100 border-none focus:bg-white focus:ring-1 focus:ring-primary"
                />
            </div> */}
        </div>


      {/* Right Side: Icons & User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Incident Report Button */}
        <IncidentReportButton variant="emergency" />
        
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="text-[hsl(var(--navbar-muted-foreground))] hover:text-[hsl(var(--navbar-foreground))] relative">
          <Bell className="h-5 w-5" />
          {/* Optional: Add a notification dot */}
          {/* <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span> */}
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             {/* Button includes Avatar, Name, Role, Dropdown Icon */}
             <Button variant="ghost" className="flex items-center gap-2 px-2 h-10 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Avatar className="h-8 w-8">
                  {/* Provide a default avatar image path or use initials */}
                  <AvatarImage src={user?.avatarUrl || `https://avatar.vercel.sh/${user?.email || 'default'}.png`} alt={user?.full_name || user?.email} />
                  <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                </Avatar>
                {/* Name and Role - styled to match target */}
                <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-[hsl(var(--navbar-foreground))]">{user?.full_name || 'User Name'}</span>
                    <span className="text-xs text-[hsl(var(--navbar-muted-foreground))]">{roleName}</span>
                </div>
                {/* Dropdown Arrow */}
                {/* <ChevronDown className="h-4 w-4 text-[hsl(var(--navbar-muted-foreground))] hidden sm:block ml-1" /> */}
             </Button>
          </DropdownMenuTrigger>
          {/* Dropdown Content */}
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user?.full_name || 'User Name'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;