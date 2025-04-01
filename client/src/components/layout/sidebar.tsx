import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Home, Package, Users, ShoppingCart, ClipboardList, 
  CreditCard, Bell, Network, Compass, FileText, Server
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItemClass = (path: string) => {
    return cn(
      "flex items-center px-4 py-2 text-sm font-medium rounded-md",
      isActive(path) 
        ? "bg-primary text-primary-foreground" 
        : "text-white hover:bg-gray-700 dark:hover:bg-gray-800"
    );
  };

  return (
    <div className={cn("flex flex-col w-64 bg-neutral-900 dark:bg-gray-900 text-white", className)}>
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700 dark:border-gray-800">
        <h1 className="text-xl font-bold">MicroStore Admin</h1>
      </div>
      <div className="flex flex-col flex-grow overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link href="/" className={navItemClass("/")}>
            <Home className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <div className="py-2">
            <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">
              Microservices
            </h3>
            <div className="mt-2 space-y-1">
              <Link href="/products" className={navItemClass("/products")}>
                <Package className="w-5 h-5 mr-3" />
                Product Catalog
              </Link>
              <Link href="/users" className={navItemClass("/users")}>
                <Users className="w-5 h-5 mr-3" />
                User Service
              </Link>
              <Link href="/cart" className={navItemClass("/cart")}>
                <ShoppingCart className="w-5 h-5 mr-3" />
                Shopping Cart
              </Link>
              <Link href="/orders" className={navItemClass("/orders")}>
                <ClipboardList className="w-5 h-5 mr-3" />
                Order Service
              </Link>
              <Link href="/payments" className={navItemClass("/payments")}>
                <CreditCard className="w-5 h-5 mr-3" />
                Payment Service
              </Link>
              <Link href="/notifications" className={navItemClass("/notifications")}>
                <Bell className="w-5 h-5 mr-3" />
                Notification Service
              </Link>
            </div>
          </div>
          <div className="py-2">
            <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-300 uppercase tracking-wider">
              Infrastructure
            </h3>
            <div className="mt-2 space-y-1">
              <Link href="/api-gateway" className={navItemClass("/api-gateway")}>
                <Network className="w-5 h-5 mr-3" />
                API Gateway
              </Link>
              <Link href="/service-discovery" className={navItemClass("/service-discovery")}>
                <Compass className="w-5 h-5 mr-3" />
                Service Discovery
              </Link>
              <Link href="/logging" className={navItemClass("/logging")}>
                <FileText className="w-5 h-5 mr-3" />
                Logging
              </Link>
              <Link href="/docker" className={navItemClass("/docker")}>
                <Server className="w-5 h-5 mr-3" />
                Docker Status
              </Link>
            </div>
          </div>
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-700 dark:border-gray-800 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-300">admin@microstore.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
