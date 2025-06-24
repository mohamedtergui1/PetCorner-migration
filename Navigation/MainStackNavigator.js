// MainStackNavigator.js - Single Stack Navigator for ALL app screens
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignatureClientScreen from '../src/screens/SignatureClientScreen';
// Import TabNavigator (from updated Tabs.js)
import TabNavigator from './Tabs';
// Import all your screens
import ProductDetails from '../src/components/Product/ProductDetails';
import ProductsScreen from '../src/screens/ProductsScreen';
import WishListScreen from '../src/screens/WishListScreen';
import CartScreen from '../src/screens/CartScreen';
import OrderScreen from '../src/screens/OrderScreen';
import OrderDetailsScreen from '../src/screens/OrderDetailsScreen'; // ✅ Added OrderDetailsScreen
import SearchScreen from '../src/screens/SearchScreen';
import ProductCategoryScreen from '../src/screens/ProductCategoryScreen';
import UserDetailsScreen from '../src/screens/UserDetailsScreen'; // ✅ Added UserDetailsScreen
import ProfileScreen from '../src/screens/ProfileScreen';
import LoginScreen from '../src/screens/Auth/LoginScreen';
import Signup from '../src/screens/Auth/Signup';
import { useTheme } from '../src/context/ThemeContext';

const Stack = createNativeStackNavigator();

// Main Stack Navigator - Contains ALL screens
export default function MainStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.backgroundColor
        },
        animation: 'slide_from_right'
      }}
      initialRouteName="TabNavigator"
    >
      {/* Tab Navigator as the main screen */}
      <Stack.Screen
        name="TabNavigator"
        component={TabNavigator}
      />

      {/* ✅ ProductDetails - Now accessible from anywhere in the app */}
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetails}
        options={{
          animation: 'slide_from_bottom'
        }}
      />

      {/* ✅ UserDetailsScreen - Now accessible from anywhere in the app */}
      <Stack.Screen
        name="UserDetailsScreen"
        component={UserDetailsScreen}
        options={{
          animation: 'slide_from_right'
        }}
      />

      {/* ✅ OrderDetailsScreen - Accessible from OrderScreen and anywhere else */}
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          animation: 'slide_from_right'
        }}
      />

      {/* All other screens */}
      <Stack.Screen
        name="ProductsScreen"
        component={ProductsScreen}
      />

      <Stack.Screen
        name="WishListScreen"
        component={WishListScreen}
      />

      <Stack.Screen
        name="CartScreen"
        component={CartScreen}
        options={{
          animation: 'slide_from_bottom'
        }}
      />

      <Stack.Screen
        name="OrderScreen"
        component={OrderScreen}
      />

      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
      />

      <Stack.Screen
        name="ProductCategoryScreen"
        component={ProductCategoryScreen}
      />

      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
      />

      {/* Auth screens */}
      <Stack.Screen
        name="LoginScreen"
        component={LoginScreen}
      />

      <Stack.Screen
        name="Signup"
        component={Signup}
      />

      <Stack.Screen
        name="SignatureClient"
        component={SignatureClientScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}