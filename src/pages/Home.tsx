import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TripPlanner from '../components/trip/TripPlanner';

const Home: React.FC = () => {
  return (
    // Changed: 
    // 1. min-h-screen (instead of h-screen) to allow scrolling
    // 2. Removed overflow-hidden to let content flow
    <div className="min-h-screen w-full bg-[#F5F5F7] selection:bg-teal-100 selection:text-teal-900 flex flex-col font-serif">
      
      {/* Header stays sticky at the top (defined inside Header.tsx) */}
      <Header />
      
      {/* Main Content Area: Flex-1 ensures it pushes the footer down if content is short */}
      <main className="flex-1 flex flex-col relative z-0">
        <TripPlanner />
      </main>

      {/* Footer: Sits at the bottom of the document flow */}
      <div className="shrink-0 z-40 relative">
        <Footer showNewsletter={false} />
      </div>
      
    </div>
  );
};

export default Home;