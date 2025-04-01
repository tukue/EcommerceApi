import { storage } from "../storage";
import { insertPaymentSchema, PaymentStatus, OrderStatus, type Payment, type InsertPayment } from "@shared/schema";
import { updateOrderStatus } from "./order-service";
import { z } from "zod";

export const validatePayment = (data: unknown) => {
  return insertPaymentSchema.parse(data);
};

export const getPayment = async (id: number): Promise<Payment | undefined> => {
  return await storage.getPayment(id);
};

export const getPaymentByOrderId = async (orderId: number): Promise<Payment | undefined> => {
  return await storage.getPaymentByOrderId(orderId);
};

export const createPayment = async (payment: InsertPayment): Promise<Payment> => {
  try {
    validatePayment(payment);
    return await storage.createPayment(payment);
  } catch (error) {
    throw error;
  }
};

export const updatePaymentStatus = async (id: number, status: PaymentStatus): Promise<Payment | undefined> => {
  return await storage.updatePaymentStatus(id, status);
};

export const processPayment = async (
  orderId: number, 
  amount: number, 
  paymentMethod: string, 
  mockSuccess: boolean = true
): Promise<Payment> => {
  // Check if payment already exists for this order
  let payment = await getPaymentByOrderId(orderId);
  
  if (payment) {
    throw new Error(`Payment already exists for order ${orderId}`);
  }
  
  // In a real world scenario, we would integrate with a payment gateway here
  // For this mock implementation, we'll simulate a payment process
  
  // Generate a mock transaction ID
  const transactionId = `txn_${Math.random().toString(36).substring(2, 10)}`;
  
  // Create the payment record
  payment = await createPayment({
    orderId,
    amount,
    status: PaymentStatus.PENDING,
    paymentMethod,
    transactionId
  });
  
  // Simulate payment processing
  if (mockSuccess) {
    // Update payment status to completed
    payment = await updatePaymentStatus(payment.id, PaymentStatus.COMPLETED) as Payment;
    
    // Update order status to processing
    await updateOrderStatus(orderId, OrderStatus.PROCESSING);
  } else {
    // Simulate payment failure
    payment = await updatePaymentStatus(payment.id, PaymentStatus.FAILED) as Payment;
  }
  
  return payment;
};
