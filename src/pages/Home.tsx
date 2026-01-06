import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TripPlanner from '../components/trip/TripPlanner';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 selection:bg-teal-100 selection:text-teal-900">
      <Header />
      <TripPlanner />
      <Footer />
    </div>
  );
};

export default Home;