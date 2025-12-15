import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileNav from '../components/ProfileNav';
import Breadcrumb from '../components/Breadcrumb';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { useTranslation } from 'react-i18next';
import { useTrips } from '../hooks/queries/useTripQueries';
import type { ApiTrip } from '../services/api/tripApiService';

const Trips: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trips');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: tripsData, isLoading, isError, error, refetch } = useTrips(currentPage, pageSize);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'profile') navigate('/profile');
    else if (tab === 'subscription') navigate('/subscription');
    else if (tab === 'notifications') navigate('/notifications');
  };

  // Transform API trips to match component interface
  const transformTrips = (apiTrips: ApiTrip[]): Array<{ id: string; date: string; city: string; stops: number; status: string }> => {
    return apiTrips.map(trip => ({
      id: trip.id,
      date: trip.startDate,
      city: trip.destination,
      stops: trip.places?.length || 0,
      status: trip.status
    }));
  };

  const trips = tripsData ? transformTrips(tripsData.trips) : [];

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

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : isError ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">
                      {t('common.error.error')}: {error instanceof Error ? error.message : 'Unknown error'}
                    </div>
                    <button
                      onClick={() => refetch()}
                      className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
                    >
                      {t('common.retry')}
                    </button>
                  </div>
                ) : trips.length === 0 ? (
                  <EmptyState
                    icon="🗺️"
                    title={t('trips.noTrips')}
                    description={t('trips.noTripsDescription')}
                    actionLabel={t('trips.planFirstTrip')}
                    onAction={() => navigate('/')}
                  />
                ) : (
                  <>
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
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                              {t('trips.status')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {trips.map((trip) => (
                            <tr key={trip.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                {new Date(trip.date).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                {trip.city}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                {trip.stops} {t('trips.stops')}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-gray-700">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  trip.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                  trip.status === 'planned' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {t(`trips.statuses.${trip.status}`)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {tripsData && tripsData.total > pageSize && (
                      <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-700">
                          {t('common.showing')} {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, tripsData.total)} {t('common.of')} {tripsData.total}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            {t('common.previous')}
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage * pageSize >= (tripsData?.total || 0)}
                            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          >
                            {t('common.next')}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
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