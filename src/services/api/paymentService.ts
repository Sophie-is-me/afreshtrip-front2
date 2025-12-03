import { HttpClient } from './httpClient';
import type {
  ApiResponse,
  VipOrder,
  VipType,
  ResultIPageVipOrder,
  ResultListVipType,
  PaymentResponse,
  AliPayDto,
  PaymentStatusResponse
} from '../../types/api';

/**
 * Payment service for handling payment-related endpoints
 */
export class PaymentService extends HttpClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Step 1: Create VIP Order
   * Returns order details (orderNo, amount, etc.) that are needed for payment initiation
   */
  async createVipOrder(planId: string): Promise<{
    success: boolean;
    orderNo: string;
    amount: number;
    errorMessage?: string;
  }> {
    try {
      // Step 1: Create a unique order identifier for backend tracking
      // In a real implementation, this would come from a proper backend order creation endpoint
      const orderNo = `VIP_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const amount = this.getPlanPrice(planId);
      
      return {
        success: true,
        orderNo,
        amount,
        errorMessage: undefined
      };
    } catch (error) {
      return {
        success: false,
        orderNo: '',
        amount: 0,
        errorMessage: error instanceof Error ? error.message : 'Failed to create order'
      };
    }
  }

  /**
   * Step 2: Initiate Alipay Payment with Order Details
   * Uses order details from Step 1 to get payment URL
   */
  async initiateAlipayPaymentForOrder(orderNo: string, amount: number, planId: string): Promise<PaymentResponse> {
    return this.initiateAliPayPayment({
      out_trade_no: orderNo,
      total_amount: amount,
      subject: `VIP ${planId} Subscription`
    });
  }

  /**
   * Step 4: Check Payment Status (for polling)
   * Verify payment completion status
   */
  async checkPaymentStatusForOrder(orderNo: string): Promise<{
    success: boolean;
    isPaid: boolean;
    status: number;
    errorMessage?: string;
  }> {
    try {
      const response = await this.checkPaymentStatus(orderNo);
      
      return {
        success: true,
        isPaid: response.success && response.status === 1,
        status: response.status || 0,
        errorMessage: undefined
      };
    } catch (error) {
      return {
        success: false,
        isPaid: false,
        status: -1,
        errorMessage: error instanceof Error ? error.message : 'Failed to check payment status'
      };
    }
  }

  /**
   * Get plan price based on planId
   */
  private getPlanPrice(planId: string): number {
    const pricing: Record<string, number> = {
      'week': 9.99,
      'month': 29.99,
      'year': 299.99
    };
    return pricing[planId] || 29.99;
  }

  /**
   * Map frontend planId to backend VIP type enum
   */
  private mapPlanIdToVipTypeEnum(planId: string): string {
    const mapping: Record<string, string> = {
      'week': 'VIP_WEEK',
      'month': 'VIP_MONTH',
      'quarter': 'VIP_QUARTER',
      'year': 'VIP_YEAR'
    };
    return mapping[planId] || 'VIP_MONTH';
  }

  /**
   * Step 2: Initiate Alipay Payment
   * Endpoint: POST /alipay/api/initiate-payment
   */
  async initiateAliPayPayment(paymentData: AliPayDto): Promise<PaymentResponse> {
    // This returns the success status and the paymentUrl (form/link from Alipay)
    return this.post<PaymentResponse>('/alipay/api/initiate-payment', paymentData);
  }

  /**
   * Step 4: Create Stripe Order
   * Endpoint: POST /api/v1/vip/orders/stripe
   */
  async createStripeOrder(planId: string): Promise<PaymentResponse> {
    const vipTypeEnum = this.mapPlanIdToVipTypeEnum(planId);
    const response = await this.post<{
      code: number;
      message: string;
      data: Record<string, unknown>;
    }>(`/api/v1/vip/orders/stripe?vipTypeEnum=${vipTypeEnum}`);
    
    // For now, return a mock response until Stripe integration is properly implemented
    return {
      success: response.code === 200,
      paymentUrl: response.code === 200 ? '/api/stripe-payment-page' : undefined,
      orderNo: `STRIPE_${Date.now()}`,
      errorMessage: response.code !== 200 ? response.message : undefined,
      errorCode: response.code !== 200 ? 'STRIPE_ERROR' : undefined
    };
  }

  /**
   * Step 3: Check Payment Status
   * Endpoint: GET /alipay/api/check-payment-status
   */
  async checkPaymentStatus(orderNo: string): Promise<PaymentStatusResponse> {
    return this.get<PaymentStatusResponse>(`/alipay/api/check-payment-status?orderNo=${orderNo}`);
  }

  /**
   * Get VIP types
   */
  async getVipTypes(): Promise<VipType[]> {
    const response = await this.get<ResultListVipType>('/admin/vipType/getVipType');
    return response.data;
  }

  /**
   * Get VIP order history
   */
  async getVipOrders(page: number = 1, size: number = 10): Promise<{
    records: VipOrder[];
    total: number;
    size: number;
    current: number;
    pages: number;
  }> {
    const response = await this.get<ResultIPageVipOrder>(
      `/api/v1/vip/orders?current=${page}&size=${size}`
    );
    return response.data;
  }

  /**
   * Cancel VIP order
   */
  async cancelVipOrder(orderNo: string): Promise<boolean> {
    const response = await this.delete<{
      code: number;
      message: string;
      data: boolean;
      timestamp?: number;
    }>(`/api/v1/vip/orders/${orderNo}`);
    return response.data;
  }

  /**
   * Get Subscription Status (Legacy/Supplemental check)
   * Note: The primary source of truth is now /subscriptions/me via SubscriptionService
   */
  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    vipType?: VipType;
    endTime?: string;
    remainingDays?: number;
  }> {
    const response = await this.get<{
      code: number;
      message: string;
      data: string;
      timestamp?: number;
    }>('/api/v1/vip/expiration');
    
    const endTime = response.data;
    const isSubscribed = endTime && new Date(endTime) > new Date();
    const remainingDays = isSubscribed ? Math.ceil((new Date(endTime).getTime() - Date.now()) / 86400000) : undefined;
    return {
      isSubscribed: !!isSubscribed,
      endTime,
      remainingDays
    };
  }

  // --- Deprecated / Legacy Methods ---
  
  /**
   * @deprecated Use generateAliPayUrl is replaced by the new initiateAliPayPayment flow
   */
  async generateAliPayUrl(params: {
    orderNo: string;
    amount: number;
    subject: string;
  }): Promise<ApiResponse<{
    success: boolean;
    paymentUrl: string;
    orderNo: string;
    errorMessage?: string;
    errorCode?: string;
  }>> {
    const queryParams = new URLSearchParams({
      orderNo: params.orderNo,
      amount: params.amount.toString(),
      subject: params.subject,
    });
    return this.get(`/alipay/api/payment-url?${queryParams}`, { requiresAuth: false });
  }
}