import { Alert, Keyboard, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, StatusBar, Platform, PermissionsAndroid, Animated, KeyboardAvoidingView, Linking } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import Toast from 'react-native-toast-message';
import Geolocation from 'react-native-geolocation-service';
import Loader from '../Loader';
import Input from '../Auth/Input'
import Button from '../Auth/Botton'
import axios from 'axios';
import API_BASE_URL from '../../../config/Api';
import Token from '../../../config/TokenDolibar';
import { useTheme } from '../../context/ThemeContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Signup({navigation}) {
  const [inputs, setInputs] = useState({
    email: '',
    fullname: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // NEW STATE: Terms and Conditions acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { theme, isDarkMode, toggleTheme, colorTheme, toggleColorTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // Animation refs for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const successToastAnim = useRef(new Animated.Value(0)).current;
  const successToastSlideAnim = useRef(new Animated.Value(-100)).current;

  // Initialize entrance animations and keyboard listeners
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Keyboard event listeners
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

  // Success toast animation functions
  const showSuccessToastWithAnimation = () => {
    setShowSuccessToast(true);
    Animated.parallel([
      Animated.spring(successToastAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(successToastSlideAnim, {
        toValue: 0,
        tension: 140,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      hideSuccessToast();
    }, 2000);
  };

  const hideSuccessToast = () => {
    Animated.parallel([
      Animated.timing(successToastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successToastSlideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessToast(false);
    });
  };

  // NEW FUNCTION: Open Terms and Conditions URL
  const openTermsAndConditions = () => {
    const termsUrl = 'https://sites.google.com/view/petcorner-term-and-conditions/accueil';
    Linking.openURL(termsUrl).catch(err => {
      console.error('Failed to open Terms and Conditions:', err);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ouvrir les conditions d\'utilisation',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });
    });
  };

  // NEW FUNCTION: Toggle terms acceptance
  const toggleTermsAcceptance = () => {
    setTermsAccepted(!termsAccepted);
    if (errors.terms) {
      handleError(null, 'terms');
    }
  };

  const validate = () => {
    Keyboard.dismiss();
    let isValid = true;

    if (!inputs.email) {
      handleError('Veuillez saisir votre email', 'email');
      isValid = false;
    } else if (!inputs.email.match(/\S+@\S+\.\S+/)) {
      handleError('Veuillez saisir un email valide', 'email');
      isValid = false;
    }

    if (!inputs.fullname) {
      handleError('Veuillez saisir votre nom complet', 'fullname');
      isValid = false;
    }

    if(!inputs.address){
      handleError('Veuillez saisir votre quartier', 'address');
      isValid = false;
    }

    if(!inputs.city){
      handleError('Veuillez saisir votre ville', 'city');
      isValid = false;
    }

    if(!inputs.postalCode){
      handleError('Veuillez saisir votre code postal', 'postalCode');
      isValid = false;
    }

    if (!inputs.phone) {
      handleError('Veuillez saisir votre numéro de téléphone', 'phone');
      isValid = false;
    }

    if (!inputs.password) {
      handleError('Veuillez saisir votre mot de passe', 'password');
      isValid = false;
    } else if (inputs.password.length < 5) {
      handleError('Le mot de passe doit contenir au moins 5 caractères', 'password');
      isValid = false;
    }

    // NEW VALIDATION: Check if terms are accepted
    if (!termsAccepted) {
      handleError('Vous devez accepter les conditions d\'utilisation', 'terms');
      isValid = false;
      Toast.show({
        type: 'error',
        text1: 'Conditions requises',
        text2: 'Veuillez accepter les conditions d\'utilisation pour continuer',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });
    }

    if (isValid) {
      register();
    }
  };

  // Request location permission for Android
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const checkResult = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (checkResult === true) {
          return true;
        }

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

  // Multiple geocoding services with fallback
  const getAddressFromCoordinates = async (latitude, longitude) => {
    console.log('Starting geocoding for coordinates:', latitude, longitude);

    // Service 1: OpenStreetMap Nominatim with better headers and rate limiting
    const tryNominatim = async () => {
      try {
        console.log('Trying Nominatim service...');
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
          console.log('Nominatim response:', addressData);

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
        throw new Error('No address data from Nominatim');
      } catch (error) {
        console.log('Nominatim failed:', error.message);
        throw error;
      }
    };

    // Service 4: Simple fallback using coordinates
    const createFallbackAddress = () => {
      console.log('Using fallback address generation...');
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
    };

    // Try services in order with fallback
    const services = [tryNominatim];

    for (const service of services) {
      try {
        const result = await service();
        console.log('Geocoding successful with source:', result.source);
        return result;
      } catch (error) {
        console.log('Service failed, trying next...');
        continue;
      }
    }

    // If all services fail, use fallback
    console.log('All geocoding services failed, using fallback');
    return createFallbackAddress();
  };

  // Updated function to get current location with better error handling
  const getCurrentLocationAddress = async () => {
    console.log('GPS button clicked - starting location process');
    setGettingLocation(true);

    try {
      console.log('Requesting location permission...');
      const hasPermission = await requestLocationPermission();
      console.log('Permission granted:', hasPermission);

      if (!hasPermission) {
        console.log('Permission denied by user');
        Toast.show({
          type: 'error',
          text1: 'Permission refusée',
          text2: 'Permission de localisation requise pour obtenir votre adresse',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 60,
        });
        setGettingLocation(false);
        return;
      }

      console.log('Getting current position...');
      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            console.log('Position received:', position.coords);
            const { latitude, longitude } = position.coords;

            console.log('Getting address from coordinates...');
            const addressInfo = await getAddressFromCoordinates(latitude, longitude);
            console.log('Address info received:', addressInfo);

            // Update all address-related inputs
            setInputs(prevState => ({
              ...prevState,
              address: addressInfo.streetAddress || addressInfo.displayName,
              city: addressInfo.city,
              postalCode: addressInfo.postalCode
            }));

            // Clear any previous errors
            handleError(null, 'address');
            handleError(null, 'city');
            handleError(null, 'postalCode');

            const successMessage = addressInfo.source === 'GPS Coordinates'
              ? 'Position GPS récupérée! Veuillez vérifier les informations.'
              : `Adresse récupérée via ${addressInfo.source}! 📍`;

            Toast.show({
              type: 'success',
              text1: successMessage,
              text2: `${addressInfo.city || 'Ville'} ${addressInfo.postalCode || 'Code postal'}`,
              visibilityTime: 4000,
              autoHide: true,
              topOffset: 60,
            });

            setGettingLocation(false);
          } catch (error) {
            console.error('Error getting address:', error);

            // Provide basic GPS coordinates as fallback
            const { latitude, longitude } = position.coords;
            const roundedLat = latitude.toFixed(4);
            const roundedLon = longitude.toFixed(4);

            setInputs(prevState => ({
              ...prevState,
              address: `GPS: ${roundedLat}, ${roundedLon}`,
              city: 'À préciser',
              postalCode: ''
            }));

            Toast.show({
              type: 'info',
              text1: 'Position GPS obtenue',
              text2: 'Veuillez vérifier et compléter les informations d\'adresse',
              visibilityTime: 4000,
              autoHide: true,
              topOffset: 60,
            });

            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Erreur lors de la récupération de la localisation';

          switch (error.code) {
            case 1:
              errorMessage = 'Permission de localisation refusée';
              break;
            case 2:
              errorMessage = 'Position non disponible. Vérifiez que le GPS est activé';
              break;
            case 3:
              errorMessage = 'Délai d\'attente dépassé. Réessayez';
              break;
            default:
              errorMessage = 'Erreur de localisation inconnue';
          }

          Toast.show({
            type: 'error',
            text1: 'Erreur de localisation',
            text2: errorMessage,
            visibilityTime: 4000,
            autoHide: true,
            topOffset: 60,
          });

          setGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
          forceRequestLocation: true,
          showLocationDialog: true,
        }
      );
    } catch (error) {
      console.error('Permission error:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de permission',
        text2: 'Impossible d\'accéder à la localisation',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });
      setGettingLocation(false);
    }
  };

  const register = async () => {
    setLoading(true);
    const concatenatedAddress = [
      inputs.address,
      inputs.city,
      inputs.postalCode
    ].filter(Boolean).join(', ');

    const inputData = {
      module: 'societe',
      name: inputs.fullname,
      phone: inputs.phone,
      address: concatenatedAddress,
      email: inputs.email,
      client: 1,
      code_client: -1,
      array_options: {
        mdpmob: inputs.password,
        ville: inputs.city,
        code_postal: inputs.postalCode,
      }
    };

    try {
      const res = await axios.post(API_BASE_URL + 'thirdparties', inputData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'DOLAPIKEY': Token
        }
      });

      console.log("User ID:", res.data);
      setLoading(false);
      showSuccessToastWithAnimation();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          navigation.replace('Login', {
            email: inputs.email,
            phone: inputs.phone,
            fromSignup: true
          });
        });
      }, 2200);

    } catch (error) {
      setLoading(false);
      if (error.response) {
        console.log("API Error:", error.response.data);
        Toast.show({
          type: 'error',
          text1: 'Erreur lors de la création',
          text2: error.response.data?.message || 'Une erreur s\'est produite',
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 60,
        });
      } else {
        console.log("Error:", error.message);
        Toast.show({
          type: 'error',
          text1: 'Erreur de connexion',
          text2: 'Vérifiez votre connexion internet',
          visibilityTime: 4000,
          autoHide: true,
          topOffset: 60,
        });
      }
    }
  };

  const handleOnchange = (text, input) => {
    setInputs(prevState => ({...prevState, [input]: text}));
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({...prevState, [input]: error}));
  };

  // Handle input focus with scrolling
  const handleInputFocus = (inputName) => {
    handleError(null, inputName);
    // Scroll to make sure the input is visible when keyboard appears
    setTimeout(() => {
      if (scrollViewRef.current) {
        let scrollOffset = 0;
        // Calculate scroll offset based on input position
        switch (inputName) {
          case 'phone':
            scrollOffset = 350;
            break;
          case 'password':
            scrollOffset = 450;
            break;
          default:
            scrollOffset = 200;
        }

        scrollViewRef.current.scrollTo({
          y: scrollOffset,
          animated: true
        });
      }
    }, 100);
  };

  const navigateToLogin = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.replace('Login');
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.backgroundColor}
      />

      <Loader visible={loading && !showSuccessToast} />

      {/* Beautiful Success Toast */}
      {showSuccessToast && (
        <Animated.View
          style={[
            styles.successToastContainer,
            {
              opacity: successToastAnim,
              transform: [{ translateY: successToastSlideAnim }],
              top: insets.top + 20,
            }
          ]}
        >
          <View style={[styles.successToast, { backgroundColor: '#4CAF50' }]}>
            <Animated.View
              style={{
                transform: [{
                  scale: successToastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }],
              }}
            >
              <MaterialCommunityIcons
                name="account-check"
                size={28}
                color="#ffffff"
              />
            </Animated.View>
            <View style={styles.successToastTextContainer}>
              <Text style={styles.successToastTitle}>Compte créé avec succès!</Text>
              <Text style={styles.successToastSubtitle}>Redirection vers la connexion...</Text>
            </View>
            <Animated.View
              style={{
                transform: [{
                  rotate: successToastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }],
              }}
            >
              <MaterialCommunityIcons
                name="login"
                size={24}
                color="#ffffff"
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {/* KeyboardAvoidingView for better keyboard handling */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Animated main content */}
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Theme Controls - Hide when keyboard is visible */}
          {!keyboardVisible && (
            <View style={[styles.themeControls, { paddingTop: insets.top + 15 }]}>
              <TouchableOpacity
                style={[styles.themeButton, {
                  backgroundColor: theme.cardBackground || (isDarkMode ? '#2a2a2a' : '#f0f0f0'),
                  borderWidth: 1,
                  borderColor: theme.borderColor || (isDarkMode ? '#404040' : '#e0e0e0')
                }]}
                onPress={toggleTheme}
              >
                <MaterialCommunityIcons
                  name={isDarkMode ? "weather-sunny" : "weather-night"}
                  size={22}
                  color={theme.primary}
                />
                <Text style={[styles.themeButtonText, { color: theme.textColor }]}>
                  {isDarkMode ? 'Clair' : 'Sombre'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.themeButton, {
                  backgroundColor: theme.cardBackground || (isDarkMode ? '#2a2a2a' : '#f0f0f0'),
                  borderWidth: 1,
                  borderColor: theme.borderColor || (isDarkMode ? '#404040' : '#e0e0e0')
                }]}
                onPress={toggleColorTheme}
              >
                <View style={[styles.colorIndicator, { backgroundColor: theme.primary }]} />
                <Text style={[styles.themeButtonText, { color: theme.textColor }]}>
                  {colorTheme === 'blue' ? 'Bleu' : 'Orange'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: keyboardVisible ? 20 : 0 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            scrollEventThrottle={16}
          >
            {/* Header - Smaller when keyboard is visible */}
            <View style={[
              styles.headerContainer,
              { marginBottom: keyboardVisible ? 15 : 30 }
            ]}>
              <Text style={[
                styles.title,
                {
                  color: theme.textColor,
                  fontSize: keyboardVisible ? 24 : 32
                }
              ]}>
                S'inscrire
              </Text>
              {!keyboardVisible && (
                <Text style={[styles.subtitle, { color: theme.secondaryTextColor }]}>
                  Entrez vos coordonnées pour vous inscrire
                </Text>
              )}
            </View>

            <View style={styles.formContainer}>
              <Input
                onChangeText={text => handleOnchange(text, 'email')}
                onFocus={() => handleInputFocus('email')}
                iconName="email-outline"
                label="Email"
                placeholder="Entrez votre adresse email"
                error={errors.email}
                labelColor={theme.textColor}
                theme={theme}
                isDarkMode={isDarkMode}
              />

              <Input
                onChangeText={text => handleOnchange(text, 'fullname')}
                onFocus={() => handleInputFocus('fullname')}
                iconName="account-outline"
                label="Nom complet"
                placeholder="Entrez votre nom complet"
                error={errors.fullname}
                labelColor={theme.textColor}
                theme={theme}
                isDarkMode={isDarkMode}
              />

              {/* Address Input with Location Button */}
              <View style={styles.addressContainer}>
                <View style={styles.addressInputContainer}>
                  <Input
                    value={inputs.address}
                    onChangeText={text => handleOnchange(text, 'address')}
                    onFocus={() => handleInputFocus('address')}
                    iconName="map-marker-outline"
                    label="Adresse"
                    placeholder="Entrez votre quartier ou utilisez la localisation"
                    error={errors.address}
                    labelColor={theme.textColor}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.locationButton, {
                    backgroundColor: theme.primary,
                    opacity: gettingLocation ? 0.7 : 1
                  }]}
                  onPress={getCurrentLocationAddress}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <MaterialCommunityIcons
                      name="loading"
                      size={20}
                      color="white"
                      style={styles.spinIcon}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="crosshairs-gps"
                      size={20}
                      color="white"
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* City and Postal Code Row */}
              <View style={styles.cityPostalRow}>
                <View style={styles.cityContainer}>
                  <Input
                    value={inputs.city}
                    onChangeText={text => handleOnchange(text, 'city')}
                    onFocus={() => handleInputFocus('city')}
                    iconName="city"
                    label="Ville"
                    placeholder="Ville"
                    error={errors.city}
                    labelColor={theme.textColor}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                </View>
                <View style={styles.postalContainer}>
                  <Input
                    value={inputs.postalCode}
                    onChangeText={text => handleOnchange(text, 'postalCode')}
                    onFocus={() => handleInputFocus('postalCode')}
                    iconName="mailbox-outline"
                    label="Code Postal"
                    placeholder="Code"
                    error={errors.postalCode}
                    keyboardType="numeric"
                    labelColor={theme.textColor}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                </View>
              </View>

              {/* Helper text for location feature - Hide when keyboard is visible */}
              {!keyboardVisible && (
                <Text style={[styles.helperText, { color: theme.secondaryTextColor }]}>
                  💡 Appuyez sur le bouton GPS pour obtenir automatiquement votre quartier et informations de localisation
                </Text>
              )}

              <Input
                keyboardType="phone-pad"
                onChangeText={text => handleOnchange(text, 'phone')}
                onFocus={() => handleInputFocus('phone')}
                iconName="phone-outline"
                label="Numéro de téléphone"
                placeholder="Entrez votre numéro de téléphone"
                error={errors.phone}
                labelColor={theme.textColor}
                theme={theme}
                isDarkMode={isDarkMode}
              />

              <Input
                onChangeText={text => handleOnchange(text, 'password')}
                onFocus={() => handleInputFocus('password')}
                iconName="lock-outline"
                label="Mot de passe"
                placeholder="Entrez votre mot de passe"
                error={errors.password}
                password
                labelColor={theme.textColor}
                theme={theme}
                isDarkMode={isDarkMode}
              />

              {/* NEW: Terms and Conditions Section */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.termsCheckboxContainer}
                  onPress={toggleTermsAcceptance}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: termsAccepted ? theme.primary : 'transparent',
                      borderColor: errors.terms ? '#FF6B6B' : theme.primary,
                    }
                  ]}>
                    {termsAccepted && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color="white"
                      />
                    )}
                  </View>
                  <View style={styles.termsTextContainer}>
                    <Text style={[styles.termsText, { color: theme.textColor }]}>
                      J'accepte les{' '}
                      <Text
                        style={[styles.termsLink, { color: theme.primary }]}
                        onPress={openTermsAndConditions}
                      >
                        Conditions d'utilisation
                      </Text>
                      {' '}de PetCorner
                    </Text>
                  </View>
                </TouchableOpacity>
                {errors.terms && (
                  <Text style={styles.termsError}>{errors.terms}</Text>
                )}
              </View>

              <Button
                title="S'inscrire"
                onPress={validate}
                theme={theme}
                isDarkMode={isDarkMode}
              />

              <Text
                onPress={navigateToLogin}
                style={[styles.loginText, { color: theme.textColor }]}
              >
                Vous avez déjà un compte ?
                <Text style={[styles.loginLink, { color: theme.primary }]}>
                  {' '}Connectez-vous
                </Text>
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  themeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 20,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  colorIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContainer: {
    marginTop: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
  },
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
    top: 35,
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
  cityPostalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 10,
  },
  cityContainer: {
    flex: 2,
  },
  postalContainer: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 5,
    fontStyle: 'italic',
  },
  spinIcon: {
    animation: 'spin 1s linear infinite',
  },
  // NEW STYLES: Terms and Conditions
  termsContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  termsCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  termsLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsError: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 36,
  },
  loginText: {
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 15,
    marginTop: 20,
    lineHeight: 20,
  },
  loginLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  successToastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successToastTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  successToastTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  successToastSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
});