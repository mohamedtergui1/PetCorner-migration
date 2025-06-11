// ProfileScreen.js modifié pour inclure la navigation vers UserDetailsScreen
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Image,
  StatusBar,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Token from '../../config/TokenDolibar';
import { useFocusEffect } from '@react-navigation/native';
import API_BASE_URL from '../../config/Api';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({navigation}) {
  const [userDetails, setUserDetails] = useState();
  const [form, setForm] = useState({
    emailNotifications: true,
    pushNotifications: false,
  });

  // Utiliser le hook useTheme avec les couleurs
  const { theme, isDarkMode, toggleTheme, colorTheme, toggleColorTheme } = useTheme();

  // Définir les couleurs primaire et secondaire en fonction du thème
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  
  // Additional color variables for better dark mode support
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#ffffff';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#f8f8f8';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';
  
  // Add dark mode overlay for profile section
  const DARK_OVERLAY = isDarkMode ? 'rgba(0,0,0,0.3)' : 'transparent';

  const getUserData = async () => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!userData) return;
      
      const clientID = userData.id;
      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };
      
      const res = await axios.get(API_BASE_URL + 'thirdparties/' + clientID, { headers });
      setUserDetails(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUserData();
    }, [])
  );

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: BACKGROUND_COLOR 
    }}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'} 
      />
      
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile section with improved styling */}
      <View style={[styles.profileContainer, { backgroundColor: PRIMARY_COLOR }]}>
        <View style={[styles.darkModeOverlay, { backgroundColor: DARK_OVERLAY }]} />
        <View style={styles.profileInner}>
          <View style={styles.profile}>
            <TouchableOpacity>
              <View style={styles.profileAvatarWrapper}>
                <Image
                  alt=""
                  source={require('../assets/images/inconnu.jpg')}
                  style={styles.profileAvatar} />
                <TouchableOpacity>
                  <View style={[styles.profileAction, { backgroundColor: SECONDARY_COLOR }]}>
                    <FontAwesome5 color="#fff" name="edit" size={14} />
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            <View>
              <Text style={styles.profileName}>
                {userDetails && userDetails.name}
              </Text>
              <Text style={styles.profileEmail}>
                {userDetails && userDetails.email}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.profileCurve, { backgroundColor: BACKGROUND_COLOR }]} />
      </View>

      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: BACKGROUND_COLOR }]}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: PRIMARY_COLOR }]}>Mon Compte</Text>
          
          {/* User Details Navigation */}
          <TouchableOpacity 
            style={[styles.row, { 
              backgroundColor: CARD_BACKGROUND,
              borderLeftWidth: 3,
              borderLeftColor: PRIMARY_COLOR
            }]}
            onPress={() => {
              console.log('Navigating to UserDetails...');
              navigation.navigate('UserDetails');
            }}
          >
            <View style={[styles.rowIcon, { backgroundColor: PRIMARY_COLOR }]}>
              <FontAwesome5 color="#fff" name="user-edit" size={18} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Mes Informations</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, { 
            backgroundColor: CARD_BACKGROUND,
            borderLeftWidth: 3,
            borderLeftColor: '#32c759'
          }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#32c759' }]}>
              <Ionicons color="#fff" name="shield-checkmark" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Sécurité</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: PRIMARY_COLOR }]}>Préférences</Text>
          
          <TouchableOpacity style={[styles.row, { 
            backgroundColor: CARD_BACKGROUND,
            borderLeftWidth: 3,
            borderLeftColor: '#fe9400'
          }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#fe9400' }]}>
              <Ionicons color="#fff" name="globe" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Langue</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} />
          </TouchableOpacity>
          
          <View style={[styles.row, { 
            backgroundColor: CARD_BACKGROUND,
            borderLeftWidth: 3,
            borderLeftColor: '#007afe'
          }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#007afe' }]}>
              <Ionicons color="#fff" name={isDarkMode ? "sunny" : "moon"} size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Mode Sombre</Text>
            <View style={styles.rowSpacer} />
            <Switch
              thumbColor={isDarkMode ? PRIMARY_COLOR : "#f4f3f4"}
              trackColor={{ false: isDarkMode ? "#555" : "#767577", true: `${PRIMARY_COLOR}80` }}
              ios_backgroundColor={isDarkMode ? "#555" : "#3e3e3e"}
              onValueChange={toggleTheme}
              value={isDarkMode} />
          </View>
          
          {/* Option pour le choix de couleur avec style amélioré */}
          <View style={[styles.row, { 
            backgroundColor: CARD_BACKGROUND,
            borderLeftWidth: 3,
            borderLeftColor: colorTheme === 'orange' ? '#fe9400' : '#007afe'
          }]}>
            <View style={[styles.rowIcon, { backgroundColor: colorTheme === 'orange' ? '#fe9400' : '#007afe' }]}>
              <Ionicons color="#fff" name="color-palette" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>
              {colorTheme === 'orange' ? 'Thème Orange' : 'Thème Bleu'}
            </Text>
            <View style={styles.rowSpacer} />
            <Switch
              thumbColor={colorTheme === 'orange' ? "#fe9400" : "#f4f3f4"}
              trackColor={{ false: isDarkMode ? "#555" : "#767577", true: "#fe940080" }}
              ios_backgroundColor={isDarkMode ? "#555" : "#3e3e3e"}
              onValueChange={toggleColorTheme}
              value={colorTheme === 'orange'} />
          </View>
          
          <TouchableOpacity
            style={[styles.row, { 
              backgroundColor: CARD_BACKGROUND,
              borderLeftWidth: 3,
              borderLeftColor: '#32c759'
            }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#32c759' }]}>
              <Ionicons
                color="#fff"
                name="location"
                size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Localisation</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} />
          </TouchableOpacity>
          
          <View style={[styles.row, { 
            backgroundColor: CARD_BACKGROUND,
            borderLeftWidth: 3,
            borderLeftColor: '#38C959'
          }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#38C959' }]}>
              <Ionicons color="#fff" name="mail" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Notifications Email</Text>
            <View style={styles.rowSpacer} />
            <Switch
              thumbColor={form.emailNotifications ? PRIMARY_COLOR : "#f4f3f4"}
              trackColor={{ false: isDarkMode ? "#555" : "#767577", true: `${PRIMARY_COLOR}80` }}
              ios_backgroundColor={isDarkMode ? "#555" : "#3e3e3e"}
              onValueChange={emailNotifications =>
                setForm({ ...form, emailNotifications })
              }
              value={form.emailNotifications} />
          </View>
          
          <View style={[styles.row, { 
            backgroundColor: CARD_BACKGROUND,
            borderLeftWidth: 3,
            borderLeftColor: '#38C959'
          }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#38C959' }]}>
              <Ionicons color="#fff" name="notifications" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Notifications Push</Text>
            <View style={styles.rowSpacer} />
            <Switch
              thumbColor={form.pushNotifications ? PRIMARY_COLOR : "#f4f3f4"}
              trackColor={{ false: isDarkMode ? "#555" : "#767577", true: `${PRIMARY_COLOR}80` }}
              ios_backgroundColor={isDarkMode ? "#555" : "#3e3e3e"}
              onValueChange={pushNotifications =>
                setForm({ ...form, pushNotifications })
              }
              value={form.pushNotifications} />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: PRIMARY_COLOR }]}>Ressources</Text>
          
          <TouchableOpacity
            style={[styles.row, { 
              backgroundColor: CARD_BACKGROUND,
              borderLeftWidth: 3,
              borderLeftColor: '#8e8d91'
            }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#8e8d91' }]}>
              <Ionicons color="#fff" name="bug" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Signaler un bug</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.row, { 
              backgroundColor: CARD_BACKGROUND,
              borderLeftWidth: 3,
              borderLeftColor: '#007afe'
            }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#007afe' }]}>
              <Ionicons color="#fff" name="chatbubble-ellipses" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Contactez-nous</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.row, { 
              backgroundColor: CARD_BACKGROUND,
              borderLeftWidth: 3,
              borderLeftColor: '#32c759'
            }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#32c759' }]}>
              <Ionicons color="#fff" name="star" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Notez l'application</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} />
          </TouchableOpacity>
        </View>

        {/* Logout button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { 
            backgroundColor: SECONDARY_COLOR,
            shadowOpacity: isDarkMode ? 0.5 : 0.2,
          }]}
          onPress={() => {
            AsyncStorage.setItem(
              'userData',
              JSON.stringify({...userDetails, loggedIn: false}),
            );
            navigation.navigate('Auth', {
              screen: 'Login',
            });
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    position: 'relative',
    paddingBottom: 30,
  },
  darkModeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  profileInner: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10,
    zIndex: 2,
  },
  profileCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 3,
  },
  profile: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarWrapper: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 8,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  profileAction: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 56,
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 15,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  logoutText: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});