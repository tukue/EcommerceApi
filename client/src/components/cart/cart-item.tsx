import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@shared/schema';

interface CartItemProps {
  item: CartItemType & { product: any };
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange, onRemove }) => {
  const handleIncrement = () => {
    onQuantityChange(item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="flex items-center">
        {item.product.imageUrl ? (
          <img 
            src={item.product.imageUrl} 
            alt={item.product.name} 
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">
            <span className="text-gray-500 text-xs">No image</span>
          </div>
        )}
        <div className="ml-4">
          <h3 className="font-medium">{item.product.name}</h3>
          <p className="text-sm text-gray-500">{item.product.sku}</p>
          <p className="text-sm font-medium">${item.product.price.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-r-none"
            onClick={handleDecrement}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="text"
            value={item.quantity}
            onChange={handleInputChange}
            className="h-8 w-12 text-center rounded-none border-x-0"
          />
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-l-none"
            onClick={handleIncrement}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-right">
          <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-gray-500 hover:text-red-600"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
