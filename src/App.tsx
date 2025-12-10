import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BlogProvider } from './contexts/BlogContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { PageErrorBoundary } from './components/error-boundaries/PageErrorBoundary';
import { SectionErrorBoundary } from './components/error-boundaries/SectionErrorBoundary';
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
      <SnackbarProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PageErrorBoundary pageName="login"><Login /></PageErrorBoundary>} />
          <Route path="/blog" element={<PageErrorBoundary pageName="blog"><BlogProvider><SectionErrorBoundary sectionName="maincontent"><Blog /></SectionErrorBoundary></BlogProvider></PageErrorBoundary>} />
          <Route path="/blog/:id" element={<PageErrorBoundary pageName="blogdetails"><BlogProvider><SectionErrorBoundary sectionName="maincontent"><BlogDetails /></SectionErrorBoundary></BlogProvider></PageErrorBoundary>} />
          <Route path="/blog/publish-success" element={<PageErrorBoundary pageName="publishsuccess"><BlogProvider><PublishSuccess /></BlogProvider></PageErrorBoundary>} />
          <Route path="/blog/create" element={<PageErrorBoundary pageName="blogeditor"><BlogProvider><ProtectedRoute><BlogEditor /></ProtectedRoute></BlogProvider></PageErrorBoundary>} />
          <Route path="/profile" element={<PageErrorBoundary pageName="profile"><Profile /></PageErrorBoundary>} />
          <Route path="/subscription" element={<PageErrorBoundary pageName="subscription"><Subscription /></PageErrorBoundary>} />
          <Route path="/trips" element={<PageErrorBoundary pageName="trips"><Trips /></PageErrorBoundary>} />
          <Route path="/notifications" element={<PageErrorBoundary pageName="notifications"><Notifications /></PageErrorBoundary>} />
          <Route path="/support" element={<PageErrorBoundary pageName="support"><Support /></PageErrorBoundary>} />
          <Route path="/about" element={<PageErrorBoundary pageName="about"><About /></PageErrorBoundary>} />
          <Route path="/destinations" element={<PageErrorBoundary pageName="destinations"><Destinations /></PageErrorBoundary>} />
          <Route path="/tours" element={<PageErrorBoundary pageName="tours"><Tours /></PageErrorBoundary>} />
          <Route path="/faq" element={<PageErrorBoundary pageName="faq"><FAQ /></PageErrorBoundary>} />
          <Route path="/privacy" element={<PageErrorBoundary pageName="privacy"><Privacy /></PageErrorBoundary>} />
          <Route path="/terms" element={<PageErrorBoundary pageName="terms"><Terms /></PageErrorBoundary>} />
          <Route path="/cookies" element={<PageErrorBoundary pageName="cookies"><Cookies /></PageErrorBoundary>} />
          <Route path="/accessibility" element={<PageErrorBoundary pageName="accessibility"><Accessibility /></PageErrorBoundary>} />
          <Route path="/dashboard" element={<PageErrorBoundary pageName="dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></PageErrorBoundary>} />
          <Route path="/payment/result" element={<PageErrorBoundary pageName="paymentresult"><PaymentResult /></PageErrorBoundary>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Router>
      </SnackbarProvider>
    </AuthProvider>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

export default App;
