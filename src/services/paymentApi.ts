// src/services/paymentApi.ts
// Complete Alipay Payment Integration with Backend

import { auth } from '../../lib/firebase/client';

// ✅ Use your actual API URL
const API_BASE_URL =  'http://192.168.10.243:9000/web';

// VIP Type Code mapping (for backend request)
const VIP_TYPE_CODE_MAPPING: Record<string, string> = {
  'week': 'WEEK',
  'month': 'MONTH',
  'season': 'SEASON',
  'year': 'YEAR'
};

// VIP Type ID mapping (from backend response)
const VIP_TYPE_ID_MAPPING: Record<string, number> = {
  'week': 1,
  'month': 2,
  'season': 3,
  'year': 4
};

// Plan pricing
const PLAN_PRICING: Record<string, number> = {
  'week': 19,
  'month': 39,
  'season': 89,
  'year': 199
};

// ============================================================================
// TYPES
// ============================================================================

interface CreateOrderRequest {
  vipTypeCode: string;
}

interface OrderData {
  id: number;
  userId: number;
  vipTypeId: number;
  orderNo: string;
  amount: number;
  status: number; // 0 = pending, 1 = paid, 2 = cancelled
  payType: number; // 1 = Alipay
  startTime: string;
  endTime: string;
  createAt: string | null;
  updateAt: string | null;
  payQrCode: string; // ✅ Alipay QR code URL
}

interface CreateOrderResponse {
  msg: string;
  code: number;
  data: OrderData;
}

interface CheckOrderStatusResponse {
  msg: string;
  code: number;
  data: {
    status: number;
    orderNo: string;
  };
}

// ============================================================================
// CREATE ORDER
// ============================================================================

/**
 * Create an Alipay order
 * @param planId - The plan ID (week, month, season, year)
 * @returns Order data with QR code
 */
export const createAlipayOrder = async (planId: string): Promise<OrderData> => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User must be authenticated to create an order');
  }

  // Get Firebase auth token
  const token = await user.getIdToken();
  
  // Map plan ID to VIP type code
  const vipTypeCode = VIP_TYPE_CODE_MAPPING[planId] || 'MONTH';

  console.log('🛒 Creating Alipay order...');
  console.log('Plan ID:', planId);
  console.log('VIP Type Code:', vipTypeCode);
  console.log('Expected VIP Type ID:', VIP_TYPE_ID_MAPPING[planId]);

  try {
    const response = await fetch(`${API_BASE_URL}/order/createOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        
        // Add any other headers your backend requires
      },
      body: JSON.stringify({
        vipTypeCode: vipTypeCode
      } as CreateOrderRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      throw new Error(errorData.msg || `Failed to create order (${response.status})`);
    }

    const result: CreateOrderResponse = await response.json();

    if (result.code !== 200) {
      throw new Error(result.msg || 'Order creation failed');
    }

    console.log('✅ Order created successfully!');
    console.log('Order Number:', result.data.orderNo);
    console.log('VIP Type ID:', result.data.vipTypeId);
    console.log('Amount:', result.data.amount);
    console.log('QR Code URL:', result.data.payQrCode);
    console.log('Start Time:', result.data.startTime);
    console.log('End Time:', result.data.endTime);

    // Validate vipTypeId matches expected
    const expectedVipTypeId = VIP_TYPE_ID_MAPPING[planId];
    if (result.data.vipTypeId !== expectedVipTypeId) {
      console.warn(`⚠️ VIP Type ID mismatch! Expected ${expectedVipTypeId}, got ${result.data.vipTypeId}`);
    }

    return result.data;

  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    
    // Enhance error message for common issues
    if (error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      throw new Error('Authentication failed. Please log in again.');
    }

    throw error;
  }
};

// ============================================================================
// CHECK ORDER STATUS
// ============================================================================

/**
 * Check the payment status of an order
 * @param orderNo - The order number to check
 * @returns Order status (0=pending, 1=paid, 2=cancelled)
 */
export const checkOrderStatus = async (orderNo: string): Promise<number> => {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const token = await user.getIdToken();

  try {
    // ✅ Adjust this endpoint to match your backend
    const response = await fetch(`${API_BASE_URL}/order/checkStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderNo })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || 'Failed to check order status');
    }

    const result: CheckOrderStatusResponse = await response.json();

    if (result.code !== 200) {
      throw new Error(result.msg || 'Status check failed');
    }

    return result.data.status;

  } catch (error: any) {
    console.error('❌ Error checking order status:', error);
    throw error;
  }
};

// ============================================================================
// POLL ORDER STATUS
// ============================================================================

/**
 * Poll order status until payment is complete or timeout
 * @param orderNo - The order number to poll
 * @param maxAttempts - Maximum number of polling attempts (default: 60 = 3 minutes)
 * @param intervalMs - Polling interval in milliseconds (default: 3000 = 3 seconds)
 * @returns Promise that resolves to true if paid, false if cancelled/timeout
 */
export const pollOrderStatus = async (
  orderNo: string,
  maxAttempts: number = 60,
  intervalMs: number = 3000
): Promise<boolean> => {
  console.log('🔄 Starting payment status polling...');
  console.log('Order No:', orderNo);
  console.log('Max Attempts:', maxAttempts);
  console.log('Interval:', intervalMs, 'ms');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const status = await checkOrderStatus(orderNo);

      console.log(`📊 Attempt ${attempt}/${maxAttempts} - Status:`, status);

      if (status === 1) {
        // Payment successful
        console.log('✅ Payment confirmed!');
        return true;
      }

      if (status === 2) {
        // Payment cancelled
        console.log('❌ Payment cancelled');
        return false;
      }

      // Status is 0 (pending), continue polling
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));

    } catch (error) {
      console.error(`⚠️ Polling error on attempt ${attempt}:`, error);
      // Continue polling even if there's an error
      // (maybe temporary network issue)
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  console.log('⏱️ Polling timeout - payment not confirmed within time limit');
  return false;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get plan details by ID
 * @param planId - The plan ID
 * @returns Plan details
 */
export const getPlanDetails = (planId: string): { 
  name: string; 
  price: number; 
  vipTypeId: number;
  vipTypeCode: string;
} => {
  const plans: Record<string, { name: string; price: number; vipTypeId: number; vipTypeCode: string }> = {
    'week': { 
      name: 'Week', 
      price: PLAN_PRICING.week,
      vipTypeId: 1,
      vipTypeCode: 'WEEK'
    },
    'month': { 
      name: 'Month', 
      price: PLAN_PRICING.month,
      vipTypeId: 2,
      vipTypeCode: 'MONTH'
    },
    'season': { 
      name: 'Season', 
      price: PLAN_PRICING.season,
      vipTypeId: 3,
      vipTypeCode: 'SEASON'
    },
    'year': { 
      name: 'Year', 
      price: PLAN_PRICING.year,
      vipTypeId: 4,
      vipTypeCode: 'YEAR'
    }
  };

  return plans[planId] || plans['month'];
};

/**
 * Validate if plan ID is valid
 */
export const isValidPlanId = (planId: string): boolean => {
  return ['week', 'month', 'season', 'year'].includes(planId);
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  VIP_TYPE_CODE_MAPPING,
  VIP_TYPE_ID_MAPPING,
  PLAN_PRICING
};

export type {
  OrderData,
  CreateOrderResponse,
  CheckOrderStatusResponse
};
