// src/types/subscription.ts
import { FeatureId } from './features';

export interface Feature {
  id: FeatureId;
  name: string;
  included: boolean;
  description?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  originalPrice?: number;
  discount?: number;
  features: Feature[];
  isPopular?: boolean;
  isBestValue?: boolean;
  isDisabled?: boolean;
  badgeText?: string;
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
      name: 'Week',
      price: 19,
      period: 'Per week',
      features: [
        { id: FeatureId.BASIC_TRIP_PLANNING, name: 'Basic trip planning', included: true },
        { id: FeatureId.LIMITED_DESTINATIONS, name: 'Limited destinations', included: true },
        { id: FeatureId.EMAIL_SUPPORT, name: 'Email support', included: true },
        { id: FeatureId.MOBILE_APP_ACCESS, name: 'Mobile app access', included: false },
      ]
    },
    {
      id: 'month',
      name: 'Month',
      price: 39,
      period: 'Per month',
      features: [
        { id: FeatureId.ADVANCED_TRIP_PLANNING, name: 'Advanced trip planning', included: true },
        { id: FeatureId.UNLIMITED_DESTINATIONS, name: 'Unlimited destinations', included: true },
        { id: FeatureId.PRIORITY_EMAIL_SUPPORT, name: 'Priority email support', included: true },
        { id: FeatureId.MOBILE_APP_ACCESS, name: 'Mobile app access', included: true },
      ],
      isPopular: true
    },
    {
      id: 'season',
      name: 'Season',
      price: 89,
      period: 'Per month',
      originalPrice: 99,
      discount: 10,
      features: [
        { id: FeatureId.PREMIUM_TRIP_PLANNING, name: 'Premium trip planning', included: true },
        { id: FeatureId.VIP_DESTINATIONS, name: 'VIP destinations access', included: true },
        { id: FeatureId.PHONE_SUPPORT, name: '24/7 phone support', included: true },
        { id: FeatureId.MOBILE_APP_ACCESS, name: 'Mobile app access', included: true },
      ],
      isBestValue: true
    },
    {
      id: 'year',
      name: 'Year',
      price: 199,
      period: 'Per month',
      originalPrice: 249,
      discount: 20,
      features: [
        { id: FeatureId.ULTIMATE_TRIP_PLANNING, name: 'Ultimate trip planning', included: true },
        { id: FeatureId.EXCLUSIVE_DESTINATIONS, name: 'Exclusive destinations', included: true },
        { id: FeatureId.DEDICATED_CONCIERGE, name: 'Dedicated concierge', included: true },
        { id: FeatureId.MOBILE_APP_ACCESS, name: 'Mobile app access', included: true },
      ],
      badgeText: 'Most Popular'
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