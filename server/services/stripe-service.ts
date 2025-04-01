import Stripe from 'stripe';
import { log } from '../vite';
import { Payment, PaymentStatus } from '@shared/schema';

// Initialize Stripe with the API key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
let stripe: Stripe | null = null;

// Only initialize Stripe if we have a valid API key
if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
  try {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia', // Specify the Stripe API version
    });
    log('Stripe initialized successfully', 'stripe-service');
  } catch (error) {
    log(`Failed to initialize Stripe: ${(error as Error).message}`, 'stripe-service');
  }
} else {
  log('Stripe API key not configured. Stripe services will be unavailable', 'stripe-service');
}

/**
 * Check if Stripe is properly configured with an API key
 */
export function isStripeConfigured(): boolean {
  return Boolean(stripe);
}

/**
 * Create a payment intent with Stripe
 * @param amount - Amount in cents
 * @param currency - Currency code (default: 'usd')
 * @param metadata - Additional metadata for the payment
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
  }

  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }
    
    // Convert amount to cents if needed (Stripe uses cents)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata,
      // Default payment method types
      payment_method_types: ['card'],
    });

    return {
      clientSecret: paymentIntent.client_secret as string,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    log(`Stripe payment intent creation failed: ${(error as Error).message}`, 'stripe-service');
    throw new Error(`Failed to create payment intent: ${(error as Error).message}`);
  }
}

/**
 * Retrieve a payment intent from Stripe
 * @param paymentIntentId - The ID of the payment intent to retrieve
 */
export async function retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
  }

  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    log(`Failed to retrieve payment intent: ${(error as Error).message}`, 'stripe-service');
    throw new Error(`Failed to retrieve payment intent: ${(error as Error).message}`);
  }
}

/**
 * Confirm a payment intent with a payment method
 * @param paymentIntentId - The ID of the payment intent to confirm
 * @param paymentMethodId - The ID of the payment method to use
 */
export async function confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<Stripe.PaymentIntent> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
  }

  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  } catch (error) {
    log(`Failed to confirm payment intent: ${(error as Error).message}`, 'stripe-service');
    throw new Error(`Failed to confirm payment intent: ${(error as Error).message}`);
  }
}

/**
 * Cancel a payment intent
 * @param paymentIntentId - The ID of the payment intent to cancel
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
  }

  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    log(`Failed to cancel payment intent: ${(error as Error).message}`, 'stripe-service');
    throw new Error(`Failed to cancel payment intent: ${(error as Error).message}`);
  }
}

/**
 * Create a refund for a payment
 * @param paymentIntentId - The ID of the payment intent to refund
 * @param amount - Amount to refund (in cents), if not provided, full amount will be refunded
 */
export async function createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
  }

  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }
    
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    return await stripe.refunds.create(refundData);
  } catch (error) {
    log(`Failed to create refund: ${(error as Error).message}`, 'stripe-service');
    throw new Error(`Failed to create refund: ${(error as Error).message}`);
  }
}

/**
 * Map Stripe payment intent status to our internal PaymentStatus
 * @param stripeStatus - The status from Stripe
 */
export function mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
  switch (stripeStatus) {
    case 'succeeded':
      return PaymentStatus.COMPLETED;
    case 'processing':
      return PaymentStatus.PENDING;
    case 'requires_payment_method':
    case 'requires_confirmation':
    case 'requires_action':
    case 'requires_capture':
      return PaymentStatus.PENDING;
    case 'canceled':
      return PaymentStatus.FAILED;
    default:
      return PaymentStatus.PENDING;
  }
}

/**
 * Format payment amount (convert cents to dollars)
 * @param amount - Amount in cents
 */
export function formatAmount(amount: number): number {
  return amount / 100;
}

/**
 * Create a payment method from token
 * @param token - The token from Stripe.js
 */
export async function createPaymentMethod(token: string): Promise<Stripe.PaymentMethod> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.');
  }

  try {
    if (!stripe) {
      throw new Error('Stripe is not initialized');
    }
    return await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token,
      },
    });
  } catch (error) {
    log(`Failed to create payment method: ${(error as Error).message}`, 'stripe-service');
    throw new Error(`Failed to create payment method: ${(error as Error).message}`);
  }
}

/**
 * Get Stripe publishable key
 */
export function getPublishableKey(): string {
  const key = process.env.STRIPE_PUBLIC_KEY || '';
  
  if (!key || !key.startsWith('pk_')) {
    log('Warning: Stripe publishable key is not configured', 'stripe-service');
  }
  
  return key;
}