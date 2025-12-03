/**
 * SUBSCRIPTION SERVICE - Business Logic Layer
 *
 * This service acts as a bridge between the UI and the lower-level API Client.
 * It orchestrates the multi-step Alipay payment flow and handles status verification.
 */

import { apiClient } from './apiClient';
import type { VipOrder as ApiVipOrder } from '../types/api';
import type { SubscriptionPlan } from '../types/subscription';

export type VipOrder = ApiVipOrder;

export interface VipStatus {
  hasVip: boolean;
  endTime?: string;
  vipType?: string; // e.g. "year", "month"
  daysRemaining?: number;
  autoRenew?: boolean;
}

export class SubscriptionService {
  
  /**
   * Purchase VIP subscription with proper Alipay flow
   * Flow: 
   * 1. Create Order (Backend)
   * 2. Initiate Payment (Backend -> Alipay)
   * 3. Return Payment URL to Frontend
   * 
   * @param userId - User ID (used for logging/verification context)
   * @param planId - 'week' | 'month' | 'year'
   * @param paymentMethod - Currently only 'alipay' is supported
   */
  async purchaseVip(
    _userId: string,
    planId: string,
    paymentMethod: 'alipay' | 'stripe' = 'alipay'
  ): Promise<{
    success: boolean;
    paymentUrl?: string;
    orderNo?: string;
    error?: string;
  }> {
    try {
      if (paymentMethod === 'alipay') {
        // Step 1: Order Creation Phase
        // Create VIP order and get order details (orderNo, amount)
        const orderResult = await apiClient.createVipOrder(planId);

        if (!orderResult.success) {
          return {
            success: false,
            error: orderResult.errorMessage || 'Failed to create VIP order'
          };
        }

        // Step 2: Payment Initiation Phase
        // Get payment URL using the order details from Step 1
        const paymentResult = await apiClient.initiateAlipayPaymentForOrder(
          orderResult.orderNo,
          orderResult.amount,
          planId
        );

        if (!paymentResult.success || !paymentResult.paymentUrl) {
          return {
            success: false,
            error: paymentResult.errorMessage || 'Failed to initiate Alipay payment'
          };
        }

        // Return the payment URL so the UI can redirect the user
        // Step 3: User Payment Phase will happen outside this service
        return {
          success: true,
          paymentUrl: paymentResult.paymentUrl,
          orderNo: orderResult.orderNo
        };

      } else if (paymentMethod === 'stripe') {
        // For Stripe: Similar 2-step process
        const orderResult = await apiClient.createVipOrder(planId);

        if (!orderResult.success) {
          return {
            success: false,
            error: orderResult.errorMessage || 'Failed to create Stripe order'
          };
        }

        const stripeResult = await apiClient.createStripeOrder(planId);

        if (!stripeResult.success) {
          return {
            success: false,
            error: stripeResult.errorMessage || 'Failed to create Stripe order'
          };
        }

        return {
          success: true,
          paymentUrl: stripeResult.paymentUrl || undefined,
          orderNo: orderResult.orderNo
        };

      } else {
        return {
          success: false,
          error: 'Unsupported payment method'
        };
      }

    } catch (error) {
      console.error('VIP purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed'
      };
    }
  }

  /**
   * Step 4: Payment Verification Phase
   * Poll for payment status after user completes payment
   */
  async verifyPayment(orderNo: string): Promise<{
    success: boolean;
    isPaid: boolean;
    error?: string;
  }> {
    try {
      const statusResult = await apiClient.checkPaymentStatusForOrder(orderNo);

      if (!statusResult.success) {
        return {
          success: false,
          isPaid: false,
          error: statusResult.errorMessage || 'Failed to check payment status'
        };
      }

      return {
        success: true,
        isPaid: statusResult.isPaid
      };

    } catch (error) {
      console.error('Payment verification failed:', error);
      return {
        success: false,
        isPaid: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      };
    }
  }

  /**
   * Check payment status
   * Wrapper for the API client method
   */
  async checkPaymentStatus(orderNo: string): Promise<{
    isPaid: boolean;
    status: number;
    error?: string;
  }> {
    try {
      const result = await apiClient.checkPaymentStatus(orderNo);

      if (!result.success) {
        return {
          isPaid: false,
          status: -1,
          error: 'Failed to check payment status'
        };
      }

      return {
        isPaid: result.isPaid,
        status: result.status
      };

    } catch (error) {
      return {
        isPaid: false,
        status: -1,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  /**
   * Handle payment completion (Polling Mechanism)
   * Call this when user returns to the app, or periodically while waiting.
   * It polls the backend multiple times to see if the Alipay webhook has processed.
   */
  async handlePaymentReturn(userId: string, orderNo: string): Promise<{
    success: boolean;
    subscription?: VipStatus;
    error?: string;
  }> {
    const maxAttempts = 10;
    const pollInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkPaymentStatus(orderNo);

      // Status 1 = Paid (Verified by backend)
      if (status.isPaid || status.status === 1) {
        // Payment successful, refresh and return the new status
        // We fetch the latest status from the Source of Truth endpoint
        const subscription = await this.getVipStatus(userId);
        return {
          success: true,
          subscription
        };
      }

      // Status 2 = Cancelled
      if (status.status === 2) {
         return { success: false, error: 'Payment was cancelled' };
      }

      // If pending (0), wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      error: 'Payment verification timeout. Please check your order history.'
    };
  }

  /**
   * Get user's VIP status
   * Uses the Unified Source of Truth endpoint (/subscriptions/me)
   */
  async getVipStatus(userId: string): Promise<VipStatus> {
    try {
      const subscription = await apiClient.getSubscription(userId);

      if (subscription && subscription.status === 'active') {
        const now = new Date();
        const endDate = subscription.endDate ? new Date(subscription.endDate) : new Date();
        
        // Visual calculation only
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        return {
          hasVip: true,
          endTime: subscription.endDate?.toISOString(),
          vipType: subscription.planId,
          daysRemaining,
          autoRenew: subscription.autoRenew
        };
      }
      return { hasVip: false };
    } catch (error) {
      console.error('Failed to get VIP status:', error);
      return { hasVip: false };
    }
  }

  /**
   * Get VIP orders history
   */
  async getVipOrders(params?: { current?: number; size?: number }) {
    try {
      const response = await apiClient.getVipOrders(params?.current, params?.size);
      return {
        orders: response.records,
        total: response.total,
        hasMore: response.current * response.size < response.total,
      };
    } catch (error) {
      console.error('Failed to get VIP orders:', error);
      return { orders: [], total: 0, hasMore: false };
    }
  }

  /**
   * Cancel VIP order
   */
  async cancelVipOrder(orderNo: string): Promise<boolean> {
    try {
      return await apiClient.cancelVipOrder(orderNo);
    } catch (error) {
      console.error('Failed to cancel VIP order:', error);
      return false;
    }
  }
  
  /**
   * Calculate savings for subscription plans (UI Helper)
   */
  calculateSavings(plan: SubscriptionPlan): number {
    if (plan.originalPrice && plan.price) {
      return Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
    }
    return 0;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();