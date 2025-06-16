import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import { COLOURS, parameters } from '../../database/Database';
import { Badge, Icon, withBadge } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const Header = ({ navigation, theme }) => {
  const { cartCount } = useCart();
  
  const BadgeIcon = withBadge(cartCount)(Icon);

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
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            resizeMode="contain"
            style={styles.logo}
          />
        </View>
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
    height: parameters.headerHeight + 10,
    justifyContent: 'space-between'
  },
  logoContainer: {
    backgroundColor: 'white', // White circular background
    width: 70, // Fixed width
    height: 70, // Fixed height (same as width for perfect circle)
    borderRadius: 35, // Half of width/height for perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5, // Android shadow
  },
  logo: {
    width: 68, // Increased from 50 to 58
    height: 58 // Increased from 50 to 58
  }
});

export default Header;