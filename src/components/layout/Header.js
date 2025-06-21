import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View, Animated, Easing } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import { COLOURS, parameters } from '../../database/Database';
import { Badge, Icon, withBadge } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { useCart } from '../../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const Header = ({ navigation, theme }) => {
  const { cartCount } = useCart();
  const BadgeIcon = withBadge(cartCount)(Icon);
  
  // Create an animated value for rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Create a rotation interpolation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '0deg']
  });

  // Animation function
  const animateLogo = () => {
    // Reset animation value
    rotateAnim.setValue(0);
    
    // Create animation sequence
    Animated.timing(rotateAnim, {
      toValue: 2,
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true
    }).start();
  };

  // Trigger animation when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      animateLogo();
      return () => {};
    }, [])
  );

  return (
    <View style={[styles.header, { backgroundColor: theme?.primary || COLOURS.buttons }]}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 15,
        }}>
        <Icon
          type="material-community"
          name="menu"
          color={theme?.buttonText || COLOURS.CardBackground}
          size={32}
          onPress={() => {
            navigation.toggleDrawer();
          }}
        />
      </View>

      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Logo with circular background */}
        <Animated.View 
          style={[
            styles.logoContainer,
            { transform: [{ rotate: spin }] }
          ]}
        >
          <Image
            source={require('../../assets/images/logo.png')}
            resizeMode="contain"
            style={styles.logo}
          />
        </Animated.View>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('CartScreen')}
        activeOpacity={0.6}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: cartCount < 0 ? 15 : 17,
        }}>
        <BadgeIcon
          type="material-community"
          name="cart"
          size={32}
          color={theme?.buttonText || COLOURS.CardBackground}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    height: parameters.headerHeight + 25,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  logoContainer: {
    backgroundColor: 'white',
    width: 64,
    height: 62,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 60,
    height: 52
  }
});

export default Header;