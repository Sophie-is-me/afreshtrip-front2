import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Layouts & Components
import AuthLayout from '../components/layouts/AuthLayout';
import AuthTabs from '../components/auth/AuthTabs';
import type { LoginMethod } from '../components/auth/AuthTabs';

// Login Forms
import LoginForm from '../components/LoginForm';
import ChineseLoginForm from '../components/ChineseLoginForm';
import PhoneLogin from '../components/PhoneLogin';
import PhoneSignup from '../components/PhoneSignup';
import { useAuth } from '../contexts/AuthContext';

type ChineseMode = 'login' | 'signup';

const Login: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Environment Flag
  const isChineseVersion = import.meta.env.VITE_IS_CHINESE_VERSION === 'true';

  // State for Chinese Login/Signup mode
  const [chineseMode, setChineseMode] = useState<ChineseMode>('login');
  
  // State for Chinese Login UI tabs
  const [activeMethod, setActiveMethod] = useState<LoginMethod>('phone');

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  // --- Chinese Market Layout ---
  if (isChineseVersion) {
    // Dynamic Header Text based on mode and active tab
    const getHeaderText = () => {
      if (chineseMode === 'signup') {
        return { 
          title: '创建账号', 
          subtitle: '开启您的下一段精彩旅程' 
        };
      }
      
      // Login mode
      switch (activeMethod) {
        case 'qr': 
          return { 
            title: '扫码登录', 
            subtitle: '打开 微信 或 支付宝 扫一扫' 
          };
        case 'email': 
          return { 
            title: '邮箱验证登录', 
            subtitle: '开启您的下一段精彩旅程' 
          };
        default: 
          return { 
            title: '欢迎回来', 
            subtitle: '开启您的下一段精彩旅程' 
          };
      }
    };

    const headerText = getHeaderText();

    return (
      <AuthLayout title={headerText.title} subtitle={headerText.subtitle}>
        {/* Show tabs only in login mode */}
        {chineseMode === 'login' && (
          <AuthTabs activeMethod={activeMethod} onChange={setActiveMethod} />
        )}

        {/* --- Content Area --- */}
        <div className="mt-6 min-h-[300px]">
          {/* LOGIN MODE */}
          {chineseMode === 'login' && (
            <>
              {/* 1. Phone Login (SMS) */}
              {activeMethod === 'phone' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <PhoneLogin onSwitchToSignup={() => setChineseMode('signup')} />
                </div>
              )}

              {/* 2. Email Login (Email Verification Code) */}
              {activeMethod === 'email' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <ChineseLoginForm redirectTo="/" />
                  
                  {/* Signup Link for Email tab */}
                  <div className="mt-6 text-center text-sm text-gray-600">
                    还没有账号？
                    <button
                      type="button"
                      onClick={() => setChineseMode('signup')}
                      className="text-teal-600 hover:text-teal-700 font-medium ml-1"
                    >
                      立即注册
                    </button>
                  </div>
                </div>
              )}

              {/* 3. QR Code Login (if implemented) */}
              {activeMethod === 'qr' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    {/* Placeholder for QR Code */}
                    <div className="w-64 h-64 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <p className="text-sm">扫码登录功能</p>
                        <p className="text-xs mt-1">即将推出</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      使用微信或支付宝扫描二维码登录
                    </p>

                    {/* Signup Link */}
                    <div className="pt-4 text-sm text-gray-600">
                      还没有账号？
                      <button
                        type="button"
                        onClick={() => setChineseMode('signup')}
                        className="text-teal-600 hover:text-teal-700 font-medium ml-1"
                      >
                        立即注册
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* SIGNUP MODE */}
          {chineseMode === 'signup' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <PhoneSignup onSwitchToLogin={() => setChineseMode('login')} />
            </div>
          )}
        </div>
      </AuthLayout>
    );
  }

  // --- International / Firebase Layout (Unified Professional Design) ---
  return (
    <AuthLayout 
      title={t('loginForm.welcomeBack', { defaultValue: 'Welcome Back' })}
      subtitle={t('loginForm.loginSubtitle', { defaultValue: 'Start your next journey' })}
    >
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <LoginForm 
          variant="plain" 
          redirectTo="/" 
        />
      </div>
    </AuthLayout>
  );
};

export default Login;
