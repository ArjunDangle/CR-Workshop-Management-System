// src/components/layout/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Search, Bell, Settings, Menu } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from '@/modules/auth/authStore'; // Correct path

interface NavbarProps {
    onToggleSidebar: () => void; // Keep prop for mobile toggle
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate(); // Initialize useNavigate

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getInitials = (name?: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    }

  return (
    // Changed background to white (bg-card), added border, removed sticky for now (layout handles it)
    <header className="h-16 bg-card border-b border-[hsl(var(--navbar-border))] flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
        {/* Left Side: Mobile Sidebar Toggle */}
        <div className="flex items-center gap-4">
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[hsl(var(--navbar-muted-foreground))] hover:text-[hsl(var(--navbar-foreground))]" // Only show on smaller screens
                onClick={onToggleSidebar}
                aria-label="Toggle Sidebar"
            >
                <Menu className="h-6 w-6" />
            </Button>

             {/* Search can go here if needed, or keep it simple */}
        </div>


      {/* Right Side: Icons & User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button variant="ghost" size="icon" className="text-[hsl(var(--navbar-muted-foreground))] hover:text-[hsl(var(--navbar-foreground))]">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="flex items-center gap-2 px-2 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || user?.email} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                {/* Display name next to avatar on larger screens */}
                <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-[hsl(var(--navbar-foreground))]">{user?.name || 'User'}</span>
                    <span className="text-xs text-[hsl(var(--navbar-muted-foreground))]">{user?.role?.name || 'Role'}</span>
                </div>
             </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem> {/* Example */}
            <DropdownMenuItem>Settings</DropdownMenuItem> {/* Example */}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
};

export default Navbar;