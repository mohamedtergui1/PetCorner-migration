import { Dimensions, StyleSheet, View, Platform, Text } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../src/screens/HomeScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import OrderScreen from '../src/screens/OrderScreen';
import SearchScreen from '../src/screens/SearchScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import { useTheme } from '../src/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function TabNavigator() {
  const { theme, isDarkMode } = useTheme();
  const Tab = createBottomTabNavigator();

  const getTabBarIcon = (routeName, color, size, focused) => {
    const iconMap = {
      'HomeTab': 'home',
      'SearchTab': 'magnify',
      'OrderTab': 'clipboard-list',
      'ProfileTab': 'account'
    };

    const iconName = iconMap[routeName];
    const iconSize = focused ? 26 : 22;

    return (
      <View style={[
        styles.iconContainer,
        focused && [styles.activeIconContainer, { backgroundColor: theme.primaryLight }]
      ]}>
        <MaterialCommunityIcons 
          name={iconName} 
          color={color} 
          size={iconSize} 
        />
        {focused && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondaryTextColor,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.cardBackground,
            borderTopColor: isDarkMode 
              ? 'rgba(255,255,255,0.08)' 
              : 'rgba(0,0,0,0.08)',
          }
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: ({ color, size, focused }) => 
          getTabBarIcon(route.name, color, size, focused),
        tabBarLabel: ({ focused, color }) => {
          const labels = {
            'HomeTab': 'Accueil',
            'SearchTab': 'Recherche',
            'OrderTab': 'Commandes',
            'ProfileTab': 'Mon compte'
          };
          
          return (
            <Text style={[
              styles.tabBarLabel,
              { 
                color: focused ? theme.primary : theme.secondaryTextColor,
                fontWeight: focused ? '700' : '500'
              }
            ]}>
              {labels[route.name]}
            </Text>
          );
        },
      })}
      screenListeners={{
        tabPress: (e) => {
          // Add haptic feedback on tab press (iOS)
          if (Platform.OS === 'ios') {
            // You can add haptic feedback here if needed
            // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
      }}
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
        name="OrderTab" 
        component={OrderScreen} 
        options={{
          tabBarAccessibilityLabel: 'Commandes',
          tabBarBadge: undefined, // You can add badge count here
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
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 85 : 65,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    position: 'relative',
  },
  activeIconContainer: {
    borderRadius: 20,
    padding: 8,
    transform: [{ scale: 1.1 }],
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});