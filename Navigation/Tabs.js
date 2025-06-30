import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text } from 'react-native';

// Import theme context
let useTheme;
try {
  useTheme = require('../src/context/ThemeContext').useTheme;
} catch (e) {
  console.log('ThemeContext import error:', e);
  // Fallback theme hook
  useTheme = () => ({
    theme: {
      primary: '#fe9400',
      backgroundColor: '#ffffff',
      textColor: '#000000',
    },
    isDarkMode: false,
    colorTheme: 'orange'
  });
}

// Import screens with error handling
let HomeScreen, SearchScreen, OrderScreen, ProfileScreen, CartScreen, CartContext;

try {
  HomeScreen = require('../src/screens/HomeScreen').default;
} catch (e) {
  console.log('HomeScreen import error:', e);
  HomeScreen = () => <View><Text>HomeScreen not found</Text></View>;
}

try {
  SearchScreen = require('../src/screens/SearchScreen').default;
} catch (e) {
  console.log('SearchScreen import error:', e);
  SearchScreen = () => <View><Text>SearchScreen not found</Text></View>;
}

try {
  OrderScreen = require('../src/screens/OrderScreen').default;
} catch (e) {
  console.log('OrderScreen import error:', e);
  OrderScreen = () => <View><Text>OrderScreen not found</Text></View>;
}

try {
  ProfileScreen = require('../src/screens/ProfileScreen').default;
} catch (e) {
  console.log('ProfileScreen import error:', e);
  ProfileScreen = () => <View><Text>ProfileScreen not found</Text></View>;
}

try {
  CartScreen = require('../src/screens/CartScreen').default;
} catch (e) {
  console.log('CartScreen import error:', e);
  CartScreen = () => <View><Text>CartScreen not found</Text></View>;
}

try {
  CartContext = require('../src/context/CartContext').CartContext;
} catch (e) {
  console.log('CartContext import error:', e);
  // Create a fallback context
  CartContext = React.createContext({ cartItems: [] });
}

const Tab = createBottomTabNavigator();

const getTabBarIcon = (route, focused, color, size) => {
  const iconMap = {
    'HomeTab': 'home',
    'SearchTab': 'magnify',
    'CartTab': 'shopping',
    'OrderTab': 'clipboard-list',
    'ProfileTab': 'account'
  };
  
  const iconName = iconMap[route.name] || 'information';
  
  return (
    <MaterialCommunityIcons
      name={iconName}
      size={size}
      color={color}
    />
  );
};

const tabBarLabel = (route) => {
  const labels = {
    'HomeTab': 'Accueil',
    'SearchTab': 'Recherche',
    'CartTab': 'Panier',
    'OrderTab': 'Commandes',
    'ProfileTab': 'Mon compte'
  };
  return labels[route.name] || route.name;
};

const TabNavigator = () => {
  // Get theme colors
  const { theme, isDarkMode, colorTheme } = useTheme();
  
  // Define colors based on theme
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const INACTIVE_COLOR = isDarkMode ? '#888888' : '#666666';
  const TAB_BAR_BACKGROUND = isDarkMode ? '#1a1a1a' : '#ffffff';
  const BORDER_COLOR = isDarkMode ? '#333333' : '#e0e0e0';

  // Get cart items from context with fallback and debugging
  let cartItemCount = 0;
  
  try {
    const cartContext = useContext(CartContext);
    console.log('Cart Context:', cartContext); // Debug log
    
    if (cartContext && cartContext.cartItems) {
      cartItemCount = cartContext.cartItems.length;
      console.log('Cart Items:', cartContext.cartItems); // Debug log
      console.log('Cart Item Count:', cartItemCount); // Debug log
    } else {
      console.log('No cart items found in context');
      // For testing purposes, set a static count
      cartItemCount = 3; // Remove this line once your context is working
    }
  } catch (e) {
    console.log('CartContext usage error:', e);
    // For testing purposes, set a static count
    cartItemCount = 2; // Remove this line once your context is working
  }

  // Force show badge for testing (remove this once context is working)
  const displayBadgeCount = cartItemCount > 0 ? cartItemCount : 1; // This will always show at least 1

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route, focused, color, size),
        tabBarLabel: tabBarLabel(route),
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: TAB_BAR_BACKGROUND,
          borderTopColor: BORDER_COLOR,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          elevation: 8,
          shadowColor: isDarkMode ? '#000000' : '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: 'Accueil',
        }}
      />
      
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarAccessibilityLabel: 'Recherche',
        }}
      />
      
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarAccessibilityLabel: 'Panier',
          // For testing: always show badge
          tabBarBadge: displayBadgeCount, // This will always show the count
          tabBarBadgeStyle: {
            backgroundColor: '#ff4444',
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            marginTop: 2,
            textAlign: 'center',
            lineHeight: 20,
          },
        }}
      />
      
      <Tab.Screen
        name="OrderTab"
        component={OrderScreen}
        options={{
          tabBarAccessibilityLabel: 'Commandes',
        }}
      />
      
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarAccessibilityLabel: 'Mon compte',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;