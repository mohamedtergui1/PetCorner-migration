import React, { useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Badge, Icon, withBadge } from 'react-native-elements';
import { useFocusEffect } from '@react-navigation/native';
import { COLOURS, parameters } from '../../database/Database';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

// Type definitions
interface Theme {
  primary?: string;
  buttonText?: string;
  backgroundColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
  cardBackground?: string;
  [key: string]: any;
}

interface NavigationProp {
  toggleDrawer: () => void;
  navigate: (screen: string, params?: any) => void;
  [key: string]: any;
}

interface HeaderProps {
  navigation: NavigationProp;
  theme?: Theme;
  cartItemsCount?: number; // Optional prop for backward compatibility
}

interface CartContextType {
  cartCount: number;
}

const Header: React.FC<HeaderProps> = ({ navigation, theme }) => {
  const { cartCount }: CartContextType = useCart();
  
  // Create BadgeIcon component with proper typing
  const BadgeIcon = withBadge(cartCount)(Icon);

  // Create an animated value for rotation with proper typing
  const rotateAnim = useRef<Animated.Value>(new Animated.Value(0)).current;

  // Create a rotation interpolation
  const spin: Animated.AnimatedInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '0deg'],
  });

  // Animation function with proper return type
  const animateLogo = (): void => {
    // Reset animation value
    rotateAnim.setValue(0);
    // Create animation sequence
    Animated.timing(rotateAnim, {
      toValue: 2,
      duration: 1200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  };

  // Trigger animation when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      animateLogo();
      return () => {
        // Cleanup function (optional)
      };
    }, [])
  );

  // Handle cart navigation with proper typing
  const handleCartPress = (): void => {
    navigation.navigate('CartScreen');
  };

  // Handle menu press with proper typing
  const handleMenuPress = (): void => {
    navigation.toggleDrawer();
  };

  // Logo source with proper typing
  const logoSource: ImageSourcePropType = require('../../assets/images/logo.png');

  // Calculate margin based on cart count
  const cartMarginRight: number = cartCount < 0 ? 15 : 17;

  // Get theme colors with fallbacks
  const headerBackgroundColor: string = theme?.primary || COLOURS.buttons;
  const iconColor: string = theme?.buttonText || COLOURS.CardBackground;

  return (
    <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
      {/* Menu Icon */}
      <View style={styles.menuContainer}>
        <Icon
          type="material-community"
          name="menu"
          color={iconColor}
          size={32}
          onPress={handleMenuPress}
        />
      </View>

      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoWrapper}>
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ rotate: spin }] }
            ]}
          >
            <Image
              source={logoSource}
              resizeMode="contain"
              style={styles.logo}
            />
          </Animated.View>
          
          {/* Beta Version Badge */}
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        </View>
      </View>

      {/* Cart Icon */}
      <TouchableOpacity
        onPress={handleCartPress}
        activeOpacity={0.6}
        style={[
          styles.cartContainer,
          { marginRight: cartMarginRight }
        ]}
      >
        <BadgeIcon
          type="material-community"
          name="cart"
          size={32}
          color={iconColor}
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
  menuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 52,
  },
  betaBadge: {
    position: 'absolute',
    top: -1,
    right: -33,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    shadowColor: '#6C5CE7',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '15deg' }],
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betaText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;