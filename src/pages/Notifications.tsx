import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileNav from '../components/ProfileNav';
import Breadcrumb from '../components/Breadcrumb';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('notifications');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'profile') navigate('/profile');
    else if (tab === 'subscription') navigate('/subscription');
    else if (tab === 'trips') navigate('/trips');
  };

  // Sample notification data
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Changes in Service',
      message: 'We just updated our privacy policy here to better service our customers. We recommend reviewing the changes.',
      date: '2024-01-15',
      read: false,
    },
    {
      id: '2',
      title: 'Changes in Service',
      message: 'We just updated our privacy policy here to better service our customers. We recommend reviewing the changes.',
      date: '2024-01-10',
      read: true,
    },
    {
      id: '3',
      title: 'New Feature Available',
      message: 'Check out our new itinerary planning feature that helps you organize your trips more efficiently.',
      date: '2024-01-08',
      read: false,
    },
    {
      id: '4',
      title: 'Changes in Service',
      message: 'We just updated our privacy policy here to better service our customers. We recommend reviewing the changes.',
      date: '2024-01-05',
      read: true,
    },
    {
      id: '5',
      title: 'Trip Reminder',
      message: 'Your trip to Paris is coming up in 3 days. Don\'t forget to check your itinerary!',
      date: '2024-01-03',
      read: false,
    },
  ];

  const markAsRead = (id: string) => {
    // In a real app, this would update the backend
    console.log('Mark notification as read:', id);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showNavLinks={false} />
      <main className="px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/profile" className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{t('blog.back')}</span>
          </Link>
          <Breadcrumb
            items={[
              { label: t('profileNav.profile'), href: '/profile' },
              { label: t('profileNav.notifications') }
            ]}
            className="mb-6"
          />
          <div className="bg-white rounded-lg shadow-md p-8">
            <ProfileNav activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === 'notifications' && (
              <div className="notification-container">
                <h2 className="text-2xl font-semibold mb-6">{t('notifications.messages')}</h2>

                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item p-4 border rounded-lg ${
                        notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${
                            notification.read ? 'text-gray-700' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className={`mt-2 ${
                            notification.read ? 'text-gray-600' : 'text-gray-800'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {notification.date}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            {t('notifications.markAsRead')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {notifications.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    {t('notifications.noNotifications')}
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'notifications' && (
              <div className="text-center text-gray-500 py-12">
                {t('notifications.contentComingSoon', { tab: activeTab })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;