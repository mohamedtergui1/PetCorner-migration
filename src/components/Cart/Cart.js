import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Linking,
  Animated,
} from 'react-native';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { COLOURS, Items } from '../../database/Database';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../../config/Api';
import Token from '../../../config/TokenDolibar';
import Toast from 'react-native-simple-toast';
import Modal from "react-native-modal";
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import Geolocation from 'react-native-geolocation-service';
import OrderService from '../../service/order.service'; // Import the enhanced order service

export default function Cart({ navigation }) {
  const { theme, isDarkMode, toggleTheme, colorTheme, toggleColorTheme } = useTheme();

  // Use cart context instead of local state
  const {
    cartItems,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCartItems,
    getQuantities
  } = useCart();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [modePaiement, setModePaiement] = useState('');
  const [errorModePaiement, setErrorModePaiement] = useState('');
  const [modalAdresseVisible, setModalAdresseVisible] = useState(false);
  
  // Enhanced address fields - split like user details screen
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [errorAdresse, setErrorAdresse] = useState('');
  const [errorCity, setErrorCity] = useState('');
  const [errorZipCode, setErrorZipCode] = useState('');
  const [userDetails, setUserDetails] = useState();
  const [gettingLocation, setGettingLocation] = useState(false);

  // Credit card states
  const [modalCardVisible, setModalCardVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [errorCardNumber, setErrorCardNumber] = useState('');
  const [errorCardHolder, setErrorCardHolder] = useState('');
  const [errorExpiryDate, setErrorExpiryDate] = useState('');
  const [errorCvv, setErrorCvv] = useState('');
  const [cardDetails, setCardDetails] = useState(null);

  // Location states
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState(0);

  // Loading states for quantity updates
  const [loadingQuantityUpdates, setLoadingQuantityUpdates] = useState({});

  // Animation refs
  const paymentAnimations = useRef({
    cash: new Animated.Value(0),
    card: new Animated.Value(0),
  }).current;

  // Store location (set this to your actual store coordinates)
  const STORE_LOCATION = {
    latitude: 33.951371146759776,
    longitude: -6.88501751937855,
    address: "Immeuble 102, Prestigia, Prestigia - Riyad Al Andalous, N° 13 sis, GH4, Rabat 10100"
  };

  // Enhanced theme colors
  const PRIMARY_COLOR = theme.primary;
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#4A90E2' : '#FF8A50';
  const BACKGROUND_COLOR = theme.backgroundColor;
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = theme.textColor;
  const TEXT_COLOR_SECONDARY = theme.secondaryTextColor;
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#f0f0f0';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', getDataFromDB);
    return unsubscribe;
  }, [navigation]);

  // Add effect to recalculate total when products or quantities change
  useEffect(() => {
    if (products.length > 0) {
      const quantities = getQuantities();
      calculateTotal(products, quantities);
    }
  }, [products, cartItems]);

  // Safe address parsing function - same as user details screen
  const parseAddress = (addressString) => {
    if (!addressString || typeof addressString !== 'string') {
      return {
        address: '',
        city: '',
        postalCode: ''
      };
    }

    try {
      // Split by comma and clean up
      const parts = addressString.split(',').map(part => part.trim()).filter(Boolean);
      
      if (parts.length === 0) {
        return { address: '', city: '', postalCode: '' };
      } else if (parts.length === 1) {
        return { address: parts[0], city: '', postalCode: '' };
      } else if (parts.length === 2) {
        return { address: parts[0], city: parts[1], postalCode: '' };
      } else {
        // 3 or more parts
        return {
          address: parts[0],
          city: parts[1],
          postalCode: parts[2]
        };
      }
    } catch (error) {
      console.log('Error parsing address:', error);
      return {
        address: addressString, // Fallback to original string
        city: '',
        postalCode: ''
      };
    }
  };

  // Safely concatenate address parts
  const concatenateAddress = (address, city, postalCode) => {
    const parts = [address, city, postalCode]
      .filter(part => part && typeof part === 'string' && part.trim())
      .map(part => part.trim());
    return parts.join(', ');
  };

  // Location permission request
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

  // Enhanced geocoding function - same as user details screen
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

  // Enhanced GPS location function - same as user details screen
  const getCurrentLocationAddress = async () => {
    console.log('GPS button clicked - starting location process');
    setGettingLocation(true);
    
    try {
      console.log('Requesting location permission...');
      const hasPermission = await requestLocationPermission();
      console.log('Permission granted:', hasPermission);
      
      if (!hasPermission) {
        console.log('Permission denied by user');
        if (Platform.OS === 'android') {
          ToastAndroid.show('Permission de localisation requise', ToastAndroid.SHORT);
        } else {
          Toast.show('Permission de localisation requise', Toast.SHORT);
        }
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
            setAddress(addressInfo.streetAddress || addressInfo.displayName);
            setCity(addressInfo.city);
            setZipCode(addressInfo.postalCode);
            
            // Clear any previous errors
            setErrorAdresse('');
            setErrorCity('');
            setErrorZipCode('');
            
            // Calculate distance and delivery cost
            const dist = calculateDistance(
              latitude,
              longitude,
              STORE_LOCATION.latitude,
              STORE_LOCATION.longitude
            );

            setUserLocation({ latitude, longitude });
            setDistance(dist);
            const cost = calculateDeliveryCost(dist);
            setDeliveryCost(cost);
            
            if (Platform.OS === 'android') {
              ToastAndroid.show(`Adresse récupérée! Distance: ${dist.toFixed(1)}km`, ToastAndroid.LONG);
            } else {
              Toast.show(`Adresse récupérée! Distance: ${dist.toFixed(1)}km`, Toast.LONG);
            }
            
            setGettingLocation(false);
          } catch (error) {
            console.error('Error getting address:', error);
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
          
          if (Platform.OS === 'android') {
            ToastAndroid.show(errorMessage, ToastAndroid.LONG);
          } else {
            Toast.show(errorMessage, Toast.LONG);
          }
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
      if (Platform.OS === 'android') {
        ToastAndroid.show('Erreur de permission', ToastAndroid.SHORT);
      } else {
        Toast.show('Erreur de permission', Toast.SHORT);
      }
      setGettingLocation(false);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Calculate delivery cost based on distance
  const calculateDeliveryCost = (distanceKm) => {
    if (distanceKm <= 5) return 0; // Free delivery within 5km
    if (distanceKm <= 10) return 15; // 15 DH for 5-10km
    if (distanceKm <= 20) return 25; // 25 DH for 10-20km
    return 35; // 35 DH for >20km
  };

  // Format card number with spaces
  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.substring(0, 16);
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Format expiry date MM/YY
  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  // Validate credit card form
  const validateCardForm = () => {
    let isValid = true;

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber || cleanCardNumber.length !== 16 || !/^\d+$/.test(cleanCardNumber)) {
      setErrorCardNumber('Le numéro de carte doit contenir 16 chiffres');
      isValid = false;
    } else {
      setErrorCardNumber('');
    }

    if (!cardHolder.trim()) {
      setErrorCardHolder('Veuillez entrer le nom du titulaire');
      isValid = false;
    } else {
      setErrorCardHolder('');
    }

    if (!expiryDate || expiryDate.length !== 5) {
      setErrorExpiryDate('Format: MM/AA');
      isValid = false;
    } else {
      const [month, year] = expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;

      if (parseInt(month) < 1 || parseInt(month) > 12) {
        setErrorExpiryDate('Mois invalide');
        isValid = false;
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        setErrorExpiryDate('Carte expirée');
        isValid = false;
      } else {
        setErrorExpiryDate('');
      }
    }

    if (!cvv || cvv.length !== 3 || !/^\d+$/.test(cvv)) {
      setErrorCvv('Le CVV doit contenir 3 chiffres');
      isValid = false;
    } else {
      setErrorCvv('');
    }

    return isValid;
  };

  // Handle card form submission
  const handleSaveCard = () => {
    if (validateCardForm()) {
      setCardDetails({
        number: cardNumber,
        holder: cardHolder,
        expiry: expiryDate,
        cvv: cvv
      });
      setModalCardVisible(false);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Carte bancaire enregistrée', ToastAndroid.SHORT);
      } else {
        Toast.show('Carte bancaire enregistrée', Toast.SHORT);
      }
    }
  };

  // Clear card details
  const clearCardDetails = () => {
    setCardNumber('');
    setCardHolder('');
    setExpiryDate('');
    setCvv('');
    setErrorCardNumber('');
    setErrorCardHolder('');
    setErrorExpiryDate('');
    setErrorCvv('');
    setCardDetails(null);
  };

  // Enhanced payment method selection with animations
  const handlePaymentMethodSelect = (method) => {
    setModePaiement(method);
    setErrorModePaiement('');

    // Animate selection
    Object.keys(paymentAnimations).forEach(key => {
      Animated.timing(paymentAnimations[key], {
        toValue: key === method ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });

    if (method === 'credit_card') {
      setModalCardVisible(true);
    } else {
      clearCardDetails();
    }
  };

  // Updated to use cart context
  const getDataFromDB = useCallback(async () => {
    setIsEmpty(false);
    try {
      const items = await loadCartItems();

      if (items.length === 0) {
        setIsEmpty(true);
        setIsLoading(false);
        return;
      }

      const itemIds = items.join(',');

      const response = await axios.get(API_BASE_URL + "categories/byid", {
        headers: {
          'Content-Type': 'application/json',
          'DOLAPIKEY': Token
        },
        params: {
          sqlfilters: itemIds
        }
      });
      const products = response.data.products;
      setProducts(products);
      setIsLoading(false);

      const quantities = getQuantities();
      calculateTotal(products, quantities);
    } catch (error) {
      console.error('Failed to load cart items:', error);
    }
  }, [loadCartItems, getQuantities]);

  // Fixed calculateTotal function
  const calculateTotal = (products, quantities) => {
    const newTotal = products.reduce((acc, item) => {
      const quantity = quantities[item.id] || 1;
      const itemTotal = (parseFloat(item.price_ttc) || 0) * quantity;
      return acc + itemTotal;
    }, 0);
    setTotal(newTotal);
  };

  // Updated to use cart context and recalculate total
  const handleUpdateQuantity = async (id, change) => {
    setLoadingQuantityUpdates(prev => ({ ...prev, [id]: true }));

    try {
      const result = await updateQuantity(id, change);
      if (result.success) {
        const updatedQuantities = getQuantities();
        calculateTotal(products, updatedQuantities);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoadingQuantityUpdates(prev => ({ ...prev, [id]: false }));
    }
  };

  // Updated to use cart context
  const handleRemoveItem = async (id) => {
    const result = await removeFromCart(id);
    if (result.success) {
      getDataFromDB();
    }
  };

  // Enhanced checkout function using OrderService
  const checkOut = async () => {
    let isValid = true;

    if (!address) {
      isValid = false;
      setModalAdresseVisible(true);
      return;
    }

    if (!city) {
      isValid = false;
      setModalAdresseVisible(true);
      return;
    }

    if (!zipCode) {
      isValid = false;
      setModalAdresseVisible(true);
      return;
    }

    if (!modePaiement) {
      setErrorModePaiement('Veuillez choisir un mode de paiement');
      isValid = false;
    }

    if (modePaiement === 'credit_card' && !cardDetails) {
      setErrorModePaiement('Veuillez entrer les détails de votre carte');
      isValid = false;
    }

    if (!isValid) return;

    try {
      const quantities = getQuantities();

      // Prepare order data for the service
      const orderData = {
        products: products,
        quantities: quantities,
        address: address,
        city: city,
        zipCode: zipCode,
        paymentMethod: modePaiement,
        cardDetails: modePaiement === 'credit_card' ? cardDetails : null,
        userLocation: userLocation,
        distance: distance,
        deliveryCost: deliveryCost
      };

      // Use the OrderService to create the order
      await OrderService.createOrderWithUI(
        orderData,
        clearCart,
        navigation,
        setIsLoading
      );

    } catch (error) {
      console.log("Error:", error);
      Alert.alert('Erreur', 'Une erreur inattendue est survenue');
      setIsLoading(false);
    }
  };

  // Enhanced address save function
  const handleSaveAdresse = () => {
    let isValid = true;
    if (!address) {
      isValid = false;
      setErrorAdresse('Veuillez entrer une adresse');
    }
    if (!city) {
      isValid = false;
      setErrorCity('Veuillez entrer une ville');
    }
    if (!zipCode) {
      isValid = false;
      setErrorZipCode('Veuillez entrer un code postal');
    }

    if (!isValid) return;

    setErrorAdresse('');
    setErrorCity('');
    setErrorZipCode('');
    setModalAdresseVisible(false);
    updateClient();
  }

  // Updated to use cart context quantities
  const renderProducts = ({ id, label, price_ttc, photo_link, description, stock }) => {
    const quantities = getQuantities();
    const quantity = quantities[id] || 1;
    const isUpdatingQuantity = loadingQuantityUpdates[id] || false;
    const data = {
      id,
      label,
      price_ttc,
      photo_link,
      description,
      stock
    };

    return (
      <View key={id} style={[styles.productCard, { backgroundColor: CARD_BACKGROUND }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.push('ProductDetails', { productId: data.id })}
          style={styles.productImageContainer}>
          <Image
            source={{ uri: photo_link }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.productInfo}>
          <View>
            <Text
              style={[styles.productTitle, { color: TEXT_COLOR }]}
              numberOfLines={1}
            >
              {label}
            </Text>

            <View style={styles.priceContainer}>
              <Text style={[styles.currentPrice, { color: PRIMARY_COLOR }]}>
                {(parseFloat(price_ttc) || 0).toFixed(2)} DH
              </Text>
              <Text style={[styles.totalPrice, { color: TEXT_COLOR_SECONDARY }]}>
                (Total: {((price_ttc * quantity)).toFixed(2)} DH)
              </Text>
            </View>
          </View>

          <View style={styles.productActions}>
            {/* Updated quantity controls with proper disable logic */}
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(id, -1)}
                disabled={isUpdatingQuantity || quantity <= 1} // Disable when quantity is 1 or less
                style={[
                  styles.quantityButton,
                  {
                    borderColor: (isUpdatingQuantity || quantity <= 1) ? TEXT_COLOR_SECONDARY : PRIMARY_COLOR,
                    backgroundColor: (isUpdatingQuantity || quantity <= 1) ? 'transparent' : 'transparent',
                    opacity: (isUpdatingQuantity || quantity <= 1) ? 0.4 : 1
                  }
                ]}>
                {isUpdatingQuantity ? (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                ) : (
                  <Text style={[
                    styles.quantityButtonText, 
                    { color: (quantity <= 1) ? TEXT_COLOR_SECONDARY : PRIMARY_COLOR }
                  ]}>-</Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.quantityText, { color: TEXT_COLOR }]}>{quantity}</Text>

              <TouchableOpacity
                onPress={() => handleUpdateQuantity(id, 1)}
                disabled={isUpdatingQuantity || quantity >= stock} // Disable when quantity reaches stock limit
                style={[
                  styles.quantityButton,
                  {
                    borderColor: (isUpdatingQuantity || quantity >= stock) ? TEXT_COLOR_SECONDARY : PRIMARY_COLOR,
                    backgroundColor: (isUpdatingQuantity || quantity >= stock) ? 'transparent' : 'transparent',
                    opacity: (isUpdatingQuantity || quantity >= stock) ? 0.4 : 1
                  }
                ]}>
                {isUpdatingQuantity ? (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                ) : (
                  <Text style={[
                    styles.quantityButtonText, 
                    { color: (quantity >= stock) ? TEXT_COLOR_SECONDARY : PRIMARY_COLOR }
                  ]}>+</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Add stock indicator below quantity controls */}
            {quantity >= stock && (
              <Text style={[styles.stockWarning, { color: '#ff6b6b' }]}>
                Stock maximum atteint
              </Text>
            )}

            <TouchableOpacity
              onPress={() => handleRemoveItem(id)}
              style={styles.removeButton}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={18}
                color={COLOURS.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Enhanced update client function
  const updateClient = async () => {
    const userData = JSON.parse(await AsyncStorage.getItem('userData'));
    const clientID = userData.id;
    
    // Concatenate address safely
    const concatenatedAddress = concatenateAddress(address, city, zipCode);
    
    const inputData = {
      address: concatenatedAddress,
      town: city,
      zip: zipCode,
    }
    try {
      const res = await axios.put(API_BASE_URL + 'thirdparties/' + clientID, inputData, {
        headers: {
          'Content-Type': 'application/json',
          'DOLAPIKEY': Token
        }
      });
      getUserData();
      setModalAdresseVisible(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  // Enhanced get user data function with safe address parsing
  const getUserData = async () => {
    const userData = JSON.parse(await AsyncStorage.getItem('userData'));
    const clientID = userData.id;

    const headers = {
      'Content-Type': 'application/json',
      'DOLAPIKEY': Token
    };

    try {
      const res = await axios.get(API_BASE_URL + 'thirdparties/' + clientID, { headers });
      setUserDetails(res.data);
      
      // Parse address safely
      const addressParts = parseAddress(res.data.address);
      setAddress(addressParts.address);
      setCity(addressParts.city || res.data.town || '');
      setZipCode(addressParts.postalCode || res.data.zip || '');
    } catch (error) {
      console.log(error);
    }
  };

  // Enhanced payment method selection component
  const renderPaymentMethods = () => (
    <View style={[styles.paymentContainer, { backgroundColor: BACKGROUND_COLOR }]}>
      <Text style={[styles.textTitlePay, { color: TEXT_COLOR }]}>
        Mode de paiement
      </Text>

      <View style={styles.paymentMethodsContainer}>
        {/* Cash Payment Option */}
        <Animated.View style={[
          styles.paymentMethodCard,
          {
            backgroundColor: CARD_BACKGROUND,
            borderColor: paymentAnimations.cash.interpolate({
              inputRange: [0, 1],
              outputRange: [BORDER_COLOR, PRIMARY_COLOR],
            }),
            borderWidth: paymentAnimations.cash.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 2],
            }),
            transform: [{
              scale: paymentAnimations.cash.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            }],
          }
        ]}>
          <TouchableOpacity
            style={styles.paymentMethodContent}
            onPress={() => handlePaymentMethodSelect('espèces')}
          >
            <View style={[styles.paymentIconContainer, { backgroundColor: PRIMARY_COLOR + '20' }]}>
              <MaterialCommunityIcons
                name="cash"
                size={24}
                color={PRIMARY_COLOR}
              />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, { color: TEXT_COLOR }]}>
                Espèces
              </Text>
              <Text style={[styles.paymentMethodSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                Paiement à la livraison
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              {
                borderColor: modePaiement === 'espèces' ? PRIMARY_COLOR : BORDER_COLOR,
                backgroundColor: modePaiement === 'espèces' ? PRIMARY_COLOR : 'transparent',
              }
            ]}>
              {modePaiement === 'espèces' && (
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Credit Card Payment Option */}
        <Animated.View style={[
          styles.paymentMethodCard,
          {
            backgroundColor: CARD_BACKGROUND,
            borderColor: paymentAnimations.card.interpolate({
              inputRange: [0, 1],
              outputRange: [BORDER_COLOR, PRIMARY_COLOR],
            }),
            borderWidth: paymentAnimations.card.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 2],
            }),
            transform: [{
              scale: paymentAnimations.card.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.02],
              }),
            }],
          }
        ]}>
          <TouchableOpacity
            style={styles.paymentMethodContent}
            onPress={() => handlePaymentMethodSelect('credit_card')}
          >
            <View style={[styles.paymentIconContainer, { backgroundColor: SECONDARY_COLOR + '20' }]}>
              <MaterialCommunityIcons
                name="credit-card"
                size={24}
                color={SECONDARY_COLOR}
              />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, { color: TEXT_COLOR }]}>
                Carte bancaire
              </Text>
              <Text style={[styles.paymentMethodSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                Paiement sécurisé
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              {
                borderColor: modePaiement === 'credit_card' ? PRIMARY_COLOR : BORDER_COLOR,
                backgroundColor: modePaiement === 'credit_card' ? PRIMARY_COLOR : 'transparent',
              }
            ]}>
              {modePaiement === 'credit_card' && (
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Display saved card details */}
      {modePaiement === "credit_card" && cardDetails && (
        <View style={[styles.cardDetailsContainer, { backgroundColor: CARD_BACKGROUND, borderColor: PRIMARY_COLOR }]}>
          <View style={styles.cardDetailsHeader}>
            <MaterialCommunityIcons
              name="credit-card"
              size={20}
              color={PRIMARY_COLOR}
            />
            <Text style={[styles.cardDetailsTitle, { color: TEXT_COLOR }]}>
              Carte enregistrée
            </Text>
            <TouchableOpacity onPress={() => setModalCardVisible(true)}>
              <MaterialCommunityIcons
                name="pencil"
                size={16}
                color={PRIMARY_COLOR}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardNumber, { color: TEXT_COLOR }]}>
            **** **** **** {cardDetails.number.slice(-4)}
          </Text>
          <Text style={[styles.cardHolder, { color: TEXT_COLOR_SECONDARY }]}>
            {cardDetails.holder}
          </Text>
        </View>
      )}

      {errorModePaiement ? (
        <Text style={styles.errorText}>{errorModePaiement}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar backgroundColor={PRIMARY_COLOR} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity
          onPress={() => {
            setIsLoading(true);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Panier</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => getDataFromDB()}
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BACKGROUND_COLOR }}>
          <Ionicons name="cart" color={PRIMARY_COLOR} size={60} />
          <Text style={{ marginTop: 5, color: PRIMARY_COLOR, fontSize: 20 }}>
            Votre panier est vide
          </Text>
        </View>
      ) : (
        isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND_COLOR }}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: BACKGROUND_COLOR }}>
              <Text style={[styles.textHeader2, { color: TEXT_COLOR }]}>Produits</Text>
              <View style={styles.productContainer}>
                {products ? products.map(renderProducts) : null}
              </View>

              {/* Enhanced Address Section */}
              <View style={[styles.deliveryContainer, { backgroundColor: BACKGROUND_COLOR }]}>
                <Text style={[styles.textDorP, { color: TEXT_COLOR }]}>
                  Adresse de livraison
                </Text>
                <View style={styles.dFlex}>
                  <View style={styles.contentDorP}>
                    <View style={[styles.viewDorP, { backgroundColor: CARD_BACKGROUND }]}>
                      <MaterialCommunityIcons
                        name="truck-delivery-outline"
                        style={[styles.truckIcon, { color: PRIMARY_COLOR }]}
                      />
                    </View>
                    <View style={styles.addressInfo}>
                      <Text style={[styles.textAdress, { color: TEXT_COLOR }]}>
                        {address || 'Adresse non définie'}
                      </Text>
                      <Text style={[styles.textZipCode, { color: TEXT_COLOR_SECONDARY }]}>
                        {zipCode && city ? `${zipCode}, ${city}` : 'Ville et code postal non définis'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.addressActions}>
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
                    <TouchableOpacity
                      activeOpacity={0.5}
                      onPress={() => setModalAdresseVisible(true)}
                      style={styles.editButton}
                    >
                      <MaterialCommunityIcons
                        name="chevron-right"
                        style={[styles.chevronRight, { color: TEXT_COLOR }]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Enhanced Payment Methods */}
              {renderPaymentMethods()}

              {/* Order Details */}
              <View style={styles.containerOrder}>
                <Text style={[styles.textDorP, { color: TEXT_COLOR }]}>
                  Détails de la Commande
                </Text>
                <View style={styles.subtotalContainer}>
                  <Text style={[styles.titleSbt_or_Tax, { color: TEXT_COLOR_SECONDARY }]}>
                    Sous-total
                  </Text>
                  <Text style={[styles.subtotal, { color: TEXT_COLOR }]}>
                    {total.toFixed(2)} DH
                  </Text>
                </View>
                {deliveryCost > 0 && (
                  <View style={styles.subtotalContainer}>
                    <Text style={[styles.titleSbt_or_Tax, { color: TEXT_COLOR_SECONDARY }]}>
                      Frais de livraison
                    </Text>
                    <Text style={[styles.subtotal, { color: TEXT_COLOR }]}>
                      {deliveryCost.toFixed(2)} DH
                    </Text>
                  </View>
                )}
                <View style={styles.taxContainer}>
                  <Text style={[styles.titleSbt_or_Tax, { color: TEXT_COLOR_SECONDARY }]}>
                    TVA (incluse)
                  </Text>
                  <Text style={[styles.subtotal, { color: TEXT_COLOR }]}>
                    {(total * 0.1667).toFixed(2)} DH
                  </Text>
                </View>
                <View style={styles.dFlex}>
                  <Text style={[styles.titleTotal, { color: TEXT_COLOR }]}>
                    Total
                  </Text>
                  <Text style={[styles.total, { color: PRIMARY_COLOR }]}>
                    {(total + deliveryCost).toFixed(2)} DH
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Checkout Button */}
            <View style={styles.containerCheckout}>
              <TouchableOpacity
                onPress={() => (total != 0 ? checkOut() : null)}
                style={[styles.shopButton, { backgroundColor: PRIMARY_COLOR }]}>
                <Ionicons
                  name="bag-outline"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.shopButtonText}>
                  Paiement ({(total + deliveryCost).toFixed(2)} DH) 
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )
      )}

      {/* Enhanced Address Modal */}
      <Modal
        isVisible={modalAdresseVisible}
        onBackdropPress={() => setModalAdresseVisible(false)}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        backdropOpacity={0.3}
        onSwipeComplete={() => setModalAdresseVisible(false)}
        swipeDirection="down"
        propagateSwipe
        avoidKeyboard
      >
        <View style={{
          height: 40,
          backgroundColor: PRIMARY_COLOR,
          borderTopRightRadius: 15,
          borderTopLeftRadius: 15,
          alignItems: "center",
        }}>
          <View style={{
            height: 3,
            width: 30,
            backgroundColor: TEXT_COLOR,
            marginTop: 14,
          }}></View>
        </View>

        <View style={{
          backgroundColor: CARD_BACKGROUND,
          minHeight: 350,
          padding: 20,
          justifyContent: 'space-between',
        }}>
          <View>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>
                Adresse de livraison
              </Text>
              <TouchableOpacity
                style={[styles.gpsModalButton, { backgroundColor: PRIMARY_COLOR }]}
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
                <Text style={styles.gpsModalButtonText}>
                  {gettingLocation ? 'GPS...' : 'GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Address Input */}
            <View style={[styles.inputContainer, {
              borderColor: errorAdresse ? 'red' : BORDER_COLOR,
            }]}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={errorAdresse ? 'red' : TEXT_COLOR_SECONDARY}
              />
              <TextInput
                style={[styles.textInput, { color: TEXT_COLOR }]}
                placeholder="Adresse (Quartier)"
                placeholderTextColor={errorAdresse ? 'red' : TEXT_COLOR_SECONDARY}
                value={address}
                onChangeText={setAddress}
                onFocus={() => setErrorAdresse('')}
              />
            </View>

            {/* City and Postal Code Row */}
            <View style={styles.cityPostalRow}>
              <View style={[styles.inputContainer, styles.cityInput, {
                borderColor: errorCity ? 'red' : BORDER_COLOR,
              }]}>
                <MaterialCommunityIcons
                  name="city"
                  size={20}
                  color={errorCity ? 'red' : TEXT_COLOR_SECONDARY}
                />
                <TextInput
                  style={[styles.textInput, { color: TEXT_COLOR }]}
                  placeholder="Ville"
                  placeholderTextColor={errorCity ? 'red' : TEXT_COLOR_SECONDARY}
                  value={city}
                  onChangeText={setCity}
                  onFocus={() => setErrorCity('')}
                />
              </View>

              <View style={[styles.inputContainer, styles.postalInput, {
                borderColor: errorZipCode ? 'red' : BORDER_COLOR,
              }]}>
                <MaterialCommunityIcons
                  name="mailbox-outline"
                  size={20}
                  color={errorZipCode ? 'red' : TEXT_COLOR_SECONDARY}
                />
                <TextInput
                  style={[styles.textInput, { color: TEXT_COLOR }]}
                  placeholder="Code"
                  placeholderTextColor={errorZipCode ? 'red' : TEXT_COLOR_SECONDARY}
                  value={zipCode}
                  onChangeText={setZipCode}
                  onFocus={() => setErrorZipCode('')}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Helper text */}
            <Text style={[styles.helperText, { color: TEXT_COLOR_SECONDARY }]}>
              💡 Appuyez sur GPS pour obtenir automatiquement votre adresse
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSaveAdresse}
            style={[styles.saveButton, { backgroundColor: PRIMARY_COLOR }]}
          >
            <Text style={styles.saveButtonText}>
              Sauvegarder l'adresse
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Credit Card Modal - keeping existing implementation */}
      <Modal
        isVisible={modalCardVisible}
        onBackdropPress={() => setModalCardVisible(false)}
        style={styles.cardModalStyle}
        backdropOpacity={0.5}
        avoidKeyboard={true}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
      >
        <View style={[styles.cardModalContainer, { backgroundColor: CARD_BACKGROUND }]}>
          <View style={[styles.cardModalHeader, { borderBottomColor: TEXT_COLOR_SECONDARY }]}>
            <Text style={[styles.cardModalTitle, { color: TEXT_COLOR }]}>
              Informations de la carte
            </Text>
            <TouchableOpacity onPress={() => setModalCardVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={TEXT_COLOR} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cardModalContent} showsVerticalScrollIndicator={false}>
            {/* Card Number */}
            <View style={styles.cardInputContainer}>
              <Text style={[styles.cardInputLabel, { color: TEXT_COLOR }]}>
                Numéro de carte
              </Text>
              <View style={[
                styles.cardInputWrapper,
                {
                  borderColor: errorCardNumber ? 'red' : TEXT_COLOR_SECONDARY,
                  backgroundColor: BACKGROUND_COLOR
                }
              ]}>
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={20}
                  color={errorCardNumber ? 'red' : TEXT_COLOR_SECONDARY}
                  style={styles.cardInputIcon}
                />
                <TextInput
                  style={[styles.cardTextInput, { color: TEXT_COLOR }]}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={errorCardNumber ? 'red' : TEXT_COLOR_SECONDARY}
                  value={cardNumber}
                  onChangeText={(text) => {
                    const formatted = formatCardNumber(text);
                    setCardNumber(formatted);
                    if (errorCardNumber) {
                      setErrorCardNumber('');
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>
              {errorCardNumber ? (
                <Text style={styles.cardErrorText}>{errorCardNumber}</Text>
              ) : null}
            </View>

            {/* Card Holder */}
            <View style={styles.cardInputContainer}>
              <Text style={[styles.cardInputLabel, { color: TEXT_COLOR }]}>
                Nom du titulaire
              </Text>
              <View style={[
                styles.cardInputWrapper,
                {
                  borderColor: errorCardHolder ? 'red' : TEXT_COLOR_SECONDARY,
                  backgroundColor: BACKGROUND_COLOR
                }
              ]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={errorCardHolder ? 'red' : TEXT_COLOR_SECONDARY}
                  style={styles.cardInputIcon}
                />
                <TextInput
                  style={[styles.cardTextInput, { color: TEXT_COLOR }]}
                  placeholder="JOHN DOE"
                  placeholderTextColor={errorCardHolder ? 'red' : TEXT_COLOR_SECONDARY}
                  value={cardHolder}
                  onChangeText={(text) => {
                    setCardHolder(text.toUpperCase());
                    setErrorCardHolder('');
                  }}
                  autoCapitalize="characters"
                />
              </View>
              {errorCardHolder ? (
                <Text style={styles.cardErrorText}>{errorCardHolder}</Text>
              ) : null}
            </View>

            {/* Expiry Date and CVV Row */}
            <View style={styles.cardRowContainer}>
              <View style={[styles.cardInputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.cardInputLabel, { color: TEXT_COLOR }]}>
                  Date d'expiration
                </Text>
                <View style={[
                  styles.cardInputWrapper,
                  {
                    borderColor: errorExpiryDate ? 'red' : TEXT_COLOR_SECONDARY,
                    backgroundColor: BACKGROUND_COLOR
                  }
                ]}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={20}
                    color={errorExpiryDate ? 'red' : TEXT_COLOR_SECONDARY}
                    style={styles.cardInputIcon}
                  />
                  <TextInput
                    style={[styles.cardTextInput, { color: TEXT_COLOR }]}
                    placeholder="MM/AA"
                    placeholderTextColor={errorExpiryDate ? 'red' : TEXT_COLOR_SECONDARY}
                    value={expiryDate}
                    onChangeText={(text) => {
                      const formatted = formatExpiryDate(text);
                      if (formatted.length <= 5) {
                        setExpiryDate(formatted);
                        setErrorExpiryDate('');
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                {errorExpiryDate ? (
                  <Text style={styles.cardErrorText}>{errorExpiryDate}</Text>
                ) : null}
              </View>

              <View style={[styles.cardInputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={[styles.cardInputLabel, { color: TEXT_COLOR }]}>
                  CVV
                </Text>
                <View style={[
                  styles.cardInputWrapper,
                  {
                    borderColor: errorCvv ? 'red' : TEXT_COLOR_SECONDARY,
                    backgroundColor: BACKGROUND_COLOR
                  }
                ]}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={errorCvv ? 'red' : TEXT_COLOR_SECONDARY}
                    style={styles.cardInputIcon}
                  />
                  <TextInput
                    style={[styles.cardTextInput, { color: TEXT_COLOR }]}
                    placeholder="123"
                    placeholderTextColor={errorCvv ? 'red' : TEXT_COLOR_SECONDARY}
                    value={cvv}
                    onChangeText={(text) => {
                      if (text.length <= 3 && /^\d*$/.test(text)) {
                        setCvv(text);
                        setErrorCvv('');
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
                {errorCvv ? (
                  <Text style={styles.cardErrorText}>{errorCvv}</Text>
                ) : null}
              </View>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color={PRIMARY_COLOR}
              />
              <Text style={[styles.securityText, { color: TEXT_COLOR_SECONDARY }]}>
                Vos informations sont sécurisées et cryptées
              </Text>
            </View>
          </ScrollView>

          <View style={styles.cardModalFooter}>
            <TouchableOpacity
              onPress={() => setModalCardVisible(false)}
              style={[styles.cardCancelButton, { borderColor: TEXT_COLOR_SECONDARY }]}
            >
              <Text style={[styles.cardCancelButtonText, { color: TEXT_COLOR }]}>
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveCard}
              style={[styles.cardSaveButton, { backgroundColor: PRIMARY_COLOR }]}
            >
              <Text style={styles.cardSaveButtonText}>
                Enregistrer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  // Header styles
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitleContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cartBadge: {
    position: 'absolute',
    top: -10,
    right: -15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007afe',
  },

  textHeader2: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 1,
    paddingTop: 20,
    paddingLeft: 16,
    marginBottom: 10,
  },
  productContainer: {
    paddingHorizontal: 16,
  },

  // Product Card Styles
  productCard: {
    width: '100%',
    marginVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },

  productImageContainer: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },

  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },

  priceContainer: {
    marginTop: 4,
  },

  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
  },

  totalPrice: {
    fontSize: 13,
    marginTop: 2,
  },

  productActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },

  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 12,
  },

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'crimson',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Enhanced Delivery section styles
  deliveryContainer: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  textDorP: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 20,
  },
  dFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentDorP: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  viewDorP: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginRight: 18,
  },
  truckIcon: {
    fontSize: 18,
  },
  addressInfo: {
    flex: 1,
  },
  textAdress: {
    fontSize: 14,
    fontWeight: '500',
  },
  textZipCode: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    opacity: 0.5,
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  editButton: {
    padding: 4,
  },
  chevronRight: {
    fontSize: 22,
  },

  // Enhanced Payment section styles
  paymentContainer: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  textTitlePay: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 20,
  },
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentMethodCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card Details Display Styles
  cardDetailsContainer: {
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 4,
  },
  cardHolder: {
    fontSize: 12,
    fontWeight: '400',
  },

  // Error text
  errorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },

  // Order details section styles
  containerOrder: {
    paddingHorizontal: 16,
    marginTop: 40,
    marginBottom: 80,
  },
  subtotalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleSbt_or_Tax: {
    fontSize: 12,
    fontWeight: '400',
    maxWidth: '80%',
    opacity: 0.5,
  },
  subtotal: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
  },
  taxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  titleTotal: {
    fontSize: 12,
    fontWeight: '400',
    maxWidth: '80%',
    opacity: 0.5,
  },
  total: {
    fontSize: 18,
    fontWeight: '500',
  },

  // Checkout button styles
  containerCheckout: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Enhanced Modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gpsModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  gpsModalButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1.5,
    marginBottom: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  cityPostalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cityInput: {
    flex: 2,
  },
  postalInput: {
    flex: 1,
    minWidth: 100,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Card Modal Styles
  cardModalStyle: {
    justifyContent: 'center',
    margin: 20,
  },
  cardModalContainer: {
    borderRadius: 20,
    maxHeight: '85%',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cardModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  cardModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardModalContent: {
    padding: 20,
  },
  cardInputContainer: {
    marginBottom: 20,
  },
  cardInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  cardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardInputIcon: {
    marginRight: 10,
  },
  cardTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  cardErrorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  cardRowContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 122, 254, 0.1)',
    borderRadius: 8,
    marginTop: 10,
  },
  securityText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  cardModalFooter: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  cardCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cardCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardSaveButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  cardSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stockWarning: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});