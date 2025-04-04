import { InsertPayment, Order, OrderStatus, Payment, PaymentStatus } from '@shared/schema';
import { storage } from '../storage';
import { log } from '../vite';
import * as notificationService from './notification-service';
import * as orderService from './order-service';
import * as stripeService from './stripe-service';

/**
 * Get a payment by ID
 * @param id - Payment ID
 */
export async function getPayment(id: number): Promise<Payment | undefined> {
  return storage.getPayment(id);
}

/**
 * Get a payment by order ID
 * @param orderId - Order ID
 */
export async function getPaymentByOrderId(orderId: number): Promise<Payment | undefined> {
  return storage.getPaymentByOrderId(orderId);
}

/**
 * Create a new payment
 * @param payment - Payment data
 */
export async function createPayment(payment: InsertPayment): Promise<Payment> {
  // Check if payment for this order already exists
  const existingPayment = await storage.getPaymentByOrderId(payment.orderId);
  if (existingPayment) {
    throw new Error(`Payment for order ${payment.orderId} already exists`);
  }

  return storage.createPayment(payment);
}

/**
 * Update payment status
 * @param id - Payment ID
 * @param status - New status
 */
export async function updatePaymentStatus(
  id: number,
  status: PaymentStatus
): Promise<Payment | undefined> {
  return storage.updatePaymentStatus(id, status);
}

/**
 * Process a payment through the payment gateway
 * @param orderId - Order ID
 * @param amount - Payment amount
 * @param paymentMethod - Payment method (credit_card, paypal, etc.)
 * @param mockSuccess - For testing, mock success or failure
 */
export async function processPayment(
  orderId: number,
  amount: number,
  paymentMethod: string,
  mockSuccess: boolean = true
): Promise<Payment> {
  // Get the order to retrieve user information
  const order = await storage.getOrder(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Get user for notification
  const user = await storage.getUser(order.userId);
  if (!user) {
    throw new Error(`User ${order.userId} not found`);
  }

  try {
    // Create a payment record in pending status
    const paymentData: InsertPayment = {
      orderId,
      amount,
      paymentMethod,
      status: PaymentStatus.PENDING
    };

    const payment = await createPayment(paymentData);

    // Handle different payment methods
    if (paymentMethod === 'stripe') {
      // Only try to process Stripe if it's configured
      if (stripeService.isStripeConfigured()) {
        try {
          // In a real implementation, this would process the payment with Stripe
          // For now, we'll just create a payment intent but won't process it fully
          const { paymentIntentId } = await stripeService.createPaymentIntent(
            amount,
            'usd',
            { orderId: orderId.toString() }
          );

          // Update payment status to pending
          await storage.updatePaymentStatus(payment.id, PaymentStatus.PENDING);

          // In a real implementation with proper updatePayment method,
          // we would also update the transaction ID in a separate field

          // Note: In a real implementation, we would handle webhooks from Stripe
          // to update the payment status when the payment is completed

          // For demo purposes, we'll just update the status to completed
          if (mockSuccess) {
            // Update payment with new status
            await storage.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED);
          }
        } catch (error) {
          log(`Stripe payment failed: ${(error as Error).message}`, 'payment-service');
          await storage.updatePaymentStatus(payment.id, PaymentStatus.FAILED);
          return storage.getPayment(payment.id) as Promise<Payment>;
        }
      } else {
        // If Stripe isn't configured, simulate payment based on mockSuccess
        if (mockSuccess) {
          await storage.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED);
        } else {
          await storage.updatePaymentStatus(payment.id, PaymentStatus.FAILED);
          return storage.getPayment(payment.id) as Promise<Payment>;
        }
      }
    } else {
      // For non-Stripe payment methods or testing, simulate payment
      if (mockSuccess) {
        await storage.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED);
      } else {
        await storage.updatePaymentStatus(payment.id, PaymentStatus.FAILED);
        return storage.getPayment(payment.id) as Promise<Payment>;
      }
    }

    // Get the updated payment
    const updatedPayment = await storage.getPayment(payment.id);
    if (!updatedPayment) {
      throw new Error(`Payment ${payment.id} not found after processing`);
    }

    // If payment was successful, update order status
    if (updatedPayment.status === PaymentStatus.COMPLETED) {
      await orderService.updateOrderStatus(orderId, OrderStatus.PROCESSING);

      // Send payment confirmation notification
      await notificationService.sendPaymentConfirmation(
        user.id,
        orderId,
        amount
      );
    }

    return updatedPayment;
  } catch (error) {
    log(`Payment processing error: ${(error as Error).message}`, 'payment-service');
    throw error;
  }
}

/**
 * Create a checkout session for Stripe
 * @param orderId - Order ID
 * @param successUrl - URL to redirect to on successful payment
 * @param cancelUrl - URL to redirect to on canceled payment
 */
export async function createStripeCheckoutSession(
  orderId: number,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string }> {
  if (!stripeService.isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
  }

  // Get the order
  const order = await storage.getOrder(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Get order items
  const orderItems = await storage.getOrderItems(orderId);
  if (!orderItems || orderItems.length === 0) {
    throw new Error(`No items found for order ${orderId}`);
  }

  // Get product details for each order item
  const lineItems = await Promise.all(
    orderItems.map(async (item) => {
      const product = await storage.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.imageUrl ? [product.imageUrl] : undefined,
          },
          unit_amount: Math.round(product.price * 100), // Stripe uses cents
        },
        quantity: item.quantity,
      };
    })
  );

  // Create a payment record in pending status
  const paymentData: InsertPayment = {
    orderId,
    amount: order.total,
    paymentMethod: 'stripe',
    status: PaymentStatus.PENDING
  };

  const payment = await createPayment(paymentData);

  try {
    // This would normally call the Stripe API to create a checkout session
    // For now, we'll return a mock session ID since we don't have valid API keys yet
    const sessionId = `mock_cs_${Date.now()}`;

    // First update the payment status
    await storage.updatePaymentStatus(payment.id, PaymentStatus.PENDING);

    // We need a way to store the transaction ID - in a real implementation,
    // we would update the payment with the transaction ID in a separate operation

    return { sessionId };
  } catch (error) {
    // Update payment status to failed
    await storage.updatePaymentStatus(payment.id, PaymentStatus.FAILED);

    log(`Failed to create Stripe checkout session: ${(error as Error).message}`, 'payment-service');
    throw new Error(`Failed to create checkout session: ${(error as Error).message}`);
  }
}

/**
 * Process a refund
 * @param paymentId - Payment ID
 * @param amount - Amount to refund (if not provided, full amount will be refunded)
 */
export async function processRefund(
  paymentId: number,
  amount?: number
): Promise<Payment> {
  // Get the payment
  const payment = await storage.getPayment(paymentId);
  if (!payment) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  // Check if payment is completed
  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new Error(`Cannot refund payment ${paymentId} with status ${payment.status}`);
  }

  // Get the order to retrieve user information
  const order = await storage.getOrder(payment.orderId);
  if (!order) {
    throw new Error(`Order ${payment.orderId} not found`);
  }

  // Get user for notification
  const user = await storage.getUser(order.userId);
  if (!user) {
    throw new Error(`User ${order.userId} not found`);
  }

  try {
    // If Stripe is configured and this was a Stripe payment, process the refund through Stripe
    if (stripeService.isStripeConfigured() && payment.paymentMethod === 'stripe' && payment.transactionId) {
      try {
        await stripeService.createRefund(payment.transactionId, amount);
      } catch (error) {
        log(`Stripe refund failed: ${(error as Error).message}`, 'payment-service');
        throw error;
      }
    }

    // Update payment status to refunded
    await storage.updatePaymentStatus(payment.id, PaymentStatus.REFUNDED);

    // Update order status to cancelled
    await orderService.updateOrderStatus(order.id, OrderStatus.CANCELLED);

    // Send notification about the refund
    await notificationService.sendNotification({
      recipientId: user.id,
      type: 'email',
      subject: `Refund Processed for Order #${order.id}`,
      message: `Your refund of $${amount || payment.amount} for Order #${order.id} has been processed.`,
      metadata: {
        orderId: order.id,
        paymentId: payment.id,
        refundAmount: amount || payment.amount
      }
    });

    return storage.getPayment(payment.id) as Promise<Payment>;
  } catch (error) {
    log(`Refund processing error: ${(error as Error).message}`, 'payment-service');
    throw error;
  }
}

/**
 * Get Stripe publishable key
 */
export function getStripePublishableKey(): string {
  return stripeService.getPublishableKey();
}

/**
 * Check health of the payment service
 * @returns true if the service is healthy, false otherwise
 */
export async function checkHealth(): Promise<boolean> {
  try {
    // Simple check to see if we can access the storage
    await storage.getPayment(1);
    return true;
  } catch (error) {
    return false;
  }
}