import { Image, StyleSheet, Text, View, useColorScheme } from 'react-native'
import React, { useEffect, useState } from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons';
import DrawerItems from '../src/components/layout/DrawerItems';
import Tabs from './Tabs';
import ProfileScreen from '../src/screens/ProfileScreen';
import UserDetailsScreen from '../src/screens/UserDetailsScreen'; // Add this import
import ProductsScreen from '../src/screens/ProductsScreen';
import WishListScreen from '../src/screens/WishListScreen';
import CartScreen from '../src/screens/CartScreen';
import OrderScreen from '../src/screens/OrderScreen';
// Updated import path for the new modular filter screen
import AnimalFilterScreen from '../src/screens/filters/AnimalFilterScreen';
import FontAwsome5Icon from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLOURS } from '../src/database/Database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../src/context/ThemeContext';
import { useCart } from '../src/context/CartContext';

// Define color constants
const BLUE = '#007afe';
const ORANGE = '#fe9400';
const DARK_BLUE = '#005dc0';
const DARK_ORANGE = '#d27b00';
const WHITE = '#ffffff';
const BLACK = '#000000';
const DARK_BG = '#121212';
const DARK_SURFACE = '#1E1E1E';
const LIGHT_GRAY = '#f5f5f5';
const DARK_GRAY = '#333333';

export default function Main() {
  const Drawer = createDrawerNavigator();
  const { theme, isDarkMode, colorTheme } = useTheme();
  const { cartCount } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);

  // System color scheme detection
  const systemColorScheme = useColorScheme();

  // Dynamic color selection based on theme
  const PRIMARY_COLOR = colorTheme === 'blue' ? BLUE : ORANGE;
  const SECONDARY_COLOR = colorTheme === 'blue' ? ORANGE : BLUE;
  const DARK_PRIMARY = colorTheme === 'blue' ? DARK_BLUE : DARK_ORANGE;
  const DARK_SECONDARY = colorTheme === 'blue' ? DARK_ORANGE : DARK_BLUE;

  // Theme-aware colors
  const BACKGROUND_COLOR = isDarkMode ? DARK_BG : WHITE;
  const SURFACE_COLOR = isDarkMode ? DARK_SURFACE : LIGHT_GRAY;
  const TEXT_COLOR = isDarkMode ? WHITE : BLACK;
  const SECONDARY_TEXT = isDarkMode ? '#B3B3B3' : '#666666';
  const BORDER_COLOR = isDarkMode ? DARK_GRAY : '#E0E0E0';

  // Updated function - only loads wishlist now, cart comes from context
  const loadWishlistCount = async () => {
    try {
      const wishlist = await AsyncStorage.getItem('wishlistItem');

      if (wishlist) {
        const parsedWishlist = JSON.parse(wishlist);
        setWishlistCount(parsedWishlist.length || 0);
      } else {
        setWishlistCount(0);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    loadWishlistCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadWishlistCount();
    }, [])
  );

  // Dynamic drawer screen options based on theme with better spacing
  const getDrawerScreenOptions = () => ({
    headerShown: false,
    drawerStyle: {
      backgroundColor: BACKGROUND_COLOR,
      width: 300, // Increased width for better spacing
      paddingTop: 20,
    },
    drawerActiveBackgroundColor: PRIMARY_COLOR,
    drawerActiveTintColor: WHITE,
    drawerInactiveTintColor: SECONDARY_TEXT,
    drawerLabelStyle: {
      marginLeft: -15, // Reduced negative margin
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'System',
    },
    drawerItemStyle: {
      borderLeftWidth: 0,
      marginHorizontal: 12, // Increased horizontal margin
      marginVertical: 4, // Increased vertical margin
      borderRadius: 12,
      paddingHorizontal: 8, // Added horizontal padding
      paddingVertical: 4, // Added vertical padding
      minHeight: 50, // Minimum height for touch targets
    },
    sceneContainerStyle: {
      backgroundColor: BACKGROUND_COLOR,
    },
    overlayColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
  });

  // Helper function to get icon color based on focus state
  const getIconColor = (focused) => focused ? WHITE : SECONDARY_TEXT;

  // Safe area color based on theme
  const SAFE_AREA_COLOR = isDarkMode ? DARK_PRIMARY : PRIMARY_COLOR;

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: SAFE_AREA_COLOR }]}>
      <Drawer.Navigator
        initialRouteName="Accueil"
        screenOptions={getDrawerScreenOptions()}
        drawerContent={(props) => (
          <DrawerItems
            {...props}
            wishlistItem={wishlistCount}
            cartItem={cartCount}
          />
        )}
      >
        <Drawer.Screen
          name="Accueil"
          component={Tabs}
          options={{
            drawerIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={22}
                  color={getIconColor(focused)}
                />
              </View>
            ),
            drawerLabel: "Accueil",
          }}
        />

        <Drawer.Screen
          name="Produits"
          component={ProductsScreen}
          options={{
            drawerIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <Image
                  source={require('../src/assets/images/store.png')}
                  style={[
                    styles.drawerIcon,
                    {
                      opacity: focused ? 1 : 0.7,
                      tintColor: isDarkMode || focused
                        ? getIconColor(focused)
                        : SECONDARY_TEXT
                    }
                  ]}
                />
              </View>
            ),
            drawerLabel: "Produits",
          }}
        />

        <Drawer.Screen
          name="Favoris"
          component={WishListScreen}
          options={{
            drawerIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <FontAwsome5Icon
                  name={focused ? "heart" : "heart"}
                  size={20}
                  color={getIconColor(focused)}
                  solid={focused}
                />
              </View>
            ),
            drawerLabel: "Favoris",
          }}
        />

        <Drawer.Screen
          name="Panier"
          component={CartScreen}
          options={{
            drawerIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <FontAwsome5Icon
                  name="shopping-cart"
                  size={20}
                  color={getIconColor(focused)}
                />
              </View>
            ),
            drawerLabel: "Panier",
          }}
        />

        <Drawer.Screen
          name="Mes commandes"
          component={OrderScreen}
          options={{
            drawerIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <FontAwsome5Icon
                  name={focused ? "clipboard-list" : "clipboard-list"}
                  size={20}
                  color={getIconColor(focused)}
                />
              </View>
            ),
            drawerLabel: "Mes commandes",
          }}
        />

        <Drawer.Screen
          name="Mon compte"
          component={ProfileScreen}
          options={{
            drawerIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <FontAwsome5Icon
                  name={focused ? "user-circle" : "user-circle"}
                  size={20}
                  color={getIconColor(focused)}
                  solid={focused}
                />
              </View>
            ),
            drawerLabel: "Mon compte",
          }}
        />

        {/* Add UserDetailsScreen as a hidden drawer screen */}
        <Drawer.Screen
          name="UserDetails"
          component={UserDetailsScreen}
          options={{
            drawerItemStyle: { display: 'none' }, // Hide from drawer menu
          }}
        />
      </Drawer.Navigator>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  drawerIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain"
  },
  safeAreaContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  }
})