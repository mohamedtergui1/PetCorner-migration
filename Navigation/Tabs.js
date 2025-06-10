import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../src/screens/HomeScreen';
import ProductDetails from '../src/components/Product/ProductDetails';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getFocusedRouteNameFromRoute, useFocusEffect } from '@react-navigation/native';
import ProductsScreen from '../src/screens/ProductsScreen';
import WishListScreen from '../src/screens/WishListScreen';
import CartScreen from '../src/screens/CartScreen';
import OrderScreen from '../src/screens/OrderScreen';
import Signup from '../src/screens/Auth/Signup';
import LoginScreen from '../src/screens/Auth/LoginScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOURS } from '../src/database/Database';
import { Icon } from 'react-native-elements';
import SearchScreen from '../src/screens/SearchScreen';
import ProductCategoryScreen from '../src/screens/ProductCategoryScreen';
import { useTheme } from '../src/context/ThemeContext'; // Adjust path as needed

const { width } = Dimensions.get('window');

export default function Tabs() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const Tab = createBottomTabNavigator();

  // Detect when route changes to update tab bar styling
  const getTabBarVisibility = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'Home';
    const hideOnScreens = ['ProductDetails', 'CartScreen'];
    
    if (hideOnScreens.includes(routeName)) {
      return false;
    }
    
    return true;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondaryTextColor,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          ...styles.shadow
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          paddingBottom: 5,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          size = focused ? 24 : 22;

          if (route.name === 'Home2') {
            return (
              <View style={focused ? [styles.activeIconContainer, {backgroundColor: theme.primaryLight}] : {}}>
                <MaterialCommunityIcons name="home" color={color} size={size} />
              </View>
            );
          } else if (route.name === 'Search') {
            return (
              <View style={focused ? [styles.activeIconContainer, {backgroundColor: theme.primaryLight}] : {}}>
                <MaterialCommunityIcons name="magnify" color={color} size={size} />
              </View>
            );
          } else if (route.name === 'OrderScreen') {
            return (
              <View style={focused ? [styles.activeIconContainer, {backgroundColor: theme.primaryLight}] : {}}>
                <MaterialCommunityIcons name="clipboard-list" color={color} size={size} />
              </View>
            );
          } else if (route.name === 'Profile') {
            return (
              <View style={focused ? [styles.activeIconContainer, {backgroundColor: theme.primaryLight}] : {}}>
                <MaterialCommunityIcons name="account" color={color} size={size} />
              </View>
            );
          }
          
          return <Icon name={iconName} type="material" color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home2" 
        component={SimpleScreen} 
        options={({ route }) => ({
          tabBarLabel: 'Accueil',
          tabBarVisible: getTabBarVisibility(route),
        })} 
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          tabBarLabel: 'Recherche',
        }} 
      />
      <Tab.Screen 
        name="OrderScreen" 
        component={OrderScreen} 
        options={{
          tabBarLabel: 'Commandes',
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Mon compte',
        }} 
      />
    </Tab.Navigator>
  );
}

const SimpleScreen = () => {
  const { theme } = useTheme();
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.backgroundColor
        },
        animation: 'slide_from_right'
      }}
      initialRouteName="Home"
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen 
        name="ProductDetails" 
        component={ProductDetails} 
        options={{
          animation: 'slide_from_bottom'
        }}
      />
      <Stack.Screen name="OrderScreen" component={OrderScreen} />
      <Stack.Screen 
        name="CartScreen" 
        component={CartScreen} 
        options={{
          animation: 'slide_from_bottom'
        }}
      />
      <Stack.Screen name="ProductCategoryScreen" component={ProductCategoryScreen} />
      {/* <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Login" component={LoginScreen} /> */}
      {/* <Stack.Screen name="UpdateProfile" component={UpdateAccount} /> */}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  activeIconContainer: {
    padding: 8,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});