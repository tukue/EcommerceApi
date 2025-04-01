import React from 'react';
import AppLayout from '@/components/layout/app-layout';
import { ContainerList } from '@/components/containers/container-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, RefreshCw } from 'lucide-react';

const Docker: React.FC = () => {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Docker Container Management</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor and manage Docker containers for your microservices</p>
      </div>

      <Tabs defaultValue="containers" className="mb-6">
        <TabsList>
          <TabsTrigger value="containers">Containers</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="networks">Networks</TabsTrigger>
          <TabsTrigger value="volumes">Volumes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="containers">
          <ContainerList />
        </TabsContent>
        
        <TabsContent value="images">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Docker Images</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Repository
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tag
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        microstore/api-gateway
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        latest
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        sha256:a72d84
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        157MB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        3 days ago
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a href="#" className="text-primary hover:text-blue-700 mr-3">Run</a>
                        <a href="#" className="text-red-500 hover:text-red-700">Delete</a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        microstore/product-service
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        1.2.0
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        sha256:e45f12
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        184MB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        5 days ago
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a href="#" className="text-primary hover:text-blue-700 mr-3">Run</a>
                        <a href="#" className="text-red-500 hover:text-red-700">Delete</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="networks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Docker Networks</CardTitle>
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Network
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Network ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scope
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        12ec8a6cdf98
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        microstore_network
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        bridge
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        local
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a href="#" className="text-red-500 hover:text-red-700">Remove</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="volumes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Docker Volumes</CardTitle>
              <Button variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Volume
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mountpoint
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        microstore_data
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        local
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        /var/lib/docker/volumes/microstore_data
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        5 days ago
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a href="#" className="text-red-500 hover:text-red-700">Remove</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Docker Compose Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
{`version: '3'

services:
  api-gateway:
    image: microstore/api-gateway:latest
    ports:
      - "8080:80"
    depends_on:
      - product-service
      - user-service
      - order-service
      - cart-service
      - payment-service
    networks:
      - microstore_network

  product-service:
    image: microstore/product-service:1.2.0
    ports:
      - "8081:8081"
    networks:
      - microstore_network

  user-service:
    image: microstore/user-service:1.1.5
    ports:
      - "8082:8082"
    networks:
      - microstore_network

  cart-service:
    image: microstore/cart-service:1.0.3
    ports:
      - "8083:8083"
    networks:
      - microstore_network

  order-service:
    image: microstore/order-service:1.1.0
    ports:
      - "8084:8084"
    networks:
      - microstore_network

  payment-service:
    image: microstore/payment-service:1.0.8
    ports:
      - "8085:8085"
    networks:
      - microstore_network

networks:
  microstore_network:
    driver: bridge`}
          </pre>
          <div className="flex justify-end mt-4">
            <Button variant="outline" className="mr-2">Edit Configuration</Button>
            <Button>Deploy Stack</Button>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Docker;
