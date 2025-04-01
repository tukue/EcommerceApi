import React from 'react';
import { Card } from '@/components/ui/card';
import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceStatus } from '@shared/schema';

// Define service status types for use in the component
type StatusType = 'healthy' | 'warning' | 'error';

interface StatusCardProps {
  name: string;
  status: ServiceStatus | StatusType;
  details: string;
  lastUpdated: Date;
  className?: string;
}

export function StatusCard({ name, status, details, lastUpdated, className }: StatusCardProps) {
  // Ensure status is a string to use as a key
  const statusKey = typeof status === 'string' ? status : status;

  const borderColor: Record<StatusType, string> = {
    'healthy': 'border-l-4 border-status-success',
    'warning': 'border-l-4 border-status-warning',
    'error': 'border-l-4 border-status-error',
  };

  const statusText: Record<StatusType, string> = {
    'healthy': 'Healthy',
    'warning': 'Warning',
    'error': 'Error',
  };

  const statusColor: Record<StatusType, string> = {
    'healthy': 'text-status-success',
    'warning': 'text-status-warning',
    'error': 'text-status-error',
  };

  const bgColor: Record<StatusType, string> = {
    'healthy': 'bg-green-100',
    'warning': 'bg-yellow-100',
    'error': 'bg-red-100',
  };

  const Icon = () => {
    switch (statusKey) {
      case 'healthy':
        return <Check className={statusColor['healthy']} />;
      case 'warning':
        return <AlertTriangle className={statusColor['warning']} />;
      case 'error':
        return <X className={statusColor['error']} />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Convert the status to a string type that matches one of our keys
  const safeStatus = (typeof statusKey === 'string' && 
    (statusKey === 'healthy' || statusKey === 'warning' || statusKey === 'error')) 
    ? statusKey as StatusType 
    : 'warning';

  return (
    <Card className={cn('p-4', borderColor[safeStatus], className)}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-600">{name}</p>
          <p className={cn('text-lg font-semibold', statusColor[safeStatus])}>
            {statusText[safeStatus]}
          </p>
        </div>
        <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', bgColor[safeStatus])}>
          <Icon />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-xs text-gray-500">
          {details || 'Last updated: ' + formatTimeAgo(lastUpdated)}
        </span>
      </div>
    </Card>
  );
}
