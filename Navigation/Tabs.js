// Tabs.js - Now simplified as TabNavigator component (used in MainStackNavigator)
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../src/screens/HomeScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getFocusedRouteNameFromRoute, useFocusEffect } from '@react-navigation/native';
import OrderScreen from '../src/screens/OrderScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOURS } from '../src/database/Database';
import { Icon } from 'react-native-elements';
import SearchScreen from '../src/screens/SearchScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import { useTheme } from '../src/context/ThemeContext';

const { width } = Dimensions.get('window');

// This is now just the Tab Navigator component
// The Stack Navigator is handled in MainStackNavigator.js
export default function TabNavigator() {
  const { theme, isDarkMode } = useTheme();
  const Tab = createBottomTabNavigator();

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

          if (route.name === 'HomeTab') {
            return (
              <View style={focused ? [styles.activeIconContainer, {backgroundColor: theme.primaryLight}] : {}}>
                <MaterialCommunityIcons name="home" color={color} size={size} />
              </View>
            );
          } else if (route.name === 'SearchTab') {
            return (
              <View style={focused ? [styles.activeIconContainer, {backgroundColor: theme.primaryLight}] : {}}>
                <MaterialCommunityIcons name="magnify" color={color} size={size} />
              </View>
            );
          } else if (route.name === 'OrderTab') {
            return (
              <View style={focused ? [styles.activeIconContainer, {backgroundColor: theme.primaryLight}] : {}}>
                <MaterialCommunityIcons name="clipboard-list" color={color} size={size} />
              </View>
            );
          } else if (route.name === 'ProfileTab') {
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
        name="HomeTab" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Accueil',
        }} 
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen} 
        options={{
          tabBarLabel: 'Recherche',
        }} 
      />
      <Tab.Screen 
        name="OrderTab" 
        component={OrderScreen} 
        options={{
          tabBarLabel: 'Commandes',
        }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Mon compte',
        }} 
      />
    </Tab.Navigator>
  );
}

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