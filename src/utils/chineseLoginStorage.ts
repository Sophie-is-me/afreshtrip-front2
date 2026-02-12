// src/utils/chineseLoginStorage.ts
// Utility for storing and retrieving Chinese login data

/**
 * Chinese Login Response Interface
 */
export interface ChineseLoginResponse {
  token: string;
  userId: number;
  phone: string;
  nickname: string;
  msg?: string;
}

/**
 * Save Chinese login data to localStorage
 * Call this immediately after successful login
 * 
 * @param loginData - Response from Chinese login API
 * 
 * @example
 * const response = await fetch('/api/auth/login', {...});
 * const data = await response.json();
 * saveChineseLoginData(data);
 */
export const saveChineseLoginData = (loginData: ChineseLoginResponse): void => {
  console.log('💾 Saving Chinese login data to localStorage...');
  
  try {
    // 1. Save token (used by payment API)
    localStorage.setItem('token', loginData.token);
    localStorage.setItem('authToken', loginData.token);
    
    // 2. Save user data
    const userData = {
      userId: loginData.userId,
      phone: loginData.phone,
      nickname: loginData.nickname || loginData.phone
    };
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('userId', String(loginData.userId));
    
    // 3. Also save to sessionStorage as backup
    sessionStorage.setItem('token', loginData.token);
    sessionStorage.setItem('userData', JSON.stringify(userData));
    
    console.log('✅ Chinese login data saved successfully!');
    console.log('Token (first 30 chars):', loginData.token.substring(0, 30) + '...');
    console.log('User ID:', loginData.userId);
    console.log('Phone:', loginData.phone);
    
  } catch (error) {
    console.error('❌ Failed to save login data:', error);
    throw new Error('Failed to save login data');
  }
};

/**
 * Get Chinese login token from storage
 * 
 * @returns Token string or null if not logged in
 */
export const getChineseLoginToken = (): string | null => {
  return localStorage.getItem('token') || 
         localStorage.getItem('authToken') ||
         sessionStorage.getItem('token');
};

/**
 * Get Chinese login user data from storage
 * 
 * @returns User data or null if not logged in
 */
export const getChineseLoginUserData = (): {
  userId: number;
  phone: string;
  nickname: string;
} | null => {
  const userDataStr = localStorage.getItem('userData') || 
                      sessionStorage.getItem('userData');
  
  if (!userDataStr) return null;
  
  try {
    return JSON.parse(userDataStr);
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
};

/**
 * Check if user is logged in with Chinese login
 * 
 * @returns true if logged in, false otherwise
 */
export const isChineseLoginAuthenticated = (): boolean => {
  const token = getChineseLoginToken();
  const userData = getChineseLoginUserData();
  
  return !!(token && userData && userData.userId);
};

/**
 * Clear all Chinese login data (logout)
 */
export const clearChineseLoginData = (): void => {
  console.log('🗑️ Clearing Chinese login data...');
  
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
  
  // Clear sessionStorage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
  sessionStorage.removeItem('userId');
  
  console.log('✅ Chinese login data cleared');
};

/**
 * Get token expiry date
 * 
 * @returns Date object or null if token invalid
 */
export const getTokenExpiry = (): Date | null => {
  const token = getChineseLoginToken();
  if (!token) return null;
  
  try {
    // JWT token format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (base64)
    const payload = JSON.parse(atob(parts[1]));
    
    // exp is in seconds, convert to milliseconds
    if (payload.exp) {
      return new Date(payload.exp * 1000);
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * 
 * @returns true if expired, false if still valid
 */
export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  
  return expiry < new Date();
};

/**
 * Get user info summary for display
 * 
 * @returns User info string or null
 */
export const getUserInfoSummary = (): string | null => {
  const userData = getChineseLoginUserData();
  if (!userData) return null;
  
  return `${userData.nickname} (${userData.phone})`;
};

/**
 * Validate login response before saving
 * 
 * @param data - Response from login API
 * @returns true if valid, false otherwise
 */
export const validateLoginResponse = (data: any): data is ChineseLoginResponse => {
  return !!(
    data &&
    typeof data.token === 'string' &&
    typeof data.userId === 'number' &&
    typeof data.phone === 'string' &&
    data.token.length > 0 &&
    data.userId > 0
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In your login component:

import { 
  saveChineseLoginData, 
  validateLoginResponse,
  isChineseLoginAuthenticated 
} from '../utils/chineseLoginStorage';

const handleLogin = async (phone: string, code: string) => {
  try {
    const response = await fetch('API_URL/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, verificationCode: code })
    });
    
    const data = await response.json();
    
    // Validate response
    if (validateLoginResponse(data)) {
      // Save to localStorage
      saveChineseLoginData(data);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } else {
      alert('Invalid login response');
    }
    
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Check if logged in:
if (isChineseLoginAuthenticated()) {
  // User is logged in
}

// Logout:
import { clearChineseLoginData } from '../utils/chineseLoginStorage';
const handleLogout = () => {
  clearChineseLoginData();
  navigate('/login');
};
*/
