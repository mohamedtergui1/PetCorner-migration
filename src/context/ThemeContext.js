// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Définir les thèmes de couleur
const blueThemeColors = {
  primary: '#007afe',
  secondary: '#0055b3',
  accent: '#40a9ff',
};

const orangeThemeColors = {
  primary: '#fe9400',
  secondary: '#d97800',
  accent: '#ffa940',
};

// Définir le thème sombre (avec support pour le choix de couleur)
const getThemes = (colorTheme) => {
  const colorSet = colorTheme === 'orange' ? orangeThemeColors : blueThemeColors;
  
  return {
    dark: {
      ...colorSet,
      backgroundColor: '#121212',
      cardBackground: '#1e1e1e',
      textColor: '#ffffff',
      secondaryTextColor: '#b3b3b3',
      borderColor: '#2c2c2c',
      rowBackground: '#2c2c2c',
      iconTint: '#b3b3b3',
      statusBar: 'light-content',
      statusBarBackground: '#121212',
    },
    light: {
      ...colorSet,
      backgroundColor: '#ffffff',
      cardBackground: '#f5f5f5',
      textColor: '#000000',
      secondaryTextColor: '#6e6e6e',
      borderColor: '#e0e0e0',
      rowBackground: '#f5f5f5',
      iconTint: '#6e6e6e',
      statusBar: 'dark-content',
      statusBarBackground: '#ffffff',
    }
  };
};

// Créer le contexte
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le thème
export const useTheme = () => useContext(ThemeContext);

// Fournisseur de thème
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorTheme, setColorTheme] = useState('blue'); // 'blue' par défaut
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences au démarrage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem('isDarkMode');
        const savedColorTheme = await AsyncStorage.getItem('colorTheme');
        
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }
        
        if (savedColorTheme !== null) {
          setColorTheme(savedColorTheme);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading theme preferences:', error);
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Basculer entre le mode sombre et le mode clair
  const toggleTheme = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem('isDarkMode', newValue.toString());
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  // Basculer entre les thèmes orange et bleu
  const toggleColorTheme = async () => {
    try {
      const newColorTheme = colorTheme === 'blue' ? 'orange' : 'blue';
      setColorTheme(newColorTheme);
      await AsyncStorage.setItem('colorTheme', newColorTheme);
    } catch (error) {
      console.error('Error saving color theme preference:', error);
    }
  };

  // Obtenir le thème actuel basé sur le mode et la couleur
  const themes = getThemes(colorTheme);
  const theme = isDarkMode ? themes.dark : themes.light;

  if (isLoading) {
    // Retourner un écran de chargement ou un thème par défaut
    return <></>;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDarkMode, 
      toggleTheme,
      colorTheme,
      toggleColorTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};