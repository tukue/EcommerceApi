import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { StatusBadge } from '@/components/ui/status-badge';
import { Order } from '@shared/schema';
import api from '@/lib/axios';

interface OrdersTableProps {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

export function OrdersTable({ limit, showViewAll = false, className }: OrdersTableProps) {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    staleTime: 60000, // 1 minute
  });

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const displayedOrders = limit && orders ? orders.slice(0, limit) : orders;

  if (isLoading) {
    return <div className="py-4 text-center">Loading orders...</div>;
  }

  if (!orders || orders.length === 0) {
    return <div className="py-4 text-center">No orders found</div>;
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
        {showViewAll && (
          <Link href="/orders" className="text-sm font-medium text-primary hover:text-blue-700">
            View all
          </Link>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedOrders?.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderId || `ORD-${order.id.toString().padStart(4, '0')}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  User #{order.userId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${order.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Link 
                    href={`/orders/${order.id}`} 
                    className="text-primary hover:text-blue-700 mr-3"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
