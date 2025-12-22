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
type AuthUser = User | CustomUser;

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserInfo | null;
  loading: boolean;
  isCustomAuth: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithSms: (phone: string, code: string) => Promise<void>;
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
    queryKey: QUERY_KEYS.user.profile(firebaseUser?.uid || ''),
    queryFn: async () => {
      if (!firebaseUser) throw new Error('No user');
      try {
        // Try to get ID token to ensure user is fully authenticated
        await firebaseUser.getIdToken(false);
        return await apiClient.getUserInfo();
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Return basic profile from Firebase user as fallback
        return {
          userId: parseInt(firebaseUser.uid, 10), // Convert uid to number for backend compatibility
          email: firebaseUser.email || undefined,
          nickname: firebaseUser.displayName || undefined,
          imageurl: firebaseUser.photoURL || undefined, // Note: backend uses 'imageurl'
        };
      }
    },
    enabled: !!firebaseUser, // Only fetch if firebase user exists
    retry: false, // Don't retry on profile fetch failure
  });

  // Ensure userProfile is never undefined
  const userProfile = userProfileData || null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'authenticated' : 'not authenticated');
      setFirebaseUser(user);
      setAuthLoading(false);
    });

    return unsubscribe;
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
      const response = await apiClient.verifySmsCode(phone, code);
      
      if (response.code === 200 && response.data) {
        // Store the custom JWT token
        localStorage.setItem('custom_auth_token', response.data.token);
        
        // Create a mock Firebase user for compatibility
        const mockCustomUser: CustomUser = {
          uid: response.data.userId.toString(),
          phone: response.data.phone,
          displayName: response.data.nickname,
          emailVerified: true,
          isCustomAuth: true
        };
        
        setCustomUser(mockCustomUser);
        
        // Update user profile with the new user info
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.profile(response.data.userId.toString()) });
      } else {
        throw new Error(response.message || 'SMS verification failed');
      }
    } catch (error) {
      console.error('SMS login error:', error);
      throw error;
    }
  };

  const loginWithEmailCode = async (email: string, code: string) => {
    try {
      const response = await apiClient.verifyEmailCode(email, code);
      
      if (response.code === 200 && response.data) {
        // Store the custom JWT token
        localStorage.setItem('custom_auth_token', response.data.token);
        
        // Create a mock Firebase user for compatibility
        const mockCustomUser: CustomUser = {
          uid: response.data.userId.toString(),
          email: response.data.email,
          displayName: response.data.nickname,
          emailVerified: true,
          isCustomAuth: true
        };
        
        setCustomUser(mockCustomUser);
        
        // Update user profile with the new user info
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.profile(response.data.userId.toString()) });
      } else {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const loginWithAlipay = async () => {
    // Placeholder for Alipay login - will call backend API later
    console.log('Alipay login initiated');
    throw new Error('Alipay login not yet implemented');
  };

  const loginWithWeChat = async () => {
    // Placeholder for WeChat login - will call backend API later
    console.log('WeChat login initiated');
    throw new Error('WeChat login not yet implemented');
  };

  const logout = async () => {
    // Clear both Firebase and custom auth
    try {
      if (firebaseUser) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Firebase logout error:', error);
    }
    
    // Clear custom auth
    localStorage.removeItem('custom_auth_token');
    setCustomUser(null);
    
    // Clear user profile cache
    queryClient.clear();
  };



  const refreshUserProfile = async () => {
    if (!firebaseUser) return;

    // Use React Query to invalidate and refetch
    await queryClient.invalidateQueries({ 
      queryKey: QUERY_KEYS.user.profile(firebaseUser.uid) 
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
      // Transform the data to match UserDto interface (nickname is required)
      const userDto = {
        nickname: profileData.nickname || '', // Default to empty string if not provided
        gender: profileData.gender,
        phone: profileData.phone,
        imageurl: profileData.imageUrl, // Note: backend expects 'imageurl'
        birthDate: profileData.birthDate,
      };

      console.log('Updating user profile with:', userDto);

      const response = await apiClient.updateUserProfile(userDto);
      if (response) {
        // Refresh user profile after successful update using React Query
        await refreshUserProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  // Combined loading state
  const loading = authLoading || (!!firebaseUser && isProfileLoading);

  // Determine current user - prioritize custom auth for Chinese users
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
    loginWithEmailCode,
    loginWithAlipay,
    loginWithWeChat,
    logout,
    updateUserProfile,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};