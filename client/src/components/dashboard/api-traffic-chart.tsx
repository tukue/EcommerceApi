import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

interface ApiTrafficProps {
  className?: string;
}

export function ApiTrafficChart({ className }: ApiTrafficProps) {
  const [timeRange, setTimeRange] = React.useState('last24hours');
  
  const { data: trafficData, isLoading } = useQuery({
    queryKey: ['/api/gateway/traffic'],
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">API Gateway Traffic</h2>
            <div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last24hours">Last 24 hours</SelectItem>
                  <SelectItem value="last7days">Last 7 days</SelectItem>
                  <SelectItem value="last30days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <p>Loading traffic data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">API Gateway Traffic</h2>
          <div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last24hours">Last 24 hours</SelectItem>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="h-64 bg-gray-50 rounded border border-gray-200 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trafficData?.dataPoints}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="requests" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="text-lg font-semibold">{trafficData?.totalRequests.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Average Response</p>
            <p className="text-lg font-semibold">{trafficData?.averageResponse}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Error Rate</p>
            <p className="text-lg font-semibold">{trafficData?.errorRate}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Cache Hit Ratio</p>
            <p className="text-lg font-semibold">{trafficData?.cacheHitRatio}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
