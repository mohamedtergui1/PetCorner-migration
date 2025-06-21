import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../../config/Api';
import Token from '../../../config/TokenDolibar';
import { Avatar } from 'react-native-elements';
import { useTheme } from '../../context/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

// Define the fixed colors
const BLUE = '#007afe';
const ORANGE = '#fe9400';
const DARK_BLUE = '#005dc0';
const DARK_ORANGE = '#d27b00';
const WHITE = '#ffffff';
const BLACK = '#000000';
const DARK_BG = '#121212';
const DARK_SURFACE = '#1E1E1E';
const LIGHT_GRAY = '#f5f5f5';
const DARK_GRAY = '#333333';

export default function DrawerItems(props) {
  const { theme, isDarkMode, toggleTheme, colorTheme, toggleColorTheme } = useTheme();
  const { favoriteCount } = useFavorites();
  const { cartItems, getCartItemCount } = useCart();
  const { navigation } = props;
  const [userDetails, setUserDetails] = React.useState();

  // Calculate cart count - try different possible cart context properties
  const cartCount = React.useMemo(() => {
    // Try different possible ways to get cart count
    if (typeof getCartItemCount === 'function') {
      return getCartItemCount();
    }
    if (cartItems && Array.isArray(cartItems)) {
      return cartItems.length;
    }
    if (cartItems && typeof cartItems === 'object') {
      return Object.keys(cartItems).length;
    }
    return 0;
  }, [cartItems, getCartItemCount]);

  // Dynamically set colors based on the selected color theme
  const PRIMARY_COLOR = colorTheme === 'blue' ? BLUE : ORANGE;
  const SECONDARY_COLOR = colorTheme === 'blue' ? ORANGE : BLUE;
  const DARK_PRIMARY = colorTheme === 'blue' ? DARK_BLUE : DARK_ORANGE;
  const DARK_SECONDARY = colorTheme === 'blue' ? DARK_ORANGE : DARK_BLUE;

  // Theme-aware colors
  const BACKGROUND_COLOR = isDarkMode ? DARK_BG : WHITE;
  const SURFACE_COLOR = isDarkMode ? DARK_SURFACE : LIGHT_GRAY;
  const TEXT_COLOR = isDarkMode ? WHITE : BLACK;
  const SECONDARY_TEXT = isDarkMode ? '#B3B3B3' : '#666666';
  const BORDER_COLOR = isDarkMode ? DARK_GRAY : '#E0E0E0';

  React.useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (userData?.id) {
        const clientID = userData.id;
        const headers = {
          'Content-Type': 'application/json',
          'DOLAPIKEY': Token
        };

        const res = await axios.get(API_BASE_URL + 'thirdparties/' + clientID, { headers });
        setUserDetails(res.data);
      }
    } catch (error) {
      console.log('Error fetching user data:', error);
    }
  };

  const formatEmail = (email) => {
    if (!email) return '';
    if (email.length <= 25) return email;
    const [username, domain] = email.split('@');
    if (!domain) return email.substring(0, 22) + '...';
    const truncatedUsername = username.length > 15
      ? username.substring(0, 12) + '...'
      : username;
    return `${truncatedUsername}@${domain}`;
  };

  const logout = () => {
    AsyncStorage.setItem(
      'userData',
      JSON.stringify({...userDetails, loggedIn: false}),
    );
    navigation.navigate('Auth', {
      screen: 'Login',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <DrawerContentScrollView
        {...props}
        style={{ backgroundColor: BACKGROUND_COLOR }}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Dynamic Primary Color with dark mode consideration */}
        <View style={[styles.profileContainer, {
          backgroundColor: PRIMARY_COLOR,
          shadowColor: isDarkMode ? '#000' : PRIMARY_COLOR,
          shadowOpacity: isDarkMode ? 0.8 : 0.3,
        }]}>
          <View style={styles.userInfoContainer}>
            <Avatar
              rounded
              avatarStyle={styles.avatar}
              size={75}
              containerStyle={[styles.avatarContainer, {
                borderColor: WHITE,
                elevation: isDarkMode ? 8 : 5,
              }]}
              source={require('../../assets/images/inconnu.jpg')}
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.userName}>
                {userDetails && userDetails.name ? userDetails.name : 'Utilisateur'}
              </Text>
              <View style={[styles.emailContainer, {
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'
              }]}>
                <Text
                  style={styles.userEmail}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {userDetails && userDetails.email ? formatEmail(userDetails.email) : ''}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={[styles.statItem, {
                backgroundColor: isDarkMode ? DARK_PRIMARY : `${DARK_PRIMARY}E6`
              }]}
              onPress={() => navigation.navigate('WishListScreen')}
              activeOpacity={0.7}
            >
              <View style={[styles.statBadge, {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)'
              }]}>
                <Text style={styles.statNumber}>
                  {favoriteCount}
                </Text>
              </View>
              <Text style={styles.statLabel}>
                Mes favoris
              </Text>
            </TouchableOpacity>

            <View style={[styles.divider, {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)'
            }]} />

            <TouchableOpacity 
              style={[styles.statItem, {
                backgroundColor: isDarkMode ? DARK_SECONDARY : `${SECONDARY_COLOR}E6`
              }]}
              onPress={() => navigation.navigate('MyCart')}
              activeOpacity={0.7}
            >
              <View style={[styles.statBadge, {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)'
              }]}>
                <Text style={styles.statNumber}>
                  {cartCount}
                </Text>
              </View>
              <Text style={styles.statLabel}>
                Mon panier
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items - Dynamic Colors with dark mode support */}
        <View style={[styles.menuContainer, { backgroundColor: BACKGROUND_COLOR }]}>
          <DrawerItemList
            {...props}
            activeTintColor={WHITE} // White text on colored background
            inactiveTintColor={SECONDARY_TEXT}
            activeBackgroundColor={PRIMARY_COLOR} // Use primary color for active state
            itemStyle={[styles.menuItem, {
              backgroundColor: 'transparent'
            }]}
            labelStyle={[styles.menuLabel, { color: TEXT_COLOR }]}
          />
        </View>

        {/* Theme Settings with improved dark mode styling */}
        <View style={[styles.settingsContainer, {
          backgroundColor: isDarkMode ? DARK_SURFACE : SURFACE_COLOR,
          borderTopColor: BORDER_COLOR
        }]}>
          <Text style={[styles.settingsHeader, { color: PRIMARY_COLOR }]}>
            Thèmes
          </Text>

          {/* Theme color toggle */}
          <TouchableOpacity
            style={[styles.optionButton, {
              backgroundColor: PRIMARY_COLOR,
              shadowColor: PRIMARY_COLOR,
              shadowOpacity: isDarkMode ? 0.6 : 0.3,
              elevation: isDarkMode ? 4 : 2,
            }]}
            onPress={toggleColorTheme}
            activeOpacity={0.8}
          >
            <View style={styles.colorSelectorContainer}>
              <View style={[styles.colorCircle, {
                backgroundColor: colorTheme === 'blue' ? DARK_BLUE : DARK_ORANGE,
                zIndex: 1,
                borderColor: WHITE,
              }]} />
              <View style={[styles.colorCircle, {
                backgroundColor: colorTheme === 'blue' ? ORANGE : BLUE,
                marginLeft: -10,
                borderColor: WHITE,
              }]} />
            </View>
            <Text style={styles.optionText}>
              Thème {colorTheme === 'blue' ? "Orange" : "Bleu"}
            </Text>
          </TouchableOpacity>

          {/* Dark mode toggle */}
          <TouchableOpacity
            style={[styles.optionButton, {
              backgroundColor: SECONDARY_COLOR,
              shadowColor: SECONDARY_COLOR,
              shadowOpacity: isDarkMode ? 0.6 : 0.3,
              elevation: isDarkMode ? 4 : 2,
            }]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={isDarkMode ? "sunny" : "moon"}
                size={22}
                color={WHITE}
              />
            </View>
            <Text style={styles.optionText}>
              {isDarkMode ? "Mode clair" : "Mode sombre"}
            </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Logout Button with improved styling */}
      <TouchableOpacity
        style={[styles.logoutButton, {
          backgroundColor: isDarkMode ? '#DC3545' : SECONDARY_COLOR,
          borderTopColor: BORDER_COLOR,
          shadowColor: isDarkMode ? '#DC3545' : SECONDARY_COLOR,
          shadowOpacity: isDarkMode ? 0.6 : 0.3,
        }]}
        onPress={logout}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color={WHITE}
          />
        </View>
        <Text style={styles.logoutText}>
          Se déconnecter
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 0,
  },
  scrollViewContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileContainer: {
    paddingTop: 25,
    paddingBottom: 20,
    marginTop: -4,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  avatarContainer: {
    borderWidth: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  avatar: {
    borderRadius: 37.5,
  },
  userTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: WHITE,
    fontSize: 19,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 5,
  },
  emailContainer: {
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  userEmail: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 15,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statBadge: {
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontWeight: 'bold',
    color: WHITE,
    fontSize: 16,
  },
  statLabel: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 45,
    width: 1.5,
  },
  menuContainer: {
    marginTop: 8,
    paddingBottom: 5,
  },
  menuItem: {
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: -20,
  },
  settingsContainer: {
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  settingsHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  colorSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  colorCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
  },
  iconContainer: {
    marginRight: 12,
    width: 26,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    color: WHITE,
    fontWeight: '600',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    elevation: 4,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: WHITE,
  },
});