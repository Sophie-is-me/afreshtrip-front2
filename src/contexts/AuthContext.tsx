import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase/client';
import { apiClient, type UserInfo } from '../services/apiClient';

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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'authenticated' : 'not authenticated');
      setUser(user);

      if (user) {
        // Wait a moment for Firebase to fully initialize
        try {
          // Try to get ID token to ensure user is fully authenticated
          await user.getIdToken(false);
          
          // Fetch user profile from backend when user is authenticated
          const response = await apiClient.getUserInfo();
          
          setUserProfile(response);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Set basic profile from Firebase user as fallback
          setUserProfile({
            userId: parseInt(user.uid, 10), // Convert uid to number for backend compatibility
            email: user.email || undefined,
            nickname: user.displayName || undefined,
            imageurl: user.photoURL || undefined, // Note: backend uses 'imageurl'
          });
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
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

  const updateUserProfile = async (profileData: {
    nickname?: string;
    gender?: string;
    phone?: string;
    imageUrl?: string;
  }) => {
    try {
      // Transform the data to match UserDto interface (nickname is required)
      const userDto = {
        nickname: profileData.nickname || '', // Default to empty string if not provided
        gender: profileData.gender,
        phone: profileData.phone,
        imageurl: profileData.imageUrl, // Note: backend expects 'imageurl'
      };
      
      const response = await apiClient.updateUserProfile(userDto);
      if (response) {
        // Refresh user profile after successful update
        await refreshUserProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getUserInfo();
      setUserProfile(response);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

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