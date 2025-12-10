// src/components/SubscriptionCard.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SubscriptionPlan } from '../types/subscription';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  onButtonClick?: () => void;
  className?: string;
  currency?: string;
  showComparison?: boolean;
  onCompareClick?: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  isSelected = false,
  isLoading = false,
  onClick,
  onButtonClick,
  className = '',
  currency = '$',
  showComparison = true,
  onCompareClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  const getPeriod = (durationDays: number) => {
    switch (durationDays) {
      case 7: return t('subscription.periods.week');
      case 30: return t('subscription.periods.month');
      case 90: return t('subscription.periods.quarter');
      case 365: return t('subscription.periods.year');
      default: return `${durationDays} ${t('subscription.periods.days')}`;
    }
  };

  const handleCardClick = () => {
    if (!plan.isDisabled && !isLoading && onClick) {
      onClick();
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!plan.isDisabled && !isLoading && onButtonClick) {
      onButtonClick();
    }
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompareClick) {
      onCompareClick();
    }
  };

  const getButtonVariant = () => {
    if (plan.isDisabled) return 'disabled';
    if (isLoading) return 'loading';
    if (isSelected) return 'selected';
    return 'default';
  };

  const getButtonClass = () => {
    const baseClass = 'w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (getButtonVariant()) {
      case 'disabled':
        return `${baseClass} bg-gray-100 text-gray-400 cursor-not-allowed`;
      case 'loading':
        return `${baseClass} bg-gradient-to-r from-teal-500 to-emerald-500 text-white cursor-wait shadow-lg`;
      case 'selected':
        return `${baseClass} bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-200`;
      default:
        return `${baseClass} bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-200 hover:shadow-xl hover:shadow-teal-300 focus:ring-teal-500`;
    }
  };

  const getCardClass = () => {
    const baseClass = `relative flex flex-col h-full p-8 rounded-2xl transition-all duration-300 ${className}`;
    
    if (plan.isDisabled) {
      return `${baseClass} bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed`;
    }
    
    if (isSelected) {
      return `${baseClass} bg-gradient-to-br from-white to-teal-50 border-2 border-teal-500 shadow-2xl shadow-teal-100 transform scale-[1.02] cursor-pointer`;
    }
    
    if (isHovered) {
      return `${baseClass} bg-white border-2 border-teal-300 shadow-xl transform -translate-y-2 cursor-pointer`;
    }
    
    return `${baseClass} bg-white border border-gray-200 shadow-lg hover:shadow-xl cursor-pointer`;
  };

  const renderBadge = () => {
    if (!plan.badgeTextKey && !plan.isPopular && !plan.isBestValue) return null;

    const badgeTextToRender = plan.badgeTextKey
      ? t(plan.badgeTextKey)
      : (plan.isBestValue ? t('subscriptionCard.bestValue') : t('subscriptionCard.popular'));
    
    const badgeStyles = plan.isBestValue
      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
      : 'bg-gradient-to-r from-orange-400 to-red-500';

    return (
      <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${badgeStyles} text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg`}>
        {badgeTextToRender}
      </div>
    );
  };

  const renderPrice = () => {
    return (
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center">
          <span className="text-2xl font-semibold text-gray-600">{currency}</span>
          <span className="text-5xl font-bold text-gray-900 mx-1">{plan.price}</span>
          <span className="text-gray-500 text-lg">/{getPeriod(plan.durationDays)}</span>
        </div>
        {plan.originalPrice && plan.discount && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-lg text-gray-400 line-through">{currency}{plan.originalPrice}</span>
            <span className="inline-flex items-center bg-linear-to-r from-red-100 to-orange-100 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
              {plan.discount}% {t('subscriptionCard.off')}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderFeatures = () => {
    return (
      <ul className="space-y-4 mb-8 grow">
        {plan.featureNames.map((featureName, index) => (
          <li key={index} className="flex items-start">
            <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 bg-linear-to-r from-teal-400 to-emerald-500 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-base text-gray-700 font-medium">
              {featureName}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderButton = () => {
    const buttonLabel = isSelected
      ? t('subscriptionCard.currentPlan')
      : t('subscriptionCard.selectPlan');
    
    return (
      <button
        className={getButtonClass()}
        onClick={handleButtonClick}
        disabled={plan.isDisabled || isLoading}
        aria-label={buttonLabel}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('subscriptionCard.processing')}
          </span>
        ) : (
          <span className="flex items-center justify-center">
            {buttonLabel}
            {!isSelected && (
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            )}
          </span>
        )}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="relative flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-200 shadow-lg animate-pulse">
        {/* Badge Skeleton */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-200 text-white text-xs font-bold px-4 py-1.5 rounded-full w-20 h-6"></div>

        {/* Plan Name Skeleton */}
        <div className="text-center mb-6 pt-2">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>

        {/* Price Section Skeleton */}
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center mb-3">
            <div className="h-6 bg-gray-200 rounded w-8 mr-1"></div>
            <div className="h-12 bg-gray-200 rounded w-16 mr-1"></div>
            <div className="h-5 bg-gray-200 rounded w-12"></div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-6"></div>

        {/* Features Skeleton */}
        <ul className="space-y-4 mb-8 flex-grow">
          {[...Array(5)].map((_, index) => (
            <li key={index} className="flex items-start">
              <div className="shrink-0 w-6 h-6 rounded-full bg-gray-200 mr-3"></div>
              <div className="h-5 bg-gray-200 rounded flex-1"></div>
            </li>
          ))}
        </ul>

        {/* CTA Button Skeleton */}
        <div className="w-full py-3 px-6 rounded-xl bg-gray-200 h-12"></div>

        {/* Compare Link Skeleton */}
        {showComparison && (
          <div className="mt-4 text-center">
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={getCardClass()}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={plan.isDisabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`${plan.planName} subscription plan, ${currency}${plan.price} per ${getPeriod(plan.durationDays)}`}
    >
      {renderBadge()}

      {/* Plan Name */}
      <div className="text-center mb-6 pt-2">
        <h3 className="text-2xl font-bold text-gray-900">{plan.planName}</h3>
      </div>

      {/* Price Section */}
      {renderPrice()}

      {/* Divider */}
      <div className="border-t border-gray-100 mb-6"></div>

      {/* Features */}
      {renderFeatures()}

      {/* CTA Button */}
      {renderButton()}

      {/* Compare Link */}
      {showComparison && !plan.isDisabled && (
        <div className="mt-4 text-center">
          <button
            className="text-sm text-teal-600 hover:text-teal-700 font-medium focus:outline-none transition-colors duration-200 hover:underline"
            onClick={handleCompareClick}
          >
            {t('subscriptionCard.comparePlans')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;