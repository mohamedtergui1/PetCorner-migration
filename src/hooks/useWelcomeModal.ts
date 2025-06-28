import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id: number;
  name?: string;
  phone: string;
  email?: string;
  loggedIn: boolean;
}

interface RouteParams {
  isFirstLogin?: boolean;
  userData?: UserData;
  [key: string]: any;
}

interface UseWelcomeModalReturn {
  showWelcomeModal: boolean;
  userData: UserData | null;
  isFirstLogin: boolean;
  closeWelcomeModal: () => void;
}

export const useWelcomeModal = (routeParams?: RouteParams): UseWelcomeModalReturn => {
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  // Check if this is user's first login
  const checkFirstLogin = async (): Promise<void> => {
    try {
      // Check if user just came from signup/login with firstLogin flag
      if (routeParams?.isFirstLogin) {
        setIsFirstLogin(true);
        setShowWelcomeModal(true);
        return;
      }

      // Alternative: Check if user has never seen welcome before
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      const storedUserData = await AsyncStorage.getItem('userData');
      
      if (storedUserData && !hasSeenWelcome) {
        setIsFirstLogin(true);
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Error checking first login:', error);
    }
  };

  // Load user data from AsyncStorage
  const loadUserData = async (): Promise<void> => {
    try {
      // Use userData from route params if available
      if (routeParams?.userData) {
        setUserData(routeParams.userData);
        return;
      }

      // Otherwise load from AsyncStorage
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Close welcome modal
  const closeWelcomeModal = (): void => {
    setShowWelcomeModal(false);
  };

  // Initialize on mount
  useEffect(() => {
    checkFirstLogin();
    loadUserData();
  }, [routeParams]);

  return {
    showWelcomeModal,
    userData,
    isFirstLogin,
    closeWelcomeModal,
  };
};