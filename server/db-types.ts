import { OrderStatus, PaymentStatus, ServiceStatus as ServiceStatusEnum } from "../shared/schema";
import type { ServiceStatus } from "../shared/schema";

export function dbToServiceStatus(dbStatus: {
  id: number;
  name: string;
  status: string;
  details: string | null;
  lastUpdated: Date | null;
}): ServiceStatus {
  return {
    id: dbStatus.id,
    name: dbStatus.name,
    status: dbStatus.status as ServiceStatusEnum,
    details: dbStatus.details || "",
    lastUpdated: dbStatus.lastUpdated || new Date(),
  };
}

export function validateOrderStatus(status: string): OrderStatus {
  if (Object.values(OrderStatus).includes(status as OrderStatus)) {
    return status as OrderStatus;
  }
  return OrderStatus.PENDING;
}

export function validatePaymentStatus(status: string): PaymentStatus {
  if (Object.values(PaymentStatus).includes(status as PaymentStatus)) {
    return status as PaymentStatus;
  }
  return PaymentStatus.PENDING;
}