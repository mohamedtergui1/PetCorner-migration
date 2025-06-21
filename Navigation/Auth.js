// Auth.js - Simplified Auth Navigator (only for authentication screens)
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Signup from '../src/screens/Auth/Signup';
import LoginScreen from '../src/screens/Auth/LoginScreen';

export default function Auth() {
  const Stack = createNativeStackNavigator();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={Signup} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({});