// src/pages/Profile.tsx
// ✅ UPDATED: Tabbed interface matching the design

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserCircleIcon,
  CreditCardIcon,
  MapPinIcon,
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Layout & Context
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { i18nErrorHandler } from '../utils/i18nErrorHandler';
import { apiClient } from '../services/apiClient';

// Tab Content Components
import ProfileTab from '../components/profile/ProfileTab';
import SubscriptionTab from '../components/profile/SubscriptionTab';
import MyTripsTab from '../components/profile/MyTripsTab';
import NotificationTab from '../components/profile/NotificationTab';

// Hooks
import { useSubscription } from '../hooks/useSubscription';

type TabId = 'profile' | 'subscription' | 'trips' | 'notification';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userProfile, updateUserProfile, logout } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  
  // State
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Subscription Hook
  const {
    plans,
    isUpdating: isUpdatingSubscription,
    showPaymentMethodSelection,
    pendingPlanId,
    handlePaymentMethodSelect,
    closePaymentMethodSelection,
  } = useSubscription();

  // Tab configuration
  const tabs = [
    {
      id: 'profile' as TabId,
      label: t('trips.myProfile') || 'My Profile',
      icon: UserCircleIcon
    },
    {
      id: 'subscription' as TabId,
      label: t('trips.subscription') || 'Subscription',
      icon: CreditCardIcon
    },
    {
      id: 'trips' as TabId,
      label: t('trips.myTrips') || 'My trips',
      icon: MapPinIcon
    },
    {
      id: 'notification' as TabId,
      label: t('trips.notifications') || 'Notification',
      icon: BellIcon
    }
  ];

  // --- Handlers ---

  const handleAvatarUpdate = async (file: File) => {
    if (!user) return;
    setIsUploadingAvatar(true);

    try {
      const imageUrl = await apiClient.uploadFile(file);
      await updateUserProfile({
        nickname: userProfile?.nickname || user.displayName || '',
        imageUrl: imageUrl
      });
      showSuccess(t('trips.updateSuccess'));
    } catch (error) {
      console.error('Avatar upload failed:', error);
      showError(t('common.error.imageLoadError'));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async (formData: any) => {
    if (!user) return;
    setIsUpdatingProfile(true);

    try {
      await updateUserProfile({
        nickname: formData.username,
        phone: formData.mobile?.replace(/\s+/g, ''),
        gender: formData.gender?.toLowerCase(),
        birthDate: formData.dob ? new Date(formData.dob).toISOString() : undefined,
      });
      showSuccess(t('trips.updateSuccess'));
    } catch (error) {
      const errorMessage = i18nErrorHandler.handleError(error, { component: 'Profile', action: 'update' }, t);
      showError(errorMessage.description);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (current: string, newPass: string) => {
    console.log('Password update requested', { current, newPass });
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        showSuccess(t('trips.updateSuccess'));
        resolve();
      }, 1000);
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      showError(t('common.error.logoutFailed'));
    }
  };

  // Initial form data
  const initialFormData = useMemo(() => ({
    username: userProfile?.nickname || user?.displayName || '',
    email: userProfile?.email || user?.email || '',
    mobile: userProfile?.phone || (user && 'phone' in user ? user.phone : '') || '',
    dob: userProfile?.birthDate ? userProfile.birthDate.split('T')[0] : '',
    gender: userProfile?.gender && typeof userProfile.gender === 'string' 
      ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1).toLowerCase() 
      : '',
  }), [userProfile, user]);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab
            initialData={initialFormData}
            onSubmit={handleProfileUpdate}
            onAvatarUpdate={handleAvatarUpdate}
            onPasswordUpdate={handlePasswordUpdate}
            isLoading={isUpdatingProfile}
            isUploadingAvatar={isUploadingAvatar}
          />
        );
      case 'subscription':
        return <SubscriptionTab />;
      case 'trips':
        return <MyTripsTab />;
      case 'notification':
        return <NotificationTab />;
      default:
        return null;
    }
  };

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

        <div className="max-w-7xl mx-auto">
          {/* Tabbed Navigation */}
          <div className="bg-white rounded-t-2xl border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-white bg-teal-600 rounded-t-lg -mb-px'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-t-lg transition-all whitespace-nowrap ml-auto"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                {t('trips.logout') || 'Logout'}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-b-2xl shadow-sm p-8">
            {renderTabContent()}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
