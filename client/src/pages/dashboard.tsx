import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/app-layout';
import { StatusCard } from '@/components/dashboard/status-card';
import { OrdersTable } from '@/components/orders/orders-table';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ApiTrafficChart } from '@/components/dashboard/api-traffic-chart';
import { ContainerList } from '@/components/containers/container-list';
import api from '@/lib/axios';
import { ServiceStatusWithMetrics } from '@shared/schema';

const Dashboard: React.FC = () => {
  const { data: serviceStatuses, isLoading: statusesLoading } = useQuery<ServiceStatusWithMetrics[]>({
    queryKey: ['/api/services/status'],
    staleTime: 60000, // 1 minute
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/gateway/metrics'],
    staleTime: 60000, // 1 minute
  });

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Service Catalog</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Monitor and manage your e-commerce platform services</p>
      </div>

      {/* System Status Cards */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusesLoading ? (
            <div>Loading service statuses...</div>
          ) : (
            serviceStatuses?.map((status) => (
              <StatusCard
                key={status.name}
                name={status.name}
                status={status.status}
                details={status.details}
                lastUpdated={status.lastUpdated}
              />
            ))
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <OrdersTable limit={4} showViewAll={true} className="mb-8" />

      {/* Metrics and Statistics */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricsLoading ? (
            <div>Loading metrics...</div>
          ) : (
            <>
              <MetricCard
                title={metrics?.orders.period || "Total Orders (Last 7 Days)"}
                value={metrics?.orders.count || 0}
                change={metrics?.orders.change || 0}
                period="vs. previous period"
                icon="orders"
              />
              <MetricCard
                title="Active Users"
                value={metrics?.users.count || 0}
                change={metrics?.users.change || 0}
                period={metrics?.users.period || "vs. previous period"}
                icon="users"
              />
              <MetricCard
                title={metrics?.revenue.period || "Revenue (Last 7 Days)"}
                value={metrics?.revenue.amount || 0}
                change={metrics?.revenue.change || 0}
                period="vs. previous period"
                icon="revenue"
              />
            </>
          )}
        </div>
      </div>

      {/* API Gateway Traffic */}
      <ApiTrafficChart className="mb-8" />

      {/* Docker Container Status */}
      <ContainerList className="mb-8" />
    </AppLayout>
  );
};

export default Dashboard;
