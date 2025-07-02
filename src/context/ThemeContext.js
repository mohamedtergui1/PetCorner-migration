// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, Platform } from 'react-native';
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
  const [themeMode, setThemeMode] = useState('system'); // 'system', 'light', 'dark'

  // Obtenir le thème par défaut du système
  const getSystemTheme = () => {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark';
  };

  // Mettre à jour le thème basé sur le mode sélectionné
  const updateThemeBasedOnMode = (mode, systemIsDark = null) => {
    const currentSystemTheme = systemIsDark !== null ? systemIsDark : getSystemTheme();
    
    switch (mode) {
      case 'system':
        setIsDarkMode(currentSystemTheme);
        break;
      case 'dark':
        setIsDarkMode(true);
        break;
      case 'light':
        setIsDarkMode(false);
        break;
      default:
        setIsDarkMode(currentSystemTheme);
    }
  };

  // Charger les préférences au démarrage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        const savedColorTheme = await AsyncStorage.getItem('colorTheme');

        // Charger le thème de couleur sauvegardé ou utiliser 'blue' par défaut
        if (savedColorTheme !== null) {
          setColorTheme(savedColorTheme);
        }

        // Charger le mode de thème sauvegardé ou utiliser 'system' par défaut
        const modeToUse = savedThemeMode || 'system';
        setThemeMode(modeToUse);

        // Appliquer le thème basé sur le mode
        updateThemeBasedOnMode(modeToUse);

        console.log(`🎨 Loaded theme mode: ${modeToUse}, Color: ${savedColorTheme || 'blue'}`);
        console.log(`🎨 Current system theme: ${getSystemTheme() ? 'dark' : 'light'}`);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading theme preferences:', error);
        // En cas d'erreur, utiliser le thème du système
        setThemeMode('system');
        updateThemeBasedOnMode('system');
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Écouter les changements du thème système
  useEffect(() => {
    let subscription;

    if (!isLoading) {
      subscription = Appearance.addChangeListener(({ colorScheme }) => {
        const systemIsDark = colorScheme === 'dark';
        console.log(`🎨 System theme changed to: ${systemIsDark ? 'dark' : 'light'}`);
        
        // Si le mode est 'system', mettre à jour automatiquement
        if (themeMode === 'system') {
          setIsDarkMode(systemIsDark);
          console.log(`🎨 App theme updated to follow system: ${systemIsDark ? 'dark' : 'light'}`);
        }
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [themeMode, isLoading]);

  // Définir le mode de thème (system, light, dark)
  const setThemeModeAndSave = async (mode) => {
    try {
      setThemeMode(mode);
      updateThemeBasedOnMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
      
      console.log(`🎨 Theme mode set to: ${mode}`);
      
      if (mode === 'system') {
        console.log(`🎨 Now following system theme: ${getSystemTheme() ? 'dark' : 'light'}`);
      }
    } catch (error) {
      console.error('Error saving theme mode preference:', error);
    }
  };

  // Basculer entre le mode sombre et le mode clair (utilise le mode manuel)
  const toggleTheme = async () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    await setThemeModeAndSave(newMode);
  };

  // Basculer entre les thèmes orange et bleu
  const toggleColorTheme = async () => {
    try {
      const newColorTheme = colorTheme === 'blue' ? 'orange' : 'blue';
      setColorTheme(newColorTheme);
      await AsyncStorage.setItem('colorTheme', newColorTheme);
      console.log(`🎨 Color theme changed to: ${newColorTheme}`);
    } catch (error) {
      console.error('Error saving color theme preference:', error);
    }
  };

  // Réinitialiser aux paramètres système
  const resetToSystemTheme = async () => {
    await setThemeModeAndSave('system');
  };

  // Forcer le mode sombre
  const forceDarkMode = async () => {
    await setThemeModeAndSave('dark');
  };

  // Forcer le mode clair
  const forceLightMode = async () => {
    await setThemeModeAndSave('light');
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
      toggleColorTheme,
      resetToSystemTheme,
      forceDarkMode,
      forceLightMode,
      themeMode, // 'system', 'light', 'dark'
      systemTheme: getSystemTheme() ? 'dark' : 'light',
      isFollowingSystem: themeMode === 'system'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};