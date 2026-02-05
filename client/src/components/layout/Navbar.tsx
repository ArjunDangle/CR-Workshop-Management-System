// src/components/layout/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, ChevronDown } from 'lucide-react'; 
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
import { useUIStore } from '@/stores/uiStore';

const Navbar: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { toggleSidebar } = useUIStore();
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

  return (
    // Height 16, transparent-ish background to blend with the dashboard area
    <header className="h-16 bg-[#F9FAFB]/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 sticky top-0 z-30">

        {/* Left Side: Mobile Menu Toggle only */}
        <div className="flex items-center">
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-400 hover:text-gray-900"
                onClick={toggleSidebar}
            >
                <Menu className="h-6 w-6" />
            </Button>
        </div>


      {/* Right Side: Minimal Icons & User Menu */}
      <div className="flex items-center space-x-6">
        
        {/* Notification Bell - Clean, No Background */}
        <button className="relative text-gray-400 hover:text-gray-900 transition-colors">
          <Bell className="h-5 w-5" strokeWidth={2} />
          {/* Subtle Notification Dot */}
          <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#F9FAFB]"></span>
          <span className="sr-only">Notifications</span>
        </button>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <button className="flex items-center gap-3 group focus:outline-none">
                <Avatar className="h-9 w-9 border border-gray-200 shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt={user?.full_name || user?.email} />
                  <AvatarFallback className="bg-white text-gray-400 font-bold text-xs">{getInitials(user?.full_name)}</AvatarFallback>
                </Avatar>
                {/* Dropdown Arrow - Minimalist detail */}
                <ChevronDown className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
             </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56 mt-2 rounded-2xl border-gray-100 shadow-2xl p-2" align="end">
            <DropdownMenuLabel className="px-3 py-3">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-bold text-gray-900 leading-none">{user?.full_name || 'User Name'}</p>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-tight">
                  {user?.role?.name || 'User Role'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-medium text-gray-600 focus:bg-gray-50 focus:text-gray-900">Profile</DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-medium text-gray-600 focus:bg-gray-50 focus:text-gray-900">Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-50" />
            <DropdownMenuItem 
                onClick={handleLogout} 
                className="rounded-xl px-3 py-2 cursor-pointer font-bold text-red-500 focus:bg-red-50 focus:text-red-600"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;