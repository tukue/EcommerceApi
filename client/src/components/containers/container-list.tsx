import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import api from '@/lib/axios';

interface Container {
  name: string;
  image: string;
  status: string;
  cpu: string;
  memory: string;
  port: string;
}

interface ContainerListProps {
  className?: string;
}

export function ContainerList({ className }: ContainerListProps) {
  const { data: containers, isLoading, refetch } = useQuery<Container[]>({
    queryKey: ['/api/gateway/containers'],
    staleTime: 60000, // 1 minute
  });

  if (isLoading) {
    return <div className="py-4 text-center">Loading containers...</div>;
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Docker Containers</h2>
        <div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Container Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPU / Memory
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Port
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {containers?.map((container) => (
              <tr key={container.name}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {container.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {container.image}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={container.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {container.cpu} / {container.memory}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {container.port}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a href="#" className="text-primary hover:text-blue-700 mr-3">Logs</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 mr-3">Restart</a>
                  {container.status === 'Running' || container.status === 'Warning' ? (
                    <a href="#" className="text-status-error hover:text-red-700">Stop</a>
                  ) : (
                    <a href="#" className="text-status-success hover:text-green-700">Start</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
