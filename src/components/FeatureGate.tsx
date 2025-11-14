// src/components/FeatureGate.tsx

/**
 * FRONTEND ONLY - UI Feature Gating Component
 *
 * 🚨 SECURITY WARNING: This component provides CLIENT-SIDE UI visibility only.
 * It enhances UX by hiding unavailable features, but provides NO SECURITY.
 *
 * Backend Protection Required:
 * - All API endpoints must validate feature access server-side
 * - Use BackendFeatureService.checkFeatureAccess() in route handlers
 * - Implement SubscriptionMiddleware for protected routes
 *
 * Example Backend Protection:
 * ```typescript
 * app.post('/api/blog/create', checkFeatureAccess('blog_publishing'), (req, res) => {
 *   // Only users with blog_publishing access can reach here
 * });
 * ```
 *
 * Migration: This component is safe to keep, but ensure backend validation exists.
 */

import React, { useState, useEffect } from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import type { FeatureId } from '../types/features';
import type { FeatureAccessResult } from '../types/features';

interface FeatureGateProps {
  feature: FeatureId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  upgradeComponent?: React.ComponentType<{ feature: FeatureId; message: string }>;
}

/**
 * FeatureGate component for conditional rendering based on subscription access
 * Provides a clean way to show/hide features based on user subscription level
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback = null,
  showUpgrade = true,
  upgradeComponent: UpgradeComponent,
}) => {
  const { checkFeatureAccess } = useFeatureAccess();
  const [access, setAccess] = useState<FeatureAccessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const result = await checkFeatureAccess(feature);
        setAccess(result);
      } catch (error) {
        console.error('Error checking feature access:', error);
        // Default to no access on error
        setAccess({
          hasAccess: false,
          feature: {
            id: feature,
            name: 'Unknown Feature',
            description: 'Feature not found',
            category: 'planning',
          },
          requiredPlans: [],
          upgradeMessage: 'Unable to check feature access',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccess();
  }, [feature, checkFeatureAccess]);

  // Show loading state or fallback while checking access
  if (isLoading || !access) {
    return fallback || null;
  }

  if (access.hasAccess) {
    return <>{children}</>;
  }

  if (showUpgrade && access.upgradeMessage) {
    if (UpgradeComponent) {
      return <UpgradeComponent feature={feature} message={access.upgradeMessage} />;
    }

    // Default upgrade prompt
    return (
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 my-4">
        <div className="flex items-center">
          <div className="shrink-0">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-900">
              Premium Feature
            </h3>
            <p className="text-blue-700 mt-1">
              {access.upgradeMessage}
            </p>
            <div className="mt-3">
              <a
                href="/subscription"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upgrade Now
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FeatureGate;