import React, { useState, useEffect, useCallback } from 'react';
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
  TextInput,
  ActivityIndicator,
  Keyboard,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import API_BASE_URL from '../../config/Api';
import Token from '../../config/TokenDolibar';

export default function UserDetailsScreen({ navigation }) {
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Form inputs for editing
  const [inputs, setInputs] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const { theme, isDarkMode, colorTheme } = useTheme();

  // Define colors based on theme
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#ffffff';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#f8f8f8';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Custom Toast Component
  const showToast = (type, title, message) => {
    setShowSuccess(type === 'success');
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Parse address string into components
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

  // Combine address components into a single string
  const combineAddress = (address, city, postalCode) => {
    const parts = [address, city, postalCode]
      .filter(part => part && typeof part === 'string' && part.trim())
      .map(part => part.trim());
    return parts.join(', ');
  };

  // Get full address display
  const getFullAddress = (userData) => {
    if (userData && userData.address) {
      return userData.address;
    }
    
    // Fallback: combine from separate fields if available
    const parts = [];
    if (userData && userData.town) parts.push(userData.town);
    if (userData && userData.zip) parts.push(userData.zip);
    return parts.join(', ') || 'Non renseigné';
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
        
        return {
          streetAddress: quartierAddress,
          city: city,
          postalCode: postalCode,
          fullAddress: [quartierAddress, city, postalCode].filter(Boolean).join(', '),
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

  // Initialize inputs with user data
  const initializeInputs = (userData) => {
    if (!userData) return;
    
    // Parse the address if it exists
    const addressParts = parseAddress(userData.address);
    
    const newInputs = {
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      address: addressParts.address || userData.address || '',
      city: addressParts.city || userData.town || '',
      postalCode: addressParts.postalCode || userData.zip || '',
    };
    
    setInputs(newInputs);
  };

  // Get current user data
  const getUserData = async () => {
    try {
      setLoading(true);
      
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!userDataString) {
        navigation.goBack();
        return;
      }
      
      const userData = JSON.parse(userDataString);
      
      if (!userData.id) {
        navigation.goBack();
        return;
      }
      
      const clientID = userData.id;
      
      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };
      
      const url = API_BASE_URL + '/thirdparties/' + clientID;
      
      const res = await axios.get(url, { headers });
      const fetchedUserData = res.data;
      
      setUserDetails(fetchedUserData);
      initializeInputs(fetchedUserData);
      
    } catch (error) {
      console.log('Error fetching user data:', error);
      showToast('error', 'Erreur', 'Impossible de charger les données utilisateur');
    } finally {
      setLoading(false);
    }
  };

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      getUserData();
      setIsEditing(false);
      setErrors({});
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

    if (!inputs.name.trim()) {
      handleError('Le nom est requis', 'name');
      isValid = false;
    }

    if (!inputs.email.trim()) {
      handleError('L\'email est requis', 'email');
      isValid = false;
    } else if (!inputs.email.match(/\S+@\S+\.\S+/)) {
      handleError('Format d\'email invalide', 'email');
      isValid = false;
    }

    if (!inputs.phone.trim()) {
      handleError('Le téléphone est requis', 'phone');
      isValid = false;
    }

    return isValid;
  };

  // Save user changes
  const saveUserData = async () => {
    if (!validateInputs()) {
      return;
    }

    setSaving(true);
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      const clientID = userData.id;
      
      // Combine address components for API
      const combinedAddress = combineAddress(inputs.address, inputs.city, inputs.postalCode);
      
      const updateData = {
        name: inputs.name.trim(),
        email: inputs.email.trim(),
        phone: inputs.phone.trim(),
        address: combinedAddress,
        town: inputs.city.trim(),
        zip: inputs.postalCode.trim(),
      };

      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };

      const res = await axios.put(
        API_BASE_URL + 'thirdparties/' + clientID,
        updateData,
        { headers }
      );

      // Update local user details
      const updatedUserDetails = { ...userDetails, ...updateData };
      setUserDetails(updatedUserDetails);
      initializeInputs(updatedUserDetails);
      
      setIsEditing(false);
      showToast('success', 'Succès! 🎉', 'Vos informations ont été mises à jour');

    } catch (error) {
      console.log('Error updating user data:', error);
      showToast('error', 'Erreur', error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    if (userDetails) {
      initializeInputs(userDetails);
    }
    setErrors({});
    setIsEditing(false);
  };

  // Confirm cancel if user has made changes
  const handleCancelPress = () => {
    const originalAddressParts = parseAddress(userDetails?.address);
    
    const hasChanges = 
      inputs.name !== (userDetails?.name || '') ||
      inputs.email !== (userDetails?.email || '') ||
      inputs.phone !== (userDetails?.phone || '') ||
      inputs.address !== (originalAddressParts.address || userDetails?.address || '') ||
      inputs.city !== (originalAddressParts.city || userDetails?.town || '') ||
      inputs.postalCode !== (originalAddressParts.postalCode || userDetails?.zip || '');

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

  // Handle edit button press
  const handleEditPress = () => {
    if (isEditing) {
      handleCancelPress();
    } else {
      if (userDetails) {
        initializeInputs(userDetails);
      }
      setIsEditing(true);
    }
  };

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
              Sauvegarde...
            </Text>
          </View>
        </View>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <View style={styles.successToast}>
          <View style={[styles.toastContent, { backgroundColor: '#4CAF50' }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.toastText}>Informations mises à jour!</Text>
          </View>
        </View>
      )}

      {/* Header */}
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
          onPress={handleEditPress}
          disabled={loading}
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
          <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
            {!keyboardVisible && (
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons 
                  name="account-circle" 
                  size={24} 
                  color={PRIMARY_COLOR} 
                />
                <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
                  Informations personnelles
                </Text>
              </View>
            )}

            <View style={styles.fieldsContainer}>
              {loading && !userDetails ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                  <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
                    Chargement des données...
                  </Text>
                </View>
              ) : userDetails ? (
                <>
                  {isEditing ? (
                    <>
                      {/* Name Input */}
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Nom complet</Text>
                        <View style={[styles.inputWrapper, { 
                          backgroundColor: BACKGROUND_COLOR,
                          borderColor: errors.name ? '#ff4444' : BORDER_COLOR 
                        }]}>
                          <MaterialCommunityIcons 
                            name="account-outline" 
                            size={20} 
                            color={TEXT_COLOR_SECONDARY} 
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.textInput, { color: TEXT_COLOR }]}
                            value={inputs.name}
                            onChangeText={text => handleOnchange(text, 'name')}
                            onFocus={() => handleError(null, 'name')}
                            placeholder="Entrez votre nom complet"
                            placeholderTextColor={TEXT_COLOR_SECONDARY}
                          />
                        </View>
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                      </View>

                      {/* Email Input */}
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Email</Text>
                        <View style={[styles.inputWrapper, { 
                          backgroundColor: BACKGROUND_COLOR,
                          borderColor: errors.email ? '#ff4444' : BORDER_COLOR 
                        }]}>
                          <MaterialCommunityIcons 
                            name="email-outline" 
                            size={20} 
                            color={TEXT_COLOR_SECONDARY} 
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.textInput, { color: TEXT_COLOR }]}
                            value={inputs.email}
                            onChangeText={text => handleOnchange(text, 'email')}
                            onFocus={() => handleError(null, 'email')}
                            placeholder="Entrez votre email"
                            placeholderTextColor={TEXT_COLOR_SECONDARY}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                      </View>

                      {/* Phone Input */}
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Téléphone</Text>
                        <View style={[styles.inputWrapper, { 
                          backgroundColor: BACKGROUND_COLOR,
                          borderColor: errors.phone ? '#ff4444' : BORDER_COLOR 
                        }]}>
                          <MaterialCommunityIcons 
                            name="phone-outline" 
                            size={20} 
                            color={TEXT_COLOR_SECONDARY} 
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.textInput, { color: TEXT_COLOR }]}
                            value={inputs.phone}
                            onChangeText={text => handleOnchange(text, 'phone')}
                            onFocus={() => handleError(null, 'phone')}
                            placeholder="Entrez votre numéro de téléphone"
                            placeholderTextColor={TEXT_COLOR_SECONDARY}
                            keyboardType="phone-pad"
                          />
                        </View>
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                      </View>

                      {/* Address Input with GPS Button */}
                      <View style={styles.addressContainer}>
                        <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Adresse</Text>
                        <View style={[styles.inputWrapper, { 
                          backgroundColor: BACKGROUND_COLOR,
                          borderColor: errors.address ? '#ff4444' : BORDER_COLOR 
                        }]}>
                          <MaterialCommunityIcons 
                            name="map-marker-outline" 
                            size={20} 
                            color={TEXT_COLOR_SECONDARY} 
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={[styles.textInput, { color: TEXT_COLOR, paddingRight: 50 }]}
                            value={inputs.address}
                            onChangeText={text => handleOnchange(text, 'address')}
                            onFocus={() => handleError(null, 'address')}
                            placeholder="Entrez votre adresse ou utilisez GPS"
                            placeholderTextColor={TEXT_COLOR_SECONDARY}
                          />
                          <TouchableOpacity
                            style={[styles.gpsButton, { 
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
                                size={16} 
                                color="white" 
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                      </View>

                      {!keyboardVisible && (
                        <View style={styles.helperContainer}>
                          <MaterialCommunityIcons name="information" size={16} color={PRIMARY_COLOR} />
                          <Text style={[styles.helperText, { color: TEXT_COLOR_SECONDARY }]}>
                            Appuyez sur le bouton GPS pour obtenir automatiquement votre adresse
                          </Text>
                        </View>
                      )}

                      {/* City and Postal Code Row */}
                      <View style={styles.cityPostalRow}>
                        {/* City Input */}
                        <View style={[styles.inputContainer, styles.cityContainer]}>
                          <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Ville</Text>
                          <View style={[styles.inputWrapper, { 
                            backgroundColor: BACKGROUND_COLOR,
                            borderColor: errors.city ? '#ff4444' : BORDER_COLOR 
                          }]}>
                            <MaterialCommunityIcons 
                              name="city" 
                              size={20} 
                              color={TEXT_COLOR_SECONDARY} 
                              style={styles.inputIcon}
                            />
                            <TextInput
                              style={[styles.textInput, { color: TEXT_COLOR }]}
                              value={inputs.city}
                              onChangeText={text => handleOnchange(text, 'city')}
                              onFocus={() => handleError(null, 'city')}
                              placeholder="Ville"
                              placeholderTextColor={TEXT_COLOR_SECONDARY}
                            />
                          </View>
                          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                        </View>

                        {/* Postal Code Input */}
                        <View style={[styles.inputContainer, styles.postalContainer]}>
                          <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>Code Postal</Text>
                          <View style={[styles.inputWrapper, { 
                            backgroundColor: BACKGROUND_COLOR,
                            borderColor: errors.postalCode ? '#ff4444' : BORDER_COLOR 
                          }]}>
                            <MaterialCommunityIcons 
                              name="mailbox-outline" 
                              size={20} 
                              color={TEXT_COLOR_SECONDARY} 
                              style={styles.inputIcon}
                            />
                            <TextInput
                              style={[styles.textInput, { color: TEXT_COLOR }]}
                              value={inputs.postalCode}
                              onChangeText={text => handleOnchange(text, 'postalCode')}
                              onFocus={() => handleError(null, 'postalCode')}
                              placeholder="Code"
                              placeholderTextColor={TEXT_COLOR_SECONDARY}
                              keyboardType="numeric"
                            />
                          </View>
                          {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                          <MaterialCommunityIcons 
                            name="account" 
                            size={20} 
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
                        <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                          <MaterialCommunityIcons 
                            name="email" 
                            size={20} 
                            color={PRIMARY_COLOR} 
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
                        <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                          <MaterialCommunityIcons 
                            name="phone" 
                            size={20} 
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
                        <View style={[styles.infoIcon, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                          <MaterialCommunityIcons 
                            name="map-marker" 
                            size={20} 
                            color={PRIMARY_COLOR} 
                          />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={[styles.infoLabel, { color: TEXT_COLOR_SECONDARY }]}>
                            Adresse complète
                          </Text>
                          <Text style={[styles.infoValue, { color: TEXT_COLOR }]}>
                            {getFullAddress(userDetails)}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <View style={styles.noDataContent}>
                  <Text style={[styles.noDataText, { color: TEXT_COLOR }]}>
                    Aucune donnée utilisateur trouvée
                  </Text>
                  <TouchableOpacity 
                    style={[styles.retryButton, { backgroundColor: PRIMARY_COLOR }]}
                    onPress={getUserData}
                  >
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Save Button (only shown when editing) */}
          {isEditing && userDetails && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={saveUserData}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingModal: {
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
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
    padding: 15,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  keyboardView: {
    flex: 1,
  },
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
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2.22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  fieldsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Custom Input Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    position: 'relative',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 5,
  },
  // Address Container with GPS Button
  addressContainer: {
    marginBottom: 20,
  },
  gpsButton: {
    position: 'absolute',
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  // City and Postal Code Row
  cityPostalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cityContainer: {
    flex: 2,
  },
  postalContainer: {
    flex: 1,
    minWidth: 100,
  },
  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  // Button Styles
  buttonContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});