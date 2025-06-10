import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import { COLOURS, parameters } from '../../database/Database';
import { Badge, Icon, withBadge } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import { useCart } from '../../context/CartContext'; // Import cart context

const { width } = Dimensions.get('window');

const Header = ({ navigation, theme }) => { // Removed cartItemsCount prop since we get it from context
  const { cartCount } = useCart(); // Get cart count from context
  
  const BadgeIcon = withBadge(cartCount)(Icon); // Use cartCount from context

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
        {/* If you want a text logo in dark mode instead of image */}
        {/* {theme?.mode === 'dark' ? (
          <Text
            style={{
              color: theme.buttonText,
              fontSize: 25,
              fontWeight: 'bold',
            }}>
            Petcorner
          </Text>
        ) : ( */}
          <Image
            source={require('../../assets/images/logo.png')}
            resizeMode="contain"
            style={{width: 60, height: 100}}
          />
        {/* )} */}
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('Panier')}
        activeOpacity={0.6}
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: cartCount < 0 ? 15 : 17, // Use cartCount from context
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
});

export default Header;