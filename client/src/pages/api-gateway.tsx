import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ApiTrafficChart } from '@/components/dashboard/api-traffic-chart';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, RefreshCw, AlertTriangle, Network } from 'lucide-react';
import api from '@/lib/axios';

const ApiGateway: React.FC = () => {
  const { data: serviceStatuses, isLoading: statusesLoading } = useQuery({
    queryKey: ['/api/services/status'],
    staleTime: 60000, // 1 minute
  });

  const { data: trafficData, isLoading: trafficLoading } = useQuery({
    queryKey: ['/api/gateway/traffic'],
    staleTime: 60000, // 1 minute
  });

  const routeExamples = [
    { path: '/api/products', method: 'GET', service: 'Product Service', description: 'Get all products' },
    { path: '/api/products/:id', method: 'GET', service: 'Product Service', description: 'Get product by ID' },
    { path: '/api/users', method: 'GET', service: 'User Service', description: 'Get all users' },
    { path: '/api/cart', method: 'GET', service: 'Cart Service', description: 'Get current user cart' },
    { path: '/api/orders', method: 'GET', service: 'Order Service', description: 'Get all orders' },
    { path: '/api/orders/:id/payment', method: 'POST', service: 'Payment Service', description: 'Process payment for order' },
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">API Gateway</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor and manage the API Gateway for your microservices</p>
      </div>

      {/* API Traffic Chart */}
      <ApiTrafficChart className="mb-6" />

      {/* Gateway Config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="mr-2 h-5 w-5" />
                Routing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routeExamples.map((route, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{route.path}</TableCell>
                      <TableCell>
                        <Badge variant={
                          route.method === 'GET' ? 'default' :
                          route.method === 'POST' ? 'secondary' :
                          route.method === 'PUT' ? 'outline' : 'destructive'
                        }>
                          {route.method}
                        </Badge>
                      </TableCell>
                      <TableCell>{route.service}</TableCell>
                      <TableCell>{route.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Routes
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Gateway Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Response Time</span>
                <span className="font-medium">187ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '30%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Error Rate</span>
                <span className="font-medium">0.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '5%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Cache Hit Ratio</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '68%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>CPU Usage</span>
                <span className="font-medium">27%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '27%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Active Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-bold text-primary mb-2">124</div>
                <p className="text-sm text-gray-500">current active connections</p>
                <BarChart3 className="text-gray-400 mt-4 h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts */}
      <Alert variant="warning" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          High latency detected in User Service. The service is showing response times above threshold (87ms).
        </AlertDescription>
      </Alert>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Gateway Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Rate Limiting</h3>
              <p className="text-sm text-gray-600 mb-2">Limits: 100 requests per minute per IP</p>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Authentication</h3>
              <p className="text-sm text-gray-600 mb-2">JWT Authentication enabled</p>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Caching</h3>
              <p className="text-sm text-gray-600 mb-2">Cache TTL: 5 minutes</p>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Load Balancing</h3>
              <p className="text-sm text-gray-600 mb-2">Algorithm: Round Robin</p>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default ApiGateway;
