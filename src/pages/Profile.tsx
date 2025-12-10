import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileNav from '../components/ProfileNav';
import Breadcrumb from '../components/Breadcrumb';
import { useTranslation } from 'react-i18next';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'subscription') navigate('/subscription');
    else if (tab === 'trips') navigate('/trips');
    else if (tab === 'notifications') navigate('/notifications');
  };
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    dob: '',
    password: '',
    confirmPassword: '',
    gender: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Profile update:', formData);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showNavLinks={false} />
      <main className="px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb
            items={[
              { label: t('profileNav.profile'), href: '/profile' }
            ]}
            className="mb-6"
          />
          <div className="bg-white rounded-lg shadow-md p-8">
            <ProfileNav activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === 'profile' && (
              <div className="profile-details">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Avatar Section */}
                  <div className="profile-pic flex flex-col items-center">
                    <div className="profile-pic-container w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                      <img src="/assets/count-1.png" alt="Profile" className="w-full h-full rounded-full object-cover" />
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="profile-info flex-1">
                    <h2 className="text-2xl font-semibold mb-6">{t('profile.editProfile')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profile.username')}
                          </label>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder={t('profile.usernamePlaceholder')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profile.email')}
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="yourname@company.com"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profile.mobile')}
                          </label>
                          <input
                            type="tel"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            placeholder={t('profile.mobilePlaceholder')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profile.dob')}
                          </label>
                          <input
                            type="date"
                            id="dob"
                            name="dob"
                            value={formData.dob}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profile.password')}
                          </label>
                          <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder={t('profile.passwordPlaceholder')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profile.confirmPassword')}
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder={t('profile.confirmPasswordPlaceholder')}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      {/* Gender Section */}
                      <div className="gender-group">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {t('profile.gender')}
                        </label>
                        <div className="flex gap-6">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="Male"
                              checked={formData.gender === 'Male'}
                              onChange={handleInputChange}
                              className="mr-2 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">{t('profile.male')}</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="Female"
                              checked={formData.gender === 'Female'}
                              onChange={handleInputChange}
                              className="mr-2 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">{t('profile.female')}</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
                        >
                          {t('profile.update')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'profile' && (
              <div className="text-center text-gray-500 py-12">
                {t('profile.contentComingSoon', { tab: activeTab })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;