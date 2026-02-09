import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { QrCodeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface LocationState {
  planId: string;
  planName?: string;
  planPrice?: number;
  paymentMethod: string;
}

const AlipayPayment: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [isPaid, setIsPaid] = useState(false);
  const [orderNumber] = useState(`19-${Date.now().toString().slice(-6)}`);

  // Redirect if no plan selected
  React.useEffect(() => {
    if (!state?.planId) {
      navigate('/pricing');
    }
  }, [state, navigate]);

  // Simulate payment check (in real app, you'd poll your backend)
  useEffect(() => {
    // TODO: Replace with actual Alipay payment status check
    const timer = setTimeout(() => {
      // For demo purposes, auto-confirm after 5 seconds
      // In production, you'd check payment status via API
      // setIsPaid(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleManualConfirm = () => {
    // TODO: Replace with actual payment verification
    navigate('/payment/success', {
      state: {
        ...state,
        orderNumber: orderNumber,
        paymentMethod: 'Alipay'
      }
    });
  };

  // Generate QR code placeholder (in production, use actual Alipay QR)
  const qrCodeData = `alipay://payment?order=${orderNumber}&amount=${state.planPrice || 0}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {t('payment.alipayPayment', 'Alipay Payment')}
            </h1>
            <p className="text-lg text-slate-600">
              {t('payment.scanWithAlipay', 'Scan QR code with your Alipay app')}
            </p>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            {!isPaid ? (
              <div className="text-center">
                {/* QR Code */}
                <div className="mb-8">
                  <div className="inline-block p-6 bg-white border-4 border-slate-200 rounded-2xl">
                    {/* TODO: Replace with actual QR code library like 'qrcode.react' */}
                    <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <QrCodeIcon className="w-32 h-32 text-slate-400 mx-auto mb-4" />
                        <p className="text-sm text-slate-500">
                          {t('payment.qrCodePlaceholder', 'QR Code Here')}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {t('payment.integrateAlipay', '(Integrate Alipay SDK)')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-600">
                      {t('payment.orderNumber', 'Order Number')}:
                    </span>
                    <span className="font-semibold text-slate-900">
                      支付单号：{orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">
                      {t('payment.amount', 'Amount')}:
                    </span>
                    <span className="text-2xl font-bold text-teal-600">
                      ${state.planPrice || 0}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-left space-y-3 mb-6">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    {t('payment.howToPay', 'How to pay:')}
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                      1
                    </div>
                    <p className="text-slate-600">
                      {t('payment.step1', 'Open Alipay app on your phone')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                      2
                    </div>
                    <p className="text-slate-600">
                      {t('payment.step2', 'Tap "Scan" and scan this QR code')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm">
                      3
                    </div>
                    <p className="text-slate-600">
                      {t('payment.step3', 'Confirm payment in your app')}
                    </p>
                  </div>
                </div>

                {/* Demo Button (Remove in production) */}
                <div className="border-t border-slate-200 pt-6">
                  <p className="text-sm text-slate-500 mb-3">
                    {t('payment.demoMode', 'Demo Mode: Click below to simulate successful payment')}
                  </p>
                  <button
                    onClick={handleManualConfirm}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('payment.simulatePayment', 'Simulate Successful Payment')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {t('payment.paymentReceived', 'Payment Received!')}
                </h2>
                <p className="text-slate-600 mb-6">
                  {t('payment.redirecting', 'Redirecting...')}
                </p>
              </div>
            )}
          </div>

          {/* Back Link */}
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← {t('payment.back', 'Back')}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AlipayPayment;
