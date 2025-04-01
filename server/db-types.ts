import { ServiceStatus as ServiceStatusEnum, OrderStatus, PaymentStatus } from "../shared/schema";

// Define explicit types for handling database rows
export interface DbServiceStatus {
  id: number;
  name: string;
  status: string;
  details: string | null;
  lastUpdated: Date | null;
}

// Convert db types to application types
export function dbToServiceStatus(dbStatus: DbServiceStatus): any {
  return {
    id: dbStatus.id,
    name: dbStatus.name,
    status: dbStatus.status as ServiceStatusEnum,
    details: dbStatus.details || "",
    lastUpdated: dbStatus.lastUpdated || new Date()
  };
}

// Helper function to ensure status is valid
export function validateStatus(status: any, defaultStatus: string): string {
  if (typeof status === 'string') {
    return status;
  }
  return defaultStatus;
}

// Helper function to ensure OrderStatus is valid
export function validateOrderStatus(status: any): OrderStatus {
  if (Object.values(OrderStatus).includes(status as OrderStatus)) {
    return status as OrderStatus;
  }
  return OrderStatus.PENDING;
}

// Helper function to ensure PaymentStatus is valid
export function validatePaymentStatus(status: any): PaymentStatus {
  if (Object.values(PaymentStatus).includes(status as PaymentStatus)) {
    return status as PaymentStatus;
  }
  return PaymentStatus.PENDING;
}

// Helper function to ensure ServiceStatusEnum is valid
export function validateServiceStatus(status: any): ServiceStatusEnum {
  if (Object.values(ServiceStatusEnum).includes(status as ServiceStatusEnum)) {
    return status as ServiceStatusEnum;
  }
  return ServiceStatusEnum.WARNING;
}