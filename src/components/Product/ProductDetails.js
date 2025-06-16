import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
  FlatList,
  Image
} from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { COLOURS } from '../../database/Database';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductService from '../../service/CustomProductApiService';

export default function ProductDetails({ route, navigation }) {
  const { width, height } = Dimensions.get('window');
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();
  
  // Get product ID from route params - simplified approach
  const { productId } = route.params;

  // State management
  const [product, setProduct] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inSaved, setInSaved] = useState(false);
  const [userDetails, setUserDetails] = useState();
  const [loading, setLoading] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState(null);
  
  // Image viewing states
  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [scale, setScale] = useState(new Animated.Value(1));
  const [translateX, setTranslateX] = useState(new Animated.Value(0));
  const [translateY, setTranslateY] = useState(new Animated.Value(0));
  const [lastScale, setLastScale] = useState(1);
  const [lastTranslateX, setLastTranslateX] = useState(0);
  const [lastTranslateY, setLastTranslateY] = useState(0);

  // Helper functions for product data
  const formatPrice = (product) => {
    if (!product) return '0,00 DH';
    
    const price = parseFloat(product.price_ttc || product.price || 0);
    return `${price.toFixed(2).replace('.', ',')} DH`;
  };

  const getPriceHT = (product) => {
    if (!product) return '0,00 DH';
    
    const priceHT = parseFloat(product.price || 0);
    return `${priceHT.toFixed(2).replace('.', ',')} DH`;
  };

  const getTaxAmount = (product) => {
    if (!product) return '0,00 DH';
    
    const priceTTC = parseFloat(product.price_ttc || 0);
    const priceHT = parseFloat(product.price || 0);
    const taxAmount = priceTTC - priceHT;
    
    return `${taxAmount.toFixed(2).replace('.', ',')} DH`;
  };

  const getBrand = (product) => {
    return product?.array_options?.options_marque || null;
  };

  const getFormattedWeight = (product) => {
    if (!product?.weight) return null;
    const weight = parseFloat(product.weight);
    if (weight >= 1) {
      return `${weight} kg`;
    } else {
      return `${(weight * 1000).toFixed(0)} g`;
    }
  };

  const isProductInStock = (product) => {
    if (!product) return false;
    return parseInt(product.stock_reel || 0) > 0;
  };

  const getStockStatusText = (product) => {
    if (!product) return 'Indisponible';
    
    const stock = parseInt(product.stock_reel || 0);
    if (stock > 0) {
      return stock > 5 ? 'En stock' : `Stock limité (${stock})`;
    }
    return 'Rupture de stock';
  };

  const getProductImageUrl = (product) => {
    if (!product) return null;
    
    // Try multiple image URL sources
    if (product.image_link) return product.image_link;
    if (product.photo_link) return product.photo_link;
    
    // Fallback image URL construction
    if (product.id && product.ref) {
      return `https://ipos.ma/fide/documents/produit/${Math.floor(product.id/1000)}/${Math.floor(product.id/100)}/${product.id}/photos/${product.ref}.jpg`;
    }
    
    return null;
  };

  // Function to load product data using ProductService.getProductById
  const loadProductData = async (id) => {
    if (!id) {
      setError('ID produit manquant');
      setLoadingProduct(false);
      return;
    }

    try {
      setLoadingProduct(true);
      setError(null);
      
      console.log('Loading product with ID:', id);
      
      // Load product using ProductService.getProductById with stock data
      const productData = await ProductService.getProductById(id, {
        includestockdata: 1,
        includesubproducts: false,
        includeparentid: false,
        includetrans: false
      });
      
      console.log('Loaded product data:', productData);
      
      if (productData) {
        setProduct(productData);
        
        // Load similar products if available
        if (productData.array_options?.options_similaire) {
          // Parse similar product IDs from string
          const similarIds = productData.array_options.options_similaire
            .split(',')
            .map(id => id.trim())
            .filter(id => id && id !== productData.id.toString());
          
          if (similarIds.length > 0) {
            loadSimilarProducts(similarIds);
          }
        }
      } else {
        setError('Produit non trouvé');
      }
      
    } catch (error) {
      console.error('Error loading product:', error);
      setError(error.message || 'Erreur lors du chargement du produit');
    } finally {
      setLoadingProduct(false);
    }
  };

  // Function to load similar products
  const loadSimilarProducts = async (similarIds) => {
    if (!similarIds || similarIds.length === 0) return;
    
    try {
      setLoadingSimilar(true);
      
      console.log('Loading similar products with IDs:', similarIds);
      
      // Load similar products using ProductService.getMultipleProducts
      const similarProductsResponse = await ProductService.getMultipleProducts(similarIds, {
        includestockdata: 0,
        pagination_data: false
      });
      
      console.log('Loaded similar products:', similarProductsResponse);
      
      // Handle both paginated and non-paginated responses
      const similarProductsData = similarProductsResponse.data || similarProductsResponse;
      
      // Filter out current product if present
      const filteredSimilar = similarProductsData.filter(
        item => item && item.id.toString() !== productId.toString()
      );
      
      setSimilarProducts(filteredSimilar);
      
    } catch (error) {
      console.error('Error loading similar products:', error);
      // Don't show error for similar products, just log it
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Load product data on component mount
  useEffect(() => {
    if (productId) {
      loadProductData(productId);
      loadWishlist();
      getUserData();
    } else {
      setError('ID produit manquant');
      setLoadingProduct(false);
    }
  }, [productId]);

  // Calculate derived values
  const isAvailable = product ? isProductInStock(product) : false;

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

  // Function to check if product is in wishlist
  const loadWishlist = async () => {
    if (!productId) return;
    
    try {
      const getWishlist = await AsyncStorage.getItem("wishlistItem");
      const parsedWishlist = JSON.parse(getWishlist);

      if (Array.isArray(parsedWishlist) && parsedWishlist.includes(parseInt(productId))) {
        setInSaved(true);
      } else {
        setInSaved(false);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  // Function to add/remove from wishlist
  const handleAddToWishlist = async () => {
    if (!product) return;
    
    try {
      const wishlist = await AsyncStorage.getItem("wishlistItem");
      const parsedWishlist = JSON.parse(wishlist);
      
      if (parsedWishlist === null) {
        const newWishlist = [parseInt(product.id)];
        await AsyncStorage.setItem("wishlistItem", JSON.stringify(newWishlist));
        setInSaved(true);
        showToast('Ajouter à la liste des favoris');
      } else {
        const isExist = parsedWishlist.includes(parseInt(product.id));
        
        if (isExist) {
          const newWishlist = parsedWishlist.filter((item) => item !== parseInt(product.id));
          await AsyncStorage.setItem("wishlistItem", JSON.stringify(newWishlist));
          setInSaved(false);
          showToast('Retiré de la liste des favoris');
        } else {
          const newWishlist = [...parsedWishlist, parseInt(product.id)];
          await AsyncStorage.setItem("wishlistItem", JSON.stringify(newWishlist));
          setInSaved(true);
          showToast('Ajouter à la liste des favoris');
        }
      }
    } catch (error) {
      console.error('Error handling wishlist:', error);
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
      if (userData && userData.id) {
        setUserDetails(userData);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
  };

  // Function to share product
  const handleShareProduct = () => {
    if (!product) return;
    
    const formattedPrice = formatPrice(product);
    
    Share.share({
      message: `Découvrez ${product.label} à ${formattedPrice} sur notre application!`,
      title: 'Partager ce produit',
    })
    .then(result => {})
    .catch(error => {});
  };

  // Function to navigate to similar product - FIXED VERSION
  const handleSimilarProductPress = (similarProduct) => {
    // Use push instead of reset to maintain navigation stack
    navigation.push('ProductDetails', { productId: similarProduct.id });
  };

  // Function to retry loading product
  const retryLoadProduct = () => {
    if (productId) {
      loadProductData(productId);
    }
  };

  // Render similar product item
  const renderSimilarProduct = ({ item }) => {
    const similarAvailable = isProductInStock(item);
    const imageUrl = getProductImageUrl(item);

    return (
      <TouchableOpacity 
        style={[styles.similarProductCard, { backgroundColor: theme.cardBackground }]}
        onPress={() => handleSimilarProductPress(item)}
      >
        <Image 
          source={{ uri: imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.similarProductImage}
          resizeMode="cover"
          onError={(error) => {
            if (__DEV__) {
              console.log('Similar product image error:', error?.nativeEvent?.error);
              console.log('Product ID:', item.id);
            }
          }}
        />
        <View style={styles.similarProductInfo}>
          <Text 
            style={[styles.similarProductName, { color: theme.textColor }]} 
            numberOfLines={2}
          >
            {item.label}
          </Text>
          <Text style={[styles.similarProductPrice, { color: theme.primary }]}>
            {formatPrice(item)}
          </Text>
          <View style={[
            styles.similarProductStatus, 
            { backgroundColor: similarAvailable ? theme.primary + '20' : '#f4433620' }
          ]}>
            <Text style={[
              styles.similarProductStatusText, 
              { color: similarAvailable ? theme.primary : '#f44336' }
            ]}>
              {getStockStatusText(item)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading indicator while product is being loaded
  if (loadingProduct) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar 
          barStyle={theme.statusBar} 
          backgroundColor="transparent" 
          translucent={true}
        />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textColor }]}>
          Chargement du produit...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error || !product) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar 
          barStyle={theme.statusBar} 
          backgroundColor="transparent" 
          translucent={true}
        />
        
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
           <Ionicons name='arrow-back' size={24} color="#ffffff" />
        </TouchableOpacity>

        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.primary} />
        <Text style={[styles.errorTitle, { color: theme.textColor }]}>
          Produit non disponible
        </Text>
        <Text style={[styles.errorMessage, { color: theme.secondaryTextColor }]}>
          {error || 'Impossible de charger les détails du produit'}
        </Text>
        
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.primary }]} 
          onPress={retryLoadProduct}
        >
          <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>
            Réessayer
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = getProductImageUrl(product);

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
            source={{ uri: imageUrl || 'https://via.placeholder.com/400x320' }}
            style={styles.productImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('Main product image error:', error?.nativeEvent?.error);
            }}
            onLoadEnd={() => {
              console.log('Main product image loaded successfully');
            }}
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
          <Ionicons name='arrow-back' size={24} color="#ffffff" />
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
            {getBrand(product) && (
              <View style={[styles.brandBadge, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.brandText, { color: theme.primary }]}>
                  {getBrand(product)}
                </Text>
              </View>
            )}
            
            <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '20' }]}>
              <Entypo name="shopping-cart" size={16} color={theme.primary} style={styles.categoryIcon} />
              <Text style={[styles.categoryText, { color: theme.primary }]}>
                Produit
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
                {getStockStatusText(product)}
              </Text>
            </View>
          </View>

          {/* Price Section */}
          <View style={[styles.priceContainer, { borderColor: theme.border }]}>
            <View>
              <Text style={[styles.price, { color: theme.textColor }]}>
                {formatPrice(product)}
              </Text>
              <Text style={[styles.priceHT, { color: theme.secondaryTextColor }]}>
                Prix HT: {getPriceHT(product)}
              </Text>
              <Text style={[styles.taxInfo, { color: theme.secondaryTextColor }]}>
                TVA ({product.tva_tx}%): {getTaxAmount(product)}
              </Text>
            </View>
            
            {getFormattedWeight(product) && (
              <View style={[styles.weightBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.weightText, { color: '#ffffff' }]}>
                  {getFormattedWeight(product)}
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
                  <Text style={[styles.specValue, { color: theme.textColor }]}>{getFormattedWeight(product)}</Text>
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
          {similarProducts.length > 0 && (
            <View style={styles.similarProductsContainer}>
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                Produits similaires
              </Text>
              
              {loadingSimilar ? (
                <ActivityIndicator size="large" color={theme.primary} style={styles.loadingIndicator} />
              ) : (
                <FlatList
                  data={similarProducts}
                  renderItem={renderSimilarProduct}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.similarProductsList}
                />
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
              <Animated.View
                style={[
                  styles.fullscreenImageContainer,
                  {
                    transform: [
                      { scale: scale },
                      { translateX: translateX },
                      { translateY: translateY }
                    ]
                  }
                ]}
              >
                <Image 
                  source={{ uri: imageUrl || 'https://via.placeholder.com/400x400' }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                  onError={(error) => {
                    console.log('Modal image error:', error?.nativeEvent?.error);
                  }}
                />
              </Animated.View>
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    flexWrap: 'wrap',
  },
  brandBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
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
    marginRight: 8,
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  customBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  customBadgeText: {
    fontSize: 12,
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
  fullscreenImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
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
  helpText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});