import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Snackbar from '../components/ui/Snackbar';
import type { SnackbarType, SnackbarAction } from '../components/ui/Snackbar';
import { i18nErrorHandler } from '../utils/i18nErrorHandler';

export interface SnackbarData {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number;
  actions?: SnackbarAction[];
}

interface SnackbarContextType {
  snackbars: SnackbarData[];
  showSnackbar: (data: Omit<SnackbarData, 'id'>) => void;
  hideSnackbar: (id: string) => void;
  hideAll: () => void;
  showError: (message: string, actions?: SnackbarAction[], duration?: number) => void;
  showSuccess: (message: string, actions?: SnackbarAction[], duration?: number) => void;
  showWarning: (message: string, actions?: SnackbarAction[], duration?: number) => void;
  showInfo: (message: string, actions?: SnackbarAction[], duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snackbars, setSnackbars] = useState<SnackbarData[]>([]);

  const generateId = () => `snackbar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showSnackbar = useCallback((data: Omit<SnackbarData, 'id'>) => {
    const newSnackbar: SnackbarData = {
      id: generateId(),
      ...data
    };
    setSnackbars(prev => [...prev, newSnackbar]);
  }, []);

  const hideSnackbar = useCallback((id: string) => {
    setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
  }, []);

  const hideAll = useCallback(() => {
    setSnackbars([]);
  }, []);

  const showError = useCallback((message: string, actions?: SnackbarAction[], duration = 6000) => {
    showSnackbar({ message, type: 'error', actions, duration });
  }, [showSnackbar]);

  const showSuccess = useCallback((message: string, actions?: SnackbarAction[], duration = 4000) => {
    showSnackbar({ message, type: 'success', actions, duration });
  }, [showSnackbar]);

  const showWarning = useCallback((message: string, actions?: SnackbarAction[], duration = 5000) => {
    showSnackbar({ message, type: 'warning', actions, duration });
  }, [showSnackbar]);

  const showInfo = useCallback((message: string, actions?: SnackbarAction[], duration = 4000) => {
    showSnackbar({ message, type: 'info', actions, duration });
  }, [showSnackbar]);

  // Initialize error handler with snackbar methods
  useEffect(() => {
    i18nErrorHandler.initializeSnackbar({
      showError,
      showSuccess,
      showWarning,
      showInfo
    });
  }, [showSnackbar]); // Only depend on showSnackbar to avoid circular dependency

  const value = {
    snackbars,
    showSnackbar,
    hideSnackbar,
    hideAll,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <SnackbarContainer />
    </SnackbarContext.Provider>
  );
};

const SnackbarContainer: React.FC = () => {
  const { hideSnackbar, snackbars } = useSnackbar();

  if (snackbars.length === 0) return null;

  return (
    <>
      {snackbars.map((snackbar: SnackbarData) => (
        <Snackbar
          key={snackbar.id}
          id={snackbar.id}
          message={snackbar.message}
          type={snackbar.type}
          duration={snackbar.duration}
          actions={snackbar.actions}
          onClose={hideSnackbar}
        />
      ))}
    </>
  );
};

export default SnackbarProvider;