/**
 * UNIFIED SUBSCRIPTION SERVICE - Single Source of Truth
 * 
 * This service combines the functionality of both:
 * - src/services/subscriptionService.ts (Business Logic Layer)
 * - src/services/api/subscriptionService.ts (API Wrapper)
 * 
 * Provides a unified interface for all subscription operations.
 */

import type { VipOrder as ApiVipOrder } from '../../types/api';
import type { SubscriptionPlan, UserSubscription } from '../../types/subscription';
import type { SubscriptionPlanResponse } from '../../types/api';
import { HttpClient } from '../api/httpClient';

export interface VipStatus {
  hasVip: boolean;
  endTime?: string;
  vipType?: string;
  daysRemaining?: number;
  autoRenew?: boolean;
}

export interface PaymentInitiationResult {
  success: boolean;
  paymentUrl?: string;
  paymentHtml?: string;
  clientSecret?: string;
  orderNo?: string;
  error?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  isPaid: boolean;
  error?: string;
}

export class UnifiedSubscriptionService {
  private httpClient: HttpClient;
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (import.meta.env?.VITE_API_BASE_URL || 
      (import.meta.env.DEV ? 'http://localhost:8080' : 'https://afreshtrip-backend-550030138351.europe-west1.run.app'));
    this.httpClient = new HttpClient(this.baseUrl);
  }

  /**
   * Get user's current subscription status
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const response = await this.httpClient.get<{
      code: number;
      message: string;
      data: {
        success: boolean;
        status?: 'active' | 'expired';
        planId?: string;
        vipTypeId?: string;
        expiresAt?: string;
        autoRenew?: boolean;
      };
    }>('/api/v1/payments/subscription');

    // Safety check for response structure
    if (!response || !response.data || !response.data.success || response.data.status !== 'active') {
      return null;
    }

    // Map backend response to frontend UserSubscription model
    const subscription: UserSubscription = {
      id: `sub_${userId}_${response.data.vipTypeId || 'unknown'}`,
      userId,
      planId: response.data.planId || 'month',
      status: response.data.status,
      startDate: new Date(),
      endDate: response.data.expiresAt ? new Date(response.data.expiresAt) : new Date(),
      autoRenew: response.data.autoRenew || false,
      paymentMethodId: 'unified'
    };

    return subscription;
  }

  /**
    * Get available subscription plans
    */
   async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
     const response = await this.httpClient.get<{
       code: number;
       message: string;
       data: SubscriptionPlanResponse[];
     }>('/api/v1/features/subscription-plans', { requiresAuth: false });

    // Safety check for response structure
    if (!response || !response.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data.map(plan => this.transformBackendPlanToFrontend(plan));
  }

  /**
   * Transform backend plan to frontend format with intelligent defaults
   */
  private transformBackendPlanToFrontend(backendPlan: SubscriptionPlanResponse): SubscriptionPlan {
    // Intelligent defaults based on plan characteristics
    const isPopular = backendPlan.planId === 'month';
    const isBestValue = backendPlan.planId === 'quarter';

    return {
      planId: backendPlan.planId,
      planName: backendPlan.planName,
      price: backendPlan.price,
      durationDays: backendPlan.durationDays,
      features: backendPlan.features,
      featureNames: backendPlan.featureNames,
      isPopular,
      isBestValue,
      isDisabled: false
    };
  }

  /**
   * Initiate VIP subscription purchase
   */
  async purchaseVip(
    userId: string,
    planId: string,
    paymentMethod: 'alipay' | 'stripe' = 'alipay'
  ): Promise<PaymentInitiationResult> {
    try {
      console.log('user id', userId);
      // Map frontend plan ID to backend VIP type
      const vipType = this.mapPlanIdToVipType(planId);
      const backendPaymentMethod = paymentMethod === 'stripe' ? 'STRIPE' : 'ALIPAY';
      
      console.log('Initiating payment with:', { vipType, paymentMethod: backendPaymentMethod });
      
      // Use unified payment initiation
      
      const response = await this.httpClient.post<{
        code: number;
        message: string;
        data: {
          success: boolean;
          orderNo: string;
          paymentMethod: 'ALIPAY' | 'STRIPE';
          paymentHtml?: string;
          clientSecret?: string;
          errorMessage?: string;
        };
      }>('/api/v1/payments/initiate', {
        vipType,
        paymentMethod: backendPaymentMethod
      });

      const data = response.data || response;

      console.log('Payment initiation data:', data);

      if (!data?.success) {
        return {
          success: false,
          error: data?.errorMessage || 'Payment initiation failed'
        };
      }

      // Return appropriate response based on payment method
      if (data?.paymentMethod === 'ALIPAY') {
        return {
          success: true,
          paymentHtml: data.paymentHtml,
          orderNo: data.orderNo
        };
      } else if (data?.paymentMethod === 'STRIPE') {
        return {
          success: true,
          clientSecret: data.clientSecret,
          orderNo: data.orderNo
        };
      }
      return {
        success: false,
        error: 'Unsupported payment method'
      };

    } catch (error) {
      console.error('VIP purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(orderNo: string): Promise<PaymentStatusResult> {
    try {
      const response = await this.httpClient.get<{
        code: number;
        message: string;
        data: {
          success: boolean;
          isPaid: boolean;
          message?: string;
        };
      }>(`/api/v1/payments/status/${orderNo}`);

      if (!response.data?.success) {
        return {
          success: false,
          isPaid: false,
          error: response.data?.message || 'Failed to check payment status'
        };
      }

      return {
        success: true,
        isPaid: response.data?.isPaid || false
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
   * Handle payment completion
   */
  async handlePaymentReturn(userId: string, orderNo: string): Promise<{
    success: boolean;
    subscription?: UserSubscription | null;
    error?: string;
  }> {
    try {
      const statusResult = await this.checkPaymentStatus(orderNo);
      
      if (statusResult.success && statusResult.isPaid) {
        // Payment successful, get the new subscription status
        const subscription = await this.getUserSubscription(userId);
        return {
          success: true,
          subscription: subscription || undefined
        };
      }

      return {
        success: false,
        error: statusResult.error || 'Payment verification failed'
      };

    } catch (error) {
      console.error('Payment return handling failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to verify payment status'
      };
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string, reason?: string): Promise<void> {
    try {
      await this.httpClient.delete(`/api/v1/payments/subscription`, {
        body: JSON.stringify({ reason })
      });
      console.log('Cancelled subscription for user:', userId, 'Reason:', reason);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Get VIP orders history
   */
  async getVipOrders(params?: { current?: number; size?: number }) {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.current) queryParams.set('current', params.current.toString());
    if (params?.size) queryParams.set('size', params.size.toString());
    
    const endpoint = `/api/v1/payments/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await this.httpClient.get<{
      code: number;
      message: string;
      data: {
        success: boolean;
        data?: {
          records: ApiVipOrder[];
          total: number;
          current: number;
          size: number;
        };
      };
    }>(endpoint);

    if (response.data?.success && response.data?.data) {
      return {
        orders: response.data.data.records || [],
        total: response.data.data.total || 0,
        hasMore: (response.data.data.current || 0) * (response.data.data.size || 10) < (response.data.data.total || 0),
      };
    }
    
    return { orders: [], total: 0, hasMore: false };
  }

  /**
   * Cancel VIP order
   */
  async cancelVipOrder(orderNo: string): Promise<boolean> {
    const response = await this.httpClient.delete<{
      code: number;
      message: string;
      data: boolean;
    }>(`/api/v1/payments/orders/${orderNo}`);
    return response.code === 200;
  }

  /**
   * Activate free trial
   */
  async activateFreeTrial(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await this.httpClient.post<{
        code: number;
        message: string;
        data: {
          success: boolean;
          message?: string;
          errorMessage?: string;
        };
      }>('/api/v1/payments/free-trial');

      return {
        success: response.data?.success || false,
        message: response.data?.message,
        error: response.data?.errorMessage
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate free trial'
      };
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

  /**
   * Map frontend plan ID to backend VIP type
   */
  private mapPlanIdToVipType(planId: string): 'VIP_WEEK' | 'VIP_MONTH' | 'VIP_QUARTER' | 'VIP_YEAR' {
    const mapping: Record<string, 'VIP_WEEK' | 'VIP_MONTH' | 'VIP_QUARTER' | 'VIP_YEAR'> = {
      'week': 'VIP_WEEK',
      'month': 'VIP_MONTH', 
      'quarter': 'VIP_QUARTER',
      'year': 'VIP_YEAR'
    };
    return mapping[planId] || 'VIP_MONTH';
  }
}

// Export singleton instance
export const unifiedSubscriptionService = new UnifiedSubscriptionService();