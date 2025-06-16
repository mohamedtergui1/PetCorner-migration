import { Alert, Keyboard, SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, StatusBar, Platform, PermissionsAndroid, Animated } from 'react-native'
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
        phone: '',
        password: '',
      });
      const [errors, setErrors] = useState({});
      const [loading, setLoading] = useState(false);
      const [gettingLocation, setGettingLocation] = useState(false);
      const [showSuccessToast, setShowSuccessToast] = useState(false); // ✅ New state for success toast
      const { theme, isDarkMode, toggleTheme, colorTheme, toggleColorTheme } = useTheme();
      const insets = useSafeAreaInsets();

      // ✅ Animation refs for smooth transitions
      const fadeAnim = useRef(new Animated.Value(1)).current;
      const slideAnim = useRef(new Animated.Value(0)).current;
      const successToastAnim = useRef(new Animated.Value(0)).current;
      const successToastSlideAnim = useRef(new Animated.Value(-100)).current;

      // ✅ Initialize entrance animations
      useEffect(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, []);

      // ✅ Success toast animation functions
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
          handleError('Veuillez saisir votre adresse', 'address');
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
    
        if (isValid) {
          register();
        }
      };

      // Request location permission for Android
      const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
          try {
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
            console.warn(err);
            return false;
          }
        }
        return true; // iOS handles permissions automatically
      };

      // Get address from coordinates using reverse geocoding
      const getAddressFromCoordinates = async (latitude, longitude) => {
        try {
          // Using a free geocoding service (you can replace with your preferred service)
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'YourAppName/1.0 (your-email@example.com)'
              }
            }
          );
          
          if (response.data && response.data.display_name) {
            return response.data.display_name;
          } else {
            throw new Error('Adresse non trouvée');
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          throw new Error('Erreur lors de la récupération de l\'adresse');
        }
      };

      // Get current location and address
      const getCurrentLocationAddress = async () => {
        setGettingLocation(true);
        
        try {
          // Request permission first
          const hasPermission = await requestLocationPermission();
          
          if (!hasPermission) {
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

          // Get current position
          Geolocation.getCurrentPosition(
            async (position) => {
              try {
                const { latitude, longitude } = position.coords;
                
                // Get address from coordinates
                const address = await getAddressFromCoordinates(latitude, longitude);
                
                // Update the address input
                setInputs(prevState => ({...prevState, address: address}));
                handleError(null, 'address'); // Clear any previous error
                
                Toast.show({
                  type: 'success',
                  text1: 'Adresse récupérée! 📍',
                  text2: 'Votre adresse actuelle a été ajoutée',
                  visibilityTime: 2500,
                  autoHide: true,
                  topOffset: 60,
                });
                
                setGettingLocation(false);
              } catch (error) {
                console.error('Error getting address:', error);
                Toast.show({
                  type: 'error',
                  text1: 'Erreur de géocodage',
                  text2: error.message || 'Impossible de récupérer l\'adresse',
                  visibilityTime: 3000,
                  autoHide: true,
                  topOffset: 60,
                });
                setGettingLocation(false);
              }
            },
            (error) => {
              console.error('Location error:', error);
              let errorMessage = 'Erreur lors de la récupération de la localisation';
              
              switch (error.code) {
                case 1:
                  errorMessage = 'Permission de localisation refusée';
                  break;
                case 2:
                  errorMessage = 'Position non disponible';
                  break;
                case 3:
                  errorMessage = 'Délai d\'attente dépassé';
                  break;
                default:
                  errorMessage = 'Erreur de localisation inconnue';
              }
              
              Toast.show({
                type: 'error',
                text1: 'Erreur de localisation',
                text2: errorMessage,
                visibilityTime: 3000,
                autoHide: true,
                topOffset: 60,
              });
              setGettingLocation(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 10000,
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
    
        const inputData = {
          module: 'societe',
          name: inputs.fullname,
          phone: inputs.phone,
          address: inputs.address,
          email: inputs.email,
          client: 1,
          code_client: -1,
          array_options: {
            mdpmob: inputs.password,
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
            
            // ✅ Show custom success toast instead of Toast.show
            showSuccessToastWithAnimation();

            // ✅ Navigate with smooth transition and pass user data
            setTimeout(() => {
              // Fade out animation before navigation
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
                // ✅ Navigate to Login with pre-filled email and phone
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
                
                // Show error toast instead of Alert
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

      // ✅ Navigate to login with smooth transition
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
      
      {/* ✅ Only show loader during registration process, not after success */}
      <Loader visible={(loading || gettingLocation) && !showSuccessToast} />
      
      {/* ✅ Beautiful Success Toast */}
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
      
      {/* ✅ Animated main content */}
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Theme Controls */}
        <View style={[styles.themeControls, { paddingTop: insets.top + 15 }]}>
          {/* Dark Mode Toggle */}
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

          {/* Color Theme Toggle */}
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: theme.textColor }]}>
              S'inscrire
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondaryTextColor }]}>
              Entrez vos coordonnées pour vous inscrire
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              onChangeText={text => handleOnchange(text, 'email')}
              onFocus={() => handleError(null, 'email')}
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
              onFocus={() => handleError(null, 'fullname')}
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
                  onFocus={() => handleError(null, 'address')}
                  iconName="map-marker-outline"
                  label="Adresse"
                  placeholder="Entrez votre adresse ou utilisez la localisation"
                  error={errors.address}
                  labelColor={theme.textColor}
                  theme={theme}
                  isDarkMode={isDarkMode}
                />
              </View>
              
              {/* Location Button */}
              <TouchableOpacity
                style={[styles.locationButton, { 
                  backgroundColor: theme.primary,
                  opacity: gettingLocation ? 0.6 : 1
                }]}
                onPress={getCurrentLocationAddress}
                disabled={gettingLocation}
              >
                <MaterialCommunityIcons 
                  name={gettingLocation ? "loading" : "crosshairs-gps"} 
                  size={20} 
                  color="white" 
                  style={gettingLocation ? styles.spinIcon : null}
                />
              </TouchableOpacity>
            </View>

            {/* Helper text for location feature */}
            <Text style={[styles.helperText, { color: theme.secondaryTextColor }]}>
              💡 Appuyez sur le bouton GPS pour obtenir automatiquement votre adresse
            </Text>

            <Input
              keyboardType="phone-pad"
              onChangeText={text => handleOnchange(text, 'phone')}
              onFocus={() => handleError(null, 'phone')}
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
              onFocus={() => handleError(null, 'password')}
              iconName="lock-outline"
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              error={errors.password}
              password
              labelColor={theme.textColor}
              theme={theme}
              isDarkMode={isDarkMode}
            />

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
      
      {/* Toast component */}
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
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
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
    right: 15,
    top: 45,
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
  helperText: {
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 5,
    fontStyle: 'italic',
  },
  spinIcon: {
    transform: [{ rotate: '45deg' }],
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
  // ✅ New styles for success toast
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
})