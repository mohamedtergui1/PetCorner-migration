import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Signup from '../src/screens/Auth/Signup';
import LoginScreen from '../src/screens/Auth/LoginScreen';
import HomeScreen from '../src/screens/HomeScreen';
import ProductDetails from '../src/components/Product/ProductDetails';
import OrderScreen from '../src/screens/OrderScreen';
import CartScreen from '../src/screens/CartScreen';

export default function Auth() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={{ 
        headerShown: false
       }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={Signup} />
      {/* <Stack.Screen name="Home" component={SimpleScreen} /> */}
    </Stack.Navigator>
  );
}

const SimpleScreen = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetails} />
      <Stack.Screen name="OrderScreen" component={OrderScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({})