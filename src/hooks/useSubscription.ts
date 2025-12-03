// src/hooks/useSubscription.ts

/**
 * FRONTEND ONLY - UX/UI Subscription Management Hook
 *
 * Updates:
 * - Uses unified "Source of Truth" for loading subscription status.
 * - Implements the Payment Method Selection Flow for plan updates/purchases.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionPlansData, type SubscriptionPlan, type UserSubscription } from '../types/subscription';
import { apiClient } from '../services/apiClient';
import { subscriptionService } from '../services/subscriptionService'; // Import the high-level orchestrator

export const useSubscription = () => {
  const { user } = useAuth();
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

  // 1. Load Subscription (Uses new Source of Truth via apiClient)
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setIsLoading(true);
        setErrorKey(null);

        // Load plans from backend API
        try {
          // const backendPlans = await apiClient.getSubscriptionPlans();
          // TODO: Transform backend plans to frontend format
          // For now, keep using static data until transformation is implemented
          setPlans(subscriptionPlansData.plans);
        } catch (error) {
          console.error('Error loading subscription plans:', error);
          // Fallback to static data
          setPlans(subscriptionPlansData.plans);
        }

        if (user) {
          // This calls the updated low-level service which hits /api/v1/subscriptions/me
          const subscription = await apiClient.getSubscription(user.uid);

          if (subscription) {
            setUserSubscription(subscription);
            setSelectedPlanId(subscription.planId);
          } else {
            setUserSubscription(null);
            setSelectedPlanId(null);
          }
        } else {
          setUserSubscription(null);
          setSelectedPlanId(null);
        }
      } catch (err) {
        setErrorKey('subscription.error.loadFailed');
        console.error('Error fetching subscription data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [user]);

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

    const selectedPlan = plans.find(p => p.id === planId);
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

    const selectedPlan = plans.find(p => p.id === planId);
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
        // REDIRECT TO PAYMENT PROVIDER
        // The user will leave the app and return to the callback URL
        window.location.href = result.paymentUrl;
      } else {
        setErrorKey(result.error || 'subscription.error.updateFailed');
        setIsUpdating(false); // Only stop loading if we didn't redirect
      }
    } catch (err) {
      setErrorKey('subscription.error.updateFailed');
      console.error('Error updating subscription:', err);
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