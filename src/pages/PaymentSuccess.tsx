import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ClockIcon, CreditCardIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface LocationState {
  planId: string;
  planName?: string;
  planPrice?: number;
  paymentMethod: string;
  orderNumber: string;
}

const PaymentSuccess: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // Redirect if accessed directly without payment
  React.useEffect(() => {
    if (!state?.orderNumber) {
      navigate('/pricing');
    }
  }, [state, navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleViewOrders = () => {
    navigate('/subscription');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Header />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
              <CheckCircleIcon className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {t('payment.success.title', 'Your Order Successfully Created')}
            </h1>
            <p className="text-lg text-slate-600">
              {t('payment.success.subtitle', 'Thank you for your purchase! Your subscription is now active.')}
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              {t('payment.success.orderDetails', 'Order Details')}
            </h2>

            <div className="space-y-4">
              {/* Order Number */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-teal-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">
                    {t('payment.success.orderNumber', 'Order Number')}
                  </p>
                  <p className="font-semibold text-slate-900">
                    #{state?.orderNumber || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-teal-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">
                    {t('payment.success.paymentMethod', 'Payment Method')}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {state?.paymentMethod || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <ClockIcon className="w-6 h-6 text-teal-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">
                    {t('payment.success.date', 'Date')}
                  </p>
                  <p className="font-semibold text-slate-900">
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Amount */}
              {state?.planPrice && (
                <div className="flex items-center justify-between p-4 bg-teal-50 border-2 border-teal-200 rounded-lg">
                  <p className="text-slate-700 font-medium">
                    {t('payment.success.total', 'Total Amount')}
                  </p>
                  <p className="text-2xl font-bold text-teal-600">
                    ${state.planPrice}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">
              {t('payment.success.whatsNext', "What's Next?")}
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('payment.success.step1', 'A confirmation email has been sent to your inbox')}</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('payment.success.step2', 'Your subscription is now active and ready to use')}</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('payment.success.step3', 'Access all premium features from your dashboard')}</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoToDashboard}
              className="w-full py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-all shadow-lg"
            >
              {t('payment.success.goToDashboard', 'Go to Dashboard')}
            </button>

            <button
              onClick={handleViewOrders}
              className="w-full py-4 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              {t('payment.success.viewSubscription', 'View Subscription Details')}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 text-slate-600 hover:text-slate-900 transition-colors"
            >
              {t('payment.success.backToHome', 'Back to Home')}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
