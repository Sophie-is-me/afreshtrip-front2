// src/hooks/useFeatureAccess.ts

/**
 * FRONTEND ONLY - UX/UI Feature Access Hook
 *
 * 🚨 SECURITY WARNING: This hook provides CLIENT-SIDE feature visibility only.
 * It enhances user experience by hiding unavailable features, but provides
 * NO SECURITY. All access control MUST be enforced on the BACKEND.
 *
 * Backend Implementation Required:
 * - See src/types/backend.ts for BackendFeatureService interface
 * - Implement server-side access validation for all protected routes
 * - Use middleware to check feature access before processing requests
 *
 * Migration: Replace mock data with real API calls to backend services.
 */

import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';
import type { FeatureId, FeatureAccessResult } from '../types/features';
import { FEATURE_REGISTRY, FEATURE_PLAN_MAPPING } from '../types/features';
import { mockApiClient } from '../services/mockApi';

/**
 * Hook for checking feature access based on user subscription
 * Provides a clean API for components to check if features are available
 */
export const useFeatureAccess = () => {
  const { user } = useAuth();
  const { userSubscription } = useSubscription();

  const checkFeatureAccess = async (featureId: FeatureId): Promise<FeatureAccessResult> => {
    if (!user) {
      const feature = FEATURE_REGISTRY[featureId];
      return {
        hasAccess: false,
        feature: feature || {
          id: featureId,
          name: 'Unknown Feature',
          description: 'Feature not found',
          category: 'planning',
        },
        requiredPlans: FEATURE_PLAN_MAPPING[featureId] || [],
        userPlan: undefined,
        upgradeMessage: 'Authentication required',
      };
    }

    // Use mock API service for feature access checking
    const response = await mockApiClient.checkFeatureAccess(user.uid, featureId);

    if (response.success && response.data) {
      // Map backend response to frontend format by adding feature info
      const feature = FEATURE_REGISTRY[featureId];
      return {
        ...response.data,
        feature: feature || {
          id: featureId,
          name: 'Unknown Feature',
          description: 'Feature not found',
          category: 'planning',
        },
      };
    }

    // Fallback for API errors
    const feature = FEATURE_REGISTRY[featureId];
    return {
      hasAccess: false,
      feature: feature || {
        id: featureId,
        name: 'Unknown Feature',
        description: 'Feature not found',
        category: 'planning',
      },
      requiredPlans: FEATURE_PLAN_MAPPING[featureId] || [],
      userPlan: userSubscription?.planId,
      upgradeMessage: response.error?.message || 'Unable to check feature access',
    };
  };

  const hasFeatureAccess = async (featureId: FeatureId): Promise<boolean> => {
    const access = await checkFeatureAccess(featureId);
    return access.hasAccess;
  };

  const getAccessibleFeatures = async (): Promise<FeatureId[]> => {
    if (!user) {
      return [];
    }

    // Use mock API to get accessible features
    const response = await mockApiClient.getAccessibleFeatures(user.uid);

    if (response.success && response.data) {
      return response.data;
    }

    return [];
  };

  const getUpgradeSuggestions = async (featureIds: FeatureId[]): Promise<Partial<Record<FeatureId, { recommendedPlan: string; features: FeatureId[]; price: number; period: string }>>> => {
    if (!user) {
      // Return empty suggestions for all features if not authenticated
      const suggestions: Partial<Record<FeatureId, { recommendedPlan: string; features: FeatureId[]; price: number; period: string }>> = {};
      featureIds.forEach(featureId => {
        suggestions[featureId] = {
          recommendedPlan: 'month',
          features: [featureId],
          price: 39,
          period: 'month',
        };
      });
      return suggestions;
    }

    // Use mock API client for upgrade suggestions
    const response = await mockApiClient.getUpgradeSuggestions(user.uid, featureIds);

    if (response.success && response.data) {
      return response.data;
    }

    // Fallback to basic suggestions on API error
    const suggestions: Partial<Record<FeatureId, { recommendedPlan: string; features: FeatureId[]; price: number; period: string }>> = {};
    featureIds.forEach(featureId => {
      suggestions[featureId] = {
        recommendedPlan: 'month',
        features: [featureId],
        price: 39,
        period: 'month',
      };
    });
    return suggestions;
  };

  return {
    checkFeatureAccess,
    hasFeatureAccess,
    getAccessibleFeatures,
    getUpgradeSuggestions,
    userPlan: userSubscription?.planId,
    isSubscribed: userSubscription?.status === 'active',
  };
};