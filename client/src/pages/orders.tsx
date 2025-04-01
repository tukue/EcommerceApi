import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrdersTable } from '@/components/orders/orders-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order, OrderStatus } from '@shared/schema';
import api from '@/lib/axios';

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('all');

  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    staleTime: 60000, // 1 minute
  });

  const filterOrdersByStatus = (status: string) => {
    if (status === 'all') return orders;
    return orders?.filter(order => order.status === status);
  };

  const filteredOrders = filterOrdersByStatus(activeTab);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
        <p className="mt-1 text-sm text-gray-600">View and manage customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value={OrderStatus.PENDING}>Pending</TabsTrigger>
              <TabsTrigger value={OrderStatus.PROCESSING}>Processing</TabsTrigger>
              <TabsTrigger value={OrderStatus.SHIPPED}>Shipped</TabsTrigger>
              <TabsTrigger value={OrderStatus.DELIVERED}>Delivered</TabsTrigger>
              <TabsTrigger value={OrderStatus.COMPLETED}>Completed</TabsTrigger>
              <TabsTrigger value={OrderStatus.CANCELLED}>Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Error loading orders</div>
          ) : (
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
                  {filteredOrders && filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderId || `ORD-${order.id.toString().padStart(4, '0')}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          User #{order.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                              order.status === OrderStatus.PROCESSING ? 'bg-yellow-100 text-yellow-800' : 
                              order.status === OrderStatus.SHIPPED ? 'bg-blue-100 text-blue-800' : 
                              order.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a 
                            href={`/orders/${order.id}`} 
                            className="text-primary hover:text-blue-700 mr-3"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Orders;
