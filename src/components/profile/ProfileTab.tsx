// src/components/profile/ProfileTab.tsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CameraIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileTabProps {
  initialData: {
    username: string;
    email: string;
    mobile: string;
    dob: string;
    gender: string;
  };
  onSubmit: (data: any) => Promise<void>;
  onAvatarUpdate: (file: File) => Promise<void>;
  onPasswordUpdate: (current: string, newPass: string) => Promise<void>;
  isLoading: boolean;
  isUploadingAvatar: boolean;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  initialData,
  onSubmit,
  onAvatarUpdate,
  onPasswordUpdate,
  isLoading,
  isUploadingAvatar
}) => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  
  const [formData, setFormData] = useState(initialData);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: 'current' | 'new' | 'confirm', value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarUpdate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Avatar */}
      <div className="lg:col-span-1">
        <div className="text-center">
          <div className="relative inline-block">
            <img
              src={userProfile?.imageurl || '/assets/default-avatar.png'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-2 bg-teal-600 rounded-full text-white cursor-pointer hover:bg-teal-700 transition-colors shadow-lg"
            >
              {isUploadingAvatar ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CameraIcon className="w-5 h-5" />
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploadingAvatar}
              />
            </label>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {formData.username || 'User'}
          </h3>
          <p className="text-sm text-gray-500">{formData.email}</p>
        </div>
      </div>

      {/* Right Column - Edit Form */}
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {t('trips.editProfileInfo') || 'Edit Profile Informations'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username & Email Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('trips.username') || 'Username'}
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('trips.email') || 'Email'}
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Mobile & DOB Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('trips.mobileNumber') || 'Mobile Number'}
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                placeholder="mm-dd/yyyy"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('trips.dateOfBirth') || 'Date of Birth'}
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                placeholder="mm-dd/yyyy"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Password Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('trips.password') || 'Password'}
              </label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => handlePasswordChange('new', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('trips.confirmedPassword') || 'Confirmed Password'}
              </label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Gender Radio Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('trips.gender') || 'Gender'}
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={formData.gender === 'Male'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{t('profile.male') || 'Male'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={formData.gender === 'Female'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{t('profile.female') || 'Female'}</span>
              </label>
            </div>
          </div>

          {/* Update Button */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.updating') || 'Updating...'}
                </div>
              ) : (
                t('trips.update') || 'Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileTab;
