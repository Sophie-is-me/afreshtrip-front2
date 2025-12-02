// src/services/api/paymentService.ts

import { HttpClient } from './httpClient';
import type { 
  ApiResponse,
  VipOrder,
  VipType,
  ResultIPageVipOrder,
  ResultListVipType
} from '../../types/api';

/**
 * Payment service for handling payment-related endpoints
 */
export class PaymentService extends HttpClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Generate AliPay payment URL
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

  /**
   * Initiate AliPay payment
   */
  async initiateAliPayPayment(paymentData: {
    subject: string;
    out_trade_no: string;
    total_amount: number;
    body?: string;
    product_code?: string;
  }): Promise<ApiResponse<{
    success: boolean;
    paymentUrl: string;
    orderNo: string;
    errorMessage?: string;
    errorCode?: string;
  }>> {
    return this.post('/alipay/api/create-order', paymentData, { requiresAuth: false });
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
   * Create VIP order
   */
  async createVipOrder(vipTypeId: number): Promise<VipOrder> {
    const response = await this.post<{
      code: number;
      message: string;
      data: VipOrder;
      timestamp?: number;
    }>('/api/v1/vip/orders/alipay', { vipTypeId });
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
   * Check subscription status
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
}