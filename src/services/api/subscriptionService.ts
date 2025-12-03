// src/services/api/subscriptionService.ts

import { HttpClient } from './httpClient';
import type {
  BackendSubscriptionService,
  SubscriptionUpdateResult
} from '../../types/backend';
import type { UserSubscription } from '../../types/subscription';
import type { VipType, VipOrder, ResultSubscriptionVo } from '../../types/api';

/**
 * Subscription service implementing BackendSubscriptionService interface
 */
export class SubscriptionService extends HttpClient implements BackendSubscriptionService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Get user's current subscription from the unified source of truth
   * Endpoint: GET /api/v1/subscriptions/me
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      // Call the new Source of Truth endpoint
      const response = await this.get<ResultSubscriptionVo>('/api/v1/subscriptions/me');
      const data = response.data;

      // If status is not active, return null (no subscription for UI purposes)
      if (data.status !== 'active') {
        return null;
      }

      // Map backend response to frontend UserSubscription model
      const subscription: UserSubscription = {
        id: `sub_${userId}_${data.vipTypeId}`, // Generate a composite ID
        userId,
        // The backend now returns the explicit planId (e.g., "year", "month")
        planId: data.planId,
        status: data.status,
        // Start date is not strictly tracked in the simple VO, defaulting to 'now' is safe for UI
        startDate: new Date(), 
        endDate: new Date(data.expiresAt),
        autoRenew: data.autoRenew,
        paymentMethodId: 'alipay'
      };

      return subscription;
    } catch (error) {
      // 404s or other errors usually mean no active subscription in this context
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Update user subscription
   */
  async updateSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<SubscriptionUpdateResult> {
    try {
      // Get VIP types to find the matching type ID
      const vipTypesResponse = await this.get<{
        code: number;
        message: string;
        data: VipType[];
        timestamp?: number;
      }>('/admin/vipType/getVipType');

      const vipTypes = vipTypesResponse.data;
      const vipType = vipTypes.find(vt => vt.typeName === planId);

      if (!vipType) {
        return {
          success: false,
          subscription: {} as UserSubscription,
          error: 'Invalid plan ID'
        };
      }

      // Create VIP order
      const orderResponse = await this.post<{
        code: number;
        message: string;
        data: VipOrder;
        timestamp?: number;
      }>('/api/v1/vip/orders/alipay', { vipTypeId: vipType.id });

      const order = orderResponse.data;

      // Construct optimistic subscription object for immediate UI update
      const subscription: UserSubscription = {
        id: order.orderNo || `sub_${Date.now()}`,
        userId,
        planId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + (vipType.durationDays || 30) * 24 * 60 * 60 * 1000),
        autoRenew: true,
        paymentMethodId: paymentMethodId || 'alipay'
      };

      return {
        success: true,
        subscription
      };
    } catch (error) {
      return {
        success: false,
        subscription: {} as UserSubscription,
        error: error instanceof Error ? error.message : 'Failed to update subscription'
      };
    }
  }

  /**
   * Cancel user subscription
   */
  async cancelSubscription(userId: string, reason?: string): Promise<void> {
    try {
      // Get user's orders to find the active one
      const ordersResponse = await this.get<{
        code: number;
        message: string;
        data: {
          records: VipOrder[];
          total: number;
          size: number;
          current: number;
          pages: number;
        };
        timestamp?: number;
      }>('/api/v1/vip/orders?current=1&size=10');

      const activeOrder = ordersResponse.data.records.find((order: VipOrder) =>
        order.status === 1 // Assuming 1 means active/pending
      );

      if (activeOrder) {
        await this.delete<{
          code: number;
          message: string;
          data: boolean;
          timestamp?: number;
        }>(`/api/v1/vip/orders/${activeOrder.orderNo}`);
      }

      console.log('Cancelled subscription for user:', userId, 'Reason:', reason);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
}