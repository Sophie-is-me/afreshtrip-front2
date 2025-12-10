// src/components/AlipayPaymentWindow.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AlipayPaymentWindowProps {
  paymentHtml?: string; // Made optional for new unified flow
  orderNo?: string; // Made optional
  onClose: () => void;
  onPaymentComplete: (success: boolean, orderNo: string) => void;
  className?: string;
  // New unified payment response
  paymentResponse?: {
    success: boolean;
    orderNo: string;
    paymentMethod: 'ALIPAY' | 'STRIPE';
    paymentHtml?: string;
    clientSecret?: string;
    errorMessage?: string;
  };
}

const AlipayPaymentWindow: React.FC<AlipayPaymentWindowProps> = ({
  paymentHtml: propPaymentHtml,
  orderNo: propOrderNo,
  onClose,
  onPaymentComplete,
  className = '',
  paymentResponse
}) => {
  // Use paymentResponse if available, fallback to props
  const paymentHtml = paymentResponse?.paymentHtml || propPaymentHtml;
  const orderNo = paymentResponse?.orderNo || propOrderNo;
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [checkInterval, setCheckInterval] = useState<number | null>(null);

  useEffect(() => {
    if (!paymentHtml) return;

    // Open Alipay payment in a new window
    const openPaymentWindow = () => {
      const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (newWindow) {
        // Wrap the HTML content in a proper document structure
        const fullHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Alipay Payment</title>
              <style>
                body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .loading { text-align: center; padding: 50px; color: #666; }
              </style>
            </head>
            <body>
              <div class="loading">Processing payment...</div>
              ${paymentHtml}
            </body>
          </html>
        `;
        
        // Write the wrapped HTML content to the new window
        newWindow.document.write(fullHtml);
        newWindow.document.close();
        
        setPaymentWindow(newWindow);
        setIsLoading(false);

        // Monitor window close and check payment status
        const interval = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(interval);
            setCheckInterval(null);
            handlePaymentReturn();
          }
        }, 1000);

        setCheckInterval(interval);
      } else {
        // Popup blocked - use iframe fallback
        setIsLoading(false);
        console.warn('Popup blocked, using iframe fallback');
      }
    };

    openPaymentWindow();

    // Cleanup function
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentHtml]);

  const handlePaymentReturn = async () => {
    const orderNoToUse = orderNo || paymentResponse?.orderNo || 'unknown';
    try {
      // Call the payment completion callback
      onPaymentComplete(true, orderNoToUse);
    } catch (error) {
      console.error('Error handling payment return:', error);
      onPaymentComplete(false, orderNoToUse);
    } finally {
      onClose();
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleClose = () => {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    onClose();
  };

  // If popup was blocked, show iframe fallback
  if (isLoading && !paymentWindow) {
    return (
      <div className={`fixed inset-0 backdrop-blur-sm bg-gray-900/60 flex items-center justify-center z-50 p-4 ${className}`}>
        <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {t('subscription.alipayPayment')}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-center mb-4">
            <p className="text-gray-600">
              {t('subscription.paymentWindowBlocked')}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t('subscription.iframeFallbackNotice')}
            </p>
          </div>

          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <svg className="animate-spin h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div className="absolute inset-0 rounded-full border-2 border-teal-200"></div>
                  </div>
                  <span className="text-teal-600 font-medium text-sm">
                    {t('subscription.loadingPayment')}
                  </span>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              srcDoc={paymentHtml}
              style={{ width: '100%', height: '600px', border: 'none' }}
              title="Alipay Payment"
              onLoad={handleIframeLoad}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main payment window modal
  return (
    <div className={`fixed inset-0 backdrop-blur-sm bg-gray-900/60 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.24c-.019.06-.048.088-.048.088s.213.665.855 1.212c.428.368 1.072.688 1.72.96.046.02.07.024.092.024.32 0 .58-.15.58-.588 0-.272-.117-.53-.117-.53l.213-.702s.023-.08.068-.134c.095-.1.21-.213.37-.375.15-.153.335-.315.564-.48.044-.033.11-.07.18-.113.07-.043.134-.086.203-.124.07-.037.14-.074.213-.11.074-.036.15-.073.224-.105.074-.033.15-.06.226-.09.077-.03.156-.053.234-.08.08-.027.16-.047.24-.07.08-.023.163-.04.244-.058.082-.018.166-.032.25-.045.083-.013.168-.02.252-.028.084-.008.168-.013.253-.013.085 0 .17.005.255.013.085.008.17.015.255.028.084.013.168.027.25.045.08.018.164.032.244.058.08.02.16.04.24.07.077.025.156.05.234.08.075.028.15.055.226.09.074.032.15.065.224.105.073.033.143.07.213.11.07.038.133.08.203.124.07.043.136.08.18.113.23.165.414.327.564.48.16.162.275.275.37.375.045.054.068.134.068.134l.213.702s-.117.258-.117.53c0 .438.26.588.58.588.022 0 .046-.005.092-.024.648-.272 1.292-.592 1.72-.96.642-.547.855-1.212.855-1.212s-.03-.028-.048-.088l-.39-1.24a.59.59 0 0 1 .213-.665C22.83 13.732 24 11.742 24 9.53c0-4.054-3.891-7.342-8.691-7.342H8.691z"/>
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('subscription.alipayPayment')}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {t('subscription.completePaymentInNewWindow')}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>{t('subscription.orderNumber')}:</strong> {orderNo}
            </p>
          </div>
          
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          >
            {t('subscription.iveCompletedPayment')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlipayPaymentWindow;