import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Layout & Context
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { i18nErrorHandler } from '../utils/i18nErrorHandler';
import { apiClient } from '../services/apiClient';

// New Components
import ProfileHeader from '../components/profile/ProfileHeader';
import PersonalDetailsForm, { type ProfileFormData } from '../components/profile/PersonalDetailsForm';
import SecuritySettings from '../components/profile/SecuritySettings';
import SubscriptionSummary from '../components/profile/SubscriptionSummary';
import PaymentMethodSelection from '../components/PaymentMethodSelection'; // Kept for subscription logic

// Hooks
import { useSubscription } from '../hooks/useSubscription';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfile } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  
  // State
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Subscription Hook (for Payment Modal logic)
  const {
    plans,
    isUpdating: isUpdatingSubscription,
    showPaymentMethodSelection,
    pendingPlanId,
    handlePaymentMethodSelect,
    closePaymentMethodSelection,
  } = useSubscription();

  // --- Handlers ---

  const handleAvatarUpdate = async (file: File) => {
    if (!user) return;
    setIsUploadingAvatar(true);

    try {
      // 1. Upload file to storage
      const imageUrl = await apiClient.uploadFile(file);

      // 2. Update user profile with new URL
      await updateUserProfile({
        nickname: userProfile?.nickname || user.displayName || '',
        imageUrl: imageUrl
      });
      
      showSuccess(t('profile.updateSuccess'));
    } catch (error) {
      console.error('Avatar upload failed:', error);
      showError(t('common.error.imageLoadError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async (formData: ProfileFormData) => {
    if (!user) return;
    setIsUpdatingProfile(true);

    try {
      await updateUserProfile({
        nickname: formData.username,
        phone: formData.mobile?.replace(/\s+/g, ''), // Remove spaces for backend validation
        gender: formData.gender?.toLowerCase(),
        birthDate: formData.dob ? new Date(formData.dob).toISOString() : undefined,
      });
      showSuccess(t('profile.updateSuccess'));
    } catch (error) {
      const errorMessage = i18nErrorHandler.handleError(error, { component: 'Profile', action: 'update' }, t);
      showError(errorMessage.description);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (current: string, newPass: string) => {
    // Note: Implementation depends on specific Auth provider capabilities exposed in AuthContext
    // This is a placeholder for where the updatePassword logic would go
    console.log('Password update requested', { current, newPass });
    
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        showSuccess(t('profile.updateSuccess'));
        resolve();
      }, 1000);
    });
  };

  // --- Data Preparation ---

  const initialFormData = useMemo<ProfileFormData>(() => ({
    username: userProfile?.nickname || user?.displayName || '',
    email: userProfile?.email || user?.email || '',
    mobile: userProfile?.phone || user?.phoneNumber || '',
    dob: userProfile?.birthDate ? userProfile.birthDate.split('T')[0] : '',
    gender: userProfile?.gender && typeof userProfile.gender === 'string' ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1).toLowerCase() : '',
  }), [userProfile, user]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { label: t('header.home'), href: '/' },
            { label: t('profileNav.profile'), href: '/profile' }
          ]}
          className="mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-3 sticky top-24">
            {/* Optional: Tiny promo or help box below nav */}
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 hidden lg:block">
              <h4 className="font-semibold text-teal-900 text-sm mb-1">{t('common.contactSupport')}</h4>
              <p className="text-xs text-teal-700 mb-3">Need help with your account? We are here 24/7.</p>
              <button onClick={() => navigate('/support')} className="text-xs font-bold text-teal-600 hover:text-teal-800">
                Contact Us &rarr;
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 space-y-6">
            <div className="animate-fadeIn">
                <ProfileHeader 
                  onAvatarUpdate={handleAvatarUpdate}
                  isUpdatingAvatar={isUploadingAvatar}
                />

                {/* Subscription Widget */}
                <SubscriptionSummary />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Left Column: Personal Details */}
                  <div className="xl:col-span-2">
                    <PersonalDetailsForm 
                      initialData={initialFormData}
                      onSubmit={handleProfileUpdate}
                      isLoading={isUpdatingProfile}
                    />
                  </div>

                  {/* Security Settings (Full width or split depending on design preference, using full for clarity) */}
                  <div className="xl:col-span-2">
                    <SecuritySettings 
                      onUpdatePassword={handlePasswordUpdate}
                      isLoading={false}
                    />
                  </div>
                </div>
              </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Payment Method Selection Modal (Preserved for logic) */}
      {showPaymentMethodSelection && pendingPlanId && (
        <PaymentMethodSelection
          plan={plans.find(p => p.planId === pendingPlanId)!}
          isOpen={showPaymentMethodSelection}
          onClose={closePaymentMethodSelection}
          onSelectPaymentMethod={(paymentMethod) => handlePaymentMethodSelect(pendingPlanId, paymentMethod)}
          isLoading={isUpdatingSubscription}
        />
      )}
    </div>
  );
};

export default Profile;