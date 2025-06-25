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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductService, { Product } from '../../service/CustomProductApiService';

// =====================================
// TYPES AND INTERFACES
// =====================================

interface ProductDetailsProps {
  route: {
    params: {
      productId: string | number;
      product?: Product;
    };
  };
  navigation: any;
}

interface UserDetails {
  id: string;
  name?: string;
  email?: string;
}

interface ExtendedOptions {
  health_option_id?: string;
  game_id?: string;
  age_id?: string;
  taste_id?: string;
  nutritional_option_id?: string;
  brand_id?: string;
  category_ids?: number[];
}

interface EnhancedProduct extends Product {
  extended_options?: ExtendedOptions;
}

// Updated mapping objects based on your data structure
const HEALTH_OPTIONS: { [key: string]: string } = {
  '1': 'Stérilisés',
  '2': 'Allergies',
  '3': 'Vessies',
  '4': 'Croissances',
  '5': 'Vieillissements',
  '6': 'Respirations',
  '7': 'Poils et peaux',
  '8': 'Digestifs',
  '9': 'Surpoids',
  '10': 'Sensibles',
  '11': 'Allaitantes ou gestantes',
  '12': 'Immunités',
  '13': 'Dentaires'
};

const AGE_OPTIONS: { [key: string]: string } = {
  '1': 'Adulte',
  '2': 'Senior',
  '3': 'Junior',
  '4': 'Première âge',
  '5': 'Chatons',
  '6': 'Chiots'
};

const TASTE_OPTIONS: { [key: string]: string } = {
  '1': 'Bœuf',
  '2': 'Poulet',
  '3': 'Canard',
  '4': 'Poisson',
  '5': 'Agneau',
  '6': 'Autre'
};

const NUTRITIONAL_OPTIONS: { [key: string]: string } = {
  '1': 'Sans céréales',
  '2': 'Ingrédient limité',
  '3': 'Bio',
  '4': 'Sans OGM',
  '5': 'Sans gluten',
  '6': 'Sans sucre',
  '7': 'Végétarien',
  '8': 'Riche en protéines',
  '9': 'Équilibré'
};

const GAME_OPTIONS: { [key: string]: string } = {
  '1': 'Premium Line',
  '2': 'Classic Line',
  '3': 'Veterinary Line',
  '4': 'Natural Line'
};

// Updated brand mapping - you'll need to get the complete list from your API
const BRAND_OPTIONS: { [key: string]: string } = {
  'MANITOBA': 'Manitoba',
  'SANTA': 'Santa',
  '1': 'Royal Canin',
  '2': 'Hill\'s',
  '3': 'Purina',
  '4': 'Whiskas',
  '5': 'Pedigree',
  '6': 'Manitoba',
  '7': 'Santa'
};

const CATEGORY_NAMES: { [key: number]: string } = {
  1: 'Général',
  2: 'Chien',
  3: 'Chat',
  4: 'Gamme Gold', // Based on your data showing "gamme": "4"
  8: 'Tranche d\'âge adulte', // Based on "trancheage": "8,9"
  9: 'Tranche d\'âge senior',
  20: 'Oiseau',
  21: 'Poisson',
  31: 'Reptile',
  184: 'Lapin'
};

// Functionality mapping based on your data
const FUNCTIONALITY_OPTIONS: { [key: string]: string } = {
  '1': 'Nutrition complète',
  '2': 'Supplément nutritionnel',
  '3': 'Friandise saine'
};

// =====================================
// MAIN COMPONENT
// =====================================

export default function ProductDetails({ route, navigation }: ProductDetailsProps) {
  const { width, height } = Dimensions.get('window');
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  
  // Get product ID from route params
  const { productId } = route.params;

  // State management
  const [product, setProduct] = useState<EnhancedProduct | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<UserDetails | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState<boolean>(false);
  const [loadingProduct, setLoadingProduct] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Image viewing states
  const [imageViewVisible, setImageViewVisible] = useState<boolean>(false);
  const [scale, setScale] = useState<Animated.Value>(new Animated.Value(1));
  const [translateX, setTranslateX] = useState<Animated.Value>(new Animated.Value(0));
  const [translateY, setTranslateY] = useState<Animated.Value>(new Animated.Value(0));
  const [lastScale, setLastScale] = useState<number>(1);
  const [lastTranslateX, setLastTranslateX] = useState<number>(0);
  const [lastTranslateY, setLastTranslateY] = useState<number>(0);

  // =====================================
  // HELPER FUNCTIONS FOR PRODUCT DATA
  // =====================================

  const formatPrice = (product: EnhancedProduct | null): string => {
    if (!product) return '0,00 DH';
    
    const price = parseFloat(String(product.price_ttc || product.price || 0));
    return `${price.toFixed(2).replace('.', ',')} DH`;
  };

  const getPriceHT = (product: EnhancedProduct | null): string => {
    if (!product) return '0,00 DH';
    
    const priceHT = parseFloat(String(product.price || 0));
    return `${priceHT.toFixed(2).replace('.', ',')} DH`;
  };

  const getTaxAmount = (product: EnhancedProduct | null): string => {
    if (!product) return '0,00 DH';
    
    const priceTTC = parseFloat(String(product.price_ttc || 0));
    const priceHT = parseFloat(String(product.price || 0));
    const taxAmount = priceTTC - priceHT;
    
    return `${taxAmount.toFixed(2).replace('.', ',')} DH`;
  };

  // Enhanced functions using both extended_options and array_options
  const getBrand = (product: EnhancedProduct | null): string | null => {
    if (!product) return null;
    
    // First try extended_options
    if (product.extended_options?.brand_id) {
      return BRAND_OPTIONS[product.extended_options.brand_id] || product.extended_options.brand_id;
    }
    
    // Then try array_options
    if (product.array_options?.options_marque) {
      const brandKey = product.array_options.options_marque;
      return BRAND_OPTIONS[brandKey] || brandKey;
    }
    
    return null;
  };

  const getHealthOption = (product: EnhancedProduct | null): string | null => {
    if (!product?.extended_options?.health_option_id) return null;
    return HEALTH_OPTIONS[product.extended_options.health_option_id] || product.extended_options.health_option_id;
  };

  const getAge = (product: EnhancedProduct | null): string | null => {
    if (!product?.extended_options?.age_id) return null;
    return AGE_OPTIONS[product.extended_options.age_id] || product.extended_options.age_id;
  };

  const getTaste = (product: EnhancedProduct | null): string | null => {
    if (!product?.extended_options?.taste_id) return null;
    return TASTE_OPTIONS[product.extended_options.taste_id] || product.extended_options.taste_id;
  };

  const getNutritionalOption = (product: EnhancedProduct | null): string | null => {
    if (!product?.extended_options?.nutritional_option_id) return null;
    return NUTRITIONAL_OPTIONS[product.extended_options.nutritional_option_id] || product.extended_options.nutritional_option_id;
  };

  const getGame = (product: EnhancedProduct | null): string | null => {
    if (!product) return null;
    
    // Try extended_options first
    if (product.extended_options?.game_id) {
      return GAME_OPTIONS[product.extended_options.game_id] || product.extended_options.game_id;
    }
    
    // Try array_options gamme field
    if (product.array_options?.options_gamme) {
      const gameKey = product.array_options.options_gamme;
      return GAME_OPTIONS[gameKey] || `Gamme ${gameKey}`;
    }
    
    return null;
  };

  const getCategories = (product: EnhancedProduct | null): string[] => {
    if (!product) return [];
    
    const categories: string[] = [];
    
    // From extended_options
    if (product.extended_options?.category_ids) {
      const extendedCategories = product.extended_options.category_ids.map(id => 
        CATEGORY_NAMES[id] || `Catégorie ${id}`
      );
      categories.push(...extendedCategories);
    }
    
    // From array_options gamme
    if (product.array_options?.options_gamme) {
      const gammeId = parseInt(product.array_options.options_gamme);
      if (CATEGORY_NAMES[gammeId]) {
        categories.push(CATEGORY_NAMES[gammeId]);
      }
    }
    
    // From array_options trancheage (age ranges)
    if (product.array_options?.options_trancheage) {
      const trancheIds = product.array_options.options_trancheage.split(',').map(id => parseInt(id.trim()));
      trancheIds.forEach(id => {
        if (CATEGORY_NAMES[id]) {
          categories.push(CATEGORY_NAMES[id]);
        }
      });
    }
    
    return [...new Set(categories)]; // Remove duplicates
  };

  const getFunctionalities = (product: EnhancedProduct | null): string[] => {
    if (!product?.array_options?.options_ftfonctionnalites) return [];
    
    const functionalityIds = product.array_options.options_ftfonctionnalites.split(',').map(id => id.trim());
    return functionalityIds.map(id => FUNCTIONALITY_OPTIONS[id] || `Fonctionnalité ${id}`);
  };

  const getTags = (product: EnhancedProduct | null): string[] => {
    if (!product?.array_options?.options_tags) return [];
    
    return product.array_options.options_tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  const getFormattedWeight = (product: EnhancedProduct | null): string | null => {
    if (!product?.weight) return null;
    const weight = parseFloat(String(product.weight));
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)} kg`;
    } else {
      return `${weight} g`;
    }
  };

  const isProductInStock = (product: EnhancedProduct | null): boolean => {
    if (!product) return false;
    return parseInt(String(product.stock_reel || 0)) > 0;
  };

  const getStockStatusText = (product: EnhancedProduct | null): string => {
    if (!product) return 'Indisponible';
    
    const stock = parseInt(String(product.stock_reel || 0));
    if (stock > 0) {
      return stock > 5 ? 'En stock' : `Stock limité (${stock})`;
    }
    return 'Rupture de stock';
  };

  const getProductImageUrl = (product: EnhancedProduct | null): string | null => {
    if (!product) return null;
    
    // Try multiple image URL sources
    if (product.image_link) return product.image_link;
    if (product.photo_link) return product.photo_link;
    
    return null;
  };

  // =====================================
  // API FUNCTIONS
  // =====================================

  // Function to load product data using enhanced endpoint
  const loadProductData = async (id: string | number): Promise<void> => {
    if (!id) {
      setError('ID produit manquant');
      setLoadingProduct(false);
      return;
    }

    try {
      setLoadingProduct(true);
      setError(null);
      
      console.log('Loading enhanced product with ID:', id);
      
      // Use the enhanced endpoint to get all product data including extended_options
      const productData = await ProductService.getEnhancedProduct(id, {
        includestockdata: 1,
        includesubproducts: false,
        includeparentid: false,
        includetrans: false,
        includeextendedoptions: true
      });
      
      console.log('Loaded enhanced product data:', productData);
      console.log('Extended options:', productData.extended_options);
      console.log('Array options:', productData.array_options);
      
      if (productData) {
        setProduct(productData as EnhancedProduct);
        
        // Load similar products if available
        if (productData.array_options?.options_similaire) {
          // Parse similar product IDs from string
          const similarIds = String(productData.array_options.options_similaire)
            .split(',')
            .map(id => id.trim())
            .filter(id => id && id !== String(productData.id));
          
          if (similarIds.length > 0) {
            loadSimilarProducts(similarIds);
          }
        }
      } else {
        setError('Produit non trouvé');
      }
      
    } catch (error: any) {
      console.error('Error loading enhanced product:', error);
      setError(error.message || 'Erreur lors du chargement du produit');
    } finally {
      setLoadingProduct(false);
    }
  };

  // Function to load similar products
  const loadSimilarProducts = async (similarIds: string[]): Promise<void> => {
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
      const similarProductsData = Array.isArray(similarProductsResponse) 
        ? similarProductsResponse 
        : similarProductsResponse.data || [];
      
      // Filter out current product if present
      const filteredSimilar = similarProductsData.filter(
        (item: Product) => item && String(item.id) !== String(productId)
      );
      
      setSimilarProducts(filteredSimilar);
      
    } catch (error: any) {
      console.error('Error loading similar products:', error);
      // Don't show error for similar products, just log it
    } finally {
      setLoadingSimilar(false);
    }
  };

  // =====================================
  // EFFECTS
  // =====================================

  // Load product data on component mount
  useEffect(() => {
    if (productId) {
      loadProductData(productId);
      getUserData();
    } else {
      setError('ID produit manquant');
      setLoadingProduct(false);
    }
  }, [productId]);

  // Calculate derived values
  const isAvailable = product ? isProductInStock(product) : false;
  const isInFavorites = product ? isFavorite(String(product.id)) : false;

  // =====================================
  // EVENT HANDLERS
  // =====================================

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
        setLastScale((scale as any)._value);
        setLastTranslateX((translateX as any)._value);
        setLastTranslateY((translateY as any)._value);
        
        if ((scale as any)._value < 1.1) {
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
  const openImageViewer = (): void => {
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    setLastScale(1);
    setLastTranslateX(0);
    setLastTranslateY(0);
    setImageViewVisible(true);
  };

  // Function to close image viewer
  const closeImageViewer = (): void => {
    setImageViewVisible(false);
  };

  // Double tap handler for image
  const lastTap = useRef<number>(0);
  const handleDoubleTap = (): void => {
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

  // Function to add/remove from favorites using context
  const handleAddToFavorites = (): void => {
    if (!product) return;
    
    toggleFavorite(String(product.id));
    
    const message = isInFavorites ? 'Retiré de la liste des favoris' : 'Ajouté à la liste des favoris';
    showToast(message);
  };

  // Helper function for showing toast
  const showToast = (message: string): void => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Toast.show(message, Toast.SHORT);
    }
  };

  // Function to add product to cart using context
  const handleAddToCart = useCallback(async (): Promise<void> => {
    if (!product || !isAvailable || loading) return;
    
    setLoading(true);
    
    try {
      const result = await addToCart(product.id);
      
      if (result.success) {
        showToast('Article ajouté avec succès au panier');
        
        setTimeout(() => {
          setLoading(false);
          navigation.navigate('CartScreen');
        }, 500);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error: any) {
      showToast('Erreur lors de l\'ajout au panier');
      setLoading(false);
    }
  }, [addToCart, product, isAvailable, loading, navigation]);

  // Function to get user data
  const getUserData = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData && parsedUserData.id) {
          setUserDetails(parsedUserData);
        }
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
  };

  // Function to share product
  const handleShareProduct = (): void => {
    if (!product) return;
    
    const formattedPrice = formatPrice(product);
    
    Share.share({
      message: `Découvrez ${product.label} à ${formattedPrice} sur notre application!`,
      title: 'Partager ce produit',
    })
    .then(result => {})
    .catch(error => {});
  };

  // Function to navigate to similar product
  const handleSimilarProductPress = (similarProduct: Product): void => {
    // Use push instead of reset to maintain navigation stack
    navigation.push('ProductDetails', { productId: similarProduct.id });
  };

  // Function to retry loading product
  const retryLoadProduct = (): void => {
    if (productId) {
      loadProductData(productId);
    }
  };

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

  // Render similar product item
  const renderSimilarProduct = ({ item }: { item: Product }) => {
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

  

  // Render enhanced badges section
  const renderEnhancedBadges = () => {
    if (!product) return null;

    const brand = getBrand(product);
    const healthOption = getHealthOption(product);
    const age = getAge(product);
    const taste = getTaste(product);
    const nutritionalOption = getNutritionalOption(product);
    const game = getGame(product);
    const categories = getCategories(product);

    return (
      <View style={styles.badgeRow}>
        {brand && (
          <View style={[styles.brandBadge, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="business" size={14} color={theme.primary} style={styles.badgeIcon} />
            <Text style={[styles.brandText, { color: theme.primary }]}>
              {brand}
            </Text>
          </View>
        )}

        {categories.map((category, index) => (
          <View key={index} style={[styles.categoryBadge, { backgroundColor: theme.primary + '20' }]}>
            <Entypo name="tag" size={14} color={theme.primary} style={styles.badgeIcon} />
            <Text style={[styles.categoryText, { color: theme.primary }]}>
              {category}
            </Text>
          </View>
        ))}

        {healthOption && (
          <View style={[styles.customBadge, { backgroundColor: '#4CAF5020' }]}>
            <Ionicons name="medical" size={14} color="#4CAF50" style={styles.badgeIcon} />
            <Text style={[styles.customBadgeText, { color: '#4CAF50' }]}>
              Santé: {healthOption}
            </Text>
          </View>
        )}

        {age && (
          <View style={[styles.customBadge, { backgroundColor: '#2196F320' }]}>
            <Ionicons name="time" size={14} color="#2196F3" style={styles.badgeIcon} />
            <Text style={[styles.customBadgeText, { color: '#2196F3' }]}>
              Âge: {age}
            </Text>
          </View>
        )}

        {taste && (
          <View style={[styles.customBadge, { backgroundColor: '#FF980020' }]}>
            <Ionicons name="restaurant" size={14} color="#FF9800" style={styles.badgeIcon} />
            <Text style={[styles.customBadgeText, { color: '#FF9800' }]}>
              Goût: {taste}
            </Text>
          </View>
        )}

        {nutritionalOption && (
          <View style={[styles.customBadge, { backgroundColor: '#9C27B020' }]}>
            <Ionicons name="leaf" size={14} color="#9C27B0" style={styles.badgeIcon} />
            <Text style={[styles.customBadgeText, { color: '#9C27B0' }]}>
              {nutritionalOption}
            </Text>
          </View>
        )}

        {game && (
          <View style={[styles.customBadge, { backgroundColor: '#00BCD420' }]}>
            <Ionicons name="star" size={14} color="#00BCD4" style={styles.badgeIcon} />
            <Text style={[styles.customBadgeText, { color: '#00BCD4' }]}>
              Gamme: {game}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Enhanced specifications render
  const renderEnhancedSpecifications = () => {
    if (!product) return null;

    const brand = getBrand(product);
    const healthOption = getHealthOption(product);
    const age = getAge(product);
    const taste = getTaste(product);
    const nutritionalOption = getNutritionalOption(product);
    const game = getGame(product);

    return (
      <View style={styles.specificationsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
          Spécifications détaillées
        </Text>
        
        <View style={[styles.specGrid, { backgroundColor: theme.cardBackground }]}>
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

          {brand && (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Marque:</Text>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{brand}</Text>
            </View>
          )}

          {age && (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Tranche d'âge:</Text>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{age}</Text>
            </View>
          )}

          {taste && (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Goût:</Text>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{taste}</Text>
            </View>
          )}

          {healthOption && (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Option santé:</Text>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{healthOption}</Text>
            </View>
          )}

          {nutritionalOption && (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Option nutritionnelle:</Text>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{nutritionalOption}</Text>
            </View>
          )}

          {game && (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Gamme produit:</Text>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{game}</Text>
            </View>
          )}
          
          {product.ref && (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Référence:</Text>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{product.ref}</Text>
            </View>
          )}

          {product.stock_reel !== undefined && (
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Stock:</Text>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{product.stock_reel} unités</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // =====================================
  // MAIN RENDER
  // =====================================

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
        
        {/* Back Button */}
        <TouchableOpacity 
          style={[
            styles.iconButton, 
            styles.backButton, 
            { 
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
              top: insets.top + 10
            }
          ]} 
          onPress={handleAddToFavorites}
        >
          <MaterialCommunityIcons 
            name={isInFavorites ? "heart" : "heart-outline"} 
            size={24} 
            color={isInFavorites ? "#e91e63" : "#ffffff"} 
          />
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity 
          style={[
            styles.iconButton, 
            styles.shareButton, 
            { 
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
          {/* Enhanced Badges with all product data */}
          {renderEnhancedBadges()}

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
                TVA ({product.tva_tx || 20}%): {getTaxAmount(product)}
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

          {/* Enhanced Product Specifications */}
          {renderEnhancedSpecifications()}

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
                  keyExtractor={(item) => String(item.id)}
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

// =====================================
// ENHANCED STYLES
// =====================================

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
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
  badgeIcon: {
    marginRight: 6,
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
    marginBottom: 12,
  },
  specGrid: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  specLabel: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
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