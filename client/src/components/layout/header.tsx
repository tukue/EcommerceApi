import React from 'react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Menu, Bell, Settings, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  onMobileMenuClick: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ onMobileMenuClick, className }) => {
  const { toast } = useToast();
  
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        return res.data;
      } catch (error) {
        return { user: null };
      }
    },
    staleTime: Infinity,
  });

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      toast({
        title: "Success",
        description: "You have been logged out.",
      });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className={cn("bg-background border-b shadow-sm flex justify-between items-center py-4 px-6", className)}>
      {/* Mobile menu button */}
      <button onClick={onMobileMenuClick} className="md:hidden text-gray-500 dark:text-gray-400 focus:outline-none">
        <Menu className="h-6 w-6" />
      </button>

      {/* Navigation links */}
      <div className="hidden md:flex space-x-4">
        <Link href="/" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">Home</Link>
        <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">Documentation</a>
        <a href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">API</a>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <button className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none">
          <Bell className="h-5 w-5" />
        </button>
        <button className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none">
          <Settings className="h-5 w-5" />
        </button>
        
        {/* Profile dropdown */}
        <div className="relative">
          <div>
            <button className="flex items-center text-sm rounded-full focus:outline-none">
              <span className="inline-block h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
