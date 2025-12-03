import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BlogProvider } from './contexts/BlogContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Blog from './pages/Blog';
import BlogDetails from './pages/BlogDetails';
import PublishSuccess from './pages/PublishSuccess';
import BlogEditor from './pages/BlogEditor';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Trips from './pages/Trips';
import Notifications from './pages/Notifications';
import Support from './pages/Support';
import About from './pages/About';
import Destinations from './pages/Destinations';
import Tours from './pages/Tours';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Cookies from './pages/Cookies';
import Accessibility from './pages/Accessibility';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import PaymentResult from './pages/PaymentResult';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/blog" element={<BlogProvider><Blog /></BlogProvider>} />
          <Route path="/blog/:id" element={<BlogProvider><BlogDetails /></BlogProvider>} />
          <Route path="/blog/publish-success" element={<BlogProvider><PublishSuccess /></BlogProvider>} />
          <Route path="/blog/create" element={<BlogProvider><ProtectedRoute><BlogEditor /></ProtectedRoute></BlogProvider>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/support" element={<Support />} />
          <Route path="/about" element={<About />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

export default App;
