import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, ApiError } from '../services/apiClient';

interface PhoneLoginProps {
  onSwitchToSignup?: () => void;
}

const PhoneLogin: React.FC<PhoneLoginProps> = ({ onSwitchToSignup }) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  
  const { loginWithSms } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Validate Chinese phone number
  const isValidPhone = (phone: string): boolean => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  // Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidPhone(phone)) {
      setError('请输入有效的手机号码');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.sendSmsCode(phone);

      if (result.code === 200) {
        setStep('verify');
        setCountdown(60);
        setError('');
      } else {
        setError(result.data || result.message || result.msg || '发送验证码失败，请重试');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || '网络错误，请检查您的连接');
      } else {
        setError('发送验证码失败，请重试');
      }
      console.error('Send SMS code error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setError('');
    setLoading(true);
    
    try {
      const result = await apiClient.sendSmsCode(phone);

      if (result.code === 200) {
        setCountdown(60);
        setError('');
      } else {
        setError(result.data || result.message || result.msg || '发送验证码失败，请重试');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || '网络错误，请检查您的连接');
      } else {
        setError('发送验证码失败，请重试');
      }
      console.error('Resend SMS code error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verify code and login
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      await loginWithSms(phone, code);
      // loginWithSms will handle setting the user state and token
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || '验证码错误，请重试');
      } else if (err instanceof Error) {
        setError(err.message || '验证失败，请重试');
      } else {
        setError('验证失败，请重试');
      }
      console.error('Verify SMS code error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Go back to phone input
  const handleBack = () => {
    setStep('phone');
    setCode('');
    setError('');
  };

  // Format phone number for display
  const formatPhoneDisplay = (phone: string): string => {
    if (phone.length !== 11) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  };

  return (
    <div className="w-full">
      {/* Phone Number Input Step */}
      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Phone Input */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              手机号码
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                +86
              </span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号码"
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Get Code Button */}
          <button
            type="submit"
            disabled={loading || phone.length !== 11}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '发送中...' : '获取验证码'}
          </button>

          {/* Signup Link */}
          <div className="text-center text-sm text-gray-600">
            还没有账号？
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-teal-600 hover:text-teal-700 font-medium ml-1"
            >
              立即注册
            </button>
          </div>
        </form>
      )}

      {/* Verification Code Input Step */}
      {step === 'verify' && (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Info Message */}
          <div className="bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-lg text-sm">
            验证码已发送至 +86 {formatPhoneDisplay(phone)}
          </div>

          {/* Code Input */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              验证码
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="请输入6位验证码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
              disabled={loading}
              maxLength={6}
              required
              autoFocus
            />
          </div>

          {/* Resend Code */}
          <div className="text-center text-sm">
            {countdown > 0 ? (
              <span className="text-gray-500">
                {countdown}秒后可重新发送
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                className="text-teal-600 hover:text-teal-700 font-medium"
                disabled={loading}
              >
                重新发送验证码
              </button>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className="w-full text-gray-600 py-2 text-sm hover:text-gray-800 transition-colors"
          >
            ← 返回修改手机号
          </button>
        </form>
      )}
    </div>
  );
};

export default PhoneLogin;
