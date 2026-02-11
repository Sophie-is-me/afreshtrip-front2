import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

import Header from '../components/Header';
import Footer from '../components/Footer';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { createAlipayOrder, pollOrderStatus, getPlanDetails } from '../services/paymentApi';

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

  const [status, setStatus] = useState<'loading' | 'ready' | 'polling' | 'success' | 'error'>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [orderData, setOrderData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  
  // ✅ Prevent double initialization
  const initRef = useRef(false);

  // Redirect if no plan selected
  useEffect(() => {
    if (!state?.planId) {
      navigate('/pricing');
    }
  }, [state, navigate]);

  // ✅ Create order and get QR code from backend
  useEffect(() => {
    const initializePayment = async () => {
      if (!state?.planId || initRef.current) return;
      initRef.current = true;

      try {
        setStatus('loading');
        console.log('📱 Initializing Alipay payment...');
        console.log('Plan ID:', state.planId);

        // ✅ Call backend API to create order
        const order = await createAlipayOrder(state.planId);

        // ✅ Set real QR code URL from backend
        setQrCodeUrl(order.payQrCode);
        setOrderNumber(order.orderNo);
        setOrderData(order);
        setStatus('ready');

        console.log('✅ Payment initialized successfully');
        console.log('✅ Real QR Code URL:', order.payQrCode);

        // ✅ Start automatic polling (NO DEMO BUTTON)
        startPolling(order.orderNo);

      } catch (error: any) {
        console.error('❌ Failed to initialize payment:', error);
        setErrorMessage(error.message || 'Failed to create payment order');
        setStatus('error');
      }
    };

    initializePayment();
  }, [state?.planId]);

  // ✅ Real polling with backend
  const startPolling = async (orderNo: string) => {
    setStatus('polling');
    setPollingProgress(0);
    
    console.log('🔄 Starting automatic payment verification...');
    
    try {
      // Poll for 3 minutes (60 attempts × 3 seconds)
      const isPaid = await pollOrderStatus(orderNo, 60, 3000);

      if (isPaid) {
        console.log('✅ Payment confirmed by backend!');
        setStatus('success');
        
        // ✅ Pass real order data to success page
        setTimeout(() => {
          navigate('/payment/success', {
            state: {
              planId: state.planId,
              planName: getPlanDetails(state.planId).name,
              planPrice: orderData?.amount,
              paymentMethod: 'Alipay',
              orderNumber: orderNo,
              // ✅ Pass full backend order data
              orderData: orderData,
              vipTypeId: orderData?.vipTypeId,
              startTime: orderData?.startTime,
              endTime: orderData?.endTime
            }
          });
        }, 2000);
      } else {
        setErrorMessage(t('payment.error.paymentCancelled', 'Payment was cancelled or timed out'));
        setStatus('error');
      }
    } catch (error: any) {
      console.error('❌ Polling error:', error);
      setErrorMessage(error.message || 'Failed to verify payment');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    navigate(-1);
  };

  const handleCheckStatus = () => {
    navigate('/subscription');
  };

  const planDetails = getPlanDetails(state?.planId || 'month');

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
              {status === 'loading' 
                ? t('payment.preparingPayment', 'Preparing your payment...')
                : status === 'polling'
                ? t('payment.waitingForPayment', 'Waiting for payment confirmation...')
                : t('payment.scanWithAlipay', 'Scan QR code with your Alipay app')
              }
            </p>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            {/* LOADING STATE */}
            {status === 'loading' && (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
                </div>
                <p className="text-slate-600">
                  {t('payment.creatingOrder', 'Creating your order...')}
                </p>
              </div>
            )}

            {/* READY / POLLING STATE */}
            {(status === 'ready' || status === 'polling') && (
              <div className="text-center">
                {/* ✅ REAL QR CODE FROM BACKEND */}
                <div className="mb-8">
                  <div className="inline-block p-6 bg-white border-4 border-slate-200 rounded-2xl shadow-sm">
                    {qrCodeUrl ? (
                      <>
                        <QRCodeCanvas 
                          value={qrCodeUrl}
                          size={256}
                          level="H"
                          includeMargin={true}
                        
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          {t('payment.scanThisCode', 'Scan this code with Alipay')}
                        </p>
                      </>
                    ) : (
                      <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center">
                        <QrCodeIcon className="w-32 h-32 text-slate-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Polling Indicator */}
                  {status === 'polling' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-center gap-2 text-teal-600 mb-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm font-medium">
                          {t('payment.verifyingPayment', 'Verifying payment...')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-600">
                      {t('payment.orderNumber', 'Order Number')}:
                    </span>
                    <span className="font-semibold text-slate-900 font-mono text-sm">
                      {orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-600">
                      {t('payment.plan', 'Plan')}:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {planDetails.name}
                    </span>
                  </div>
                  {orderData && (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-600">
                          {t('payment.startDate', 'Start Date')}:
                        </span>
                        <span className="font-medium text-slate-700 text-sm">
                          {new Date(orderData.startTime).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-600">
                          {t('payment.endDate', 'End Date')}:
                        </span>
                        <span className="font-medium text-slate-700 text-sm">
                          {new Date(orderData.endTime).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-slate-600">
                      {t('payment.amount', 'Amount')}:
                    </span>
                    <span className="text-2xl font-bold text-teal-600">
                      ${orderData?.amount || planDetails.price}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-left space-y-3 mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      i
                    </span>
                    {t('payment.howToPay', 'How to pay:')}
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      1
                    </div>
                    <p className="text-slate-700">
                      {t('payment.step1', 'Open Alipay app on your phone')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      2
                    </div>
                    <p className="text-slate-700">
                      {t('payment.step2', 'Tap "Scan" and scan the QR code above')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      3
                    </div>
                    <p className="text-slate-700">
                      {t('payment.step3', 'Confirm payment in your Alipay app')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      4
                    </div>
                    <p className="text-slate-700">
                      {t('payment.step4', 'Wait for automatic confirmation (do not close this page)')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS STATE */}
            {status === 'success' && (
              <div className="text-center py-12">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {t('payment.paymentReceived', 'Payment Confirmed!')}
                </h2>
                <p className="text-slate-600 mb-6">
                  {t('payment.redirecting', 'Redirecting to confirmation page...')}
                </p>
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                </div>
              </div>
            )}

            {/* ERROR STATE */}
            {status === 'error' && (
              <div className="text-center py-12">
                <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {t('payment.error.title', 'Payment Error')}
                </h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {errorMessage}
                </p>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                  >
                    {t('payment.retry', 'Try Again')}
                  </button>
                  {orderNumber && (
                    <button
                      onClick={handleCheckStatus}
                      className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                    >
                      {t('payment.checkStatus', 'Check Order Status')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Back Link - Only show when not polling */}
          {status !== 'success' && status !== 'polling' && (
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← {t('payment.back', 'Back')}
            </button>
          )}

          {/* Warning - Don't close during polling */}
          {status === 'polling' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center font-medium">
                ⚠️ {t('payment.doNotClose', 'Please keep this page open while we verify your payment')}
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AlipayPayment;
