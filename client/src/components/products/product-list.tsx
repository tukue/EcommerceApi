import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@shared/schema';
import api from '@/lib/axios';

interface ProductListProps {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  className?: string;
}

export function ProductList({ onAddProduct, onEditProduct, onDeleteProduct, className }: ProductListProps) {
  const { toast } = useToast();

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return <div className="flex justify-center items-center py-8">Loading products...</div>;
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load products",
      variant: "destructive",
    });
    return <div>Error loading products</div>;
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Product Catalog</h2>
        <Button onClick={onAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="p-5">
              <div className="font-medium text-lg mb-2">{product.name}</div>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.inventory && product.inventory > 10 
                    ? 'bg-green-100 text-green-800' 
                    : product.inventory && product.inventory > 0 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                }`}>
                  {product.inventory && product.inventory > 10 
                    ? 'In Stock' 
                    : product.inventory && product.inventory > 0 
                      ? 'Low Stock' 
                      : 'Out of Stock'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                <div>
                  <button 
                    onClick={() => onEditProduct(product)}
                    className="text-primary hover:text-blue-700 text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDeleteProduct(product.id)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {products?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found</p>
          <Button onClick={onAddProduct} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Product
          </Button>
        </div>
      )}
    </div>
  );
}
