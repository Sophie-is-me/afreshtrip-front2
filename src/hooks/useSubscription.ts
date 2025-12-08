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
import { subscriptionService } from '../services/subscriptionService'; // Import the high-level orchestrator
import type { SubscriptionPlanResponse } from '../types/api';
import { useTranslation } from 'react-i18next';

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
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);
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
        setErrorKey(null);

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
            setErrorKey('subscription.error.loadFailed');
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
        setErrorKey('subscription.error.loadFailed');
        console.error('Error fetching subscription data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user, i18n.language]);

  // 2. Handle Plan Selection - Just selects the plan for preview
  const handlePlanSelect = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    setErrorKey(null);
    setSuccessKey(null);
  }, []);

  // 3. Handle Plan Purchase - Shows payment method selection modal
  const handlePlanUpdate = useCallback((planId: string) => {
    if (!user) {
      setErrorKey('subscription.error.loginRequired');
      return;
    }

    if (userSubscription?.planId === planId) {
      setErrorKey('subscription.error.alreadySubscribed');
      return;
    }

    const selectedPlan = plans.find(p => p.planId === planId);
    if (!selectedPlan) {
      setErrorKey('subscription.error.planNotFound');
      return;
    }

    if (selectedPlan.isDisabled) {
      setErrorKey('subscription.error.planDisabled');
      return;
    }

    // Show payment method selection modal
    setPendingPlanId(planId);
    setShowPaymentMethodSelection(true);
  }, [user, userSubscription, plans]);

  // 4. Handle Payment Method Selection and Processing
  const handlePaymentMethodSelect = useCallback(async (planId: string, paymentMethod: 'alipay' | 'stripe') => {
    if (!user) {
      setErrorKey('subscription.error.loginRequired');
      return;
    }

    if (userSubscription?.planId === planId) {
      setErrorKey('subscription.error.alreadySubscribed');
      return;
    }

    const selectedPlan = plans.find(p => p.planId === planId);
    if (!selectedPlan) {
      setErrorKey('subscription.error.planNotFound');
      return;
    }

    if (selectedPlan.isDisabled) {
      setErrorKey('subscription.error.planDisabled');
      return;
    }

    try {
      setIsUpdating(true);
      setErrorKey(null);
      setSuccessKey(null);

      // Close the payment method selection modal
      setShowPaymentMethodSelection(false);
      setPendingPlanId(null);

      // Call the high-level service to orchestrate the payment flow
      const result = await subscriptionService.purchaseVip(
        user.uid,
        planId,
        paymentMethod
      );

      if (result.success && result.paymentUrl) {
        // Store payment context for return handling
        sessionStorage.setItem('pendingPayment', JSON.stringify({
          orderNo: result.orderNo,
          planId,
          paymentMethod,
          timestamp: Date.now()
        }));

        // REDIRECT TO PAYMENT PROVIDER
        // The user will leave the app and return to the callback URL
        window.location.href = result.paymentUrl;
      } else {
        setErrorKey(result.error || 'subscription.error.paymentFailed');
        setIsUpdating(false); // Only stop loading if we didn't redirect
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      if (err instanceof Error) {
        // Handle specific error types
        if (err.message.includes('network') || err.message.includes('fetch')) {
          setErrorKey('subscription.error.networkError');
        } else if (err.message.includes('timeout')) {
          setErrorKey('subscription.error.timeout');
        } else {
          setErrorKey('subscription.error.paymentFailed');
        }
      } else {
        setErrorKey('subscription.error.updateFailed');
      }
      setIsUpdating(false);
    }
    // Note: If success, we don't set isUpdating(false) because the page is unloading/redirecting
  }, [user, userSubscription, plans]);

  // 5. Cancel Subscription
  const handleCancelSubscription = useCallback(async (reason?: string) => {
    if (!user) {
      setErrorKey('subscription.error.cancelLoginRequired');
      return;
    }

    if (!userSubscription) {
      setErrorKey('subscription.error.noSubscription');
      return;
    }

    try {
      setIsCancelling(true);
      setErrorKey(null);
      setSuccessKey(null);

      await apiClient.cancelSubscription(user.uid, reason);

      // Optimistic update
      setUserSubscription(prev => prev ? { ...prev, autoRenew: false } : null);
      setSuccessKey('subscription.success.cancelSuccess');
    } catch (err) {
      setErrorKey('subscription.error.cancelFailed');
      console.error('Error cancelling subscription:', err);
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

  // 7. Close Payment Method Selection Modal
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
    errorKey,
    successKey,
    showPaymentMethodSelection,
    pendingPlanId,
    handlePlanSelect,
    handlePlanUpdate,
    handlePaymentMethodSelect,
    handleCancelSubscription,
    refreshSubscription,
    closePaymentMethodSelection
  }), [
    selectedPlanId, 
    userSubscription, 
    plans, 
    isLoading, 
    isUpdating, 
    isCancelling, 
    errorKey, 
    successKey,
    showPaymentMethodSelection,
    pendingPlanId,
    handlePlanSelect, 
    handlePlanUpdate, 
    handlePaymentMethodSelect, 
    handleCancelSubscription, 
    refreshSubscription,
    closePaymentMethodSelection
  ]);
};