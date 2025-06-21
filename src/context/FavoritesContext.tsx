import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of our context
interface FavoritesContextType {
  favoriteIds: string[];
  addToFavorites: (productId: string) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  clearFavorites: () => void;
  favoriteCount: number;
}

// Create the context
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Provider component props
interface FavoritesProviderProps {
  children: ReactNode;
}

// Storage key for AsyncStorage
const FAVORITES_STORAGE_KEY = '@favorites';

// Provider component
export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Load favorites from AsyncStorage on component mount
  useEffect(() => {
    loadFavorites();
  }, []);

  // Save favorites to AsyncStorage whenever favoriteIds changes
  useEffect(() => {
    saveFavorites(favoriteIds);
  }, [favoriteIds]);

  // Load favorites from AsyncStorage
  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        setFavoriteIds(parsedFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // Save favorites to AsyncStorage
  const saveFavorites = async (favorites: string[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Add a product to favorites
  const addToFavorites = (productId: string) => {
    setFavoriteIds(prev => {
      if (!prev.includes(productId)) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  // Remove a product from favorites
  const removeFromFavorites = (productId: string) => {
    setFavoriteIds(prev => prev.filter(id => id !== productId));
  };

  // Check if a product is in favorites
  const isFavorite = (productId: string): boolean => {
    return favoriteIds.includes(productId);
  };

  // Toggle favorite status of a product
  const toggleFavorite = (productId: string) => {
    if (isFavorite(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(productId);
    }
  };

  // Clear all favorites
  const clearFavorites = () => {
    setFavoriteIds([]);
  };

  // Get favorite count
  const favoriteCount = favoriteIds.length;

  const value: FavoritesContextType = {
    favoriteIds,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    favoriteCount,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Custom hook to use the favorites context
export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;