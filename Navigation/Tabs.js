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

// Import cart context
let useCart;
try {
  useCart = require('../src/context/CartContext').useCart;
} catch (e) {
  console.log('useCart import error:', e);
  // Fallback hook
  useCart = () => ({ cartCount: 0 });
}

// Import screens with error handling
let HomeScreen, SearchScreen, OrderScreen, ProfileScreen, CartScreen;

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

const Tab = createBottomTabNavigator();

// Custom cart icon component with badge
const CartTabIcon = ({ focused, color, size }) => {
  const { cartCount } = useCart();
  
  return (
    <View style={{ position: 'relative' }}>
      <MaterialCommunityIcons
        name="shopping"
        size={size}
        color={color}
      />
      {cartCount > 0 && (
        <View style={{
          position: 'absolute',
          right: -8,
          top: -8,
          backgroundColor: '#ff4444',
          borderRadius: 10,
          minWidth: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#ffffff',
        }}>
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            {cartCount > 99 ? '99+' : cartCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const getTabBarIcon = (route, focused, color, size) => {
  // Handle cart tab specially with badge
  if (route.name === 'CartTab') {
    return <CartTabIcon focused={focused} color={color} size={size} />;
  }
  
  // Handle other tabs normally
  const iconMap = {
    'HomeTab': 'home',
    'SearchTab': 'magnify',
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
          // No need for tabBarBadge anymore, handled in custom icon
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