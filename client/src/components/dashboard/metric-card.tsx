import React from 'react';
import { Card } from '@/components/ui/card';
import { ShoppingBag, Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  period: string;
  icon: 'orders' | 'users' | 'revenue';
  className?: string;
}

export function MetricCard({ title, value, change, period, icon, className }: MetricCardProps) {
  const formatValue = () => {
    if (typeof value === 'number') {
      if (icon === 'revenue') {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const renderIcon = () => {
    const iconClass = "h-5 w-5";
    
    switch (icon) {
      case 'orders':
        return <ShoppingBag className={cn(iconClass, 'text-primary')} />;
      case 'users':
        return <Users className={cn(iconClass, 'text-secondary')} />;
      case 'revenue':
        return <DollarSign className={cn(iconClass, 'text-accent')} />;
      default:
        return null;
    }
  };

  const getIconBgColor = () => {
    switch (icon) {
      case 'orders':
        return 'bg-primary bg-opacity-20';
      case 'users':
        return 'bg-secondary bg-opacity-20';
      case 'revenue':
        return 'bg-accent bg-opacity-20';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', getIconBgColor())}>
          {renderIcon()}
        </div>
      </div>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{formatValue()}</p>
      <div className="mt-2 flex items-center text-sm">
        <span className={cn(
          'font-semibold',
          change >= 0 ? 'text-status-success' : 'text-status-error'
        )}>
          {change >= 0 ? '↑' : '↓'}{Math.abs(change)}%
        </span>
        <span className="ml-1 text-gray-500">{period}</span>
      </div>
    </Card>
  );
}
