import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase/client';
import { apiClient, type UserInfo } from '../services/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/react-query/queryKeys';

interface AuthContextType {
  user: User | null;
  userProfile: UserInfo | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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

  const logout = async () => {
    await signOut(auth);
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

  // Transform firebaseUser to user for compatibility
  const user = firebaseUser;

  const value = {
    user,
    userProfile,
    loading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    updateUserProfile,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};