import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderWithItems, OrderStatus, PaymentStatus } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import api from '@/lib/axios';

const OrderDetail: React.FC = () => {
  const { toast } = useToast();
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id ? parseInt(params.id) : 0;

  const { data: order, isLoading, error } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: orderId > 0,
  });

  const { data: payment, isLoading: isPaymentLoading } = useQuery({
    queryKey: [`/api/payments/${order?.id}`],
    enabled: !!order,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The order status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (paymentMethod: string) => {
      const response = await api.post(`/orders/${orderId}/payment`, { paymentMethod });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Payment Processed",
        description: "The payment has been processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/payments/${orderId}`] });
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status as OrderStatus);
  };

  const handleProcessPayment = () => {
    processPaymentMutation.mutate('credit_card');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading order details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !order) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">Error loading order details. Please try again.</p>
        </div>
      </AppLayout>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Order {order.orderId || `ORD-${order.id.toString().padStart(4, '0')}`}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} className="text-sm px-3 py-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {order.user && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
                    <p>{order.user.firstName} {order.user.lastName}</p>
                    <p>{order.user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h3>
                    <p>{order.shippingAddress || 'No shipping address provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${(order.total * 0.08).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">
                    ${(order.total + (order.total * 0.08)).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch space-y-4">
              {order.status !== OrderStatus.CANCELLED && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                  <Select 
                    defaultValue={order.status} 
                    onValueChange={handleStatusChange}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={OrderStatus.PROCESSING}>Processing</SelectItem>
                      <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                      <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                      <SelectItem value={OrderStatus.COMPLETED}>Completed</SelectItem>
                      <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!payment && order.status === OrderStatus.PENDING && (
                <Button 
                  onClick={handleProcessPayment}
                  disabled={processPaymentMutation.isPending}
                >
                  {processPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
                </Button>
              )}

              {payment && (
                <div className="border rounded-md p-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Payment Information</p>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500">Method:</span>
                    <span>{payment.paymentMethod}</span>
                    <span className="text-gray-500">Status:</span>
                    <span><StatusBadge status={payment.status} /></span>
                    <span className="text-gray-500">Transaction ID:</span>
                    <span className="truncate">{payment.transactionId}</span>
                    <span className="text-gray-500">Date:</span>
                    <span>{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default OrderDetail;
