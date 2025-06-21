import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  PermissionsAndroid,
  Animated,
  Dimensions,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Input from './Auth/Input'; // Using your existing Input component
import API_BASE_URL from '../../config/Api';
import Token from '../../config/TokenDolibar';

const { width: screenWidth } = Dimensions.get('window');

export default function UserDetailsScreen({ navigation }) {
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Form inputs for editing
  const [inputs, setInputs] = useState({
    fullname: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const { theme, isDarkMode, colorTheme } = useTheme();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Enhanced theme colors
  const PRIMARY_COLOR = theme.primary;
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#4A90E2' : '#FF8A50';
  const BACKGROUND_COLOR = theme.backgroundColor;
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = theme.textColor;
  const TEXT_COLOR_SECONDARY = theme.secondaryTextColor;
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#f0f0f0';

  // Initialize animations
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Success animation
  const showSuccessAnimation = () => {
    setShowSuccess(true);
    Animated.sequence([
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSuccess(false));
  };

  // Safe address parsing function
  const parseAddress = (addressString) => {
    if (!addressString || typeof addressString !== 'string') {
      return { address: '', city: '', postalCode: '' };
    }

    try {
      const parts = addressString.split(',').map(part => part.trim()).filter(Boolean);
      
      if (parts.length === 0) {
        return { address: '', city: '', postalCode: '' };
      } else if (parts.length === 1) {
        return { address: parts[0], city: '', postalCode: '' };
      } else if (parts.length === 2) {
        return { address: parts[0], city: parts[1], postalCode: '' };
      } else {
        return {
          address: parts[0],
          city: parts[1],
          postalCode: parts[2]
        };
      }
    } catch (error) {
      console.log('Error parsing address:', error);
      return { address: addressString, city: '', postalCode: '' };
    }
  };

  // Safely concatenate address parts
  const concatenateAddress = (address, city, postalCode) => {
    const parts = [address, city, postalCode]
      .filter(part => part && typeof part === 'string' && part.trim())
      .map(part => part.trim());
    return parts.join(', ');
  };

  // Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const checkResult = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (checkResult === true) return true;

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message: 'Cette application a besoin d\'accéder à votre localisation pour obtenir votre adresse automatiquement.',
            buttonNeutral: 'Plus tard',
            buttonNegative: 'Refuser',
            buttonPositive: 'Accepter',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  // Get address from coordinates
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&accept-language=fr`,
        {
          headers: {
            'User-Agent': 'PetCornerApp/1.0',
            'Referer': 'https://your-app-domain.com'
          },
          timeout: 10000
        }
      );
      
      if (response.data && response.data.address) {
        const addressData = response.data.address;
        const neighbourhood = addressData.neighbourhood || addressData.suburb || addressData.quarter || addressData.district || '';
        const city = addressData.city || addressData.town || addressData.village || addressData.municipality || '';
        const postalCode = addressData.postcode || '';
        
        const quartierAddress = neighbourhood || city || 'Quartier non spécifié';
        const fullAddress = [quartierAddress, city, postalCode].filter(Boolean).join(', ');
        
        return {
          streetAddress: quartierAddress,
          city: city,
          postalCode: postalCode,
          fullAddress: fullAddress,
          displayName: response.data.display_name,
          source: 'Nominatim'
        };
      }
      throw new Error('No address data');
    } catch (error) {
      console.log('Geocoding failed:', error.message);
      const roundedLat = latitude.toFixed(4);
      const roundedLon = longitude.toFixed(4);
      
      return {
        streetAddress: `Localisation GPS (${roundedLat}, ${roundedLon})`,
        city: 'Ville à préciser',
        postalCode: '',
        fullAddress: `Coordonnées: ${roundedLat}, ${roundedLon}`,
        displayName: `Position GPS: ${roundedLat}, ${roundedLon}`,
        source: 'GPS Coordinates'
      };
    }
  };

  // Get current location
  const getCurrentLocationAddress = async () => {
    setGettingLocation(true);
    
    try {
      const hasPermission = await requestLocationPermission();
      
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          text1: 'Permission refusée',
          text2: 'Permission de localisation requise',
          visibilityTime: 3000,
          topOffset: 60,
        });
        setGettingLocation(false);
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const addressInfo = await getAddressFromCoordinates(latitude, longitude);
            
            setInputs(prevState => ({
              ...prevState, 
              address: addressInfo.streetAddress || addressInfo.displayName,
              city: addressInfo.city,
              postalCode: addressInfo.postalCode
            }));
            
            handleError(null, 'address');
            handleError(null, 'city');
            handleError(null, 'postalCode');
            
            Toast.show({
              type: 'success',
              text1: 'Adresse récupérée! 📍',
              text2: `${addressInfo.city || 'Ville'} ${addressInfo.postalCode || 'Code postal'}`,
              visibilityTime: 3000,
              topOffset: 60,
            });
            
            setGettingLocation(false);
          } catch (error) {
            console.error('Error getting address:', error);
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          Toast.show({
            type: 'error',
            text1: 'Erreur de localisation',
            text2: 'Impossible d\'obtenir votre position',
            visibilityTime: 4000,
            topOffset: 60,
          });
          setGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        }
      );
    } catch (error) {
      console.error('Permission error:', error);
      setGettingLocation(false);
    }
  };

  // Get user data
  const getUserData = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!userData) {
        navigation.goBack();
        return;
      }
      
      const clientID = userData.id;
      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };
      
      const res = await axios.get(API_BASE_URL + 'thirdparties/' + clientID, { headers });
      setUserDetails(res.data);
      
      const addressParts = parseAddress(res.data.address);
      
      setInputs({
        fullname: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: addressParts.address,
        city: addressParts.city,
        postalCode: addressParts.postalCode,
      });
      
    } catch (error) {
      console.log('Error fetching user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les données',
        visibilityTime: 3000,
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUserData();
    }, [])
  );

  // Handle input changes
  const handleOnchange = (text, input) => {
    setInputs(prevState => ({ ...prevState, [input]: text }));
    if (errors[input]) {
      setErrors(prevState => ({ ...prevState, [input]: null }));
    }
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({ ...prevState, [input]: error }));
  };

  // Validate inputs
  const validateInputs = () => {
    let isValid = true;

    if (!inputs.fullname.trim()) {
      handleError('Veuillez saisir votre nom complet', 'fullname');
      isValid = false;
    }

    if (!inputs.email.trim()) {
      handleError('Veuillez saisir votre email', 'email');
      isValid = false;
    } else if (!inputs.email.match(/\S+@\S+\.\S+/)) {
      handleError('Veuillez saisir un email valide', 'email');
      isValid = false;
    }

    if (!inputs.phone.trim()) {
      handleError('Veuillez saisir votre numéro de téléphone', 'phone');
      isValid = false;
    }

    if (!inputs.address.trim()) {
      handleError('Veuillez saisir votre quartier', 'address');
      isValid = false;
    }

    if (!inputs.city.trim()) {
      handleError('Veuillez saisir votre ville', 'city');
      isValid = false;
    }

    if (!inputs.postalCode.trim()) {
      handleError('Veuillez saisir votre code postal', 'postalCode');
      isValid = false;
    }

    return isValid;
  };

  // Save user data
  const saveUserData = async () => {
    if (!validateInputs()) return;

    setSaving(true);
    
    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      const clientID = userData.id;
      
      const concatenatedAddress = concatenateAddress(
        inputs.address,
        inputs.city, 
        inputs.postalCode
      );

      const updateData = {
        name: inputs.fullname.trim(),
        email: inputs.email.trim(),
        phone: inputs.phone.trim(),
        address: concatenatedAddress,
        array_options: {
          ville: inputs.city.trim(),
          code_postal: inputs.postalCode.trim(),
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };

      await axios.put(
        API_BASE_URL + 'thirdparties/' + clientID,
        updateData,
        { headers }
      );

      setUserDetails({ ...userDetails, ...updateData });
      setIsEditing(false);
      showSuccessAnimation();

    } catch (error) {
      console.log('Error updating user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Erreur lors de la mise à jour',
        visibilityTime: 3000,
        topOffset: 60,
      });
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    if (userDetails) {
      const addressParts = parseAddress(userDetails.address);
      setInputs({
        fullname: userDetails.name || '',
        email: userDetails.email || '',
        phone: userDetails.phone || '',
        address: addressParts.address,
        city: addressParts.city,
        postalCode: addressParts.postalCode,
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  // Handle cancel press
  const handleCancelPress = () => {
    const originalAddressParts = parseAddress(userDetails?.address);
    const hasChanges = 
      inputs.fullname !== (userDetails?.name || '') ||
      inputs.email !== (userDetails?.email || '') ||
      inputs.phone !== (userDetails?.phone || '') ||
      inputs.address !== originalAddressParts.address ||
      inputs.city !== originalAddressParts.city ||
      inputs.postalCode !== originalAddressParts.postalCode;

    if (hasChanges) {
      Alert.alert(
        'Annuler les modifications',
        'Êtes-vous sûr de vouloir annuler vos modifications ?',
        [
          { text: 'Non', style: 'cancel' },
          { text: 'Oui', onPress: cancelEditing }
        ]
      );
    } else {
      cancelEditing();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={styles.loaderContainer}>
          <View style={[styles.loadingCard, { backgroundColor: CARD_BACKGROUND }]}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
              Chargement de votre profil...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={BACKGROUND_COLOR} 
      />
      
      {/* Loading Overlay */}
      {saving && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingModal, { backgroundColor: CARD_BACKGROUND }]}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
              Sauvegarde en cours...
            </Text>
          </View>
        </View>
      )}

      {/* Enhanced Success Toast */}
      {showSuccess && (
        <Animated.View 
          style={[
            styles.successToast,
            {
              opacity: successAnim,
              transform: [
                {
                  translateY: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
                {
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.toastContent}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
            <Text style={styles.toastText}>Profil mis à jour avec succès!</Text>
            <MaterialCommunityIcons name="sparkles" size={20} color="#fff" />
          </View>
        </Animated.View>
      )}

      {/* Header - keeping original */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier le profil' : 'Mon profil'}
        </Text>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => {
            if (isEditing) {
              handleCancelPress();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <MaterialCommunityIcons 
            name={isEditing ? "close" : "pencil"} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View
          style={[
            styles.scrollContainer,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: keyboardVisible ? 10 : 20 }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Enhanced User Info Section */}
            <Animated.View 
              style={[
                styles.section, 
                { 
                  backgroundColor: CARD_BACKGROUND,
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                }
              ]}
            >
              {!keyboardVisible && (
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconContainer, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                    <MaterialCommunityIcons 
                      name="account-circle" 
                      size={28} 
                      color={PRIMARY_COLOR} 
                    />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
                      Informations personnelles
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                      {isEditing ? 'Modifiez vos informations' : 'Vos données personnelles'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.fieldsContainer}>
                {isEditing ? (
                  <>
                    <Input
                      value={inputs.fullname}
                      onChangeText={text => handleOnchange(text, 'fullname')}
                      onFocus={() => handleError(null, 'fullname')}
                      iconName="account-outline"
                      label="Nom complet"
                      placeholder="Entrez votre nom complet"
                      error={errors.fullname}
                      labelColor={TEXT_COLOR}
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />

                    <Input
                      value={inputs.email}
                      onChangeText={text => handleOnchange(text, 'email')}
                      onFocus={() => handleError(null, 'email')}
                      iconName="email-outline"
                      label="Email"
                      placeholder="Entrez votre email"
                      error={errors.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      labelColor={TEXT_COLOR}
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />

                    {/* Address Input with Location Button */}
                    <View style={styles.addressContainer}>
                      <View style={styles.addressInputContainer}>
                        <Input
                          value={inputs.address}
                          onChangeText={text => handleOnchange(text, 'address')}
                          onFocus={() => handleError(null, 'address')}
                          iconName="map-marker-outline"
                          label="Adresse (Quartier)"
                          placeholder="Entrez votre quartier ou utilisez la localisation"
                          error={errors.address}
                          labelColor={TEXT_COLOR}
                          theme={theme}
                          isDarkMode={isDarkMode}
                        />
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.locationButton, { 
                          backgroundColor: PRIMARY_COLOR,
                          opacity: gettingLocation ? 0.7 : 1
                        }]}
                        onPress={getCurrentLocationAddress}
                        disabled={gettingLocation}
                      >
                        {gettingLocation ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <MaterialCommunityIcons 
                            name="crosshairs-gps" 
                            size={20} 
                            color="white" 
                          />
                        )}
                      </TouchableOpacity>
                    </View>

                    {!keyboardVisible && (
                      <View style={styles.helperContainer}>
                        <MaterialCommunityIcons name="information" size={16} color={PRIMARY_COLOR} />
                        <Text style={[styles.helperText, { color: TEXT_COLOR_SECONDARY }]}>
                          Appuyez sur le bouton GPS pour obtenir automatiquement votre adresse
                        </Text>
                      </View>
                    )}

                    {/* Fixed City and Postal Code Row */}
                    <View style={styles.cityPostalRow}>
                      <View style={styles.cityContainer}>
                        <Input
                          value={inputs.city}
                          onChangeText={text => handleOnchange(text, 'city')}
                          onFocus={() => handleError(null, 'city')}
                          iconName="city"
                          label="Ville"
                          placeholder="Ville"
                          error={errors.city}
                          labelColor={TEXT_COLOR}
                          theme={theme}
                          isDarkMode={isDarkMode}
                        />
                      </View>
                      
                      <View style={styles.postalContainer}>
                        <Input
                          value={inputs.postalCode}
                          onChangeText={text => handleOnchange(text, 'postalCode')}
                          onFocus={() => handleError(null, 'postalCode')}
                          iconName="mailbox-outline"
                          label="Code Postal"
                          placeholder="Code"
                          error={errors.postalCode}
                          keyboardType="numeric"
                          labelColor={TEXT_COLOR}
                          theme={theme}
                          isDarkMode={isDarkMode}
                        />
                      </View>
                    </View>

                    <Input
                      value={inputs.phone}
                      onChangeText={text => handleOnchange(text, 'phone')}
                      onFocus={() => handleError(null, 'phone')}
                      iconName="phone-outline"
                      label="Numéro de téléphone"
                      placeholder="Entrez votre numéro de téléphone"
                      error={errors.phone}
                      keyboardType="phone-pad"
                      labelColor={TEXT_COLOR}
                      theme={theme}
                      isDarkMode={isDarkMode}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '15' }]}>
                        <MaterialCommunityIcons 
                          name="account" 
                          size={22} 
                          color={PRIMARY_COLOR} 
                        />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                          Nom complet
                        </Text>
                        <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                          {userDetails?.name || 'Non renseigné'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={[styles.infoIcon, { backgroundColor: SECONDARY_COLOR + '15' }]}>
                        <MaterialCommunityIcons 
                          name="email" 
                          size={22} 
                          color={SECONDARY_COLOR} 
                        />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                          Email
                        </Text>
                        <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                          {userDetails?.email || 'Non renseigné'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '15' }]}>
                        <MaterialCommunityIcons 
                          name="phone" 
                          size={22} 
                          color={PRIMARY_COLOR} 
                        />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                          Téléphone
                        </Text>
                        <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                          {userDetails?.phone || 'Non renseigné'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={[styles.infoIcon, { backgroundColor: SECONDARY_COLOR + '15' }]}>
                        <MaterialCommunityIcons 
                          name="map-marker" 
                          size={22} 
                          color={SECONDARY_COLOR} 
                        />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                          Adresse complète
                        </Text>
                        <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                          {userDetails?.address || 'Non renseigné'}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </Animated.View>

            {/* Enhanced Save Button */}
            {isEditing && (
              <Animated.View 
                style={[
                  styles.buttonContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                  }
                ]}
              >
                <TouchableOpacity 
                  style={[styles.saveButton, { 
                    backgroundColor: PRIMARY_COLOR,
                    opacity: saving ? 0.8 : 1,
                  }]}
                  onPress={saveUserData}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="content-save" size={22} color="#fff" />
                      <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
      
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingModal: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    minWidth: 200,
  },
  successToast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  // Original header styles
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  fieldsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  // Address container and location button styles - FIXED
  addressContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  addressInputContainer: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    right: 10,
    top: 35, // Adjusted to align with input field
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: -8,
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 13,
    marginLeft: 8,
    fontStyle: 'italic',
    flex: 1,
  },
  // City and Postal Code Row - FIXED for proper display
  cityPostalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 10,
  },
  cityContainer: {
    flex: 2, // Takes more space for city
  },
  postalContainer: {
    flex: 1, // Takes less space for postal code
    minWidth: 100, // Ensures minimum width for postal code
  },
  // Enhanced Info Row Styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  // Enhanced Button Styles
  buttonContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});