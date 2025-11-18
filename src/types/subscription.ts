// src/types/subscription.ts
import { FeatureId } from './features';

export interface Feature {
  id: FeatureId;
  nameKey: string;
  included: boolean;
  description?: string;
}

export interface SubscriptionPlan {
  id: string;
  nameKey: string;
  price: number;
  periodKey: string;
  originalPrice?: number;
  discount?: number;
  features: Feature[];
  isPopular?: boolean;
  isBestValue?: boolean;
  isDisabled?: boolean;
  badgeTextKey?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentMethodId?: string;
}

export interface SubscriptionData {
  plans: SubscriptionPlan[];
  userSubscription?: UserSubscription;
}

// for testing the UI
export const subscriptionPlansData: SubscriptionData = {
  plans: [
    {
      id: 'week',
      nameKey: 'subscriptionCard.plans.week.name',
      price: 19,
      periodKey: 'subscriptionCard.plans.week.period',
      features: [
        { id: FeatureId.BASIC_TRIP_PLANNING, nameKey: 'subscriptionCard.features.basicTripPlanning', included: true },
        { id: FeatureId.LIMITED_DESTINATIONS, nameKey: 'subscriptionCard.features.limitedDestinations', included: true },
        { id: FeatureId.EMAIL_SUPPORT, nameKey: 'subscriptionCard.features.emailSupport', included: true },
        { id: FeatureId.MOBILE_APP_ACCESS, nameKey: 'subscriptionCard.features.mobileAppAccess', included: false },
      ]
    },
    {
      id: 'month',
      nameKey: 'subscriptionCard.plans.month.name',
      price: 39,
      periodKey: 'subscriptionCard.plans.month.period',
      features: [
        { id: FeatureId.ADVANCED_TRIP_PLANNING, nameKey: 'subscriptionCard.features.advancedTripPlanning', included: true },
        { id: FeatureId.UNLIMITED_DESTINATIONS, nameKey: 'subscriptionCard.features.unlimitedDestinations', included: true },
        { id: FeatureId.PRIORITY_EMAIL_SUPPORT, nameKey: 'subscriptionCard.features.priorityEmailSupport', included: true },
        { id: FeatureId.MOBILE_APP_ACCESS, nameKey: 'subscriptionCard.features.mobileAppAccess', included: true },
      ],
      isPopular: true
    },
    {
      id: 'season',
      nameKey: 'subscriptionCard.plans.season.name',
      price: 89,
      periodKey: 'subscriptionCard.plans.season.period',
      originalPrice: 99,
      discount: 10,
      features: [
        { id: FeatureId.PREMIUM_TRIP_PLANNING, nameKey: 'subscriptionCard.features.premiumTripPlanning', included: true },
        { id: FeatureId.VIP_DESTINATIONS, nameKey: 'subscriptionCard.features.vipDestinations', included: true },
        { id: FeatureId.PHONE_SUPPORT, nameKey: 'subscriptionCard.features.phoneSupport', included: true },
        { id: FeatureId.MOBILE_APP_ACCESS, nameKey: 'subscriptionCard.features.mobileAppAccess', included: true },
      ],
      isBestValue: true
    },
    {
      id: 'year',
      nameKey: 'subscriptionCard.plans.year.name',
      price: 199,
      periodKey: 'subscriptionCard.plans.year.period',
      originalPrice: 249,
      discount: 20,
      features: [
        { id: FeatureId.ULTIMATE_TRIP_PLANNING, nameKey: 'subscriptionCard.features.ultimateTripPlanning', included: true },
        { id: FeatureId.EXCLUSIVE_DESTINATIONS, nameKey: 'subscriptionCard.features.exclusiveDestinations', included: true },
        { id: FeatureId.DEDICATED_CONCIERGE, nameKey: 'subscriptionCard.features.dedicatedConcierge', included: true },
        { id: FeatureId.MOBILE_APP_ACCESS, nameKey: 'subscriptionCard.features.mobileAppAccess', included: true },
      ],
      badgeTextKey: 'subscriptionCard.plans.year.badgeText'
    },
  ]
};

// Mock user subscription for testing
export const mockUserSubscription: UserSubscription = {
  id: 'sub_123',
  userId: 'user_123', // This will be replaced with actual user ID
  planId: 'week',
  status: 'active',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  autoRenew: true,
};