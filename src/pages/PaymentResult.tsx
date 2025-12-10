import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import { unifiedSubscriptionService } from '../services/subscription/UnifiedSubscriptionService';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { i18nErrorHandler } from '../utils/i18nErrorHandler';

const PaymentResult: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUserProfile } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { showSuccess } = useSnackbar();
  
  // Prevent double-firing in strict mode
  const processingRef = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const orderNo = searchParams.get('orderNo');
      const outTradeNo = searchParams.get('out_trade_no'); // Alipay sometimes uses this param name
      
      const transactionId = orderNo || outTradeNo;

      if (!transactionId) {
        i18nErrorHandler.showErrorToUser(
          new Error('No order number found'),
          { component: 'PaymentResult', action: 'verifyPayment' },
          [
            {
              label: t('common.retry'),
              onClick: () => window.location.reload(),
              style: 'primary'
            }
          ],
          t.bind(t)
        );
        setStatus('error');
        return;
      }

      if (!user) {
        // If user is not logged in (session lost during redirect), redirect to login
        // In a real app, you might store the orderNo in local storage and check after login
        i18nErrorHandler.showErrorToUser(
          new Error('Please log in to verify payment'),
          { component: 'PaymentResult', action: 'verifyPayment' },
          [
            {
              label: t('common.login'),
              onClick: () => navigate('/login'),
              style: 'primary'
            }
          ],
          t.bind(t)
        );
        setStatus('error');
        return;
      }

      if (processingRef.current) return;
      processingRef.current = true;

      try {
        // Start polling the backend using the new unified payment system
        const result = await unifiedSubscriptionService.handlePaymentReturn(user.uid, transactionId);

        if (result.success) {
          setStatus('success');
          // Refresh the global user profile/auth context so the UI updates immediately
          await refreshUserProfile();
          showSuccess(t('payment.success.title', 'Payment Successful!')); 
        } else {
          i18nErrorHandler.showErrorToUser(
            new Error(result.error || 'Payment verification failed'),
            { component: 'PaymentResult', action: 'verifyPayment' },
            [
              {
                label: t('common.retry'),
                onClick: () => window.location.reload(),
                style: 'primary'
              }
            ],
            t.bind(t)
          );
          setStatus('error');
        }
      } catch (err) {
        console.error(err);
        i18nErrorHandler.showErrorToUser(
          err,
          { component: 'PaymentResult', action: 'verifyPayment' },
          [
            {
              label: t('common.retry'),
              onClick: () => window.location.reload(),
              style: 'primary'
            }
          ],
          t.bind(t)
        );
        setStatus('error');
      }
    };

    if (user) {
      verifyPayment();
    }
  }, [searchParams, user, t, refreshUserProfile]);

  const handleContinue = () => {
    // Redirect to the blog editor or dashboard
    navigate('/blog-editor?new=true'); 
  };

  const handleRetry = () => {
    navigate('/subscription');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
        
        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="py-12 flex flex-col items-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-gray-900">
              {t('payment.verifying', 'Verifying Payment...')}
            </h2>
            <p className="mt-2 text-gray-500">
              {t('payment.waitMessage', 'Please wait while we confirm your transaction.')}
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div className="py-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
              <FiCheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('payment.success.title', 'Payment Successful!')}
            </h2>
            <p className="mt-2 text-gray-600 mb-8">
              {t('payment.success.message', 'Your subscription is now active. You have full access to all premium features.')}
            </p>
            <button
              onClick={handleContinue}
              className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              {t('payment.continue', 'Start Creating')} <FiArrowRight />
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="py-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
              <FiXCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('payment.failed.title', 'Payment Failed')}
            </h2>
            <p className="mt-2 text-gray-600 mb-8">
              {t('payment.error.verificationFailed', 'Payment verification failed. Please try again or contact support.')}
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleRetry}
                className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                {t('payment.retry', 'Try Again')}
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-full transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;