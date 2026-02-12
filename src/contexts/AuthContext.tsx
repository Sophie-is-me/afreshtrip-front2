import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase/client';
import { apiClient, type UserInfo } from '../services/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/react-query/queryKeys';

// Custom user type for Chinese authentication
interface CustomUser {
  uid: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  isCustomAuth: true;
  metadata?: {
    creationTime: string;
  };
}

// Union type for Firebase or Custom user
export type AuthUser = User | CustomUser;

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserInfo | null;
  loading: boolean;
  isCustomAuth: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithSms: (phone: string, code: string) => Promise<void>;
  registerWithSms: (phone: string, code: string, password: string) => Promise<void>;
  loginWithEmailCode: (email: string, code: string) => Promise<void>;
  loginWithAlipay: () => Promise<void>;
  loginWithWeChat: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: {
    nickname?: string;
    gender?: string;
    phone?: string;
    imageUrl?: string;
    birthDate?: string;
  }) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [customUser, setCustomUser] = useState<CustomUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const queryClient = useQueryClient();

  // React Query for User Profile
  const { data: userProfileData, isLoading: isProfileLoading } = useQuery<UserInfo>({
    queryKey: QUERY_KEYS.user.profile((firebaseUser?.uid || customUser?.uid) || ''),
    queryFn: async () => {
      if (!firebaseUser && !customUser) throw new Error('No user');
      try {
        if (firebaseUser) {
          await firebaseUser.getIdToken(false);
        }
        return await apiClient.getUserInfo();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        const user = firebaseUser || customUser;
        if (user) {
          return {
            userId: parseInt(user.uid, 10),
            email: user.email || undefined,
            nickname: user.displayName || undefined,
            imageurl: firebaseUser?.photoURL || undefined,
          };
        }
        throw error;
      }
    },
    enabled: !!(firebaseUser || customUser),
    retry: false,
  });

  const userProfile = userProfileData || null;

  useEffect(() => {
    const isChineseVersion = import.meta.env.VITE_IS_CHINESE_VERSION === 'true';

    if (!isChineseVersion) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user ? 'authenticated' : 'not authenticated');
        setFirebaseUser(user);
        setAuthLoading(false);
      });

      return unsubscribe;
    } else {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const isChineseVersion = import.meta.env.VITE_IS_CHINESE_VERSION === 'true';

    if (isChineseVersion) {
      const customToken = localStorage.getItem('custom_auth_token');
      const customUserData = localStorage.getItem('custom_user_data');

      if (customToken) {
        if (customUserData) {
          try {
            const parsedUser: CustomUser = JSON.parse(customUserData);
            setCustomUser(parsedUser);
            console.log('Restored custom auth state for Chinese user:', parsedUser.displayName || parsedUser.phone || parsedUser.email);
          } catch (error) {
            console.error('Failed to parse stored custom user data:', error);
            localStorage.removeItem('custom_auth_token');
            localStorage.removeItem('custom_user_data');
          }
        } else {
          (async () => {
            try {
              const userInfo = await apiClient.getUserInfo();
              if (userInfo.userId) {
                const mockCustomUser: CustomUser = {
                  uid: userInfo.userId.toString(),
                  email: userInfo.email || undefined,
                  phone: userInfo.phone || undefined,
                  displayName: userInfo.nickname || undefined,
                  emailVerified: true,
                  isCustomAuth: true
                };
                setCustomUser(mockCustomUser);
                localStorage.setItem('custom_user_data', JSON.stringify(mockCustomUser));
                console.log('Fetched and restored custom auth state for Chinese user:', mockCustomUser.displayName || mockCustomUser.phone || mockCustomUser.email);
              } else {
                throw new Error('Invalid user info');
              }
            } catch (error) {
              console.error('Failed to fetch user info for restoration:', error);
              if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
                console.warn('Clearing invalid auth token due to authentication error');
                localStorage.removeItem('custom_auth_token');
              } else {
                console.warn('Keeping auth token despite restoration failure - may be temporary issue');
              }
            }
          })();
        }
      }
    }
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithSms = async (phone: string, code: string) => {
    try {
      console.log('🔐 Starting SMS login...');
      const response = await apiClient.verifySmsCode(phone, code);
      
      console.log('📱 API Response:', response);
      console.log('Response code:', response.code);
      console.log('Response data:', response.data);

      // ✅ CHECK IF RESPONSE IS SUCCESSFUL
      if (response.code !== 200) {
        throw new Error(response.message || response.msg || 'SMS verification failed');
      }

      // ✅ CHECK IF DATA EXISTS
      if (!response.data) {
        console.error('❌ No data in response!');
        throw new Error('Invalid response from server - missing data');
      }

      // ✅ CHECK IF TOKEN EXISTS
      if (!response.data.token) {
        console.error('❌ No token in response.data!');
        console.error('Response.data contents:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response from server - missing token');
      }

      // ✅ CHECK IF USERID EXISTS
      if (!response.data.userId) {
        console.error('❌ No userId in response.data!');
        console.error('Response.data contents:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response from server - missing userId');
      }

      console.log('✅ Valid response received');
      console.log('Token:', response.data.token.substring(0, 30) + '...');
      console.log('User ID:', response.data.userId);

      // Store the custom JWT token
      localStorage.setItem('custom_auth_token', response.data.token);

      // Create a mock Firebase user for compatibility
      const mockCustomUser: CustomUser = {
        uid: response.data.userId.toString(),
        phone: response.data.phone || phone,
        displayName: response.data.nickname || phone,
        emailVerified: true,
        isCustomAuth: true
      };

      // Store user data for persistence
      localStorage.setItem('custom_user_data', JSON.stringify(mockCustomUser));

      setCustomUser(mockCustomUser);

      // Update user profile with the new user info
      await queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.user.profile(response.data.userId.toString()) 
      });

      console.log('✅ SMS login successful!');

    } catch (error) {
      console.error('❌ SMS login error:', error);
      throw error;
    }
  };

  const registerWithSms = async (phone: string, code: string, password: string) => {
    try {
      const response = await apiClient.registerWithSms(phone, code, password);

      if (response.code !== 200) {
        throw new Error(response.message || response.msg || 'SMS registration failed');
      }

      if (!response.data || !response.data.token || !response.data.userId) {
        throw new Error('Invalid response from server - missing required data');
      }

      // Store the custom JWT token
      localStorage.setItem('custom_auth_token', response.data.token);

      // Create a custom user
      const mockCustomUser: CustomUser = {
        uid: response.data.userId.toString(),
        phone: response.data.phone || phone,
        displayName: response.data.nickname || phone,
        emailVerified: true,
        isCustomAuth: true,
        metadata: {
          creationTime: new Date().toISOString(),
        }
      };

      // Store user data for persistence
      localStorage.setItem('custom_user_data', JSON.stringify(mockCustomUser));

      setCustomUser(mockCustomUser);

      // Fetch user profile
      await queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.user.profile(response.data.userId.toString()) 
      });

      console.log('SMS registration successful:', mockCustomUser.phone);
    } catch (error) {
      console.error('SMS registration error:', error);
      throw error;
    }
  };

  const loginWithEmailCode = async (email: string, code: string) => {
    try {
      const response = await apiClient.verifyEmailCode(email, code);

      if (response.code !== 200) {
        throw new Error(response.message || response.msg || 'Email verification failed');
      }

      if (!response.data || !response.data.token || !response.data.userId) {
        throw new Error('Invalid response from server - missing required data');
      }

      // Store the custom JWT token
      localStorage.setItem('custom_auth_token', response.data.token);

      // Create a mock Firebase user for compatibility
      const mockCustomUser: CustomUser = {
        uid: response.data.userId.toString(),
        email: response.data.email || email,
        displayName: response.data.nickname || email,
        emailVerified: true,
        isCustomAuth: true
      };

      // Store user data for persistence
      localStorage.setItem('custom_user_data', JSON.stringify(mockCustomUser));

      setCustomUser(mockCustomUser);

      // Update user profile with the new user info
      await queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.user.profile(response.data.userId.toString()) 
      });

    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const loginWithAlipay = async () => {
    console.log('Alipay login initiated');
    throw new Error('Alipay login not yet implemented');
  };

  const loginWithWeChat = async () => {
    console.log('WeChat login initiated');
    throw new Error('WeChat login not yet implemented');
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Firebase logout error:', error);
    }

    // Clear custom auth
    localStorage.removeItem('custom_auth_token');
    localStorage.removeItem('custom_user_data');
    setCustomUser(null);

    // Clear user profile cache
    queryClient.clear();
  };

  const refreshUserProfile = async () => {
    const user = firebaseUser || customUser;
    if (!user) return;

    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.user.profile(user.uid)
    });
  };

  const updateUserProfile = async (profileData: {
    nickname?: string;
    gender?: string;
    phone?: string;
    imageUrl?: string;
    birthDate?: string;
  }) => {
    try {
      const userDto = {
        nickname: profileData.nickname || '',
        gender: profileData.gender,
        phone: profileData.phone,
        imageurl: profileData.imageUrl,
        birthDate: profileData.birthDate,
      };

      console.log('Updating user profile with:', userDto);

      const response = await apiClient.updateUserProfile(userDto);
      if (response) {
        await refreshUserProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  const loading = authLoading || (!!firebaseUser && isProfileLoading);
  const user = customUser || firebaseUser;
  const isCustomAuth = !!customUser;

  const value = {
    user,
    userProfile,
    loading,
    isCustomAuth,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithSms,
    registerWithSms,
    loginWithEmailCode,
    loginWithAlipay,
    loginWithWeChat,
    logout,
    updateUserProfile,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
