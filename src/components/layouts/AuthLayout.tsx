import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Visual Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-teal-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Travel Background"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          <div className="flex items-center gap-3">
             {/* Logo */}
             <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                <span className="font-bold text-xl">A</span>
             </div>
             <span className="text-2xl font-bold tracking-tight">Afreshtrip</span>
          </div>

          <div className="mb-12">
            <blockquote className="text-3xl font-medium leading-tight mb-6">
              "旅行不仅仅是看风景，更是发现全新的自己。"
            </blockquote>
            <p className="text-teal-100 text-lg">— 您的智能旅行管家</p>
          </div>

          <div className="text-sm text-teal-200/80">
            © 2025 Afreshtrip. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden text-center mb-8">
             <div className="inline-flex items-center gap-2 mb-4">
                <img src="/assets/tubiao.png" alt="Logo" className="w-10 h-10 rounded-full" />
                <span className="text-2xl font-bold text-teal-900">Afreshtrip</span>
             </div>
          </div>

          {/* Form Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {title || '欢迎回来'}
            </h2>
            <p className="mt-2 text-gray-500">
              {subtitle || '开启您的下一段精彩旅程'}
            </p>
          </div>

          {/* Main Content (Tabs + Forms) */}
          <div className="mt-8">
            {children}
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-auto pt-8 text-center text-xs text-gray-400">
            © 2025 Afreshtrip. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;