// src/services/api/featureService.ts

import { HttpClient } from './httpClient';
import type {
  BackendFeatureService,
  FeatureAccessResult,
  UpgradeSuggestion
} from '../../types/backend';
import { FeatureId, FEATURE_REGISTRY } from '../../types/features';
import type { ResultFeatureList, ResultFeatureAccess, ResultUpgradeSuggestions, SubscriptionPlanResponse, ResultSubscriptionPlans } from '../../types/api';
import i18n from '../../i18n';

/**
 * Feature service implementing BackendFeatureService interface
 */
export class FeatureService extends HttpClient implements BackendFeatureService {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Check if user has access to a specific feature
   * Now uses the dedicated backend feature access API
   */
  async checkFeatureAccess(_userId: string, featureId: FeatureId): Promise<FeatureAccessResult> {
    try {
      // Use the new backend feature access endpoint
      const response = await this.get<ResultFeatureAccess>(`/api/v1/features/${featureId}/access`);

      const data = response.data;

      return {
        hasAccess: data.hasAccess,
        featureId,
        requiredPlans: data.requiredPlans,
        upgradeMessage: data.upgradeMessage,
        userPlan: undefined, // Backend doesn't provide this in this endpoint
      };
    } catch (error) {
      console.error('Error checking feature access:', error);
      const feature = FEATURE_REGISTRY[featureId];
      const featureName = feature?.name || 'This feature';
      return {
        hasAccess: false,
        featureId,
        requiredPlans: [],
        upgradeMessage: `Unable to verify access to ${featureName.toLowerCase()}. Please try again later or contact support if the problem persists.`,
      };
    }
  }

  /**
   * Get all features accessible to a user
   * NEW: Calls the dedicated server-side validation endpoint
   * Endpoint: GET /api/v1/users/{id}/features
   */
  async getUserAccessibleFeatures(userId: string): Promise<FeatureId[]> {
    try {
      const response = await this.get<ResultFeatureList>(`/api/v1/users/${userId}/features`);
      
      // The backend returns string keys. We cast them to FeatureId type.
      return response.data as FeatureId[];
    } catch (error) {
      console.error('Error getting accessible features:', error);
      return [];
    }
  }

  /**
   * Get upgrade suggestions for inaccessible features
   * Now uses the dedicated backend upgrade suggestions API
   */
  async getUpgradeSuggestions(
    _userId: string,
    featureIds: FeatureId[]
  ): Promise<Partial<Record<FeatureId, UpgradeSuggestion>>> {
    try {
      // Use the new backend upgrade suggestions endpoint
      const response = await this.post<ResultUpgradeSuggestions>('/api/v1/features/upgrade-suggestions', {
        featureIds
      });

      const data = response.data;

      // Convert backend response format to frontend format
      const suggestions: Partial<Record<FeatureId, UpgradeSuggestion>> = {};
      Object.entries(data).forEach(([featureId, suggestion]) => {
        suggestions[featureId as FeatureId] = {
          recommendedPlan: suggestion.recommendedPlan,
          features: suggestion.features as FeatureId[],
          price: suggestion.price,
          period: suggestion.period,
        };
      });

      return suggestions;
    } catch (error) {
      console.error('Error getting upgrade suggestions:', error);
      // Return default suggestions on error
      const suggestions: Partial<Record<FeatureId, UpgradeSuggestion>> = {};
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
  }

  /**
   * Get all subscription plans with their features
   * Uses the dedicated backend subscription plans API
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlanResponse[]> {
    try {
      const currentLang = i18n.language || 'en';
      const response = await this.get<ResultSubscriptionPlans>(`/api/v1/features/subscription-plans?lang=${currentLang}`, {
        requiresAuth: false
      });
      return response.data;
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      return [];
    }
  }
}