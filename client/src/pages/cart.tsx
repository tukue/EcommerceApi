import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/components/cart/cart-item';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { CartWithItems } from '@shared/schema';
import api from '@/lib/axios';

const Cart: React.FC = () => {
  const { toast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);

  const { data: cartWithItems, isLoading, error } = useQuery<CartWithItems>({
    queryKey: ['/api/cart'],
    staleTime: 30000, // 30 seconds
  });

  const updateCartItemMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number, quantity: number }) => {
      const response = await api.put(`/cart/items/${cartItemId}`, { quantity });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Cart updated",
        description: "Your cart has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      });
    }
  });

  const removeCartItemMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await api.delete(`/cart/items/${cartItemId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  });

  const handleQuantityChange = (cartItemId: number, quantity: number) => {
    updateCartItemMutation.mutate({ cartItemId, quantity });
  };

  const handleRemoveItem = (cartItemId: number) => {
    removeCartItemMutation.mutate(cartItemId);
  };

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Shopping Cart</h1>
        <p className="mt-1 text-sm text-gray-600">Review and manage your shopping cart</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading cart...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">Error loading cart. Please try again.</p>
        </div>
      ) : cartWithItems && cartWithItems.items && cartWithItems.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Your Cart ({cartWithItems.totalItems} {cartWithItems.totalItems === 1 ? 'item' : 'items'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartWithItems.items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onQuantityChange={(quantity) => handleQuantityChange(item.id, quantity)}
                      onRemove={() => handleRemoveItem(item.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
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
                    <span className="font-medium">${cartWithItems.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">${(cartWithItems.subtotal * 0.08).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-lg">
                      ${(cartWithItems.subtotal + (cartWithItems.subtotal * 0.08)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={updateCartItemMutation.isPending || removeCartItemMutation.isPending}
                >
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64">
          <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-4">Looks like you haven't added any products to your cart yet.</p>
          <Button onClick={() => window.location.href = '/products'}>
            Browse Products
          </Button>
        </div>
      )}

      {/* Checkout Form Dialog */}
      <CheckoutForm
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totalAmount={cartWithItems ? cartWithItems.subtotal + (cartWithItems.subtotal * 0.08) : 0}
      />
    </AppLayout>
  );
};

export default Cart;
