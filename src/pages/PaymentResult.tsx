import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

const PaymentResult: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUserProfile } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Prevent double-firing in strict mode
  const processingRef = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const orderNo = searchParams.get('orderNo');
      const outTradeNo = searchParams.get('out_trade_no'); // Alipay sometimes uses this param name
      
      const transactionId = orderNo || outTradeNo;

      if (!transactionId) {
        setStatus('error');
        setErrorMessage(t('payment.error.noOrderNo', 'No order number found.'));
        return;
      }

      if (!user) {
        // If user is not logged in (session lost during redirect), redirect to login
        // In a real app, you might store the orderNo in local storage and check after login
        setStatus('error');
        setErrorMessage(t('payment.error.loginRequired', 'Please log in to verify payment.'));
        return;
      }

      if (processingRef.current) return;
      processingRef.current = true;

      try {
        // Start polling the backend
        const result = await subscriptionService.handlePaymentReturn(user.uid, transactionId);

        if (result.success) {
          setStatus('success');
          // Refresh the global user profile/auth context so the UI updates immediately
          await refreshUserProfile(); 
        } else {
          setStatus('error');
          setErrorMessage(result.error || t('payment.error.verificationFailed', 'Payment verification failed.'));
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setErrorMessage(t('payment.error.generic', 'An unexpected error occurred.'));
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
              {errorMessage}
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