import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';

// Layouts & Components
import AuthLayout from '../components/layouts/AuthLayout';
import AuthTabs from '../components/auth/AuthTabs';
import type { LoginMethod } from '../components/auth/AuthTabs';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Login Forms
import LoginForm from '../components/LoginForm';
import ChineseLoginForm from '../components/ChineseLoginForm';
import PhoneLogin from '../components/PhoneLogin';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
   const { user } = useAuth();

  // Environment Flag
  const isChineseVersion = import.meta.env.VITE_IS_CHINESE_VERSION === 'true';

  // State for Chinese Login UI
  const [activeMethod, setActiveMethod] = useState<LoginMethod>('phone');

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  // --- Chinese Market Layout ---
  if (isChineseVersion) {
    // Dynamic Header Text based on active tab
    const getHeaderText = () => {
      switch (activeMethod) {
        case 'qr': return { title: '扫码登录', subtitle: '打开 微信 或 支付宝 扫一扫' };
        case 'email': return { title: '邮箱验证登录', subtitle: '开启您的下一段精彩旅程' };
        default: return { title: '欢迎回来', subtitle: '开启您的下一段精彩旅程' };
      }
    };

    const headerText = getHeaderText();

    return (
      <AuthLayout title={headerText.title} subtitle={headerText.subtitle}>
        {/* Navigation Tabs */}
        <AuthTabs activeMethod={activeMethod} onChange={setActiveMethod} />

        {/* --- Content Area --- */}
        <div className="mt-6 min-h-[300px]">

          {/* 1. Phone Login (SMS) */}
          {activeMethod === 'phone' && (
            <PhoneLogin />
          )}

          {/* 2. Email Login (Email Verification Code) */}
          {activeMethod === 'email' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ChineseLoginForm
                redirectTo="/"
              />
            </div>
          )}

        </div>
      </AuthLayout>
    );
  }

  // --- International / Firebase Layout (Existing) ---
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 to-blue-50 flex flex-col">
      <Header showNavLinks={false} />
      <main className="flex-1 flex justify-center items-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;