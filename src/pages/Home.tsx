import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TripPlanner from '../components/trip/TripPlanner';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-teal-50">
      <Header />
      <TripPlanner />
      <Footer />
    </div>
  );
};

export default Home;