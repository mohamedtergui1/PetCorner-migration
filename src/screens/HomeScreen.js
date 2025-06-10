import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import {COLOURS, Items} from '../database/Database'
import Entypo from 'react-native-vector-icons/Entypo'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import HomeProduct from '../components/Home/HomeProduct'
import Header from '../components/layout/Header'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../context/ThemeContext'

export default function HomeScreen({navigation}) {
  const { theme, isDarkMode } = useTheme();
  const [cartItemsCount, setCartItemsCount] = useState(0);
  
  const getCartItemsCount = async () => {
    try {
      const cartItems = JSON.parse(await AsyncStorage.getItem('cartItems')) || [];
      setCartItemsCount(cartItems.length);
    } catch (error) {
      console.error("Failed to retrieve cart items", error);
    }
  };
  
  useEffect(() => {
    getCartItemsCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      getCartItemsCount();
    }, [])
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.backgroundColor,
      }}>
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.statusBarBackground}
      />
      
      {/* Header component with theme support */}
      <Header 
        navigation={navigation} 
        cartItemsCount={cartItemsCount} 
        theme={theme}
      />
      
      {/* HomeProduct component with theme support */}
      <HomeProduct 
        navigation={navigation} 
        theme={theme}
      />
    </View>
  )
}

const styles = StyleSheet.create({})