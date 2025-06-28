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
 
const CATEGORY_NAMES: { [key: number]: string } = {
  1: 'Général',
  2: 'Chien',
  3: 'Chat',
  4: 'Gamme Gold',
  8: 'Tranche d\'âge adulte',
  9: 'Tranche d\'âge senior',
  20: 'Oiseau',
  21: 'Poisson',
  31: 'Reptile',
  184: 'Lapin'
};

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

  const getBrand = (product: EnhancedProduct | null): string | null => {
    if (!product) return null;
    if (product.extended_options?.brand_id) {
      return product.extended_options.brand_id || product.extended_options.brand_id;
    }
    if (product.array_options?.options_marque) {
      const brandKey = product.array_options.options_marque;
      return  brandKey;
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
    if (product.extended_options?.game_id) {
      return GAME_OPTIONS[product.extended_options.game_id] || product.extended_options.game_id;
    }
    if (product.array_options?.options_gamme) {
      const gameKey = product.array_options.options_gamme;
      return GAME_OPTIONS[gameKey] || `Gamme ${gameKey}`;
    }
    return null;
  };

  const getCategories = (product: EnhancedProduct | null): string[] => {
    if (!product) return [];
    const categories: string[] = [];
    
    if (product.extended_options?.category_ids) {
      const extendedCategories = product.extended_options.category_ids.map(id => 
        CATEGORY_NAMES[id] || `Catégorie ${id}`
      );
      categories.push(...extendedCategories);
    }
    
    if (product.array_options?.options_gamme) {
      const gammeId = parseInt(product.array_options.options_gamme);
      if (CATEGORY_NAMES[gammeId]) {
        categories.push(CATEGORY_NAMES[gammeId]);
      }
    }
    
    if (product.array_options?.options_trancheage) {
      const trancheIds = product.array_options.options_trancheage.split(',').map(id => parseInt(id.trim()));
      trancheIds.forEach(id => {
        if (CATEGORY_NAMES[id]) {
          categories.push(CATEGORY_NAMES[id]);
        }
      });
    }
    
    return [...new Set(categories)];
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
    if (product.image_link) return product.image_link;
    if (product.photo_link) return product.photo_link;
    return null;
  };

  // =====================================
  // API FUNCTIONS
  // =====================================

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
      
      const productData = await ProductService.getEnhancedProduct(id, {
        includestockdata: 1,
        includesubproducts: false,
        includeparentid: false,
        includetrans: false,
        includeextendedoptions: true
      });

      console.log('Loaded enhanced product data:', productData);

      if (productData) {
        setProduct(productData as EnhancedProduct);
        
        if (productData.array_options?.options_similaire) {
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

  const loadSimilarProducts = async (similarIds: string[]): Promise<void> => {
    if (!similarIds || similarIds.length === 0) return;

    try {
      setLoadingSimilar(true);
      console.log('Loading similar products with IDs:', similarIds);
      
      const similarProductsResponse = await ProductService.getMultipleProducts(similarIds, {
        includestockdata: 0,
        pagination_data: false
      });

      const similarProductsData = Array.isArray(similarProductsResponse) 
        ? similarProductsResponse 
        : similarProductsResponse.data || [];

      const filteredSimilar = similarProductsData.filter(
        (item: Product) => item && String(item.id) !== String(productId)
      );

      setSimilarProducts(filteredSimilar);
    } catch (error: any) {
      console.error('Error loading similar products:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // =====================================
  // EFFECTS
  // =====================================

  useEffect(() => {
    if (productId) {
      loadProductData(productId);
      getUserData();
    } else {
      setError('ID produit manquant');
      setLoadingProduct(false);
    }
  }, [productId]);

  const isAvailable = product ? isProductInStock(product) : false;
  const isInFavorites = product ? isFavorite(String(product.id)) : false;

  // =====================================
  // EVENT HANDLERS
  // =====================================

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

  const openImageViewer = (): void => {
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    setLastScale(1);
    setLastTranslateX(0);
    setLastTranslateY(0);
    setImageViewVisible(true);
  };

  const closeImageViewer = (): void => {
    setImageViewVisible(false);
  };

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

  const handleAddToFavorites = (): void => {
    if (!product) return;
    toggleFavorite(String(product.id));
    const message = isInFavorites ? 'Retiré de la liste des favoris' : 'Ajouté à la liste des favoris';
    showToast(message);
  };

  const showToast = (message: string): void => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Toast.show(message, Toast.SHORT);
    }
  };

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

  const handleSimilarProductPress = (similarProduct: Product): void => {
    navigation.push('ProductDetails', { productId: similarProduct.id });
  };

  const retryLoadProduct = (): void => {
    if (productId) {
      loadProductData(productId);
    }
  };

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

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
      <View style={styles.badgeContainer}>
        {brand && (
          <View style={[styles.badge, styles.brandBadge, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="business-outline" size={16} color={theme.primary} style={styles.badgeIcon} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              {brand}
            </Text>
          </View>
        )}
        
        {categories.map((category, index) => (
          <View key={index} style={[styles.badge, styles.categoryBadge, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="pricetag-outline" size={16} color={theme.primary} style={styles.badgeIcon} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              {category}
            </Text>
          </View>
        ))}
        
        {healthOption && (
          <View style={[styles.badge, styles.healthBadge, { backgroundColor: '#4CAF5015' }]}>
            <Ionicons name="medical-outline" size={16} color="#4CAF50" style={styles.badgeIcon} />
            <Text style={[styles.badgeText, { color: '#4CAF50' }]}>
              Santé: {healthOption}
            </Text>
          </View>
        )}
        
        {age && (
          <View style={[styles.badge, styles.ageBadge, { backgroundColor: '#2196F315' }]}>
            <Ionicons name="time-outline" size={16} color="#2196F3" style={styles.badgeIcon} />
            <Text style={[styles.badgeText, { color: '#2196F3' }]}>
              Âge: {age}
            </Text>
          </View>
        )}
        
        {taste && (
          <View style={[styles.badge, styles.tasteBadge, { backgroundColor: '#FF980015' }]}>
            <Ionicons name="restaurant-outline" size={16} color="#FF9800" style={styles.badgeIcon} />
            <Text style={[styles.badgeText, { color: '#FF9800' }]}>
              Goût: {taste}
            </Text>
          </View>
        )}
        
        {nutritionalOption && (
          <View style={[styles.badge, styles.nutritionalBadge, { backgroundColor: '#9C27B015' }]}>
            <Ionicons name="leaf-outline" size={16} color="#9C27B0" style={styles.badgeIcon} />
            <Text style={[styles.badgeText, { color: '#9C27B0' }]}>
              {nutritionalOption}
            </Text>
          </View>
        )}
        
        {game && (
          <View style={[styles.badge, styles.gameBadge, { backgroundColor: '#00BCD415' }]}>
            <Ionicons name="star-outline" size={16} color="#00BCD4" style={styles.badgeIcon} />
            <Text style={[styles.badgeText, { color: '#00BCD4' }]}>
              Gamme: {game}
            </Text>
          </View>
        )}
      </View>
    );
  };

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
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            Spécifications détaillées
          </Text>
        </View>
        
        <View style={[styles.specGrid, { backgroundColor: theme.cardBackground }]}>
          {product.barcode && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="barcode-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Code-barres:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{product.barcode}</Text>
            </View>
          )}
          
          {product.weight && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="scale-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Poids:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{getFormattedWeight(product)}</Text>
            </View>
          )}
          
          {brand && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="business-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Marque:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{brand}</Text>
            </View>
          )}
          
          {age && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="time-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Tranche d'âge:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{age}</Text>
            </View>
          )}
          
          {taste && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="restaurant-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Goût:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{taste}</Text>
            </View>
          )}
          
          {healthOption && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="medical-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Option santé:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{healthOption}</Text>
            </View>
          )}
          
          {nutritionalOption && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="leaf-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Option nutritionnelle:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{nutritionalOption}</Text>
            </View>
          )}
          
          {game && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="star-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Gamme produit:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{game}</Text>
            </View>
          )}
          
          {product.ref && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Référence:</Text>
              </View>
              <Text style={[styles.specValue, { color: theme.textColor }]}>{product.ref}</Text>
            </View>
          )}
          
          {product.stock_reel !== undefined && (
            <View style={styles.specItem}>
              <View style={styles.specLabelContainer}>
                <Ionicons name="cube-outline" size={18} color={theme.primary} />
                <Text style={[styles.specLabel, { color: theme.secondaryTextColor }]}>Stock:</Text>
              </View>
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

  if (loadingProduct) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar 
          barStyle={theme.statusBar} 
          backgroundColor="transparent" 
          translucent={true}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>
            Chargement du produit...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: theme.backgroundColor }]}>
        <StatusBar 
          barStyle={theme.statusBar} 
          backgroundColor="transparent" 
          translucent={true}
        />
        
        <TouchableOpacity 
          style={[
            styles.iconButton, 
            styles.backButton, 
            { top: insets.top + 10 }
          ]} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name='arrow-back' size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.primary} />
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
            <Ionicons name="refresh-outline" size={20} color="#ffffff" style={styles.retryIcon} />
            <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>
              Réessayer
            </Text>
          </TouchableOpacity>
        </View>
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
          />
        </TouchableWithoutFeedback>

        {/* Image Tap Indicator */}
        <View style={styles.tapIndicatorContainer}>
          <Ionicons name="expand-outline" size={20} color="white" style={styles.tapIcon} />
          <Text style={styles.tapText}>Tap pour agrandir</Text>
        </View>

        {/* Header Buttons */}
        <View style={[styles.headerButtons, { top: insets.top + 10 }]}>
          <TouchableOpacity 
            style={[styles.iconButton, styles.backButton]} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name='arrow-back' size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.rightButtons}>
            <TouchableOpacity 
              style={[styles.iconButton, styles.heartButton]} 
              onPress={handleAddToFavorites}
            >
              <Ionicons 
                name={isInFavorites ? "heart" : "heart-outline"} 
                size={24} 
                color={isInFavorites ? "#e91e63" : "#ffffff"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, styles.shareButton]} 
              onPress={handleShareProduct}
            >
              <Ionicons name="share-social-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Product Details */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailsContainer}>
          {/* Enhanced Badges */}
          {renderEnhancedBadges()}

          {/* Product Name and Status */}
          <View style={styles.nameContainer}>
            <Text style={[styles.productName, { color: theme.textColor }]}>
              {product.label}
            </Text>
            
            {product.ref && (
              <View style={styles.refContainer}>
                <Ionicons name="document-text-outline" size={16} color={theme.secondaryTextColor} />
                <Text style={[styles.productRef, { color: theme.secondaryTextColor }]}>
                  Référence: {product.ref}
                </Text>
              </View>
            )}

            <View style={[
              styles.statusBadge, 
              { backgroundColor: isAvailable ? theme.primary + '20' : '#f4433620' }
            ]}>
              <Ionicons 
                name={isAvailable ? "checkmark-circle-outline" : "close-circle-outline"} 
                size={16} 
                color={isAvailable ? theme.primary : '#f44336'} 
              />
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
            <View style={styles.priceInfo}>
              <View style={styles.mainPriceContainer}>
                <Ionicons name="pricetag" size={24} color={theme.primary} />
                <Text style={[styles.price, { color: theme.textColor }]}>
                  {formatPrice(product)}
                </Text>
              </View>
              
              <View style={styles.priceDetails}>
                <View style={styles.priceDetailItem}>
                  <Ionicons name="calculator-outline" size={16} color={theme.secondaryTextColor} />
                  <Text style={[styles.priceHT, { color: theme.secondaryTextColor }]}>
                    Prix HT: {getPriceHT(product)}
                  </Text>
                </View>
                
                <View style={styles.priceDetailItem}>
                  <Ionicons name="receipt-outline" size={16} color={theme.secondaryTextColor} />
                  <Text style={[styles.taxInfo, { color: theme.secondaryTextColor }]}>
                    TVA ({product.tva_tx || 20}%): {getTaxAmount(product)}
                  </Text>
                </View>
              </View>
            </View>

            {getFormattedWeight(product) && (
              <View style={[styles.weightBadge, { backgroundColor: theme.primary }]}>
                <Ionicons name="scale-outline" size={16} color="#ffffff" />
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
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                Description
              </Text>
            </View>
            
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
                <Ionicons 
                  name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                  size={16} 
                  color={theme.primary} 
                />
                <Text style={[styles.showMoreText, { color: theme.primary }]}>
                  {isExpanded ? 'Voir moins' : 'Voir plus'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Similar Products Section */}
          {similarProducts.length > 0 && (
            <View style={styles.similarProductsContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="grid-outline" size={24} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                  Produits similaires
                </Text>
              </View>
              
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

          <View style={{ height: 100 }} />
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
              <Ionicons 
                name={isAvailable ? "cart-outline" : "ban-outline"} 
                size={22} 
                color="#ffffff" 
                style={styles.cartIcon} 
              />
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
          
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={closeImageViewer}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

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
                />
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>

          <View style={styles.helpTextContainer}>
            <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
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
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryIcon: {
    marginRight: 8,
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  tapIndicatorContainer: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tapIcon: {
    marginRight: 6,
  },
  tapText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  headerButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    zIndex: 10,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backButton: {
    // Individual styling if needed
  },
  heartButton: {
    marginRight: 10,
  },
  shareButton: {
    // Individual styling if needed
  },
  scrollContent: {
    flexGrow: 1,
  },
  detailsContainer: {
    padding: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  brandBadge: {
    // Specific styling for brand badge
  },
  categoryBadge: {
    // Specific styling for category badge
  },
  healthBadge: {
    // Specific styling for health badge
  },
  ageBadge: {
    // Specific styling for age badge
  },
  tasteBadge: {
    // Specific styling for taste badge
  },
  nutritionalBadge: {
    // Specific styling for nutritional badge
  },
  gameBadge: {
    // Specific styling for game badge
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgeIcon: {
    marginRight: 6,
  },
  nameContainer: {
    marginVertical: 15,
  },
  productName: {
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
    lineHeight: 32,
  },
  refContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productRef: {
    fontSize: 14,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  priceInfo: {
    flex: 1,
  },
  mainPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  priceDetails: {
    marginLeft: 32,
  },
  priceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceHT: {
    fontSize: 13,
    marginLeft: 6,
  },
  taxInfo: {
    fontSize: 13,
    marginLeft: 6,
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  weightText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  specificationsContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 10,
  },
  specGrid: {
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  specLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  specLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  specValue: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  descriptionContainer: {
    marginBottom: 25,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'justify',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  similarProductsContainer: {
    marginBottom: 25,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  similarProductsList: {
    paddingVertical: 10,
  },
  similarProductCard: {
    width: 160,
    marginRight: 15,
    borderRadius: 15,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  similarProductImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    marginBottom: 10,
  },
  similarProductInfo: {
    flex: 1,
  },
  similarProductName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    minHeight: 36,
    lineHeight: 18,
  },
  similarProductPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  similarProductStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  similarProductStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cartButton: {
    height: 55,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cartIcon: {
    marginRight: 10,
  },
  cartButtonText: {
    fontSize: 17,
    fontWeight: '700',
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
    top: 50,
    right: 20,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 25,
    padding: 12,
  },
  helpTextContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  helpText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginLeft: 6,
  },
});