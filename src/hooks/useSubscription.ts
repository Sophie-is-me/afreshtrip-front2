// src/hooks/useSubscription.ts

/**
 * FRONTEND ONLY - UX/UI Subscription Management Hook
 *
 * Updates:
 * - Uses unified "Source of Truth" for loading subscription status.
 * - Implements the Payment Method Selection Flow for plan updates/purchases.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionPlansData, type SubscriptionPlan, type UserSubscription } from '../types/subscription';
import { apiClient } from '../services/apiClient';
import { unifiedSubscriptionService } from '../services/subscription/UnifiedSubscriptionService'; // Use unified service
import type { SubscriptionPlanResponse } from '../types/api';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '../contexts/SnackbarContext';
import { i18nErrorHandler } from '../utils/i18nErrorHandler';

/**
 * Transform backend subscription plan response to frontend format
 */
const transformBackendPlanToFrontend = (backendPlan: SubscriptionPlanResponse): SubscriptionPlan => {
  // Determine plan popularity based on planId
  const isPopular = backendPlan.planId === 'VIP_MONTH';
  const isBestValue = backendPlan.planId === 'VIP_QUARTER';

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
};

export const useSubscription = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const { showSuccess } = useSnackbar();

  // Local error handler wrapper to reduce repetitive code
  const showError = useCallback((error: unknown, action: string) => {
    i18nErrorHandler.showErrorToUser(
      error instanceof Error ? error : new Error('Unknown error'),
      { component: 'useSubscription', action },
      [],
      i18n.t.bind(i18n)
    );
  }, [i18n]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showPaymentMethodSelection, setShowPaymentMethodSelection] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  // Simple cache for subscription data
  const subscriptionCache = useRef<{
    data: UserSubscription | null;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  }>({
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000 // 5 minutes
  });

  // 1. Load Subscription (Uses new Source of Truth via apiClient)
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setIsLoading(true);

        // Load plans from backend API
        try {
          const backendPlans = await apiClient.getSubscriptionPlans();
          console.log(backendPlans);
          // Transform backend plans to frontend format
          const frontendPlans = backendPlans.map(transformBackendPlanToFrontend);
          setPlans(frontendPlans);
        } catch (error) {
          console.error('Error loading subscription plans from backend:', error);
          // SECURITY: Only fallback to static data in development, not production
          // Check if we're in development by looking for Vite's dev server
          const isDevelopment = import.meta.env?.DEV || window.location.hostname === 'localhost';

          if (isDevelopment) {
            console.warn('Using static fallback data in development mode');
            setPlans(subscriptionPlansData.plans);
          } else {
            // In production, set empty plans and show error
            setPlans([]);
            showError('Failed to load subscription plans', 'fetchPlans');
          }
        }

        if (user) {
          // Check cache first
          const now = Date.now();
          const cacheValid = subscriptionCache.current.data !== undefined &&
                           (now - subscriptionCache.current.timestamp) < subscriptionCache.current.ttl;

          if (cacheValid && subscriptionCache.current.data !== null) {
            // Use cached data
            setUserSubscription(subscriptionCache.current.data);
            setSelectedPlanId(subscriptionCache.current.data.planId);
          } else {
            // Fetch fresh data
            const subscription = await apiClient.getSubscription(user.uid);

            // Update cache
            subscriptionCache.current.data = subscription;
            subscriptionCache.current.timestamp = now;

            if (subscription) {
              setUserSubscription(subscription);
              setSelectedPlanId(subscription.planId);
            } else {
              setUserSubscription(null);
              setSelectedPlanId(null);
            }
          }
        } else {
          setUserSubscription(null);
          setSelectedPlanId(null);
          // Clear cache when user logs out
          subscriptionCache.current.data = null;
          subscriptionCache.current.timestamp = 0;
        }
      } catch (err) {
        showError(err, 'fetchSubscriptionData');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user, i18n.language]);

  // 2. Handle Plan Selection - Just selects the plan for preview
  const handlePlanSelect = useCallback((planId: string) => {
    setSelectedPlanId(planId);
  }, []);

  // 3. Handle Plan Purchase - Shows payment method selection modal
  const handlePlanUpdate = useCallback((planId: string) => {
    if (!user) {
      showError('Authentication required', 'handlePlanUpdate');
      return;
    }

    if (userSubscription?.planId === planId) {
      showError('Already subscribed to this plan', 'handlePlanUpdate');
      return;
    }

    const selectedPlan = plans.find(p => p.planId === planId);
    if (!selectedPlan) {
      showError('Plan not found', 'handlePlanUpdate');
      return;
    }

    if (selectedPlan.isDisabled) {
      showError('Plan is disabled', 'handlePlanUpdate');
      return;
    }

    // Show payment method selection modal
    setPendingPlanId(planId);
    setShowPaymentMethodSelection(true);
  }, [user, userSubscription, plans]);

  // 4. Handle Payment Method Selection and Processing
  const handlePaymentMethodSelect = useCallback(async (planId: string, paymentMethod: 'alipay' | 'stripe') => {
    if (!user) {
      showError('Authentication required', 'handlePaymentMethodSelect');
      return;
    }

    if (userSubscription?.planId === planId) {
      showError('Already subscribed to this plan', 'handlePaymentMethodSelect');
      return;
    }

    const selectedPlan = plans.find(p => p.planId === planId);
    if (!selectedPlan) {
      showError('Plan not found', 'handlePaymentMethodSelect');
      return;
    }

    if (selectedPlan.isDisabled) {
      showError('Plan is disabled', 'handlePaymentMethodSelect');
      return;
    }

    try {
      setIsUpdating(true);

      // Close the payment method selection modal
      setShowPaymentMethodSelection(false);
      setPendingPlanId(null);

      // Call the unified service to orchestrate the payment flow
      const result = await unifiedSubscriptionService.purchaseVip(
        user.uid,
        planId,
        paymentMethod
      );

      if (result.success) {
        // Store payment context for return handling
        sessionStorage.setItem('pendingPayment', JSON.stringify({
          orderNo: result.orderNo,
          planId,
          paymentMethod,
          timestamp: Date.now()
        }));

        if (paymentMethod === 'alipay' && result.paymentHtml) {
          // FIXED ALIPAY FLOW: Open payment window immediately to avoid popup blocker
          const paymentWindow = window.open('', '_blank', 'width=800,height=600');
          if (paymentWindow) {
            // Show loading state immediately in the new window
            const loadingHtml = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Alipay Payment</title>
                  <style>
                    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                    .loading { text-align: center; padding: 50px; color: #666; }
                    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                  </style>
                </head>
                <body>
                  <div class="loading">
                    <div class="spinner"></div>
                    <h2>Processing Payment...</h2>
                    <p>Please wait while we prepare your payment page.</p>
                  </div>
                </body>
              </html>
            `;
            
            paymentWindow.document.write(loadingHtml);
            paymentWindow.document.close();
            
            // Now make the API call (window is already open, so no popup blocker)
            try {
              // Wrap the HTML content in a proper document structure
              const fullHtml = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Alipay Payment</title>
                    <style>
                      body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                      .success { text-align: center; padding: 50px; color: #27ae60; }
                    </style>
                  </head>
                  <body>
                    <div class="success">
                      <h2>Payment Ready!</h2>
                      <p>Complete your payment in the Alipay window.</p>
                    </div>
                    ${result.paymentHtml}
                  </body>
                </html>
              `;
              
              paymentWindow.document.write(fullHtml);
              paymentWindow.document.close();
              
              // Monitor window close and check payment status
              const checkClosed = setInterval(() => {
                if (paymentWindow.closed) {
                  clearInterval(checkClosed);
                  setIsUpdating(false);
                  // Check payment status after window closes
                  handlePaymentReturn(result.orderNo!);
                }
              }, 1000);
              
              setIsUpdating(false);
            } catch (error) {
              console.error('Error writing payment content to window:', error);
              paymentWindow.document.write('<html><body><h2>Error loading payment</h2></body></html>');
              paymentWindow.document.close();
              showError('Failed to load payment page', 'handlePaymentMethodSelect');
              setIsUpdating(false);
            }
          } else {
            showError('Popup blocked. Please allow popups for this site to complete payment.', 'handlePaymentMethodSelect');
            setIsUpdating(false);
          }
        } else if (paymentMethod === 'stripe' && result.clientSecret) {
          // NEW STRIPE FLOW: Use Stripe.js for on-site payment confirmation
          console.log('Stripe client secret received:', result.clientSecret);
          
          // TODO: Implement proper Stripe.js integration
          // For now, we'll show an error since this requires Stripe.js setup
          showError(
            'Stripe payment processing requires additional setup. Please contact support.',
            'handlePaymentMethodSelect'
          );
          setIsUpdating(false);
          
          // Alternative: If backend supports it, we could redirect to a Stripe-hosted page
          // window.location.href = `/payment-result?orderNo=${result.orderNo}&clientSecret=${result.clientSecret}`;
        } else if (paymentMethod === 'stripe' && result.paymentUrl) {
          // LEGACY STRIPE FLOW: Redirect to payment URL
          window.location.href = result.paymentUrl;
        } else {
          showError('Payment failed - no payment data received', 'handlePaymentMethodSelect');
          setIsUpdating(false);
        }
      } else {
        showError(result.error || 'Payment failed', 'handlePaymentMethodSelect');
        setIsUpdating(false);
      }
    } catch (err) {
      showError(err, 'handlePaymentMethodSelect');
      setIsUpdating(false);
    }
    // Note: If success, we don't set isUpdating(false) because the page is unloading/redirecting
  }, [user, userSubscription, plans]);

  // 5. Cancel Subscription
  const handleCancelSubscription = useCallback(async (reason?: string) => {
    if (!user) {
      showError('Authentication required to cancel subscription', 'handleCancelSubscription');
      return;
    }

    if (!userSubscription) {
      showError('No active subscription found', 'handleCancelSubscription');
      return;
    }

    try {
      setIsCancelling(true);

      await apiClient.cancelSubscription(user.uid, reason);

      // Optimistic update
      setUserSubscription(prev => prev ? { ...prev, autoRenew: false } : null);
      showSuccess(
        i18n.t('subscription.success.cancelSuccess') || 'Subscription cancelled successfully. Your access will continue until the end of the current billing period.'
      );
    } catch (err) {
      i18nErrorHandler.showErrorToUser(
        err,
        { component: 'useSubscription', action: 'handleCancelSubscription' },
        [],
        i18n.t.bind(i18n)
      );
    } finally {
      setIsCancelling(false);
    }
  }, [user, userSubscription]);

  // 6. Manual Refresh (Useful for the Return Page)
  const refreshSubscription = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const subscription = await apiClient.getSubscription(user.uid);

      // Update cache
      const now = Date.now();
      subscriptionCache.current.data = subscription;
      subscriptionCache.current.timestamp = now;

      setUserSubscription(subscription);
      if (subscription) setSelectedPlanId(subscription.planId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 7. Handle Payment Return Status Check
  const handlePaymentReturn = useCallback(async (orderNo: string) => {
    try {
      setIsLoading(true);
      const result = await unifiedSubscriptionService.handlePaymentReturn(user?.uid || '', orderNo);
      
      if (result.success && result.subscription) {
        // Payment successful, update user subscription
        await refreshSubscription();
        showSuccess(
          i18n.t('subscription.success.paymentCompleted') || 'Payment completed successfully!'
        );
      } else {
        showError(result.error || 'Payment not completed', 'handlePaymentReturn');
      }
    } catch (error) {
      showError(error, 'handlePaymentReturn');
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshSubscription]);

  // 8. Close Payment Method Selection Modal
  const closePaymentMethodSelection = useCallback(() => {
    setShowPaymentMethodSelection(false);
    setPendingPlanId(null);
  }, []);

  return useMemo(() => ({
    selectedPlanId,
    userSubscription,
    plans,
    isLoading,
    isUpdating,
    isCancelling,
    showPaymentMethodSelection,
    pendingPlanId,
    handlePlanSelect,
    handlePlanUpdate,
    handlePaymentMethodSelect,
    handleCancelSubscription,
    refreshSubscription,
    handlePaymentReturn,
    closePaymentMethodSelection
  }), [
    selectedPlanId, 
    userSubscription, 
    plans, 
    isLoading, 
    isUpdating, 
    isCancelling,
    showPaymentMethodSelection,
    pendingPlanId,
    handlePlanSelect, 
    handlePlanUpdate, 
    handlePaymentMethodSelect, 
    handleCancelSubscription, 
    refreshSubscription,
    handlePaymentReturn,
    closePaymentMethodSelection
  ]);
};