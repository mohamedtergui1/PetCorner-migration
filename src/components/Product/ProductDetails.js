import { 
  ActivityIndicator, 
  Animated, 
  Dimensions, 
  Image, 
  Modal,
  Platform, 
  ScrollView, 
  Share, 
  StyleSheet, 
  Text, 
  ToastAndroid, 
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  PanResponder,
  FlatList
} from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { COLOURS } from '../../database/Database';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import Token from '../../../config/TokenDolibar';
import API_BASE_URL from '../../../config/Api';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetails({ route, navigation }) {
  const { width, height } = Dimensions.get('window');
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();
  
  const { product: rawProduct } = route.params;

  // State for normalized product data
  const [product, setProduct] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inSaved, setInSaved] = useState(false);
  const [userDetails, setUserDetails] = useState();
  const [loading, setLoading] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);
  
  // Image viewing states
  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [scale, setScale] = useState(new Animated.Value(1));
  const [translateX, setTranslateX] = useState(new Animated.Value(0));
  const [translateY, setTranslateY] = useState(new Animated.Value(0));
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);

  // Function to detect data format and normalize
  const normalizeProductData = (productData) => {
    if (!productData) return null;

    // Detect format type
    const hasArrayOptions = productData.hasOwnProperty('array_options');
    const hasPhotoLink = productData.hasOwnProperty('photo_link');
    const hasImageLink = productData.hasOwnProperty('image_link');
    const hasSimplifiedFields = productData.hasOwnProperty('Marque') || 
                               productData.hasOwnProperty('tag') || 
                               productData.hasOwnProperty('Similaire') ||
                               productData.hasOwnProperty('stock');

    // Format 1: Full API format (has array_options)
    if (hasArrayOptions) {
      return {
        ...productData,
        // Ensure consistent image field
        photo_link: productData.photo_link || productData.image_link,
        image_link: productData.image_link || productData.photo_link,
        // Ensure stock_reel is available
        stock_reel: productData.stock_reel || productData.stock || '0',
        // Ensure consistent price calculation
        price: productData.price || (productData.price_ttc ? 
          (parseFloat(productData.price_ttc) / (1 + (parseFloat(productData.tva_tx || '20') / 100))).toFixed(8) : '0'),
      };
    }
    
    // Format 2 & 3: Simplified or Navigation formats
    if (hasSimplifiedFields || hasPhotoLink) {
      const normalizedProduct = {
        id: productData.id,
        label: productData.label,
        ref: productData.ref,
        description: productData.description,
        price_ttc: productData.price_ttc,
        price: productData.price || (productData.price_ttc ? 
          (parseFloat(productData.price_ttc) / (1 + (parseFloat(productData.tva_tx || '20') / 100))).toFixed(8) : '0'),
        tva_tx: productData.tva_tx || '20.000',
        barcode: productData.barcode,
        weight: productData.weight,
        stock_reel: productData.stock_reel || productData.stock || '0',
        photo_link: productData.photo_link || productData.image_link,
        image_link: productData.image_link || productData.photo_link,
        category_label: productData.category_label || 'Produit',
        
        // Create array_options from simplified fields
        array_options: {
          options_marque: productData.Marque || productData.marque || 
                         productData.array_options?.options_marque,
          options_tags: productData.tag || productData.tags || 
                       productData.array_options?.options_tags,
          options_similaire: productData.Similaire || productData.similaire || 
                            productData.array_options?.options_similaire,
          options_ecommerceng_short_description_1: productData.description ||
                                                  productData.array_options?.options_ecommerceng_short_description_1,
          
          // Handle additional custom fields
          options_option_sante: productData['Option Santé'] || productData.option_sante,
          options_gout: productData['Goût'] || productData.gout,
          options_option_nutritionnel: productData['Option Nutritionnel'] || productData.option_nutritionnel,
          options_ages: productData['Ages'] || productData.ages,
          
          // Preserve any existing array_options
          ...productData.array_options
        },
        
        // Preserve other fields that might exist
        ...Object.keys(productData).reduce((acc, key) => {
          // Don't override the fields we've already handled
          if (!['Marque', 'marque', 'tag', 'tags', 'Similaire', 'similaire', 'stock', 
                'Option Santé', 'option_sante', 'Goût', 'gout', 'Option Nutritionnel', 
                'option_nutritionnel', 'Ages', 'ages'].includes(key)) {
            acc[key] = productData[key];
          }
          return acc;
        }, {})
      };

      return normalizedProduct;
    }

    // Default: return as-is with minimal processing
    return {
      ...productData,
      stock_reel: productData.stock_reel || productData.stock || '0',
      photo_link: productData.photo_link || productData.image_link,
      image_link: productData.image_link || productData.photo_link,
      array_options: productData.array_options || {}
    };
  };

  // Function to fetch full product details if we have simplified data
  const fetchFullProductDetails = async (productId) => {
    try {
      setLoadingProductDetails(true);
      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };

      const response = await axios.get(`${API_BASE_URL}products/${productId}`, { headers });
      return response.data;
    } catch (error) {
      console.log('Error fetching full product details:', error);
      return null;
    } finally {
      setLoadingProductDetails(false);
    }
  };

  // Initialize product data
  useEffect(() => {
    const initializeProduct = async () => {
      let normalizedProduct = normalizeProductData(rawProduct);
      
      // Determine if we should try to fetch full details
      const shouldFetchFullDetails = () => {
        if (!normalizedProduct || !normalizedProduct.id) return false;
        
        // If we have array_options, we likely have full details already
        if (normalizedProduct.array_options && 
            Object.keys(normalizedProduct.array_options).length > 3) {
          return false;
        }
        
        // If we're missing key fields that are usually in full API response
        const missingFields = !normalizedProduct.multiprices || 
                             !normalizedProduct.date_creation ||
                             !normalizedProduct.entity;
        
        return missingFields;
      };
      
      if (shouldFetchFullDetails()) {
        const fullDetails = await fetchFullProductDetails(normalizedProduct.id);
        if (fullDetails) {
          // Merge full details with normalized data, prioritizing full details
          normalizedProduct = {
            ...normalizedProduct,
            ...fullDetails,
            // But keep any custom fields from normalized data that might not be in API
            array_options: {
              ...normalizedProduct.array_options,
              ...fullDetails.array_options
            }
          };
        }
      }
      
      setProduct(normalizedProduct);
      console.log('Final Normalized Product:', normalizedProduct);
    };

    initializeProduct();
  }, [rawProduct]);

  // Calculate derived values
  const formattedPrice = product?.price_ttc ? parseFloat(product.price_ttc).toFixed(2) : '0.00';
  const isAvailable = product ? (parseInt(product.stock_reel) || 0) > 0 : false;

  // Setup pan responder for image zooming and panning
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.changedTouches.length === 2) {
          const touch1 = evt.nativeEvent.changedTouches[0];
          const touch2 = evt.nativeEvent.changedTouches[1];
          
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          const newScale = Math.max(1, Math.min(lastScale * (distance / 150), 3));
          scale.setValue(newScale);
        } else if (lastScale > 1) {
          translateX.setValue(lastTranslateX + gestureState.dx);
          translateY.setValue(lastTranslateY + gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        setLastScale(scale._value);
        setLastTranslateX(translateX._value);
        setLastTranslateY(translateY._value);
        
        if (scale._value < 1.1) {
          Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          ]).start(() => {
            setLastScale(1);
            setLastTranslateX(0);
            setLastTranslateY(0);
          });
        }
      },
    })
  ).current;

  // Function to open image viewer
  const openImageViewer = () => {
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    setLastScale(1);
    setLastTranslateX(0);
    setLastTranslateY(0);
    setImageViewVisible(true);
  };

  // Function to close image viewer
  const closeImageViewer = () => {
    setImageViewVisible(false);
  };

  // Double tap handler for image
  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      if (lastScale > 1) {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start(() => {
          setLastScale(1);
          setLastTranslateX(0);
          setLastTranslateY(0);
        });
      } else {
        Animated.spring(scale, { toValue: 2, useNativeDriver: true }).start(() => {
          setLastScale(2);
        });
      }
    }
    lastTap.current = now;
  };

  // Load data on component mount
  useEffect(() => {
    if (product) {
      console.log('Main Product Image Link:', product.photo_link || product.image_link);
      loadWishlist();
      getUserData();
      loadSimilarProducts();
    }
  }, [product]);

  // Function to load similar products using IDs from response
  const loadSimilarProducts = async () => {
    if (!product) return;
    
    const similarIds = product.array_options?.options_similaire;
    
    if (!similarIds) {
      return;
    }
    
    setLoadingSimilar(true);
    try {
      const idsArray = similarIds.split(',').map(id => id.trim());
      
      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };

      // Fetch each similar product by ID
      const similarProductsData = await Promise.all(
        idsArray.map(async (id) => {
          try {
            const response = await axios.get(`${API_BASE_URL}products/${id}`, { headers });
            
            console.log(`Similar Product ${response.data.label} Image Link:`, response.data.photo_link || response.data.image_link);
            
            return response.data;
          } catch (error) {
            return null;
          }
        })
      );

      // Filter out null responses and current product
      const validSimilarProducts = similarProductsData.filter(
        (item) => item && item.id !== product.id
      );
      
      setSimilarProducts(validSimilarProducts);
    } catch (error) {
      // Error handling without logging
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Function to check if product is in wishlist
  const loadWishlist = async () => {
    if (!product) return;
    
    try {
      const getWishlist = await AsyncStorage.getItem("wishlistItem");
      const parsedWishlist = JSON.parse(getWishlist);

      if (Array.isArray(parsedWishlist) && parsedWishlist.includes(product.id)) {
        setInSaved(true);
      } else {
        setInSaved(false);
      }
    } catch (error) {
      // Error handling without logging
    }
  };

  // Function to add/remove from wishlist
  const handleAddToWishlist = async () => {
    if (!product) return;
    
    try {
      const wishlist = await AsyncStorage.getItem("wishlistItem");
      const parsedWishlist = JSON.parse(wishlist);
      
      if (parsedWishlist === null) {
        const newWishlist = [product.id];
        await AsyncStorage.setItem("wishlistItem", JSON.stringify(newWishlist));
        setInSaved(true);
        showToast('Ajouter à la liste des favoris');
      } else {
        const isExist = parsedWishlist.includes(product.id);
        
        if (isExist) {
          const newWishlist = parsedWishlist.filter((item) => item !== product.id);
          await AsyncStorage.setItem("wishlistItem", JSON.stringify(newWishlist));
          setInSaved(false);
          showToast('Retiré de la liste des favoris');
        } else {
          const newWishlist = [...parsedWishlist, product.id];
          await AsyncStorage.setItem("wishlistItem", JSON.stringify(newWishlist));
          setInSaved(true);
          showToast('Ajouter à la liste des favoris');
        }
      }
    } catch (error) {
      // Error handling without logging
    }
  };

  // Helper function for showing toast
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Toast.show(message, Toast.SHORT);
    }
  };

  // Function to add product to cart using context
  const handleAddToCart = useCallback(async () => {
    if (!product || !isAvailable || loading) return;
    
    setLoading(true);
    
    try {
      const result = await addToCart(product.id);
      
      if (result.success) {
        showToast('Article ajouté avec succès au panier');
        
        setTimeout(() => {
          setLoading(false);
          navigation.navigate('Home');
        }, 500);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      showToast('Erreur lors de l\'ajout au panier');
      setLoading(false);
    }
  }, [addToCart, product, isAvailable, loading, navigation]);

  // Function to get user data
  const getUserData = async () => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!userData || !userData.id) return;
      
      const headers = {
        'Content-Type': 'application/json',
        'DOLAPIKEY': Token
      };

      const res = await axios.get(`${API_BASE_URL}thirdparties/${userData.id}`, { headers });
      setUserDetails(res.data);
    } catch (error) {
      // Error handling without logging
    }
  };

  // Function to share product
  const handleShareProduct = () => {
    if (!product) return;
    
    Share.share({
      message: `Découvrez ${product.label} à ${formattedPrice} DH sur notre application!`,
      title: 'Partager ce produit',
    })
    .then(result => {})
    .catch(error => {});
  };

  // Function to navigate to similar product
  const handleSimilarProductPress = (similarProduct) => {
    navigation.push('ProductDetails', { product: similarProduct });
  };

  // Render similar product item
  const renderSimilarProduct = ({ item }) => {
    const similarPrice = item.price_ttc ? parseFloat(item.price_ttc).toFixed(2) : '0.00';
    const similarAvailable = (parseInt(item.stock_reel) || 0) > 0;

    return (
      <TouchableOpacity 
        style={[styles.similarProductCard, { backgroundColor: theme.cardBackground }]}
        onPress={() => handleSimilarProductPress(item)}
      >
        <Image 
          source={{ uri: item.photo_link || item.image_link || 'https://via.placeholder.com/150' }} 
          style={styles.similarProductImage}
          resizeMode="cover"
        />
        <View style={styles.similarProductInfo}>
          <Text 
            style={[styles.similarProductName, { color: theme.textColor }]} 
            numberOfLines={2}
          >
            {item.label}
          </Text>
          <Text style={[styles.similarProductPrice, { color: theme.primary }]}>
            {similarPrice} DH
          </Text>
          <View style={[
            styles.similarProductStatus, 
            { backgroundColor: similarAvailable ? theme.primary + '20' : '#f4433620' }
          ]}>
            <Text style={[
              styles.similarProductStatusText, 
              { color: similarAvailable ? theme.primary : '#f44336' }
            ]}>
              {similarAvailable ? 'En stock' : 'Rupture'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading indicator while product is being normalized/fetched
  if (!product) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textColor }]}>
          {loadingProductDetails ? 'Chargement des détails...' : 'Préparation du produit...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar 
        barStyle={theme.statusBar} 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <TouchableWithoutFeedback onPress={openImageViewer}>
          <Image 
            source={{ uri: product.photo_link || product.image_link || 'https://via.placeholder.com/400' }} 
            resizeMode='cover' 
            style={styles.productImage} 
          />
        </TouchableWithoutFeedback>
        
        {/* Image Tap Indicator */}
        <View style={styles.tapIndicatorContainer}>
          <MaterialCommunityIcons 
            name="gesture-tap" 
            size={24} 
            color="white" 
            style={styles.tapIcon} 
          />
          <Text style={styles.tapText}>Tap pour agrandir</Text>
        </View>
        
        {/* Overlay gradient for better readability of buttons */}
        <View style={styles.imageOverlay} />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={[
            styles.iconButton, 
            styles.backButton, 
            { 
              backgroundColor: theme.primary,
              top: insets.top + 10
            }
          ]} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name='arrow-back' size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Wishlist Button */}
        <TouchableOpacity 
          style={[
            styles.iconButton, 
            styles.heartButton, 
            { 
              backgroundColor: theme.primary,
              top: insets.top + 10
            }
          ]} 
          onPress={handleAddToWishlist}
        >
          <MaterialCommunityIcons 
            name={inSaved ? "heart" : "heart-outline"} 
            size={24} 
            color={inSaved ? "#e91e63" : "#ffffff"} 
          />
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity 
          style={[
            styles.iconButton, 
            styles.shareButton, 
            { 
              backgroundColor: theme.primary,
              top: insets.top + 10
            }
          ]} 
          onPress={handleShareProduct}
        >
          <Ionicons name="share-social-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Product Details */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsContainer}>
          {/* Brand and Category */}
          <View style={styles.badgeRow}>
            {product.array_options?.options_marque && (
              <View style={[styles.brandBadge, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.brandText, { color: theme.primary }]}>
                  {product.array_options.options_marque}
                </Text>
              </View>
            )}
            
            <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '20' }]}>
              <Entypo name="shopping-cart" size={16} color={theme.primary} style={styles.categoryIcon} />
              <Text style={[styles.categoryText, { color: theme.primary }]}>
                {product.category_label || 'Produit'}
              </Text>
            </View>
            
            {/* Additional Custom Fields */}
            {product.array_options?.options_option_sante && (
              <View style={[styles.customBadge, { backgroundColor: '#4CAF5020' }]}>
                <Text style={[styles.customBadgeText, { color: '#4CAF50' }]}>
                  Santé: {product.array_options.options_option_sante}
                </Text>
              </View>
            )}
            
            {product.array_options?.options_gout && (
              <View style={[styles.customBadge, { backgroundColor: '#FF980020' }]}>
                <Text style={[styles.customBadgeText, { color: '#FF9800' }]}>
                  Goût: {product.array_options.options_gout}
                </Text>
              </View>
            )}
          </View>

          {/* Product Name and Status */}
          <View style={styles.nameContainer}>
            <Text style={[styles.productName, { color: theme.textColor }]}>
              {product.label}
            </Text>
            
            {/* Product Reference */}
            {product.ref && (
              <Text style={[styles.productRef, { color: theme.secondaryTextColor }]}>
                Référence: {product.ref}
              </Text>
            )}
            
            {/* Status Badge */}
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isAvailable ? theme.primary + '20' : '#f4433620' }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: isAvailable ? theme.primary : '#f44336' }
              ]}>
                {isAvailable ? `En stock (${product.stock_reel})` : 'Rupture de stock'}
              </Text>
            </View>
          </View>

          {/* Price Section */}
          <View style={[styles.priceContainer, { borderColor: theme.border }]}>
            <View>
              <Text style={[styles.price, { color: theme.textColor }]}>
                {formattedPrice} DH
              </Text>
              {product.price && (
                <Text style={[styles.priceHT, { color: theme.secondaryTextColor }]}>
                  Prix HT: {parseFloat(product.price).toFixed(2)} DH
                </Text>
              )}
              <Text style={[styles.taxInfo, { color: theme.secondaryTextColor }]}>
                TVA ({product.tva_tx}%): {(formattedPrice * (parseFloat(product.tva_tx) / 100) / (1 + parseFloat(product.tva_tx) / 100)).toFixed(2)} DH
              </Text>
            </View>
            
            {product.weight && (
              <View style={[styles.weightBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.weightText, { color: '#ffffff' }]}>
                  {product.weight} kg
                </Text>
              </View>
            )}
          </View>

          {/* Product Specifications */}
          <View style={styles.specificationsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Spécifications
            </Text>
            
            <View style={styles.specGrid}>
              {product.barcode && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Code-barres:</Text>
                  <Text style={[styles.specValue, { color: theme.textColor }]}>{product.barcode}</Text>
                </View>
              )}
              
              {product.weight && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Poids:</Text>
                  <Text style={[styles.specValue, { color: theme.textColor }]}>{product.weight} kg</Text>
                </View>
              )}
              
              {product.cost_price && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Prix de revient:</Text>
                  <Text style={[styles.specValue, { color: theme.textColor }]}>{parseFloat(product.cost_price).toFixed(2)} DH</Text>
                </View>
              )}
              
              {product.array_options?.options_ages && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Âge:</Text>
                  <Text style={[styles.specValue, { color: theme.textColor }]}>{product.array_options.options_ages}</Text>
                </View>
              )}
              
              {product.array_options?.options_option_nutritionnel && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Option nutritionnelle:</Text>
                  <Text style={[styles.specValue, { color: theme.textColor }]}>{product.array_options.options_option_nutritionnel}</Text>
                </View>
              )}
              
              {product.ref && (
                <View style={styles.specItem}>
                  <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Référence:</Text>
                  <Text style={[styles.specValue, { color: theme.textColor }]}>{product.ref}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Description
            </Text>
            <Text 
              style={[styles.description, { color: theme.secondaryTextColor }]} 
              numberOfLines={isExpanded ? undefined : 4}
            >
              {product.description?.replace(/<[^>]*>/g, '') || 
               product.array_options?.options_ecommerceng_short_description_1?.replace(/<[^>]*>/g, '') || 
               "Aucune description disponible pour ce produit."}
            </Text>
            
            {((product.description && product.description.length > 150) || 
              (product.array_options?.options_ecommerceng_short_description_1 && 
               product.array_options.options_ecommerceng_short_description_1.length > 150)) && (
              <TouchableOpacity 
                style={[styles.showMoreButton, { borderColor: theme.border }]} 
                onPress={() => setIsExpanded(!isExpanded)}
              >
                <Text style={[styles.showMoreText, { color: theme.primary }]}>
                  {isExpanded ? 'Voir moins' : 'Voir plus'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Similar Products Section */}
          {(product.array_options?.options_similaire || similarProducts.length > 0) && (
            <View style={styles.similarProductsContainer}>
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                Produits similaires
              </Text>
              
              {loadingSimilar ? (
                <ActivityIndicator size="large" color={theme.primary} style={styles.loadingIndicator} />
              ) : similarProducts.length > 0 ? (
                <FlatList
                  data={similarProducts}
                  renderItem={renderSimilarProduct}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.similarProductsList}
                />
              ) : (
                <Text style={[styles.noSimilarText, { color: theme.secondaryTextColor }]}>
                  Aucun produit similaire trouvé
                </Text>
              )}
            </View>
          )}

        
          
          {/* Extra padding at bottom for the fixed button */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={[
        styles.bottomContainer, 
        { 
          backgroundColor: theme.backgroundColor,
          paddingBottom: Math.max(insets.bottom, 10)
        }
      ]}>
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={!isAvailable || loading}
          style={[
            styles.cartButton, 
            { 
              backgroundColor: isAvailable ? theme.primary : theme.secondaryTextColor,
              opacity: loading ? 0.7 : 1
            }
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="cart-plus" size={20} color="#ffffff" style={styles.cartIcon} />
              <Text style={[styles.cartButtonText, { color: '#ffffff' }]}>
                {isAvailable ? 'Ajouter au panier' : 'Indisponible'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.modalContainer}>
          <StatusBar backgroundColor="#000" barStyle="light-content" />
          
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={closeImageViewer}
          >
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {/* Image viewer content */}
          <TouchableWithoutFeedback onPress={handleDoubleTap}>
            <View 
              style={styles.imageViewerContainer} 
              {...panResponder.panHandlers}
            >
              <Animated.Image
                source={{ uri: product.photo_link || product.image_link || 'https://via.placeholder.com/400' }}
                style={[
                  styles.fullscreenImage,
                  {
                    transform: [
                      { scale: scale },
                      { translateX: translateX },
                      { translateY: translateY }
                    ]
                  }
                ]}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
          
          {/* Help text */}
          <View style={styles.helpTextContainer}>
            <Text style={styles.helpText}>Pincez pour zoomer • Double-tapez pour agrandir</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  tapIndicatorContainer: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tapIcon: {
    marginRight: 5,
  },
  tapText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  iconButton: {
    position: 'absolute',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  backButton: {
    left: 15,
  },
  heartButton: {
    right: 60,
  },
  shareButton: {
    right: 15,
  },
  scrollContent: {
    flexGrow: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  brandBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  nameContainer: {
    marginVertical: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  productRef: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  priceHT: {
    fontSize: 12,
    marginTop: 2,
  },
  taxInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  weightBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  weightText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  specificationsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  specGrid: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 12,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  specLabel: {
    fontSize: 14,
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  showMoreButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: '500',
  },
  similarProductsContainer: {
    marginBottom: 20,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  similarProductsList: {
    paddingVertical: 10,
  },
  similarProductCard: {
    width: 150,
    marginRight: 12,
    borderRadius: 12,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  similarProductImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarProductInfo: {
    flex: 1,
  },
  similarProductName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    minHeight: 32,
  },
  similarProductPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  similarProductStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  similarProductStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconContainer: {
    padding: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 13,
    flex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartButton: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    marginRight: 8,
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Image Viewer Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  helpTextContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noSimilarText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  helpText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});