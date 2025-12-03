// src/components/FeatureGate.tsx

/**
 * BACKEND-PROTECTED Feature Access Component
 *
 * ✅ SECURE: Now relies on backend API validation for access control.
 * This component provides UX enhancement by showing upgrade modals for
 * inaccessible features, but backend APIs enforce actual security.
 *
 * Backend Protection:
 * - GET /api/v1/features/{featureId}/access validates access server-side
 * - POST /api/v1/features/upgrade-suggestions provides upgrade options
 * - All feature access is logged and audited
 */

import React, { useState, useEffect } from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useAuth } from '../contexts/AuthContext';
import type { FeatureId } from '../types/features';
import type { FeatureAccessResult } from '../types/features';
import FeatureAccessModal from './FeatureAccessModal';
import { FEATURE_REGISTRY } from '../types/features';

interface FeatureGateProps {
  feature: FeatureId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * FeatureGate component for conditional rendering based on backend-validated access
 * Shows upgrade modal for inaccessible features, but relies on backend for security
 */
const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();
  const { checkFeatureAccess } = useFeatureAccess();
  const [access, setAccess] = useState<FeatureAccessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  // Show loading state while checking access
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Checking feature access...</span>
      </div>
    );
  }

  // If user has access, show the content
  if (access?.hasAccess) {
    return <>{children}</>;
  }

  // If no access and user is not authenticated, redirect to login or show login prompt
  if (!user) {
    return fallback || (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-4">
        <div className="text-center">
          <svg className="w-12 h-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Sign In Required
          </h3>
          <p className="text-blue-700 mb-4">
            Please sign in to access this premium feature.
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // If user is authenticated but doesn't have access, show upgrade modal trigger
  const featureName = access?.feature?.name || FEATURE_REGISTRY[feature]?.name || 'This Feature';

  return (
    <>
      {/* Trigger element - shows upgrade prompt */}
      <div
        className="cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        {fallback || (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 my-4 hover:from-blue-100 hover:to-indigo-100 transition-colors">
            <div className="text-center">
              <svg className="w-12 h-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Premium Feature
              </h3>
              <p className="text-blue-700 mb-4">
                {featureName} is available with a premium subscription.
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Upgrade to Access
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <FeatureAccessModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureId={feature}
        featureName={featureName}
      />
    </>
  );
};

export default FeatureGate;