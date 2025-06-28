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
import Ionicons from 'react-native-vector-icons/Ionicons';
import Token from '../../config/TokenDolibar';
import { useFocusEffect } from '@react-navigation/native';
import API_BASE_URL from '../../config/Api';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen({navigation}) {
  const [userDetails, setUserDetails] = useState();
  const [form, setForm] = useState({
    emailNotifications: true,
    pushNotifications: false,
  });

  // Get safe area insets for proper padding
  const insets = useSafeAreaInsets();

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
  const DISABLED_COLOR = isDarkMode ? '#333333' : '#f0f0f0';
  const DISABLED_TEXT_COLOR = isDarkMode ? '#666666' : '#999999';

  // Add dark mode overlay for profile section
  const DARK_OVERLAY = isDarkMode ? 'rgba(0,0,0,0.3)' : 'transparent';

  // Calculate bottom padding for tab navigation
  const TAB_HEIGHT = 60; // Standard tab bar height
  const BOTTOM_PADDING = TAB_HEIGHT + insets.bottom + 20; // Tab height + safe area + extra padding

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

  // Component for disabled buttons with "Coming soon" indicator
  const DisabledRow = ({ icon, label, borderColor, iconBgColor }) => (
    <View style={[styles.row, styles.disabledRow, { 
      backgroundColor: DISABLED_COLOR,
      borderLeftWidth: 3,
      borderLeftColor: DISABLED_TEXT_COLOR,
      opacity: 0.6
    }]}>
      <View style={[styles.rowIcon, { backgroundColor: DISABLED_TEXT_COLOR }]}>
        <Ionicons color="#fff" name={icon} size={18} />
      </View>
      <View style={styles.rowLabelContainer}>
        <Text style={[styles.rowLabel, { color: DISABLED_TEXT_COLOR }]}>{label}</Text>
        <Text style={[styles.comingSoonText, { color: DISABLED_TEXT_COLOR }]}>
          Disponible dans la prochaine version
        </Text>
      </View>
      <View style={styles.rowSpacer} />
      <Ionicons
        color={DISABLED_TEXT_COLOR}
        name="time-outline"
        size={20} 
      />
    </View>
  );

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
            <TouchableOpacity disabled={true}>
              <View style={styles.profileAvatarWrapper}>
                <Image
                  alt=""
                  source={require('../assets/images/inconnu.jpg')}
                  style={styles.profileAvatar} 
                />
                <View style={[styles.profileAction, { backgroundColor: DISABLED_TEXT_COLOR }]}>
                  <Ionicons color="#fff" name="camera-outline" size={14} />
                </View>
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
        contentContainerStyle={{ 
          paddingBottom: BOTTOM_PADDING,
          flexGrow: 1 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: PRIMARY_COLOR }]}>
            <Ionicons name="person-circle-outline" size={18} color={PRIMARY_COLOR} /> Mon Compte
          </Text>

          {/* User Details Navigation - FUNCTIONAL */}
          <TouchableOpacity 
            style={[styles.row, { 
              backgroundColor: CARD_BACKGROUND,
              borderLeftWidth: 3,
              borderLeftColor: PRIMARY_COLOR
            }]}
            onPress={() => {
              console.log('Navigating to UserDetails...');
              navigation.navigate('UserDetailsScreen');
            }}
          >
            <View style={[styles.rowIcon, { backgroundColor: PRIMARY_COLOR }]}>
              <Ionicons color="#fff" name="person-outline" size={18} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Mes Informations</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: PRIMARY_COLOR }]}>
            <Ionicons name="settings-outline" size={18} color={PRIMARY_COLOR} /> Préférences
          </Text>

          {/* Dark Mode Toggle - FUNCTIONAL */}
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
              value={isDarkMode} 
            />
          </View>

          {/* Color Theme Toggle - FUNCTIONAL */}
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
              value={colorTheme === 'orange'} 
            />
          </View>

          {/* Email Notifications - DISABLED */}
          <View style={[styles.row, styles.disabledRow, { 
            backgroundColor: DISABLED_COLOR,
            borderLeftWidth: 3,
            borderLeftColor: DISABLED_TEXT_COLOR,
            opacity: 0.6
          }]}>
            <View style={[styles.rowIcon, { backgroundColor: DISABLED_TEXT_COLOR }]}>
              <Ionicons color="#fff" name="mail-outline" size={20} />
            </View>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: DISABLED_TEXT_COLOR }]}>Notifications Email</Text>
              <Text style={[styles.comingSoonText, { color: DISABLED_TEXT_COLOR }]}>
                Prochaine version
              </Text>
            </View>
            <View style={styles.rowSpacer} />
            <Switch
              disabled={true}
              thumbColor="#f4f3f4"
              trackColor={{ false: "#767577", true: "#767577" }}
              ios_backgroundColor="#3e3e3e"
              value={false} 
            />
          </View>

          {/* Push Notifications - DISABLED */}
          <View style={[styles.row, styles.disabledRow, { 
            backgroundColor: DISABLED_COLOR,
            borderLeftWidth: 3,
            borderLeftColor: DISABLED_TEXT_COLOR,
            opacity: 0.6
          }]}>
            <View style={[styles.rowIcon, { backgroundColor: DISABLED_TEXT_COLOR }]}>
              <Ionicons color="#fff" name="notifications-outline" size={20} />
            </View>
            <View style={styles.rowLabelContainer}>
              <Text style={[styles.rowLabel, { color: DISABLED_TEXT_COLOR }]}>Notifications Push</Text>
              <Text style={[styles.comingSoonText, { color: DISABLED_TEXT_COLOR }]}>
                Prochaine version
              </Text>
            </View>
            <View style={styles.rowSpacer} />
            <Switch
              disabled={true}
              thumbColor="#f4f3f4"
              trackColor={{ false: "#767577", true: "#767577" }}
              ios_backgroundColor="#3e3e3e"
              value={false} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: PRIMARY_COLOR }]}>
            <Ionicons name="help-circle-outline" size={18} color={PRIMARY_COLOR} /> Ressources
          </Text>

          {/* Bug Report - FUNCTIONAL */}
          <TouchableOpacity
            onPress={() => navigation.navigate("SignatureClient")}
            style={[styles.row, { 
              backgroundColor: CARD_BACKGROUND,
              borderLeftWidth: 3,
              borderLeftColor: '#8e8d91'
            }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#8e8d91' }]}>
              <Ionicons color="#fff" name="bug-outline" size={20} />
            </View>
            <Text style={[styles.rowLabel, { color: TEXT_COLOR }]}>Signaler un bug</Text>
            <View style={styles.rowSpacer} />
            <Ionicons
              color={TEXT_COLOR_SECONDARY}
              name="chevron-forward"
              size={20} 
            />
          </TouchableOpacity>

          {/* Contact Us - DISABLED */}
          <DisabledRow 
            icon="chatbubble-ellipses-outline"
            label="Contactez-nous"
            borderColor="#007afe"
            iconBgColor="#007afe"
          />

          {/* Rate App - DISABLED */}
          <DisabledRow 
            icon="star-outline"
            label="Notez l'application"
            borderColor="#32c759"
            iconBgColor="#32c759"
          />
        </View>

        {/* Logout button - FUNCTIONAL */}
        <View style={styles.logoutSection}>
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
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <View style={styles.versionBadge}>
            <Ionicons name="information-circle-outline" size={16} color={TEXT_COLOR_SECONDARY} />
            <Text style={[styles.versionText, { color: TEXT_COLOR_SECONDARY }]}>
              Version 1.0.0
            </Text>
          </View>
          <Text style={[styles.versionSubText, { color: DISABLED_TEXT_COLOR }]}>
            Nouvelles fonctionnalités à venir
          </Text>
        </View>

        {/* Extra bottom spacing to ensure content is visible above tab bar */}
        <View style={styles.bottomSpacer} />
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
    marginBottom: 25,
  },
  sectionTitle: {
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 56,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
  },
  disabledRow: {
    // Additional styling for disabled rows
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
  rowLabelContainer: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  comingSoonText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  rowSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  logoutSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
  },
  logoutText: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 24,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  versionSubText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20, // Extra spacing at the bottom
  },
});