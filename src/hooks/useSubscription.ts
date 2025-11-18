// src/hooks/useSubscription.ts

/**
 * FRONTEND ONLY - UX/UI Subscription Management Hook
 *
 * 🚨 SECURITY WARNING: This hook provides CLIENT-SIDE subscription UI only.
 * It enhances user experience for subscription management, but provides
 * NO SECURITY. All subscription operations MUST be validated on the BACKEND.
 *
 * Backend Implementation Required:
 * - See src/types/backend.ts for BackendSubscriptionService interface
 * - Implement server-side subscription validation and payment processing
 * - Use middleware to protect subscription management endpoints
 *
 * Critical Backend Endpoints Needed:
 * - GET /api/subscriptions/me - Get user's subscription (authenticated)
 * - POST /api/subscriptions/update - Update subscription (with payment)
 * - GET /api/features/accessible - Get user's accessible features
 *
 * Migration: Replace mock data with real API calls to backend services.
 * Keep UI logic, replace data fetching with authenticated API requests.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionPlansData, type SubscriptionPlan, type UserSubscription } from '../types/subscription';
import { mockApiClient } from '../services/mockApi';
import type { UpdateSubscriptionRequest } from '../types/backend';

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

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setIsLoading(true);
        setErrorKey(null);

        // Load plans (this would come from API in production)
        setPlans(subscriptionPlansData.plans);

        // Load user subscription using mock API
        if (user) {
          const response = await mockApiClient.getSubscription(user.uid);

          if (response.success && response.data) {
            setUserSubscription(response.data);
            setSelectedPlanId(response.data.planId);
          } else {
            // User has no subscription
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


  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handlePlanUpdate = useCallback(async (planId: string) => {
    if (!user) {
      setErrorKey('subscription.error.loginRequired');
      return;
    }

    // Validation: Check if selecting the same plan
    if (userSubscription?.planId === planId) {
      setErrorKey('subscription.error.alreadySubscribed');
      return;
    }

    // Validation: Check if plan exists
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) {
      setErrorKey('subscription.error.planNotFound');
      return;
    }

    // Validation: Check if plan is disabled
    if (selectedPlan.isDisabled) {
      setErrorKey('subscription.error.planDisabled');
      return;
    }

    try {
      setIsUpdating(true);
      setErrorKey(null);
      setSuccessKey(null);

      // Use mock API client for subscription update
      const request: UpdateSubscriptionRequest = {
        planId,
        paymentMethodId: 'pm_mock123', // Mock payment method
      };

      const response = await mockApiClient.updateSubscription(user.uid, request);

      if (response.success && response.data?.subscription) {
        setUserSubscription(response.data.subscription);
        setSelectedPlanId(planId);
        setSuccessKey('subscription.success.updateSuccess');
      } else {
        setErrorKey(response.error?.message || 'subscription.error.updateFailed');
      }
    } catch (err) {
      setErrorKey('subscription.error.updateFailed');
      console.error('Error updating subscription:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [user, userSubscription, plans]);

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

      // Use mock API client for subscription cancellation
      const response = await mockApiClient.cancelSubscription(user.uid, reason);

      if (response.success) {
        // Update local state to reflect cancellation
        setUserSubscription(prev => prev ? { ...prev, autoRenew: false } : null);
        setSuccessKey('subscription.success.cancelSuccess');
      } else {
        setErrorKey(response.error?.message || 'subscription.error.cancelFailed');
      }
    } catch (err) {
      setErrorKey('subscription.error.cancelFailed');
      console.error('Error cancelling subscription:', err);
    } finally {
      setIsCancelling(false);
    }
  }, [user, userSubscription]);

  return {
    selectedPlanId,
    userSubscription,
    plans,
    isLoading,
    isUpdating,
    isCancelling,
    errorKey,
    successKey,
    handlePlanSelect,
    handlePlanUpdate,
    handleCancelSubscription,
  };
};