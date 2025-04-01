import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import api from '@/lib/axios';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
}

const formSchema = z.object({
  shippingAddress: z.string().min(5, "Shipping address is required"),
  paymentMethod: z.enum(["credit_card", "paypal"]),
});

type FormValues = z.infer<typeof formSchema>;

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ isOpen, onClose, totalAmount }) => {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shippingAddress: '',
      paymentMethod: 'credit_card',
    },
  });

  const orderMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await api.post('/orders', {
        shippingAddress: data.shippingAddress,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Process payment after creating the order
      paymentMutation.mutate({
        orderId: data.id,
        paymentMethod: form.getValues().paymentMethod,
      });
    },
    onError: () => {
      toast({
        title: "Order Creation Failed",
        description: "There was an error creating your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentMethod }: { orderId: number, paymentMethod: string }) => {
      const response = await api.post(`/orders/${orderId}/payment`, {
        paymentMethod,
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Order Placed!",
        description: "Your order has been placed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      onClose();
      // Redirect to orders page
      window.location.href = '/orders';
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    orderMutation.mutate(data);
  };

  const isPending = orderMutation.isPending || paymentMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter your full shipping address" 
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="credit_card" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Credit Card
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="paypal" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          PayPal
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('paymentMethod') === 'credit_card' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <Input placeholder="4242 4242 4242 4242" />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>Card Holder</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" />
                    </FormControl>
                  </FormItem>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/YY" />
                    </FormControl>
                  </FormItem>
                  <FormItem>
                    <FormLabel>CVC</FormLabel>
                    <FormControl>
                      <Input placeholder="123" />
                    </FormControl>
                  </FormItem>
                </div>
              </div>
            )}
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${(totalAmount / 1.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax (8%):</span>
                <span>${(totalAmount - (totalAmount / 1.08)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Processing...' : `Place Order • $${totalAmount.toFixed(2)}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
