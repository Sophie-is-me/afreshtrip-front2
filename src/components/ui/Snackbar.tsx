import React, { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';

export type SnackbarType = 'error' | 'success' | 'warning' | 'info';

export interface SnackbarAction {
  label: string;
  onClick: () => void;
  style?: 'default' | 'primary' | 'secondary';
}

export interface SnackbarProps {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number; // Auto-close duration in ms (0 for persistent)
  actions?: SnackbarAction[];
  onClose: (id: string) => void;
  showProgress?: boolean;
}

const Snackbar: React.FC<SnackbarProps> = ({
  id,
  message,
  type,
  duration = 5000,
  actions = [],
  onClose,
  showProgress = true
}) => {
//   const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  // Animation entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Auto-close with progress
  useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setProgress((remaining / duration) * 100);

        if (remaining <= 0) {
          handleClose();
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-400',
          progress: 'bg-red-500'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-400',
          progress: 'bg-green-500'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-400',
          progress: 'bg-yellow-500'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-400',
          progress: 'bg-blue-500'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'text-gray-400',
          progress: 'bg-gray-500'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          relative rounded-lg border p-4 shadow-lg backdrop-blur-sm
          ${styles.container}
        `}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Progress bar */}
        {showProgress && duration > 0 && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded-t-lg overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${styles.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {getIcon()}
          </div>

          {/* Message */}
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium leading-5">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className={`
              ml-4 inline-flex flex-shrink-0 rounded-md p-1.5 
              transition-colors duration-200 hover:bg-black hover:bg-opacity-10
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-current
              ${styles.icon}
            `}
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="mt-3 flex space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${action.style === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    : action.style === 'secondary'
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500'
                    : 'bg-transparent text-current hover:bg-black hover:bg-opacity-10 focus:ring-offset-current'
                  }
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Snackbar;