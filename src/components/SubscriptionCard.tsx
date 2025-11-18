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
  highlightColor?: string;
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
  highlightColor = 'teal',
  currency = '$',
  showComparison = true,
  onCompareClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

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
    const baseClass = 'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2';
    
    switch (getButtonVariant()) {
      case 'disabled':
        return `${baseClass} bg-gray-200 text-gray-500 cursor-not-allowed`;
      case 'loading':
        return `${baseClass} bg-${highlightColor}-600 text-white cursor-wait`;
      case 'selected':
        return `${baseClass} bg-${highlightColor}-600 text-white`;
      default:
        return `${baseClass} bg-${highlightColor}-600 text-white hover:bg-${highlightColor}-700 focus:ring-${highlightColor}-500`;
    }
  };

  const getCardClass = () => {
    const baseClass = `p-6 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden ${className}`;
    
    if (plan.isDisabled) {
      return `${baseClass} border border-gray-200 bg-gray-50 opacity-60`;
    }
    
    if (isSelected) {
      return `${baseClass} border-2 border-${highlightColor}-600 bg-${highlightColor}-50 shadow-lg transform scale-105`;
    }
    
    if (isHovered) {
      return `${baseClass} border-2 border-${highlightColor}-300 bg-white shadow-md transform -translate-y-1`;
    }
    
    return `${baseClass} border border-gray-200 bg-white hover:border-${highlightColor}-300 hover:shadow-md`;
  };

  const renderBadge = () => {
    if (!plan.badgeTextKey && !plan.isPopular && !plan.isBestValue) return null;

    const badgeTextToRender = plan.badgeTextKey ? t(plan.badgeTextKey) : (plan.isBestValue ? t('subscriptionCard.bestValue') : t('subscriptionCard.popular'));
    const badgeColor = plan.isBestValue ? 'purple' : 'red';

    return (
      <div className={`absolute top-0 right-0 bg-${badgeColor}-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl`}>
        {badgeTextToRender}
      </div>
    );
  };

  const renderPrice = () => {
    if (!plan.originalPrice || !plan.discount) {
      return (
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">{currency}{plan.price}</span>
          <span className="ml-2 text-gray-600">{t(plan.periodKey)}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-baseline">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">{currency}{plan.price}</span>
            <span className="ml-2 text-gray-600">{t(plan.periodKey)}</span>
          </div>
          <div className="flex items-center mt-1">
            <span className="text-lg text-gray-500 line-through mr-2">{currency}{plan.originalPrice}</span>
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
              {plan.discount}% {t('subscriptionCard.off')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderFeatures = () => {
    return (
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature) => (
          <li key={feature.id} className="flex items-start">
            <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
              feature.included ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {feature.included ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
              {t(feature.nameKey)}
              {feature.description && (
                <span className="block text-xs text-gray-500 mt-1">{feature.description}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderButton = () => {
    const buttonLabel = isSelected ? t('subscriptionCard.currentPlan') : t('subscriptionCard.selectPlan');
    
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
          buttonLabel
        )}
      </button>
    );
  };

  return (
    <div
      className={getCardClass()}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={plan.isDisabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`${t(plan.nameKey)} subscription plan, ${currency}${plan.price} per ${t(plan.periodKey)}`}
    >
      {renderBadge()}
      
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t(plan.nameKey)}</h3>
        {renderPrice()}
      </div>
      
      {renderFeatures()}
      
      {renderButton()}
      
      {showComparison && !plan.isDisabled && (
        <div className="mt-4 text-center">
          <button
            className={`text-sm text-${highlightColor}-600 hover:text-${highlightColor}-700 font-medium focus:outline-none`}
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