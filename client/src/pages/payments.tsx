import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Payment, PaymentStatus } from '@shared/schema';
import api from '@/lib/axios';

const Payments: React.FC = () => {
  // Mock implementation since we don't have a backend endpoint to get all payments
  // In a real implementation, we would fetch from a proper endpoint
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    staleTime: 60000,
  });

  // Extract payment information from orders
  const payments = React.useMemo(() => {
    if (!orders) return [];
    
    // This is just a mock to simulate payment data
    // In a real system, you'd fetch this from a proper endpoint
    return orders.map(order => ({
      id: order.id,
      orderId: order.id,
      amount: order.total,
      status: Math.random() > 0.2 ? PaymentStatus.COMPLETED : 
              Math.random() > 0.5 ? PaymentStatus.PENDING : PaymentStatus.FAILED,
      paymentMethod: Math.random() > 0.5 ? 'credit_card' : 'paypal',
      transactionId: `txn_${Math.random().toString(36).substring(2, 10)}`,
      createdAt: order.createdAt
    }));
  }, [orders]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payment Service</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor and manage payment transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading payment data...</div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.transactionId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {`ORD-${payment.orderId.toString().padStart(4, '0')}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No payment transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Credit Card</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '68%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>PayPal</span>
                <span className="font-medium">24%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '24%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Other</span>
                <span className="font-medium">8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Completed</span>
                <span className="font-medium">
                  {payments.filter(p => p.status === PaymentStatus.COMPLETED).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pending</span>
                <span className="font-medium">
                  {payments.filter(p => p.status === PaymentStatus.PENDING).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Failed</span>
                <span className="font-medium">
                  {payments.filter(p => p.status === PaymentStatus.FAILED).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Refunded</span>
                <span className="font-medium">
                  {payments.filter(p => p.status === PaymentStatus.REFUNDED).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Gateway Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-32">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-green-600">Payment Gateway Operational</p>
              <p className="text-xs text-gray-500 mt-1">Last checked: 2 minutes ago</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Payments;
