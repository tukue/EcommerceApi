import { ServiceStatus as ServiceStatusEnum, type ServiceStatusWithMetrics } from "@shared/schema";
import { storage } from "../storage";

// API Gateway Service
export const getServiceStatuses = async (): Promise<ServiceStatusWithMetrics[]> => {
  const statuses = await storage.getServiceStatuses();
  
  // Add mock metrics for demonstration
  return statuses.map(status => {
    const metrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 512,
      requests: Math.floor(Math.random() * 1000),
      errors: Math.floor(Math.random() * 10),
    };
    
    // Override specific service metrics based on status
    if (status.name === "User Service" && status.status === ServiceStatusEnum.WARNING) {
      metrics.cpu = 87.2;
    }
    
    if (status.name === "Payment Service" && status.status === ServiceStatusEnum.ERROR) {
      metrics.cpu = 0;
      metrics.memory = 0;
      metrics.requests = 0;
      metrics.errors = 100;
    }
    
    return {
      ...status,
      metrics
    };
  });
};

export const updateServiceStatus = async (
  name: string, 
  status: ServiceStatusEnum, 
  details?: string
): Promise<ServiceStatusWithMetrics> => {
  const updatedStatus = await storage.updateServiceStatus(name, status, details);
  
  // Add mock metrics
  return {
    ...updatedStatus,
    metrics: {
      cpu: Math.random() * 100,
      memory: Math.random() * 512,
      requests: Math.floor(Math.random() * 1000),
      errors: Math.floor(Math.random() * 10),
    }
  };
};

export const getApiTrafficStats = async () => {
  // Mock implementation of API traffic statistics
  return {
    totalRequests: 243581,
    averageResponse: "187ms",
    errorRate: "0.8%",
    cacheHitRatio: "68%",
    timePoints: ["00:00", "06:00", "12:00", "18:00", "23:59"],
    dataPoints: [
      { time: "00:00", requests: 5200 },
      { time: "02:00", requests: 4300 },
      { time: "04:00", requests: 3200 },
      { time: "06:00", requests: 5600 },
      { time: "08:00", requests: 7800 },
      { time: "10:00", requests: 9200 },
      { time: "12:00", requests: 12500 },
      { time: "14:00", requests: 13800 },
      { time: "16:00", requests: 15200 },
      { time: "18:00", requests: 14300 },
      { time: "20:00", requests: 10500 },
      { time: "22:00", requests: 7800 },
    ]
  };
};

export const getSystemMetrics = async () => {
  // Mock implementation of system metrics
  return {
    orders: {
      count: 128,
      change: 12.5,
      period: "Last 7 Days"
    },
    users: {
      count: 1892,
      change: 8.1,
      period: "vs. previous period"
    },
    revenue: {
      amount: 14382,
      change: -3.2,
      period: "Last 7 Days"
    }
  };
};

export const getContainerStatuses = async () => {
  // Mock implementation of container statuses
  return [
    {
      name: "microstore-api-gateway",
      image: "microstore/api-gateway:latest",
      status: "Running",
      cpu: "0.8%",
      memory: "128MB",
      port: "8080:80"
    },
    {
      name: "microstore-product-service",
      image: "microstore/product-service:1.2.0",
      status: "Running",
      cpu: "1.2%",
      memory: "256MB",
      port: "8081:8081"
    },
    {
      name: "microstore-user-service",
      image: "microstore/user-service:1.1.5",
      status: "Warning",
      cpu: "87.2%",
      memory: "384MB",
      port: "8082:8082"
    },
    {
      name: "microstore-payment-service",
      image: "microstore/payment-service:1.0.8",
      status: "Error",
      cpu: "0.0%",
      memory: "0MB",
      port: "8083:8083"
    }
  ];
};
