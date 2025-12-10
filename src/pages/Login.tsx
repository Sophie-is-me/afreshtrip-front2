import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoginForm from '../components/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-50">
      <Header showNavLinks={false} />
      <main className="flex justify-center items-center min-h-[calc(100vh-80px)] px-8 py-8">
        <LoginForm />
      </main>
      <Footer />
    </div>
  );
};

export default Login;