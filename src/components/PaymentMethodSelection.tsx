// src/components/PaymentMethodSelection.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SubscriptionPlan } from '../types/subscription';

interface PaymentMethodSelectionProps {
  plan: SubscriptionPlan;
  isOpen: boolean;
  onClose: () => void;
  onSelectPaymentMethod: (paymentMethod: 'alipay' | 'stripe') => void;
  isLoading?: boolean;
}

const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({
  plan,
  isOpen,
  onClose,
  onSelectPaymentMethod,
  isLoading = false
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handlePaymentMethodSelect = (paymentMethod: 'alipay' | 'stripe') => {
    onSelectPaymentMethod(paymentMethod);
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-gray-900/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 pr-8">
            {t('subscription.selectPaymentMethod')}
          </h2>
          <p className="text-gray-600">
            {t('subscription.selectedPlan')}: {plan.planName}
          </p>
          <p className="text-lg font-semibold text-teal-600 mt-2">
            ${plan.price} /{plan.durationDays === 7 ? 'week' : plan.durationDays === 30 ? 'month' : plan.durationDays === 90 ? 'quarter' : plan.durationDays === 365 ? 'year' : `${plan.durationDays} days`}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {/* Alipay Option */}
          <button
            onClick={() => handlePaymentMethodSelect('alipay')}
            disabled={isLoading}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.24c-.019.06-.048.088-.048.088s.213.665.855 1.212c.428.368 1.072.688 1.72.96.046.02.07.024.092.024.32 0 .58-.15.58-.588 0-.272-.117-.53-.117-.53l.213-.702s.023-.08.068-.134c.095-.1.21-.213.37-.375.15-.153.335-.315.564-.48.044-.033.11-.07.18-.113.07-.043.134-.086.203-.124.07-.037.14-.074.213-.11.074-.036.15-.073.224-.105.074-.033.15-.06.226-.09.077-.03.156-.053.234-.08.08-.027.16-.047.24-.07.08-.023.163-.04.244-.058.082-.018.166-.032.25-.045.083-.013.168-.02.252-.028.084-.008.168-.013.253-.013.085 0 .17.005.255.013.085.008.17.015.255.028.084.013.168.027.25.045.08.018.164.032.244.058.08.02.16.04.24.07.077.025.156.05.234.08.075.028.15.055.226.09.074.032.15.065.224.105.073.033.143.07.213.11.07.038.133.08.203.124.07.043.136.08.18.113.23.165.414.327.564.48.16.162.275.275.37.375.045.054.068.134.068.134l.213.702s-.117.258-.117.53c0 .438.26.588.58.588.022 0 .046-.005.092-.024.648-.272 1.292-.592 1.72-.96.642-.547.855-1.212.855-1.212s-.03-.028-.048-.088l-.39-1.24a.59.59 0 0 1 .213-.665C22.83 13.732 24 11.742 24 9.53c0-4.054-3.891-7.342-8.691-7.342H8.691z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{t('subscription.alipay')}</h3>
                  <p className="text-sm text-gray-600">{t('subscription.alipayDescription')}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {t('subscription.recommended')}
              </div>
            </div>
          </button>

          {/* Stripe Option */}
          <button
            onClick={() => handlePaymentMethodSelect('stripe')}
            disabled={isLoading}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.826-3.356-3.673 0-1.845 1.354-2.953 3.385-2.953 1.868 0 2.932.917 3.463 2.088h-.023v-2.177h4.221v.721c-.574 1.182-2.051 2.092-4.139 2.355v-.002zm-3.773 3.023c.263 0 .528-.036.792-.108 2.23-.72 3.15-1.88 3.15-3.507 0-2.015-1.269-3.03-3.133-3.03-1.927 0-3.028 1.013-3.06 3.03h6.998l-.028.18h-4.26v.432l-.234.036c-.108.024-.18.036-.252.036z"/>
                    <path d="M21.395 17.04c-.217.072-.432.107-.648.107-.18 0-.36-.036-.576-.108-1.8-.6-2.988-1.826-2.988-3.57 0-2.196 1.404-3.654 3.564-3.654.9 0 1.692.217 2.305.6v-3.062h4.261v10.686h-4.229v-2.98h-.041c-.3.6-.72 1.08-1.3 1.414-.252.144-.576.263-.9.263h-.428v3.063h4.23v.756c-1.188-.024-2.196-.504-3.017-1.27zm-5.69.648h-2.484v3.02h2.484c.84 0 1.416-.432 1.416-1.14 0-.72-.624-1.08-1.416-1.08z"/>
                    <circle cx="8" cy="16" r="1"/>
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{t('subscription.stripe')}</h3>
                  <p className="text-sm text-gray-600">{t('subscription.stripeDescription')}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {t('subscription.international')}
              </div>
            </div>
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <svg className="animate-spin h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="absolute inset-0 rounded-full border-2 border-teal-200"></div>
              </div>
              <span className="text-teal-600 font-medium text-sm">{t('subscription.processingPayment')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSelection;