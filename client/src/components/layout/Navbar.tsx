import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
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
import { useAuthStore } from '@/modules/auth/authStore';
import { useUIStore } from '@/stores/uiStore'; // Import UI Store
import { IncidentReportButton } from '@/modules/incident/components/widgets/IncidentReportButton';

const Navbar: React.FC = () => { // Removed props interface
    const { user, logout } = useAuthStore();
    const { toggleSidebar } = useUIStore(); // Use UI Store
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/'); 
    };

    const getInitials = (name?: string | null) => { 
        const names = name?.split(' ');
        if (names && names.length > 1) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        } else if (names && names.length === 1 && names[0].length > 0) {
            return names[0][0].toUpperCase();
        }
        return '?';
    }

    const roleName = user?.role?.name || 'User Role';

  return (
    <header className="h-16 bg-[hsl(var(--navbar-bg))] border-b border-[hsl(var(--navbar-border))] flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-30">

        <div className="flex items-center gap-4">
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[hsl(var(--navbar-muted-foreground))] hover:text-[hsl(var(--navbar-foreground))]"
                onClick={toggleSidebar} // Use store action
                aria-label="Toggle Sidebar"
            >
                <Menu className="h-6 w-6" />
            </Button>
        </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <IncidentReportButton variant="emergency" />
        
        <Button variant="ghost" size="icon" className="text-[hsl(var(--navbar-muted-foreground))] hover:text-[hsl(var(--navbar-foreground))] relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="flex items-center gap-2 px-2 h-10 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || `https://avatar.vercel.sh/${user?.email || 'default'}.png`} alt={user?.full_name || user?.email} />
                  <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-[hsl(var(--navbar-foreground))]">{user?.full_name || 'User Name'}</span>
                    <span className="text-xs text-[hsl(var(--navbar-muted-foreground))]">{roleName}</span>
                </div>
             </Button>
          </DropdownMenuTrigger>
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