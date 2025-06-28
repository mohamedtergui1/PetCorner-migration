import { Alert, BackHandler, Image, Keyboard, SafeAreaView, StyleSheet, Text, ToastAndroid, View, Platform, TouchableOpacity, StatusBar, Animated, ScrollView, KeyboardAvoidingView } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import Input from './Input'
import Botton from './Botton'
import { COLOURS } from '../../database/Database'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Loader from '../Loader'
import axios from 'axios'
import API_BASE_URL from '../../../config/Api'
import Token from '../../../config/TokenDolibar'
import Toast from 'react-native-simple-toast'
import { useTheme } from '../../context/ThemeContext'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function LoginScreen({ navigation, route }) {
  // ✅ Get params from signup navigation
  const signupData = route?.params || {};
  const { email: signupEmail, phone: signupPhone, fromSignup } = signupData;

  const [inputs, setInputs] = useState({
    email: signupPhone || '', // ✅ Pre-fill with phone from signup
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false); // ✅ New state for welcome message
  const [backPressCount, setBackPressCount] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { theme, isDarkMode, toggleTheme, colorTheme, toggleColorTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const themeControlsAnim = useRef(new Animated.Value(-100)).current;
  const formSlideAnim = useRef(new Animated.Value(100)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const logoContainerAnim = useRef(new Animated.Value(1)).current;

  // ✅ New animation refs for success toast
  const successToastAnim = useRef(new Animated.Value(0)).current;
  const successToastSlideAnim = useRef(new Animated.Value(-100)).current;

  // ✅ Show welcome message if coming from signup
  useEffect(() => {
    if (fromSignup) {
      setShowWelcomeMessage(true);

      // Auto-hide welcome message after 3 seconds
      setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 3000);
    }
  }, [fromSignup]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Animate logo container to be smaller when keyboard is visible
        Animated.timing(logoContainerAnim, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // Animate logo container back to normal size
        Animated.timing(logoContainerAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  // Start entrance animations on mount
  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      // Theme controls slide down
      Animated.timing(themeControlsAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      // Logo animations
      Animated.parallel([
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Form slide up animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(formSlideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Continuous button pulse animation
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(buttonPulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };

    setTimeout(pulseAnimation, 1000);
  }, []);

  // ✅ Improved success toast animation with better timing
  const showSuccessToastWithAnimation = () => {
    setShowSuccessToast(true);

    // Animate in with spring animation for smoothness
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

    // ✅ Hide after shorter duration for better flow
    setTimeout(() => {
      hideSuccessToast();
    }, 1500); // Reduced from 2000 to 1500
  };

  // ✅ Faster hide animation
  const hideSuccessToast = () => {
    Animated.parallel([
      Animated.timing(successToastAnim, {
        toValue: 0,
        duration: 200, // Faster fade out
        useNativeDriver: true,
      }),
      Animated.timing(successToastSlideAnim, {
        toValue: -100,
        duration: 200, // Faster slide up
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessToast(false);
    });
  };

  // Success animation when login succeeds
  const playSuccessAnimation = () => {
    Animated.sequence([
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 100,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(successAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    const backAction = () => {
      setBackPressCount(prevCount => prevCount + 1);

      if (backPressCount === 0) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Cliquez à nouveau sur Retour pour quitter', ToastAndroid.SHORT);
        } else {
          Toast.show('Cliquez à nouveau sur Retour pour quitter', ToastAndroid.SHORT);
        }
        setTimeout(() => {
          setBackPressCount(0);
        }, 2000);
        return true;
      } else if (backPressCount === 1) {
        BackHandler.exitApp();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [backPressCount]);

  const validate = async () => {
    Keyboard.dismiss();

    // Button press animation
    Animated.sequence([
      Animated.spring(buttonPulseAnim, {
        toValue: 0.95,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(buttonPulseAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    let isValid = true;
    if (!inputs.email) {
      handleError('Veuillez saisir le numéro de téléphone', 'email');
      isValid = false;
    }
    if (!inputs.password) {
      handleError('Veuillez saisir le mot de passe', 'password');
      isValid = false;
    }
    if (isValid) {
      login();
    }
  };

  // Add this to your login function in LoginScreen.js
  // Replace the existing login function with this updated version:

  const login = async () => {
    setLoading(true);

    // Loading animation - logo rotation
    const loadingRotation = Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 2,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    loadingRotation.start();

    try {
      const response = await axios.get(API_BASE_URL + 'thirdparties/login', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'DOLAPIKEY': Token
        },
        params: {
          phone: inputs.email,
          pwd: inputs.password
        }
      });

      // Stop animations and hide loading immediately
      setLoading(false);
      loadingRotation.stop();

      // Reset logo rotation to prevent visual glitches
      logoRotateAnim.setValue(1);

      if (response.status === 200) {
        const result = response.data;

        const idMatch = result.match(/id :(\d+)/);
        if (idMatch && idMatch[1]) {
          const userId = parseInt(idMatch[1], 10);

          // ✅ NEW: Check if this is a first login
          const isFirstLogin = fromSignup || false; // Check if user came from signup

          // Save user data with additional info
          const userDataToSave = {
            id: userId,
            phone: inputs.email,
            loggedIn: true,
            // Store signup email if available for name reference
            ...(signupEmail && { email: signupEmail })
          };

          await AsyncStorage.setItem('userData', JSON.stringify(userDataToSave));

          // Show success toast with improved timing
          showSuccessToastWithAnimation();

          // Shorter delay for smoother transition
          setTimeout(() => {
            // Fade out current screen before navigation
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(formSlideAnim, {
                toValue: 100,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              // ✅ NEW: Navigate with isFirstLogin parameter
              navigation.replace('Main', {
                isFirstLogin: isFirstLogin,
                userData: userDataToSave
              });
            });
          }, 1800);
        } else {
          Alert.alert('Error', 'Unable to extract user ID from the response');
        }
      } else {
        Alert.alert('Error', 'Informations incorrectes');
      }
    } catch (error) {
      setLoading(false);
      loadingRotation.stop();

      // Reset logo rotation on error
      logoRotateAnim.setValue(1);

      // Error shake animation
      Animated.sequence([
        Animated.timing(formSlideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(formSlideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(formSlideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(formSlideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();

      Alert.alert('Error', "Informations incorrectes");
    }
  };

  const handleOnchange = (text, input) => {
    setInputs(prevState => ({ ...prevState, [input]: text }));
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({ ...prevState, [input]: error }));
  };

  // Function to scroll to input when focused
  const scrollToInput = (inputPosition) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: inputPosition,
        animated: true,
      });
    }
  };

  // Animated values for transforms
  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg']
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.backgroundColor}
      />

      {/* ✅ Only show loader during login process, not after success */}
      <Loader visible={loading && !showSuccessToast} />

      {/* ✅ Welcome Message for users coming from signup */}
      {showWelcomeMessage && (
        <Animated.View
          style={[
            styles.welcomeMessageContainer,
            {
              top: insets.top + 80,
            }
          ]}
        >
          <View style={[styles.welcomeMessage, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons
              name="account-check"
              size={24}
              color="#ffffff"
            />
            <View style={styles.welcomeMessageTextContainer}>
              <Text style={styles.welcomeMessageTitle}>Bienvenue!</Text>
              <Text style={styles.welcomeMessageSubtitle}>
                Connectez-vous avec votre numéro de téléphone
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

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
                name="check-circle"
                size={28}
                color="#ffffff"
              />
            </Animated.View>
            <View style={styles.successToastTextContainer}>
              <Text style={styles.successToastTitle}>Connexion réussie!</Text>
              <Text style={styles.successToastSubtitle}>Redirection...</Text>
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
                name="arrow-right-circle"
                size={24}
                color="#ffffff"
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Animated Theme Controls */}
        <Animated.View
          style={[
            styles.themeControls,
            {
              paddingTop: insets.top + 15,
              transform: [{ translateY: themeControlsAnim }],
            }
          ]}
        >
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
        </Animated.View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Animated Logo Container */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                height: logoContainerAnim.interpolate({
                  inputRange: [0.6, 1],
                  outputRange: [120, 200],
                }),
              }
            ]}
          >
            <Animated.View
              style={{
                transform: [
                  { scale: logoScaleAnim },
                  { rotate: logoRotation },
                ],
              }}
            >
              <Image
                source={require('../../assets/images/logo.png')}
                resizeMode='contain'
                style={[
                  styles.logo,
                  keyboardVisible && styles.logoSmall
                ]}
              />
            </Animated.View>
          </Animated.View>

          {/* Animated Form Container */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlideAnim }],
              }
            ]}
          >
            <Text style={[styles.welcomeText, { color: theme.secondaryTextColor }]}>
              Entrez vos coordonnées pour vous connecter
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Input
                  value={inputs.email} // ✅ Show pre-filled value
                  onChangeText={text => handleOnchange(text, 'email')}
                  onFocus={() => {
                    handleError(null, 'email');
                    // Scroll to this input when focused
                    setTimeout(() => scrollToInput(250), 100);
                  }}
                  iconName="phone-outline"
                  label="Téléphone"
                  placeholder="Entrez votre téléphone"
                  error={errors.email}
                  labelColor={theme.textColor}
                  theme={theme}
                  isDarkMode={isDarkMode}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Input
                  onChangeText={text => handleOnchange(text, 'password')}
                  onFocus={() => {
                    handleError(null, 'password');
                    // Scroll to this input when focused
                    setTimeout(() => scrollToInput(350), 100);
                  }}
                  iconName="lock-outline"
                  label="Mot de passe"
                  placeholder="Entrez votre mot de passe"
                  error={errors.password}
                  password
                  labelColor={theme.textColor}
                  theme={theme}
                  isDarkMode={isDarkMode}
                />
              </View>

              <Animated.View style={{ transform: [{ scale: buttonPulseAnim }] }}>
                <Botton
                  title="Se connecter"
                  onPress={validate}
                  theme={theme}
                  isDarkMode={isDarkMode}
                />
              </Animated.View>

              <Text
                onPress={() => navigation.navigate('Signup')}
                style={[styles.signupText, { color: theme.textColor }]}
              >
                Vous n'avez pas de compte ?
                <Text style={[styles.signupLink, { color: theme.primary }]}>
                  {' '}Inscrivez-vous
                </Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    position: 'relative',
  },
  logo: {
    width: 200,
    height: 180,
    maxWidth: 280,
  },
  logoSmall: {
    width: 120,
    height: 108,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  welcomeText: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginVertical: 30,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  signupText: {
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 15,
    marginTop: 20,
    lineHeight: 20,
  },
  signupLink: {
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
  // ✅ New styles for welcome message
  welcomeMessageContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 999,
  },
  welcomeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  welcomeMessageTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  welcomeMessageTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  welcomeMessageSubtitle: {
    color: '#ffffff',
    fontSize: 13,
    opacity: 0.9,
  },
})