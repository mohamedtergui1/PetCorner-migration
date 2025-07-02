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
import OrderService from '../../service/order.service';
import ProductService from '../../service/CustomProductApiService';

export default function Cart({ navigation }) {
  const { theme, isDarkMode, toggleTheme, colorTheme, toggleColorTheme } = useTheme();

  // Use cart context
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
  const [modePaiement, setModePaiement] = useState('espèces');
  const [errorModePaiement, setErrorModePaiement] = useState('');
  const [modalAdresseVisible, setModalAdresseVisible] = useState(false);
  
  // Address fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [errorAdresse, setErrorAdresse] = useState('');
  const [errorCity, setErrorCity] = useState('');
  const [errorZipCode, setErrorZipCode] = useState('');
  const [userDetails, setUserDetails] = useState();
  const [gettingLocation, setGettingLocation] = useState(false);

  // Location states
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState(0);

  // Loading states for quantity updates
  const [loadingQuantityUpdates, setLoadingQuantityUpdates] = useState({});

  // Animation refs
  const paymentAnimations = useRef({
    cash: new Animated.Value(1),
  }).current;

  // Store location
  const STORE_LOCATION = {
    latitude: 33.951371146759776,
    longitude: -6.88501751937855,
    address: "Immeuble 102, Prestigia, Prestigia - Riyad Al Andalous, N° 13 sis, GH4, Rabat 10100"
  };

  // Theme colors
  const PRIMARY_COLOR = theme.primary;
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#4A90E2' : '#FF8A50';
  const BACKGROUND_COLOR = theme.backgroundColor;
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = theme.textColor;
  const TEXT_COLOR_SECONDARY = theme.secondaryTextColor;
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#f0f0f0';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🎯 Screen focused, loading cart data...');
      getDataFromDB();
      loadUserAddress(); // Load user data when screen focuses
    });
    return unsubscribe;
  }, [navigation]);

  // Initialize data when component mounts
  useEffect(() => {
    console.log('🚀 Component mounted, loading initial data...');
    getDataFromDB();
    loadUserAddress();
  }, []);

  // Separate function to load user address with better error handling
  const loadUserAddress = async () => {
    try {
      console.log('📍 Starting to load user address...');
      await getUserData();
    } catch (error) {
      console.log('❌ Failed to load user address:', error);
    }
  };

  // Recalculate total when products or quantities change
  useEffect(() => {
    if (products.length > 0) {
      const quantities = getQuantities();
      calculateTotal(products, quantities);
    }
  }, [products, cartItems]);

  // Parse address string into components with enhanced debugging
  const parseAddress = (addressString) => {
    console.log('🔍 Parsing address string:', addressString);
    
    if (!addressString || typeof addressString !== 'string') {
      console.log('⚠️ Address string is empty or not a string');
      return {
        address: '',
        city: '',
        postalCode: ''
      };
    }

    try {
      const parts = addressString.split(',').map(part => part.trim()).filter(Boolean);
      console.log('📝 Address parts after split:', parts);
      
      let result;
      if (parts.length === 0) {
        result = { address: '', city: '', postalCode: '' };
      } else if (parts.length === 1) {
        result = { address: parts[0], city: '', postalCode: '' };
      } else if (parts.length === 2) {
        result = { address: parts[0], city: parts[1], postalCode: '' };
      } else {
        result = {
          address: parts[0],
          city: parts[1],
          postalCode: parts[2]
        };
      }
      
      console.log('📍 Parsed result:', result);
      return result;
    } catch (error) {
      console.log('❌ Error parsing address:', error);
      return {
        address: addressString,
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

  // Get user data function with enhanced debugging
  const getUserData = async () => {
    try {
      console.log('📋 Starting getUserData function...');
      
      // Step 1: Get user data from AsyncStorage
      console.log('🔍 Getting user data from AsyncStorage...');
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (!userDataString) {
        console.log('❌ No user data found in AsyncStorage');
        return;
      }
      
      console.log('✅ User data found in storage:', userDataString.substring(0, 100) + '...');
      
      const userData = JSON.parse(userDataString);
      if (!userData || !userData.id) {
        console.log('❌ No user ID found in parsed data:', userData);
        return;
      }
      
      const clientID = userData.id;
      console.log('🆔 Client ID found:', clientID);

      // Step 2: Make API call to get full user details
      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };

      console.log('🌐 Making API call to:', API_BASE_URL + '/thirdparties/' + clientID);
      const res = await axios.get(API_BASE_URL + '/thirdparties/' + clientID, { 
        headers,
        timeout: 10000 
      });
      
      console.log('✅ API response received');
      console.log('📄 Full user data:', JSON.stringify(res.data, null, 2));
      
      const fetchedUserData = res.data;
      setUserDetails(fetchedUserData);
      
      // Step 3: Parse and set address components
      console.log('🏠 Raw address from API:', fetchedUserData.address);
      console.log('🏙️ Raw city from API:', fetchedUserData.town);
      console.log('📮 Raw zip from API:', fetchedUserData.zip);
      
      // Check if we have a combined address that needs parsing
      if (fetchedUserData.address && fetchedUserData.address.includes(',')) {
        console.log('📍 Found comma-separated address, parsing...');
        const addressParts = parseAddress(fetchedUserData.address);
        console.log('📍 Parsed address parts:', addressParts);
        
        // Use parsed parts
        const finalAddress = addressParts.address || '';
        const finalCity = addressParts.city || fetchedUserData.town || '';
        const finalZipCode = addressParts.postalCode || fetchedUserData.zip || '';
        
        console.log('🎯 Using parsed address values:');
        console.log('   - Address:', finalAddress);
        console.log('   - City:', finalCity);
        console.log('   - Postal Code:', finalZipCode);
        
        setAddress(finalAddress);
        setCity(finalCity);
        setZipCode(finalZipCode);
      } else {
        console.log('📍 Using direct field values (no comma found)');
        // Use direct fields if no comma separation
        const finalAddress = fetchedUserData.address || '';
        const finalCity = fetchedUserData.town || '';
        const finalZipCode = fetchedUserData.zip || '';
        
        console.log('🎯 Using direct field values:');
        console.log('   - Address:', finalAddress);
        console.log('   - City:', finalCity);
        console.log('   - Postal Code:', finalZipCode);
        
        setAddress(finalAddress);
        setCity(finalCity);
        setZipCode(finalZipCode);
      }
      
      console.log('✅ Address state updated successfully');
      
      // Add a small delay and then log the current state
      setTimeout(() => {
        console.log('🔍 Current state after update:');
        console.log('   - address state:', address);
        console.log('   - city state:', city);
        console.log('   - zipCode state:', zipCode);
      }, 100);
      
      // Show success message if we have any address data
      if (finalAddress || finalCity || finalZipCode) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Adresse chargée depuis votre profil', ToastAndroid.SHORT);
        } else {
          Toast.show('Adresse chargée depuis votre profil', Toast.SHORT);
        }
      }
      
    } catch (error) {
      console.log('❌ Error in getUserData:', error);
      console.log('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      
    }
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
        console.warn('⚠️ Permission error:', err);
        return false;
      }
    }
    return true;
  };

  // Geocoding function
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
      console.log('❌ Geocoding failed:', error.message);
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

  // GPS location function
  const getCurrentLocationAddress = async () => {
    console.log('📍 GPS button clicked - starting location process');
    setGettingLocation(true);
    
    try {
      console.log('🔐 Requesting location permission...');
      const hasPermission = await requestLocationPermission();
      console.log('✅ Permission granted:', hasPermission);
      
      if (!hasPermission) {
        console.log('❌ Permission denied by user');
        if (Platform.OS === 'android') {
          ToastAndroid.show('Permission de localisation requise', ToastAndroid.SHORT);
        } else {
          Toast.show('Permission de localisation requise', Toast.SHORT);
        }
        setGettingLocation(false);
        return;
      }

      console.log('🎯 Getting current position...');
      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            console.log('📍 Position received:', position.coords);
            const { latitude, longitude } = position.coords;
            
            console.log('🗺️ Getting address from coordinates...');
            const addressInfo = await getAddressFromCoordinates(latitude, longitude);
            console.log('✅ Address info received:', addressInfo);
            
            setAddress(addressInfo.streetAddress || addressInfo.displayName);
            setCity(addressInfo.city);
            setZipCode(addressInfo.postalCode);
            
            setErrorAdresse('');
            setErrorCity('');
            setErrorZipCode('');
            
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
            console.error('❌ Error getting address:', error);
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
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
      console.error('❌ Permission error:', error);
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
    const R = 6371;
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
    if (distanceKm <= 5) return 0;
    if (distanceKm <= 10) return 15;
    if (distanceKm <= 20) return 25;
    return 35;
  };

  // Payment method selection
  const handlePaymentMethodSelect = (method) => {
    if (method === 'espèces') {
      setModePaiement(method);
      setErrorModePaiement('');

      Animated.timing(paymentAnimations.cash, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // 🎯 MAIN FUNCTION: Load cart data and fetch products
  const getDataFromDB = useCallback(async () => {
    console.log('🚀 Starting getDataFromDB...');
    setIsLoading(true);
    setIsEmpty(false);
    
    try {
      // 1. Load cart items (array of IDs like [123, 456, 123, 789, 123])
      console.log('📦 Loading cart items from storage...');
      const items = await loadCartItems();
      console.log('📋 Cart items loaded:', items);

      if (!items || items.length === 0) {
        console.log('🛒 Cart is empty');
        setIsEmpty(true);
        setProducts([]);
        setTotal(0);
        setIsLoading(false);
        return;
      }

      // 2. Get unique product IDs (remove duplicates)
      const uniqueProductIds = [...new Set(items)];
      console.log('🔢 Unique product IDs:', uniqueProductIds);

      try {
        console.log('🌐 Fetching products using getEnhancedProduct...');
        
        // 3. Fetch each unique product using getEnhancedProduct
        const productPromises = uniqueProductIds.map(async (id) => {
          try {
            console.log(`📡 Fetching product ${id}...`);
            const product = await ProductService.getEnhancedProduct(id, {
              includestockdata: 1,
              includesubproducts: false,
              includeparentid: false,
              includetrans: false,
              includeextendedoptions: true
            });
            console.log(`✅ Product ${id} fetched successfully:`, product?.label || 'No label');
            return product;
          } catch (error) {
            console.error(`❌ Error fetching enhanced product ${id}:`, error);
            return null;
          }
        });

        // 4. Wait for all products to be fetched
        const productsResults = await Promise.all(productPromises);
        const validProducts = productsResults.filter(product => product !== null);
        
        console.log(`✅ Products loaded successfully: ${validProducts.length}/${uniqueProductIds.length}`);
        console.log('📋 Valid products:', validProducts.map(p => ({ id: p.id, label: p.label })));
        
        setProducts(validProducts);
        
        // 5. Calculate total with quantities
        if (validProducts.length > 0) {
          const quantities = getQuantities();
          console.log('📊 Current quantities:', quantities);
          calculateTotal(validProducts, quantities);
        } else {
          console.log('❌ No valid products found');
          setTotal(0);
        }

      } catch (apiError) {
        console.error('❌ Product fetching failed:', apiError);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show('Erreur lors du chargement des produits', ToastAndroid.SHORT);
        } else {
          Toast.show('Erreur lors du chargement des produits', Toast.SHORT);
        }
        
        setProducts([]);
        setTotal(0);
      }

    } catch (error) {
      console.error('❌ Failed to load cart items:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Erreur lors du chargement du panier', ToastAndroid.SHORT);
      } else {
        Toast.show('Erreur lors du chargement du panier', Toast.SHORT);
      }
      setIsEmpty(true);
      setProducts([]);
      setTotal(0);
    } finally {
      console.log('🏁 Setting loading to false');
      setIsLoading(false);
    }
  }, [loadCartItems, getQuantities]);

  // Calculate total function
  const calculateTotal = (products, quantities) => {
    console.log('💰 Calculating total for products:', products.length);
    const newTotal = products.reduce((acc, item) => {
      const quantity = quantities[item.id] || 1;
      const itemTotal = (parseFloat(item.price_ttc) || 0) * quantity;
      console.log(`💵 Item ${item.id}: price=${item.price_ttc}, quantity=${quantity}, total=${itemTotal}`);
      return acc + itemTotal;
    }, 0);
    console.log('💰 New total calculated:', newTotal);
    setTotal(newTotal);
  };

  // Update quantity handler
  const handleUpdateQuantity = async (id, change) => {
    setLoadingQuantityUpdates(prev => ({ ...prev, [id]: true }));

    try {
      const result = await updateQuantity(id, change);
      if (result.success) {
        const updatedQuantities = getQuantities();
        calculateTotal(products, updatedQuantities);
      } else if (result.error) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(result.error, ToastAndroid.SHORT);
        } else {
          Toast.show(result.error, Toast.SHORT);
        }
      }
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
    } finally {
      setLoadingQuantityUpdates(prev => ({ ...prev, [id]: false }));
    }
  };

  // Remove item handler
  const handleRemoveItem = async (id) => {
    const result = await removeFromCart(id);
    if (result.success) {
      getDataFromDB();
    }
  };

  // Checkout function
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

    if (!isValid) return;

    try {
      setIsLoading(true);
      const quantities = getQuantities();

      const orderData = {
        products: products,
        quantities: quantities,
        address: address,
        city: city,
        zipCode: zipCode,
        paymentMethod: 'espèces',
        cardDetails: null,
        userLocation: userLocation,
        distance: distance,
        deliveryCost: deliveryCost
      };

      await OrderService.createOrderWithUI(
        orderData,
        clearCart,
        navigation,
        setIsLoading
      );

    } catch (error) {
      console.log("❌ Checkout error:", error);
      Alert.alert('Erreur', 'Une erreur inattendue est survenue');
      setIsLoading(false);
    }
  };

  // Save address function
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

  // Update client function
  const updateClient = async () => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      const clientID = userData.id;
      
      const concatenatedAddress = concatenateAddress(address, city, zipCode);
      
      const inputData = {
        address: concatenatedAddress,
        town: city,
        zip: zipCode,
      }
      
      const res = await axios.put(API_BASE_URL + '/thirdparties/' + clientID, inputData, {
        headers: {
          'Content-Type': 'application/json',
          'DOLAPIKEY': Token
        }
      });
      
      await getUserData();
      setModalAdresseVisible(false);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Adresse mise à jour', ToastAndroid.SHORT);
      } else {
        Toast.show('Adresse mise à jour', Toast.SHORT);
      }
    } catch (error) {
      console.log('❌ Error updating client:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Erreur lors de la mise à jour', ToastAndroid.SHORT);
      } else {
        Toast.show('Erreur lors de la mise à jour', Toast.SHORT);
      }
    }
  };

  // Render product function
  const renderProducts = ({ id, label, price_ttc, image_link, description, stock_reel }) => {
    const quantities = getQuantities();
    const quantity = quantities[id] || 1;
    const isUpdatingQuantity = loadingQuantityUpdates[id] || false;
    const availableStock = parseInt(stock_reel) || 0;

    return (
      <View key={id} style={[styles.productCard, { backgroundColor: CARD_BACKGROUND }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.push('ProductDetails', { productId: id })}
          style={styles.productImageContainer}>
          <Image
            source={{ uri: image_link }}
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
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(id, -1)}
                disabled={isUpdatingQuantity || quantity <= 1}
                style={[
                  styles.quantityButton,
                  {
                    borderColor: (isUpdatingQuantity || quantity <= 1) ? TEXT_COLOR_SECONDARY : PRIMARY_COLOR,
                    backgroundColor: 'transparent',
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
                disabled={isUpdatingQuantity || quantity >= availableStock}
                style={[
                  styles.quantityButton,
                  {
                    borderColor: (isUpdatingQuantity || quantity >= availableStock) ? TEXT_COLOR_SECONDARY : PRIMARY_COLOR,
                    backgroundColor: 'transparent',
                    opacity: (isUpdatingQuantity || quantity >= availableStock) ? 0.4 : 1
                  }
                ]}>
                {isUpdatingQuantity ? (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                ) : (
                  <Text style={[
                    styles.quantityButtonText, 
                    { color: (quantity >= availableStock) ? TEXT_COLOR_SECONDARY : PRIMARY_COLOR }
                  ]}>+</Text>
                )}
              </TouchableOpacity>
            </View>

            {quantity >= availableStock && (
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

  // Payment methods component
  const renderPaymentMethods = () => (
    <View style={[styles.paymentContainer, { backgroundColor: BACKGROUND_COLOR }]}>
      <Text style={[styles.textTitlePay, { color: TEXT_COLOR }]}>
        Mode de paiement
      </Text>

      <View style={styles.paymentMethodsContainer}>
        <Animated.View style={[
          styles.paymentMethodCard,
          {
            backgroundColor: CARD_BACKGROUND,
            borderColor: PRIMARY_COLOR,
            borderWidth: 2,
            transform: [{
              scale: 1.02,
            }],
          }
        ]}>
          <View style={styles.paymentMethodContent}>
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
                borderColor: PRIMARY_COLOR,
                backgroundColor: PRIMARY_COLOR,
              }
            ]}>
              <MaterialCommunityIcons name="check" size={16} color="#fff" />
            </View>
          </View>
        </Animated.View>

        <View style={[
          styles.paymentMethodCard,
          styles.disabledPaymentCard,
          {
            backgroundColor: CARD_BACKGROUND,
            borderColor: BORDER_COLOR,
            opacity: 0.5,
          }
        ]}>
          <View style={styles.paymentMethodContent}>
            <View style={[styles.paymentIconContainer, { backgroundColor: TEXT_COLOR_SECONDARY + '20' }]}>
              <MaterialCommunityIcons
                name="credit-card-off"
                size={24}
                color={TEXT_COLOR_SECONDARY}
              />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={[styles.paymentMethodTitle, { color: TEXT_COLOR_SECONDARY }]}>
                Carte bancaire
              </Text>
              <Text style={[styles.paymentMethodSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                Non disponible
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              {
                borderColor: TEXT_COLOR_SECONDARY,
                backgroundColor: 'transparent',
              }
            ]}>
              <MaterialCommunityIcons name="close" size={16} color={TEXT_COLOR_SECONDARY} />
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.paymentNotice, { backgroundColor: PRIMARY_COLOR + '10' }]}>
        <MaterialCommunityIcons
          name="information"
          size={16}
          color={PRIMARY_COLOR}
        />
        <Text style={[styles.paymentNoticeText, { color: PRIMARY_COLOR }]}>
          Le paiement par carte bancaire sera bientôt disponible
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar backgroundColor={PRIMARY_COLOR} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity
          onPress={() => {
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
            <Text style={{ marginTop: 10, color: TEXT_COLOR, fontSize: 16 }}>
              Chargement du panier...
            </Text>
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: BACKGROUND_COLOR }}>
              <Text style={[styles.textHeader2, { color: TEXT_COLOR }]}>Produits</Text>
              <View style={styles.productContainer}>
                {products && products.length > 0 ? 
                  products.map(renderProducts) : 
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: TEXT_COLOR_SECONDARY }}>
                      Aucun produit trouvé
                    </Text>
                  </View>
                }
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
                style={[
                  styles.shopButton, 
                  { 
                    backgroundColor: total > 0 ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY,
                    opacity: total > 0 ? 1 : 0.6
                  }
                ]}
                disabled={total <= 0}
              >
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
                onChangeText={(text) => {
                  console.log('📝 Address input changed to:', text);
                  setAddress(text);
                }}
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
                  onChangeText={(text) => {
                    console.log('📝 City input changed to:', text);
                    setCity(text);
                  }}
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
                  onChangeText={(text) => {
                    console.log('📝 ZipCode input changed to:', text);
                    setZipCode(text);
                  }}
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
  disabledPaymentCard: {
    // Additional styling for disabled card
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

  // Payment notice styles
  paymentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  paymentNoticeText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
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
  stockWarning: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});