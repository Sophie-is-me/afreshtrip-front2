import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileNav from '../components/ProfileNav';
import Breadcrumb from '../components/Breadcrumb';
import { useTranslation } from 'react-i18next';

interface Trip {
  id: string;
  date: string;
  city: string;
  stops: number;
}

const Trips: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trips');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'profile') navigate('/profile');
    else if (tab === 'subscription') navigate('/subscription');
    else if (tab === 'notifications') navigate('/notifications');
  };

  // Sample trip data
  const trips: Trip[] = [
    { id: '1', date: '2020-09-10', city: 'Paris', stops: 5 },
    { id: '2', date: '2021-10-10', city: 'London', stops: 6 },
    { id: '3', date: '2022-05-15', city: 'Tokyo', stops: 8 },
    { id: '4', date: '2023-03-22', city: 'New York', stops: 4 },
  ];

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
              { label: t('profileNav.trips') }
            ]}
            className="mb-6"
          />
          <div className="bg-white rounded-lg shadow-md p-8">
            <ProfileNav activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === 'trips' && (
              <div className="my-trips">
                <h2 className="text-2xl font-semibold mb-6">{t('trips.myTrips')}</h2>

                <div className="overflow-x-auto">
                  <table className="trips-table w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                          {t('trips.date')}
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                          {t('trips.city')}
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                          {t('trips.stops')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((trip) => (
                        <tr key={trip.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            {trip.date}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            {trip.city}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-gray-700">
                            {trip.stops} {t('trips.stops')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {trips.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    {t('trips.noTrips')}
                  </div>
                )}
              </div>
            )}

            {activeTab !== 'trips' && (
              <div className="text-center text-gray-500 py-12">
                {t('trips.contentComingSoon', { tab: activeTab })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Trips;