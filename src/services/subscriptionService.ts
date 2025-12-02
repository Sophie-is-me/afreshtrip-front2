// src/services/subscriptionService.ts

/**
 * SUBSCRIPTION SERVICE - Backend Integration for VIP/Subscription Management
 *
 * This service integrates with backend VIP APIs to manage user subscriptions,
 * payment processing, and feature access control.
 */

import { apiClient } from './apiClient';
import { paymentService, type VipPaymentOptions } from './paymentService';
import type { VipOrder as ApiVipOrder } from '../types/api';

export type VipOrder = ApiVipOrder;

export interface VipStatus {
  hasVip: boolean;
  endTime?: string;
  vipType?: string;
  daysRemaining?: number;
}

export class SubscriptionService {
  /**
   * Get user's VIP status
   */
  async getVipStatus(): Promise<VipStatus> {
    try {
      const response = await apiClient.getSubscriptionStatus();

      if (response.isSubscribed && response.endTime) {
        const endTime = new Date(response.endTime);
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        return {
          hasVip: endTime > now,
          endTime: response.endTime,
          vipType: response.vipType?.typeName,
          daysRemaining,
        };
      }

      return {
        hasVip: false,
      };
    } catch (error) {
      console.error('Failed to get VIP status:', error);
      return {
        hasVip: false,
      };
    }
  }

  /**
   * Get user's VIP orders
   */
  async getVipOrders(params?: {
    current?: number;
    size?: number;
  }): Promise<{
    orders: VipOrder[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const response = await apiClient.getVipOrders(params?.current, params?.size);

      return {
        orders: response.records,
        total: response.total,
        hasMore: response.current * response.size < response.total,
      };
    } catch (error) {
      console.error('Failed to get VIP orders:', error);
      return {
        orders: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Cancel unpaid VIP order
   */
  async cancelVipOrder(orderNo: string): Promise<boolean> {
    try {
      const response = await apiClient.deleteVipOrder(orderNo);
      return response;
    } catch (error) {
      console.error('Failed to cancel VIP order:', error);
      return false;
    }
  }

  /**
   * Activate free VIP trial
   */
  async activateFreeTrial(): Promise<boolean> {
    try {
      const response = await apiClient.activateFreeVipTrial();
      return response;
    } catch (error) {
      console.error('Failed to activate free trial:', error);
      return false;
    }
  }

  /**
   * Purchase VIP subscription
   */
  async purchaseVip(
    vipType: VipPaymentOptions['vipType'],
    paymentMethod: 'alipay' | 'stripe' = 'alipay'
  ): Promise<{
    success: boolean;
    paymentUrl?: string;
    sessionId?: string;
    error?: string;
  }> {
    try {
      let result;

      // Use the appropriate payment method based on the parameter
      if (paymentMethod === 'alipay') {
        result = await paymentService.createVipAliPayPayment({ vipType });
      } else {
        result = await paymentService.createVipStripePayment({ vipType });
      }

      return {
        success: result.success,
        paymentUrl: result.paymentUrl,
        sessionId: result.sessionId,
        error: result.errorMessage,
      };
    } catch (error) {
      console.error('VIP purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Check if user has active VIP
   */
  async hasActiveVip(): Promise<boolean> {
    const status = await this.getVipStatus();
    return status.hasVip;
  }

  /**
   * Get VIP pricing information
   */
  getVipPricing() {
    return paymentService.getVipPricing();
  }

  /**
   * Calculate savings for subscription plans
   */
  calculateSavings(vipType: keyof ReturnType<typeof this.getVipPricing>) {
    return paymentService.calculateSavings(vipType);
  }

  /**
   * Get recommended VIP plan based on usage
   */
  getRecommendedPlan(userActivity?: {
    tripsGenerated?: number;
    blogsCreated?: number;
    featuresUsed?: string[];
  }): VipPaymentOptions['vipType'] {
    // Simple recommendation logic based on activity
    const { tripsGenerated = 0, blogsCreated = 0, featuresUsed = [] } = userActivity || {};

    if (tripsGenerated > 20 || blogsCreated > 10 || featuresUsed.length > 5) {
      return 'VIP_YEAR';
    } else if (tripsGenerated > 10 || blogsCreated > 5 || featuresUsed.length > 3) {
      return 'VIP_QUARTER';
    } else if (tripsGenerated > 5 || blogsCreated > 2 || featuresUsed.length > 1) {
      return 'VIP_MONTH';
    } else {
      return 'VIP_WEEK';
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();