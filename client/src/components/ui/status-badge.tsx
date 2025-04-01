import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'healthy' | 'warning' | 'error' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled' | 'Running' | 'Warning' | 'Error' | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusLower = typeof status === 'string' ? status.toLowerCase() : '';

  const colors = {
    healthy: 'bg-green-100 text-green-800',
    running: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
  };

  const getColorClass = () => {
    for (const [key, value] of Object.entries(colors)) {
      if (statusLower.includes(key)) {
        return value;
      }
    }
    return 'bg-gray-100 text-gray-800'; // Default
  };

  return (
    <span className={cn(
      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
      getColorClass(),
      className
    )}>
      {status}
    </span>
  );
}
