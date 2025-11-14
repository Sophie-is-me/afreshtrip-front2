// src/services/mockApi.ts

/**
 * MOCK API SERVICE - Simulated Backend Responses
 *
 * This service simulates the backend API responses for development and testing.
 * It implements the same interfaces as the real backend services, making it
 * easy to replace with real API calls when the backend is ready.
 *
 * 🚨 MIGRATION NOTE: When backend is ready, replace this file's implementations
 * with real fetch() calls to your API endpoints. The interfaces and response
 * formats will remain the same.
 */

import type {
  BackendSubscriptionService,
  BackendFeatureService,
  SubscriptionUpdateResult,
  FeatureAccessResult,
  UpdateSubscriptionRequest,
} from '../types/backend';
import { FeatureId, FEATURE_PLAN_MAPPING, getUpgradePlan } from '../types/features';
import type { UserSubscription } from '../types/subscription';
import { mockUserSubscription } from '../types/subscription';
import type { TripSettings, Trip, Place, Weather, Route } from '../types/trip';

// Simulate network delay
const simulateDelay = (ms: number = 500) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Mock user database (in real backend, this would be in database)
const mockUserSubscriptions = new Map<string, UserSubscription>();

// Initialize with some test data
mockUserSubscriptions.set('user123', {
  ...mockUserSubscription,
  userId: 'user123',
  planId: 'week',
  status: 'active',
});

mockUserSubscriptions.set('premium_user', {
  ...mockUserSubscription,
  userId: 'premium_user',
  planId: 'year',
  status: 'active',
});

/**
 * Mock Subscription Service - Simulates BackendSubscriptionService
 */
export class MockSubscriptionService implements BackendSubscriptionService {
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    await simulateDelay();

    // Simulate different user scenarios
    if (userId === 'no_subscription') {
      return null; // User without subscription
    }

    if (userId === 'expired_user') {
      return {
        ...mockUserSubscription,
        userId,
        status: 'expired',
        endDate: new Date('2024-01-01'), // Past date
      };
    }

    // Return mock subscription or null
    return mockUserSubscriptions.get(userId) || null;
  }

  async updateSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string
  ): Promise<SubscriptionUpdateResult> {
    await simulateDelay(1000); // Simulate payment processing delay

    // Simulate payment failure for testing
    if (planId === 'fail_payment') {
      return {
        success: false,
        subscription: {} as UserSubscription,
        error: 'Payment method declined',
      };
    }

    // Simulate successful subscription update
    const updatedSubscription: UserSubscription = {
      id: `sub_${Date.now()}`,
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      autoRenew: true,
      paymentMethodId: paymentMethodId || 'pm_mock123',
    };

    // Update mock database
    mockUserSubscriptions.set(userId, updatedSubscription);

    return {
      success: true,
      subscription: updatedSubscription,
    };
  }

  async cancelSubscription(userId: string, reason?: string): Promise<void> {
    await simulateDelay();

    const subscription = mockUserSubscriptions.get(userId);
    if (!subscription) {
      throw new Error('No active subscription found');
    }
    console.log('Cancelling subscription:', subscription, "Reason: ", reason);


    // Mark for cancellation at period end
    const updatedSubscription: UserSubscription = {
      ...subscription,
      autoRenew: false,
    };

    mockUserSubscriptions.set(userId, updatedSubscription);
  }
}

/**
 * Mock Feature Service - Simulates BackendFeatureService
 */
export class MockFeatureService implements BackendFeatureService {
  async checkFeatureAccess(userId: string, featureId: FeatureId): Promise<FeatureAccessResult> {
    await simulateDelay(200); // Quick feature checks

    const subscription = await mockSubscriptionService.getUserSubscription(userId);
    const requiredPlans = FEATURE_PLAN_MAPPING[featureId];

    if (!requiredPlans) {
      return {
        hasAccess: false,
        featureId,
        requiredPlans: [],
      };
    }

    if (!subscription || subscription.status !== 'active') {
      return {
        hasAccess: false,
        featureId,
        requiredPlans,
        userPlan: subscription?.planId,
      };
    }

    const userPlanId = subscription.planId;
    const hasAccess = requiredPlans.includes(userPlanId);

    if (hasAccess) {
      return {
        hasAccess: true,
        featureId,
        requiredPlans,
        userPlan: userPlanId,
      };
    }

    // Find upgrade suggestion
    const upgradePlan = getUpgradePlan(userPlanId, requiredPlans);

    return {
      hasAccess: false,
      featureId,
      requiredPlans,
      userPlan: userPlanId,
      upgradeSuggestion: upgradePlan ? {
        recommendedPlan: upgradePlan,
        features: [featureId],
        price: 0, // Mock price
        period: 'month',
      } : undefined,
    };
  }

  async getUserAccessibleFeatures(userId: string): Promise<FeatureId[]> {
    await simulateDelay();

    const subscription = await mockSubscriptionService.getUserSubscription(userId);

    if (!subscription || subscription.status !== 'active') {
      return [];
    }

    return Object.entries(FEATURE_PLAN_MAPPING)
      .filter(([, plans]) => plans.includes(subscription.planId))
      .map(([featureId]) => featureId as FeatureId);
  }

  async getUpgradeSuggestions(
    userId: string,
    featureIds: FeatureId[]
  ): Promise<Record<FeatureId, { recommendedPlan: string; features: FeatureId[]; price: number; period: string }>> {
    await simulateDelay();

    const subscription = await mockSubscriptionService.getUserSubscription(userId);
    const suggestions = {} as Record<FeatureId, { recommendedPlan: string; features: FeatureId[]; price: number; period: string }>;

    if (!subscription || subscription.status !== 'active') {
      // Return empty suggestions for all features
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

    featureIds.forEach(featureId => {
      const requiredPlans = FEATURE_PLAN_MAPPING[featureId];
      const upgradePlan = getUpgradePlan(subscription.planId, requiredPlans);

      suggestions[featureId] = upgradePlan ? {
        recommendedPlan: upgradePlan,
        features: [featureId],
        price: upgradePlan === 'month' ? 39 : upgradePlan === 'season' ? 89 : 199,
        period: 'month',
      } : {
        recommendedPlan: 'month',
        features: [featureId],
        price: 39,
        period: 'month',
      };
    });

    return suggestions;
  }
}

// Create singleton instances (in real app, these would be injected)
export const mockSubscriptionService = new MockSubscriptionService();
export const mockFeatureService = new MockFeatureService();

/**
 * MOCK API CLIENT - Simulates HTTP requests
 *
 * This simulates the API client that would make real HTTP requests.
 * When backend is ready, replace the implementations with fetch() calls.
 */
export class MockApiClient {
  private subscriptionService = mockSubscriptionService;
  private featureService = mockFeatureService;

  // Simulate GET /api/subscriptions/me
  async getSubscription(userId: string) {
    try {
      const subscription = await this.subscriptionService.getUserSubscription(userId);
      return {
        success: true,
        data: subscription,
      };
    } catch {
      return {
        success: false,
        error: { message: 'Failed to fetch subscription' },
      };
    }
  }

  // Simulate POST /api/subscriptions/update
  async updateSubscription(userId: string, request: UpdateSubscriptionRequest) {
    try {
      const result = await this.subscriptionService.updateSubscription(
        userId,
        request.planId,
        request.paymentMethodId
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Failed to update subscription' },
      };
    }
  }

  // Simulate POST /api/subscriptions/cancel
  async cancelSubscription(userId: string, reason?: string) {
    try {
      await this.subscriptionService.cancelSubscription(userId, reason);
      return {
        success: true,
        message: 'Subscription cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      };
    }
  }

  // Simulate GET /api/features/:featureId/access
  async checkFeatureAccess(userId: string, featureId: FeatureId) {
    try {
      const result = await this.featureService.checkFeatureAccess(userId, featureId);
      return {
        success: true,
        data: result,
      };
    } catch {
      return {
        success: false,
        error: { message: 'Failed to check feature access' },
      };
    }
  }

  // Simulate GET /api/features/accessible
  async getAccessibleFeatures(userId: string) {
    try {
      const features = await this.featureService.getUserAccessibleFeatures(userId);
      return {
        success: true,
        data: features,
      };
    } catch {
      return {
        success: false,
        error: { message: 'Failed to fetch accessible features' },
      };
    }
  }

  // Simulate GET /api/features/upgrade-suggestions
  async getUpgradeSuggestions(userId: string, featureIds: FeatureId[]) {
    try {
      const suggestions = await this.featureService.getUpgradeSuggestions(userId, featureIds);
      return {
        success: true,
        data: suggestions,
      };
    } catch {
      return {
        success: false,
        error: { message: 'Failed to fetch upgrade suggestions' },
      };
    }
  }

  // Trip-related mock services
  async generateTrip(settings: TripSettings): Promise<Trip> {
    await simulateDelay();
    const mockPlaces: Place[] = [
      { id: '1', name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, description: 'Iconic tower in Paris', category: 'attraction' },
      { id: '2', name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, description: 'World-famous art museum', category: 'museum' },
    ];
    const mockRoute: Route = {
      waypoints: [{ lat: 48.8584, lng: 2.2945 }, { lat: 48.8606, lng: 2.3376 }],
      distance: 5.2,
      duration: 25,
    };
    const mockWeather: Weather = {
      location: settings.destination,
      temperature: 18,
      condition: 'Partly cloudy',
      humidity: 55,
      forecast: [
        { date: new Date().toISOString().split('T')[0], temp: 18, condition: 'Partly cloudy' },
        { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], temp: 20, condition: 'Sunny' },
      ],
    };
    return {
      id: 'trip_' + Date.now(),
      settings,
      places: mockPlaces,
      route: mockRoute,
      weather: mockWeather,
      createdAt: new Date(),
    };
  }

  async getPlaces(): Promise<Place[]> {
    await simulateDelay();
    return [
      { id: '1', name: 'Central Park', lat: 40.7829, lng: -73.9654, description: 'Large public park in NYC', category: 'park' },
      { id: '2', name: 'Times Square', lat: 40.7580, lng: -73.9855, description: 'Bustling commercial intersection', category: 'attraction' },
      { id: '3', name: 'Statue of Liberty', lat: 40.6892, lng: -74.0445, description: 'Iconic statue and museum', category: 'attraction' },
    ];
  }

  async getWeather(location: string): Promise<Weather> {
    await simulateDelay();
    return {
      location,
      temperature: 22,
      condition: 'Sunny',
      humidity: 60,
      forecast: [
        { date: new Date().toISOString().split('T')[0], temp: 22, condition: 'Sunny' },
        { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], temp: 24, condition: 'Clear' },
        { date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], temp: 20, condition: 'Cloudy' },
      ],
    };
  }

  async getRoute(waypoints: { lat: number; lng: number }[]): Promise<Route> {
    await simulateDelay();
    const distance = waypoints.length > 1 ? waypoints.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return acc;
      const prev = arr[idx - 1];
      // Simple distance calculation (not accurate, just mock)
      const dist = Math.sqrt((curr.lat - prev.lat) ** 2 + (curr.lng - prev.lng) ** 2) * 111; // rough km
      return acc + dist;
    }, 0) : 0;
    return {
      waypoints,
      distance: Math.round(distance * 10) / 10,
      duration: Math.round(distance * 2), // assume 30 km/h average
    };
  }
}

// Export singleton API client
export const mockApiClient = new MockApiClient();

/**
 * MIGRATION INSTRUCTIONS
 * ======================
 *
 * When your real backend is ready, replace this file with:
 *
 * ```typescript
 * // src/services/apiClient.ts
 * import { BackendSubscriptionService, BackendFeatureService } from '../types/backend';
 *
 * export class RealApiClient {
 *   async getSubscription(userId: string) {
 *     const response = await fetch(`/api/subscriptions/me`, {
 *       headers: { Authorization: `Bearer ${token}` },
 *     });
 *     return response.json();
 *   }
 *
 *   async updateSubscription(userId: string, request: UpdateSubscriptionRequest) {
 *     const response = await fetch(`/api/subscriptions/update`, {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         Authorization: `Bearer ${token}`,
 *       },
 *       body: JSON.stringify(request),
 *     });
 *     return response.json();
 *   }
 *
 *   // ... implement all other methods
 * }
 *
 * export const apiClient = new RealApiClient();
 * ```
 *
 * Then update the imports in your hooks from `mockApiClient` to `apiClient`.
 */