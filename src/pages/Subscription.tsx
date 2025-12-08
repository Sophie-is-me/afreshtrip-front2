// src/pages/Subscription.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import SubscriptionCard from '../components/SubscriptionCard';
import PaymentMethodSelection from '../components/PaymentMethodSelection';
import { useSubscription } from '../hooks/useSubscription';
import ErrorMessage from '../components/ErrorMessage';

const Subscription: React.FC = () => {
  const { t } = useTranslation();
  const {
    selectedPlanId,
    userSubscription,
    plans,
    isLoading,
    isUpdating,
    errorKey,
    successKey,
    showPaymentMethodSelection,
    pendingPlanId,
    handlePlanSelect,
    handlePlanUpdate,
    handlePaymentMethodSelect,
    closePaymentMethodSelection,
  } = useSubscription();

  const handleComparePlans = () => {
    // Handle comparison view
    console.log('Compare plans clicked');
  };

  if (errorKey) {
    return (
      <div className="min-h-screen bg-white">
        <Header showIconButtons showNavLinks={false} />
        <main className="px-8 py-8">
          <div className="max-w-6xl mx-auto">
            <ErrorMessage error={t(errorKey)} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header showIconButtons showNavLinks={false} />
      <main className="px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/profile" className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t('blog.back')}</span>
          </Link>
          
          <Breadcrumb
            items={[
              { label: t('profileNav.profile'), href: '/profile' },
              { label: t('profileNav.subscription') }
            ]}
            className="mb-6"
          />

          {successKey && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">{t(successKey)}</span>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('subscription.title')}</h1>
            <p className="text-lg text-gray-600">{t('subscription.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading && plans.length === 0 ? (
              // Show skeleton cards during initial loading
              [...Array(4)].map((_, index) => (
                <SubscriptionCard
                  key={`skeleton-${index}`}
                  plan={{
                    planId: `skeleton-${index}`,
                    planName: '',
                    price: 0,
                    durationDays: 0,
                    features: [],
                    featureNames: []
                  }}
                  isLoading={true}
                />
              ))
            ) : (
              plans.map((plan) => (
                <SubscriptionCard
                  key={plan.planId}
                  plan={plan}
                  isSelected={userSubscription?.planId === plan.planId}
                  isLoading={isUpdating && selectedPlanId === plan.planId}
                  onClick={() => handlePlanSelect(plan.planId)}
                  onButtonClick={() => handlePlanUpdate(plan.planId)}
                  onCompareClick={handleComparePlans}
                />
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Payment Method Selection Modal */}
      {showPaymentMethodSelection && pendingPlanId && (
        <PaymentMethodSelection
          plan={plans.find(p => p.planId === pendingPlanId)!}
          isOpen={showPaymentMethodSelection}
          onClose={closePaymentMethodSelection}
          onSelectPaymentMethod={(paymentMethod) => handlePaymentMethodSelect(pendingPlanId, paymentMethod)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

export default Subscription;