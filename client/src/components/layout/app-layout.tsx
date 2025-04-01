import React, { useState } from 'react';
import Sidebar from './sidebar';
import Header from './header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile unless toggled */}
      <div className={cn(
        'md:flex md:flex-shrink-0',
        mobileMenuOpen ? 'block absolute z-10 h-full' : 'hidden'
      )}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMobileMenuClick={toggleMobileMenu} />
        
        <main className={cn("flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
