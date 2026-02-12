// src/components/profile/SubscriptionTab.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useSubscription } from '../../hooks/useSubscription';

const SubscriptionTab: React.FC = () => {
  const { t } = useTranslation();
  const { plans, currentPlan, isUpdating, selectPlan } = useSubscription();

  const subscriptionPlans = [
    {
      id: 'week',
      name: t('trips.week') || 'Week',
      price: '$19',
      duration: t('trips.perWeek') || 'per week',
      isCurrent: currentPlan?.id === 'week'
    },
    {
      id: 'month',
      name: t('trips.month') || 'Month',
      price: '$39',
      duration: t('trips.perMonth') || 'per month',
      isCurrent: currentPlan?.id === 'month'
    },
    {
      id: 'season',
      name: t('trips.season') || 'Season',
      price: '$89',
      duration: t('trips.perSeason') || 'per season',
      isCurrent: currentPlan?.id === 'season'
    },
    {
      id: 'year',
      name: t('trips.year') || 'Year',
      price: '$199',
      duration: t('trips.perYear') || 'per year',
      isCurrent: currentPlan?.id === 'year'
    }
  ];

  const handleSelectPlan = (planId: string) => {
    if (selectPlan) {
      selectPlan(planId);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        {t('trips.choosePlan') || 'Choose Your Subscription Plan'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border-2 p-6 transition-all ${
              plan.isCurrent
                ? 'border-teal-600 bg-teal-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-md'
            }`}
          >
            {/* Current Plan Badge */}
            {plan.isCurrent && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-teal-600 text-white text-xs font-bold rounded-full">
                {t('trips.youAreHere') || 'You are here!'}
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
              {plan.name}
            </h3>

            {/* Price */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {plan.price}
              </div>
              <div className="text-sm text-gray-500">
                {plan.duration}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckIcon className="w-5 h-5 text-teal-600" />
                {t('subscription.feature1') || 'Unlimited access'}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckIcon className="w-5 h-5 text-teal-600" />
                {t('subscription.feature2') || 'Priority support'}
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <CheckIcon className="w-5 h-5 text-teal-600" />
                {t('subscription.feature3') || 'Exclusive deals'}
              </li>
            </ul>

            {/* Action Button */}
            <button
              onClick={() => handleSelectPlan(plan.id)}
              disabled={plan.isCurrent || isUpdating}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                plan.isCurrent
                  ? 'bg-gray-800 text-white cursor-default'
                  : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'
              }`}
            >
              {plan.isCurrent
                ? t('trips.currentPlan') || 'Current Plan'
                : t('trips.upgrade') || 'Update'}
            </button>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-12 p-6 bg-gray-50 rounded-xl max-w-3xl mx-auto">
        <h3 className="font-semibold text-gray-900 mb-2">
          {t('subscription.infoTitle') || 'Subscription Information'}
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• {t('subscription.info1') || 'All plans include access to premium features'}</li>
          <li>• {t('subscription.info2') || 'Cancel anytime without any penalties'}</li>
          <li>• {t('subscription.info3') || 'Automatic renewal unless cancelled'}</li>
          <li>• {t('subscription.info4') || 'Secure payment processing'}</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionTab;
