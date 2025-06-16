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
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { COLOURS, Items } from '../../database/Database';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../../config/Api';
import Token from '../../../config/TokenDolibar';
import Toast from 'react-native-simple-toast';
import { RadioButton } from "react-native-paper";
import Modal from "react-native-modal";
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import Geolocation from '@react-native-community/geolocation';

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
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [errorAdresse, setErrorAdresse] = useState('');
  const [errorCity, setErrorCity] = useState('');
  const [errorZipCode, setErrorZipCode] = useState('');
  const [userDetails, setUserDetails] = useState();
  
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
  
  // Store location (set this to your actual store coordinates)
  const STORE_LOCATION = {
    latitude: 33.5731, // Example: Casablanca coordinates
    longitude: -7.5898,
    address: "123 Rue Mohamed V, Casablanca, Morocco"
  };
  
  // Define theme colors matching ProductScreen
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';

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
  }, [products, cartItems]); // Listen to cartItems changes from context

  // Location permission request
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission de localisation',
            message: 'Cette application a besoin d\'accéder à votre localisation pour calculer la distance de livraison.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 16 digits maximum
    const limited = cleaned.substring(0, 16);
    
    // Add spaces every 4 digits
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

    // Card number validation (16 digits)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!cleanCardNumber || cleanCardNumber.length !== 16 || !/^\d+$/.test(cleanCardNumber)) {
      setErrorCardNumber('Le numéro de carte doit contenir 16 chiffres');
      isValid = false;
    } else {
      setErrorCardNumber('');
    }

    // Card holder validation
    if (!cardHolder.trim()) {
      setErrorCardHolder('Veuillez entrer le nom du titulaire');
      isValid = false;
    } else {
      setErrorCardHolder('');
    }

    // Expiry date validation
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

    // CVV validation
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

  // Get user's current location
  const getCurrentLocation = async () => {
    setLocationLoading(true);
    
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission refusée',
        'La permission de localisation est nécessaire pour calculer la distance de livraison.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Paramètres', onPress: () => Linking.openSettings() }
        ]
      );
      setLocationLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        // Calculate distance to store
        const dist = calculateDistance(
          latitude, 
          longitude, 
          STORE_LOCATION.latitude, 
          STORE_LOCATION.longitude
        );
        
        setDistance(dist);
        const cost = calculateDeliveryCost(dist);
        setDeliveryCost(cost);
        
        setLocationLoading(false);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Distance: ${dist.toFixed(1)}km - Frais de livraison: ${cost} DH`, ToastAndroid.LONG);
        } else {
          Toast.show(`Distance: ${dist.toFixed(1)}km - Frais de livraison: ${cost} DH`, Toast.LONG);
        }
      },
      (error) => {
        console.log('Location error:', error);
        setLocationLoading(false);
        Alert.alert(
          'Erreur de localisation', 
          'Impossible d\'obtenir votre position. Vérifiez que le GPS est activé.',
          [
            { text: 'OK' },
            { text: 'Réessayer', onPress: getCurrentLocation }
          ]
        );
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000 
      }
    );
  };

  // Updated to use cart context
  const getDataFromDB = useCallback(async () => {
    setIsEmpty(false);
    try {
      const items = await loadCartItems(); // Use context function

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

      // Calculate total immediately after setting products
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
    // Set loading state for this specific product
    setLoadingQuantityUpdates(prev => ({ ...prev, [id]: true }));
    
    try {
      const result = await updateQuantity(id, change); // Use context function
      if (result.success) {
        // Immediately recalculate total with updated quantities
        const updatedQuantities = getQuantities();
        calculateTotal(products, updatedQuantities);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      // Clear loading state for this specific product
      setLoadingQuantityUpdates(prev => ({ ...prev, [id]: false }));
    }
  };

  // Updated to use cart context
  const handleRemoveItem = async (id) => {
    const result = await removeFromCart(id); // Use context function
    if (result.success) {
      getDataFromDB(); // Refresh data after removal
    }
  };

  // Updated checkout to use cart context
  const checkOut = async () => {
    const userData = JSON.parse(await AsyncStorage.getItem('userData'));
    const clientID = userData.id;

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

    // Validate card details if credit card is selected
    if (modePaiement === 'credit_card' && !cardDetails) {
      setErrorModePaiement('Veuillez entrer les détails de votre carte');
      isValid = false;
    }

    if (!isValid) return;

    try {
      const quantities = getQuantities(); // Use context function
      
      const inputData = {
        socid: clientID,
        date: new Date().toISOString().split('T')[0],
        type: 0,
        brouillon: 1,
        mode_reglement_id: 4,
        mode_reglement_code: 'LIQ',
        lines: products.map(product => ({
          fk_product: product.id,
          qty: quantities[product.id] || 1,
          price: product.price_ttc,
          subprice: product.price_ttc * (quantities[product.id] || 1),
          product_type: 0,
          tva_tx: 20,
        })),
        cond_reglement_id: 6,
        date_validation: new Date().toISOString().split('T')[0],
        // Add delivery info if location is available
        ...(userLocation && {
          note_public: `Livraison à: ${address}, ${city} ${zipCode}\nDistance: ${distance?.toFixed(1)}km\nFrais de livraison: ${deliveryCost} DH${modePaiement === 'credit_card' ? `\nPaiement par carte: ****${cardDetails?.number.slice(-4)}` : ''}`
        })
      }

      const res = await axios.post(API_BASE_URL + 'orders', inputData, {
        headers: {
          'Content-Type': 'application/json',
          'DOLAPIKEY': Token
        }
      });

      // Use context function to clear cart
      await clearCart();
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Les articles seront livrés BIENTOT !', ToastAndroid.SHORT);
        setIsLoading(true);
      } else if (Platform.OS === 'ios') {
        Toast.show('Les articles seront livrés BIENTOT !', Toast.SHORT);
        setIsLoading(true);
      }
      navigation.navigate('Accueil');
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        console.log("API Error:", error.response.data);
        Alert.alert('Error', error.response.data?.message || 'Something went wrong');
      } else if (error.request) {
        console.log("Request Error:", error.request);
        Alert.alert('Error', 'No response received from the server');
      } else {
        console.log("Error:", error.message);
        Alert.alert('Error', 'Something went wrong');
      }
      return error;
    }
  };

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

  // Updated to use context quantities
  const renderProducts = ({ id, label, price_ttc, photo_link, description, stock }) => {
    const quantities = getQuantities(); // Use context function
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
      <View key={id} style={[styles.productCard, { backgroundColor: theme.cardBackground }]}>
        {/* Product Image */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ProductDetails', { product: data })}
          style={styles.productImageContainer}>
          <Image
            source={{ uri: photo_link }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View>
            <Text
              style={[styles.productTitle, { color: theme.textColor }]}
              numberOfLines={1}
            >
              {label}
            </Text>

            <View style={styles.priceContainer}>
              <Text style={[styles.currentPrice, { color: PRIMARY_COLOR }]}>
                {(parseFloat(price_ttc) || 0).toFixed(2)} DH
              </Text>
              <Text style={[styles.totalPrice, { color: theme.secondaryTextColor }]}>
                (Total: {((price_ttc * quantity)).toFixed(2)} DH)
              </Text>
            </View>
          </View>

          {/* Product Actions */}
          <View style={styles.productActions}>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(id, -1)} // Use context function
                disabled={isUpdatingQuantity}
                style={[
                  styles.quantityButton, 
                  { 
                    borderColor: PRIMARY_COLOR,
                    opacity: isUpdatingQuantity ? 0.6 : 1
                  }
                ]}>
                {isUpdatingQuantity ? (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                ) : (
                  <Text style={[styles.quantityButtonText, { color: PRIMARY_COLOR }]}>-</Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.quantityText, { color: theme.textColor }]}>{quantity}</Text>

              <TouchableOpacity
                onPress={() => handleUpdateQuantity(id, 1)} // Use context function
                disabled={isUpdatingQuantity}
                style={[
                  styles.quantityButton, 
                  { 
                    borderColor: PRIMARY_COLOR,
                    opacity: isUpdatingQuantity ? 0.6 : 1
                  }
                ]}>
                {isUpdatingQuantity ? (
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                ) : (
                  <Text style={[styles.quantityButtonText, { color: PRIMARY_COLOR }]}>+</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => handleRemoveItem(id)} // Use context function
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

  const updateClient = async () => {
    const userData = JSON.parse(await AsyncStorage.getItem('userData'));
    const clientID = userData.id;
    const inputData = {
      address: address,
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
      setAddress(res.data.address);
      setCity(res.data.town);
      setZipCode(res.data.zip);
    } catch (error) {
      console.log(error);
    }
  };

  // Render location section
  const renderLocationSection = () => (
    <View style={[styles.deliveryContainer, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.locationHeader}>
        <Text style={[styles.textDorP, { color: theme.textColor }]}>
          Localisation et livraison
        </Text>
        <TouchableOpacity
          onPress={getCurrentLocation}
          disabled={locationLoading}
          style={[styles.locationButton, { backgroundColor: PRIMARY_COLOR }]}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#fff" />
          )}
          <Text style={styles.locationButtonText}>
            {locationLoading ? 'Recherche...' : 'Ma position'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Store Location */}
      <View style={[styles.locationCard, { backgroundColor: theme.cardBackground }]}>
        <MaterialCommunityIcons
          name="store"
          size={20}
          color={PRIMARY_COLOR}
          style={styles.locationIcon}
        />
        <View style={styles.locationInfo}>
          <Text style={[styles.locationTitle, { color: theme.textColor }]}>Magasin</Text>
          <Text style={[styles.locationAddress, { color: theme.secondaryTextColor }]}>
            {STORE_LOCATION.address}
          </Text>
        </View>
      </View>

      {/* User Location & Distance */}
      {userLocation && (
        <View style={[styles.locationCard, { backgroundColor: theme.cardBackground }]}>
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={PRIMARY_COLOR}
            style={styles.locationIcon}
          />
          <View style={styles.locationInfo}>
            <Text style={[styles.locationTitle, { color: theme.textColor }]}>Votre position</Text>
            <Text style={[styles.locationAddress, { color: theme.secondaryTextColor }]}>
              {`${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
            </Text>
            {distance && (
              <View style={styles.distanceInfo}>
                <Text style={[styles.distanceText, { color: PRIMARY_COLOR }]}>
                  Distance: {distance.toFixed(1)} km
                </Text>
                <Text style={[styles.deliveryCostText, { color: theme.textColor }]}>
                  Frais de livraison: {deliveryCost} DH
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar backgroundColor={PRIMARY_COLOR} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Updated Header with cart count from context */}
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
          {cartCount > 0 && ( // Use context cart count
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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundColor }}>
          <Ionicons name="cart" color={PRIMARY_COLOR} size={60} />
          <Text style={{ marginTop: 5, color: PRIMARY_COLOR, fontSize: 20 }}>
            Votre panier est vide
          </Text>
        </View>
      ) : (
        isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundColor }}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: theme.backgroundColor }}>
              <Text style={[styles.textHeader2, { color: theme.textColor }]}>Produits</Text>
              <View style={styles.productContainer}>
                {products ? products.map(renderProducts) : null}
              </View>
              
              {/* Location Section */}
              {renderLocationSection()}
              
              <View>
                <View style={[styles.deliveryContainer, { backgroundColor: theme.backgroundColor }]}>
                  <Text style={[styles.textDorP, { color: theme.textColor }]}>
                    Adresse de livraison
                  </Text>
                  <View style={styles.dFlex}>
                    <View style={styles.contentDorP}>
                      <View style={[styles.viewDorP, { backgroundColor: theme.cardBackground }]}>
                        <MaterialCommunityIcons
                          name="truck-delivery-outline"
                          style={[styles.truckIcon, { color: PRIMARY_COLOR }]}
                        />
                      </View>
                      <View>
                        <Text style={[styles.textAdress, { color: theme.textColor }]}>
                          {address}
                        </Text>
                        <Text style={[styles.textZipCode, { color: theme.secondaryTextColor }]}>
                          {zipCode}, {city}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.5}
                      onPress={() => setModalAdresseVisible(true)}
                    >
                      <MaterialCommunityIcons
                        name="chevron-right"
                        style={[styles.chevronRight, { color: theme.textColor }]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={[styles.conatinerPayement, { backgroundColor: theme.backgroundColor }]}>
                  <Text style={[styles.textTitlePay, { color: theme.textColor }]}>
                    Mode de paiement
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
                    <View style={{ flexDirection: "row" }}>
                      <RadioButton
                        value="espèces"
                        color={PRIMARY_COLOR}
                        uncheckedColor={errorModePaiement ? "red" : theme.secondaryTextColor}
                        status={modePaiement === "espèces" ? "checked" : "unchecked"}
                        onPress={() => {
                          setModePaiement("espèces");
                          setErrorModePaiement("");
                          clearCardDetails(); // Clear card details when switching to cash
                        }}
                      />

                      <Text
                        style={{
                          fontWeight: "bold",
                          alignSelf: "center",
                          color: modePaiement === "espèces"
                            ? PRIMARY_COLOR
                            : errorModePaiement
                              ? "red"
                              : theme.secondaryTextColor,
                        }}
                      >
                        Espèces
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                      <RadioButton
                        value="credit_card"
                        color={PRIMARY_COLOR}
                        uncheckedColor={errorModePaiement ? "red" : theme.secondaryTextColor}
                        status={modePaiement === "credit_card" ? "checked" : "unchecked"}
                        onPress={() => {
                          setModePaiement("credit_card");
                          setErrorModePaiement("");
                          setModalCardVisible(true); // Open card modal when selecting card payment
                        }}
                      />

                      <Text
                        style={{
                          fontWeight: "bold",
                          alignSelf: "center",
                          color: modePaiement === "credit_card"
                            ? PRIMARY_COLOR
                            : errorModePaiement
                              ? "red"
                              : theme.secondaryTextColor,
                        }}
                      >
                        Carte bancaire
                      </Text>
                    </View>
                  </View>

                  {/* Display saved card details */}
                  {modePaiement === "credit_card" && cardDetails && (
                    <View style={[styles.cardDetailsContainer, { backgroundColor: theme.cardBackground, borderColor: PRIMARY_COLOR }]}>
                      <View style={styles.cardDetailsHeader}>
                        <MaterialCommunityIcons 
                          name="credit-card" 
                          size={20} 
                          color={PRIMARY_COLOR} 
                        />
                        <Text style={[styles.cardDetailsTitle, { color: theme.textColor }]}>
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
                      <Text style={[styles.cardNumber, { color: theme.textColor }]}>
                        **** **** **** {cardDetails.number.slice(-4)}
                      </Text>
                      <Text style={[styles.cardHolder, { color: theme.secondaryTextColor }]}>
                        {cardDetails.holder}
                      </Text>
                    </View>
                  )}

                  {
                    errorModePaiement != null ? (
                      <Text style={{ color: 'red', fontSize: 12, textAlign: 'center' }}>{errorModePaiement}</Text>
                    ) : null
                  }
                </View>
                
                <View style={[styles.containerOrder, { backgroundColor: theme.backgroundColor }]}>
                  <Text style={[styles.textDorP, { color: theme.textColor }]}>
                    Détails de la Commande
                  </Text>
                  <View style={styles.subtotalContainer}>
                    <Text style={[styles.titleSbt_or_Tax, { color: theme.secondaryTextColor }]}>
                      Sous-total
                    </Text>
                    <Text style={[styles.subtotal, { color: theme.textColor }]}>
                      {total.toFixed(2)} DH
                    </Text>
                  </View>
                  {deliveryCost > 0 && (
                    <View style={styles.subtotalContainer}>
                      <Text style={[styles.titleSbt_or_Tax, { color: theme.secondaryTextColor }]}>
                        Frais de livraison
                      </Text>
                      <Text style={[styles.subtotal, { color: theme.textColor }]}>
                        {deliveryCost.toFixed(2)} DH
                      </Text>
                    </View>
                  )}
                  <View style={styles.subtotalContainer}>
                    <Text style={[styles.titleSbt_or_Tax, { color: theme.secondaryTextColor }]}>
                      TVA
                    </Text>
                    <Text style={[styles.subtotal, { color: theme.textColor }]}>
                      (20%)
                    </Text>
                  </View>
                  <View style={styles.taxContainer}>
                    <Text style={[styles.titleSbt_or_Tax, { color: theme.secondaryTextColor }]}>
                      Tax
                    </Text>
                    <Text style={[styles.subtotal, { color: theme.textColor }]}>
                      {((total + deliveryCost) / 5).toFixed(2)} DH
                    </Text>
                  </View>
                  <View style={styles.dFlex}>
                    <Text style={[styles.titleTotal, { color: theme.textColor }]}>
                      Total
                    </Text>
                    <Text style={[styles.total, { color: PRIMARY_COLOR }]}>
                      {(total + deliveryCost + (total + deliveryCost) / 5).toFixed(2)} DH
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Updated Checkout Button */}
            <View style={styles.containerCheckout}>
              <TouchableOpacity
                onPress={() => (total != 0 ? checkOut() : null)}
                style={[styles.shopButton, { backgroundColor: PRIMARY_COLOR }]}>
                <FontAwesome 
                  name="shopping-bag"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.shopButtonText}>
                  Paiement ({(total + deliveryCost + (total + deliveryCost) / 5).toFixed(2)} DH)
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )
      )}
      
      {/* Address Modal */}
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
            backgroundColor: theme.textColor,
            marginTop: 14,
          }}></View>
        </View>

        <View>
          <View style={{
            backgroundColor: theme.cardBackground,
            height: 300,
            padding: 20,
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: theme.textColor,
              textAlign: 'center',
            }}>
              Adresse de livraison
            </Text>

            <View style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 5,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderWidth: 0.5,
              borderColor: errorAdresse ? 'red' : theme.secondaryTextColor,
              marginTop: 10,
            }}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={errorAdresse ? 'red' : theme.secondaryTextColor}
              />
              <TextInput
                style={{
                  flex: 1,
                  padding: 0,
                  margin: 0,
                  marginLeft: 6,
                  color: theme.textColor,
                }}
                placeholder="Adresse"
                placeholderTextColor={errorAdresse ? 'red' : theme.secondaryTextColor}
                value={address}
                onChangeText={setAddress}
                onFocus={() => setErrorAdresse('')}
              />
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                borderRadius: 5,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 0.5,
                borderColor: errorCity ? 'red' : theme.secondaryTextColor,
                marginTop: 10,
                width: '48%',
              }}>
                <MaterialCommunityIcons
                  name="city"
                  size={20}
                  color={errorCity ? 'red' : theme.secondaryTextColor}
                />
                <TextInput
                  style={{
                    flex: 1,
                    padding: 0,
                    margin: 0,
                    marginLeft: 6,
                    color: theme.textColor,
                  }}
                  placeholder="Ville"
                  placeholderTextColor={errorCity ? 'red' : theme.secondaryTextColor}
                  value={city}
                  onChangeText={setCity}
                  onFocus={() => setErrorCity('')}
                />
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 5,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 0.5,
                borderColor: errorZipCode ? 'red' : theme.secondaryTextColor,
                marginTop: 10,
                width: '48%',
              }}>
                <TextInput
                  style={{
                    flex: 1,
                    padding: 0,
                    margin: 0,
                    marginLeft: 6,
                    width: 100,
                    color: theme.textColor,
                  }}
                  placeholder="Code postal"
                  placeholderTextColor={errorZipCode ? 'red' : theme.secondaryTextColor}
                  value={zipCode}
                  onChangeText={setZipCode}
                  onFocus={() => setErrorZipCode('')}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveAdresse}
              style={{
                backgroundColor: PRIMARY_COLOR,
                padding: 10,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16 }}>
                Sauvegarder l'adresse
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Credit Card Modal */}
      <Modal
        isVisible={modalCardVisible}
        onBackdropPress={() => setModalCardVisible(false)}
        style={styles.cardModalStyle}
        backdropOpacity={0.5}
        avoidKeyboard={true}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}
      >
        <View style={[styles.cardModalContainer, { backgroundColor: theme.cardBackground }]}>
          {/* Modal Header */}
          <View style={[styles.cardModalHeader, { borderBottomColor: theme.secondaryTextColor }]}>
            <Text style={[styles.cardModalTitle, { color: theme.textColor }]}>
              Informations de la carte
            </Text>
            <TouchableOpacity onPress={() => setModalCardVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cardModalContent} showsVerticalScrollIndicator={false}>
            {/* Card Number */}
            <View style={styles.cardInputContainer}>
              <Text style={[styles.cardInputLabel, { color: theme.textColor }]}>
                Numéro de carte
              </Text>
              <View style={[
                styles.cardInputWrapper, 
                { 
                  borderColor: errorCardNumber ? 'red' : theme.secondaryTextColor,
                  backgroundColor: theme.backgroundColor 
                }
              ]}>
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={20}
                  color={errorCardNumber ? 'red' : theme.secondaryTextColor}
                  style={styles.cardInputIcon}
                />
                <TextInput
                  style={[styles.cardTextInput, { color: theme.textColor }]}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={errorCardNumber ? 'red' : theme.secondaryTextColor}
                  value={cardNumber}
                  onChangeText={(text) => {
                    const formatted = formatCardNumber(text);
                    setCardNumber(formatted);
                    if (errorCardNumber) {
                      setErrorCardNumber('');
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={19} // 16 digits + 3 spaces
                />
              </View>
              {errorCardNumber ? (
                <Text style={styles.cardErrorText}>{errorCardNumber}</Text>
              ) : null}
            </View>

            {/* Card Holder */}
            <View style={styles.cardInputContainer}>
              <Text style={[styles.cardInputLabel, { color: theme.textColor }]}>
                Nom du titulaire
              </Text>
              <View style={[
                styles.cardInputWrapper, 
                { 
                  borderColor: errorCardHolder ? 'red' : theme.secondaryTextColor,
                  backgroundColor: theme.backgroundColor 
                }
              ]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={errorCardHolder ? 'red' : theme.secondaryTextColor}
                  style={styles.cardInputIcon}
                />
                <TextInput
                  style={[styles.cardTextInput, { color: theme.textColor }]}
                  placeholder="JOHN DOE"
                  placeholderTextColor={errorCardHolder ? 'red' : theme.secondaryTextColor}
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
              {/* Expiry Date */}
              <View style={[styles.cardInputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.cardInputLabel, { color: theme.textColor }]}>
                  Date d'expiration
                </Text>
                <View style={[
                  styles.cardInputWrapper, 
                  { 
                    borderColor: errorExpiryDate ? 'red' : theme.secondaryTextColor,
                    backgroundColor: theme.backgroundColor 
                  }
                ]}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={20}
                    color={errorExpiryDate ? 'red' : theme.secondaryTextColor}
                    style={styles.cardInputIcon}
                  />
                  <TextInput
                    style={[styles.cardTextInput, { color: theme.textColor }]}
                    placeholder="MM/AA"
                    placeholderTextColor={errorExpiryDate ? 'red' : theme.secondaryTextColor}
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

              {/* CVV */}
              <View style={[styles.cardInputContainer, { flex: 1, marginLeft: 10 }]}>
                <Text style={[styles.cardInputLabel, { color: theme.textColor }]}>
                  CVV
                </Text>
                <View style={[
                  styles.cardInputWrapper, 
                  { 
                    borderColor: errorCvv ? 'red' : theme.secondaryTextColor,
                    backgroundColor: theme.backgroundColor 
                  }
                ]}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={errorCvv ? 'red' : theme.secondaryTextColor}
                    style={styles.cardInputIcon}
                  />
                  <TextInput
                    style={[styles.cardTextInput, { color: theme.textColor }]}
                    placeholder="123"
                    placeholderTextColor={errorCvv ? 'red' : theme.secondaryTextColor}
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
              <Text style={[styles.securityText, { color: theme.secondaryTextColor }]}>
                Vos informations sont sécurisées et cryptées
              </Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.cardModalFooter}>
            <TouchableOpacity
              onPress={() => setModalCardVisible(false)}
              style={[styles.cardCancelButton, { borderColor: theme.secondaryTextColor }]}
            >
              <Text style={[styles.cardCancelButtonText, { color: theme.textColor }]}>
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
  
  // Updated Header styles
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

  // Location section styles
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  locationButton: {
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

  locationButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  locationCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },

  locationIcon: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },

  locationInfo: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  locationAddress: {
    fontSize: 12,
    lineHeight: 16,
  },

  distanceInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },

  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },

  deliveryCostText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Delivery section styles
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
    width: '80%',
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
  chevronRight: {
    fontSize: 22,
  },

  // Payment section styles
  conatinerPayement: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  textTitlePay: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 20,
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

  // Updated Checkout button styles
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
});