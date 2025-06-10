// App.js modifié pour utiliser ThemeContext avec la clé darkMode existante
import { StatusBar, StyleSheet, View } from 'react-native'; 
import React, { useEffect, useState } from 'react'; 
import { NavigationContainer } from '@react-navigation/native'; 
import { createNativeStackNavigator } from '@react-navigation/native-stack'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import Loader from './src/screens/Loader'; 
import Main from './Navigation/Main'; 
import Auth from './Navigation/Auth'; 
import { COLOURS } from './src/database/Database';
import { ThemeProvider, useTheme } from './src/context/ThemeContext'; // Importer ThemeProvider
import { CartProvider } from './src/context/CartContext'; // Importer CartProvider

// Composant qui utilise le thème pour la navigation
const NavigationWithTheme = () => {
  const Stack = createNativeStackNavigator();
  const [initialRouteName, setInitialRouteName] = useState('');
  const { theme } = useTheme(); // Accéder au thème
  
  const authUser = async () => {
    try {
      let userData = await AsyncStorage.getItem('userData');
      if (userData) {
        userData = JSON.parse(userData);
        setInitialRouteName(userData?.loggedIn ? 'Main' : 'Auth');
      } else {
        setInitialRouteName('Auth');
      }
    } catch (error) {
      setInitialRouteName('Auth');
    }
  };
  
  useEffect(() => {
    setTimeout(authUser, 2000);
  }, []);
  
  // Si initialRouteName n'est pas encore défini, afficher le loader
  if (initialRouteName === '') {
    return <Loader visible={true} />;
  }
  
  // Sinon, afficher le navigateur
  return (
    <>
      <StatusBar 
        barStyle={theme.statusBar} 
        backgroundColor={theme.statusBarBackground || COLOURS.statusbar} 
      />
      
      <Stack.Navigator 
        initialRouteName={initialRouteName} 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="Auth" component={Auth} />
      </Stack.Navigator>
    </>
  );
};

// Composant principal de l'application
export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <NavigationContainer>
          <NavigationWithTheme />
        </NavigationContainer>
      </CartProvider>
    </ThemeProvider>
  );
}