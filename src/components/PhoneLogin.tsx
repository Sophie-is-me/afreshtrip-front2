import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Loader2, ShieldCheck } from 'lucide-react';
import { useSnackbar } from '../contexts/SnackbarContext';
import { useCountdown } from '../hooks/useCountdown';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';

const PhoneLogin: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const { loginWithSms } = useAuth();

  // Logic Hooks
  const { timeLeft, isActive, startCountdown } = useCountdown(60);

  // Form State
  const [regionCode, setRegionCode] = useState('+86');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [agreed, setAgreed] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [shakeTerms, setShakeTerms] = useState(false);

  // Validation
  const isValidPhone = /^1[3-9]\d{9}$/.test(phoneNumber);

  const handleSendCode = async () => {
    if (!phoneNumber) {
      showError('请输入手机号码 (Please enter phone number)');
      return;
    }
    if (regionCode === '+86' && !isValidPhone) {
      showError('请输入有效的手机号码 (Invalid phone format)');
      return;
    }

    setIsSendingCode(true);
    try {
      // 1. Start UI Timer immediately for better UX
      startCountdown();

      // 2. Call Real SMS API using centralized service
      // Extract clean phone number without region code
      const cleanPhone = regionCode === '+86' ? phoneNumber : `${regionCode}${phoneNumber}`;
      
      const result = await apiClient.sendSmsCode(cleanPhone);

      if (result.code === 200) {
        showSuccess('验证码已发送 (Verification code sent)');
      } else {
        throw new Error(result.message || '发送失败 (Failed to send)');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '发送失败 (Failed to send)');
      // Stop countdown on error
      if (isActive) {
        // Reset countdown state
        setTimeout(() => window.location.reload(), 1000);
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleLogin = async () => {
    // 1. Validation Checks
    if (!agreed) {
      setShakeTerms(true);
      setTimeout(() => setShakeTerms(false), 500); // Reset shake animation
      showError('请先阅读并同意用户协议 (Please agree to terms)');
      return;
    }
    if (!phoneNumber || !verifyCode) {
      showError('请填写完整信息 (Please fill in all fields)');
      return;
    }

    // 2. API Call
    setIsLoading(true);
    try {
      // Extract clean phone number without region code
      const cleanPhone = regionCode === '+86' ? phoneNumber : `${regionCode}${phoneNumber}`;
      
      await loginWithSms(cleanPhone, verifyCode);
      
      showSuccess('登录成功！');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      showError(error instanceof Error ? error.message : '登录失败 (Login failed)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Input Group: Phone */}
      <div className="space-y-2">
        <div className="flex rounded-lg border border-gray-300 focus-within:border-teal-600 focus-within:ring-1 focus-within:ring-teal-600 transition-all overflow-hidden bg-white">
          {/* Region Selector */}
          <div className="relative border-r border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-colors group">
            <select
              value={regionCode}
              onChange={(e) => setRegionCode(e.target.value)}
              className="appearance-none bg-transparent h-12 pl-4 pr-8 text-gray-700 font-medium focus:outline-none cursor-pointer text-sm w-full"
            >
              <option value="+86">CN +86</option>
              {/* <option value="+852">HK +852</option>
              <option value="+853">MO +853</option>
              <option value="+886">TW +886</option> */}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 pointer-events-none transition-colors" size={14} />
          </div>

          {/* Phone Number Input */}
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="请输入手机号码"
            className="flex-1 h-12 px-4 text-gray-900 placeholder-gray-400 focus:outline-none text-base bg-transparent"
          />
        </div>
      </div>

      {/* Input Group: Verify Code */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-lg border border-gray-300 focus-within:border-teal-600 focus-within:ring-1 focus-within:ring-teal-600 transition-all bg-white relative">
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="验证码"
            className="w-full h-12 px-4 text-gray-900 placeholder-gray-400 focus:outline-none text-base bg-transparent rounded-lg"
            maxLength={6}
          />
          <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
        </div>

        <button
          onClick={handleSendCode}
          disabled={isActive || isSendingCode || !phoneNumber}
          className={`
            h-12 px-4 rounded-lg text-sm font-medium transition-all min-w-[120px] border
            ${isActive || isSendingCode
              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-teal-600 border-teal-600 hover:bg-teal-50 active:bg-teal-100'
            }
          `}
        >
          {isSendingCode ? (
            <Loader2 className="animate-spin h-4 w-4 mx-auto" />
          ) : isActive ? (
            `${timeLeft}s 后重试`
          ) : (
            '获取验证码'
          )}
        </button>
      </div>

      {/* Terms Checkbox */}
      <div className={`flex items-start gap-2 text-xs text-gray-500 transition-transform ${shakeTerms ? 'animate-shake text-red-500' : ''}`}>
        <input
          type="checkbox"
          id="terms"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            if (e.target.checked) setShakeTerms(false);
          }}
          className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
        />
        <label htmlFor="terms" className="cursor-pointer select-none leading-5">
          登录即代表同意
          <span className="text-teal-600 hover:underline mx-1 cursor-pointer">《用户协议》</span>
          和
          <span className="text-teal-600 hover:underline mx-1 cursor-pointer">《隐私政策》</span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`
          w-full h-12 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg shadow-sm
          transition-all active:scale-[0.99] text-base flex items-center justify-center gap-2
          ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}
        `}
      >
        {isLoading && <Loader2 className="animate-spin" size={20} />}
        {isLoading ? '登录中...' : '登录'}
      </button>

      {/* Helper Links */}
      <div className="flex justify-center">
         <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            遇到问题? 联系客服
         </button>
      </div>
    </div>
  );
};

export default PhoneLogin;