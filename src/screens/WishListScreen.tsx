import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import React, {useCallback, useEffect, useState} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-simple-toast';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import ProductService, { Product } from '../service/CustomProductApiService';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function WishListScreen({navigation}) {
  const { theme, isDarkMode, colorTheme } = useTheme();
  const { favoriteIds, removeFromFavorites, favoriteCount } = useFavorites();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  // Define theme colors (matching OrderScreen)
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  
  // Dark mode colors
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadFavoriteProducts);
    return unsubscribe;
  }, [navigation, favoriteIds]);

  // Load products when favoriteIds change
  useEffect(() => {
    loadFavoriteProducts();
  }, [favoriteIds]);

  const loadFavoriteProducts = useCallback(async () => {
    setIsLoading(true);
    setIsEmpty(false);
    
    try {
      if (favoriteIds.length === 0) {
        setIsEmpty(true);
        setProducts([]);
        setIsLoading(false);
        return;
      }

      console.log('Loading favorite products with IDs:', favoriteIds);
      
      // Fetch products using ProductService
      const response = await ProductService.getMultipleProducts(favoriteIds, {
        includestockdata: 1,
        pagination_data: false
      });
      
      // Handle both paginated and non-paginated responses
      const productsData = 'data' in response ? response.data : response;
      
      console.log('Loaded favorite products:', productsData);
      setProducts(productsData);
      
    } catch (error) {
      console.error('Failed to load favorite products:', error);
      showToast('Erreur lors du chargement des favoris');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [favoriteIds]);

  const removeItemFromFavorites = (productId: string) => {
    removeFromFavorites(productId);
    showToast('Produit retiré des favoris');
  };

  const moveItemToCart = async (productId: string) => {
    try {
      // Add to cart using context
      const result = await addToCart(productId);
      
      if (result.success) {
        // Remove from favorites
        removeFromFavorites(productId);
        showToast('Produit ajouté au panier et retiré des favoris!');
      } else {
        throw new Error(result.error || 'Erreur lors de l\'ajout au panier');
      }
      
    } catch (error) {
      console.error('Failed to move item to cart:', error);
      showToast('Erreur lors de l\'ajout au panier');
    }
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Toast.show(message, Toast.SHORT);
    }
  };

  const formatPrice = (product: Product) => {
    const price = parseFloat(product.price_ttc || product.price || '0');
    return `${price.toFixed(2).replace('.', ',')} DH`;
  };

  const getProductImageUrl = (product: Product) => {
    return product.image_link || product.photo_link || null;
  };

  const isProductInStock = (product: Product) => {
    return parseInt(product.stock_reel || '0') > 0;
  };

  const getStockStatusText = (product: Product) => {
    const stock = parseInt(product.stock_reel || '0');
    if (stock > 0) {
      return stock > 5 ? 'En stock' : `Stock limité (${stock})`;
    }
    return 'Rupture de stock';
  };

  const renderProducts = (product: Product, index: number) => {
    const imageUrl = getProductImageUrl(product);
    const isInStock = isProductInStock(product);
    
    return (
      <Animatable.View 
        key={product.id} 
        style={[styles.productCard, { 
          backgroundColor: CARD_BACKGROUND,
          borderColor: BORDER_COLOR,
        }]}
        animation="fadeIn"
        duration={500}
        delay={index * 100}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
          style={[styles.imageContainer, { backgroundColor: isDarkMode ? '#252525' : '#f5f5f5' }]}>
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.productImage} 
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={24} color={TEXT_COLOR_SECONDARY} />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={[styles.productTitle, { color: TEXT_COLOR }]} numberOfLines={2}>
              {product.label}
            </Text>
            <TouchableOpacity
              onPress={() => removeItemFromFavorites(product.id.toString())}
              style={[styles.removeButton, { backgroundColor: 'rgba(244,67,54,0.9)' }]}>
              <Ionicons
                name="trash-outline"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: PRIMARY_COLOR }]}>
              {formatPrice(product)}
            </Text>
            {product.ref && (
              <Text style={[styles.productRef, { color: TEXT_COLOR_SECONDARY }]}>
                Réf: {product.ref}
              </Text>
            )}
          </View>
          
          {isInStock ? (
            <View style={[styles.stockContainer, { backgroundColor: 'rgba(76,175,80,0.1)', borderColor: '#4caf50' }]}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#4caf50" style={styles.stockIcon} />
              <Text style={[styles.inStock, { color: '#4caf50' }]}>
                {getStockStatusText(product)}
              </Text>
            </View>
          ) : (
            <View style={[styles.stockContainer, { backgroundColor: 'rgba(244,67,54,0.1)', borderColor: '#f44336' }]}>
              <Ionicons name="close-circle-outline" size={12} color="#f44336" style={styles.stockIcon} />
              <Text style={[styles.outOfStock, { color: '#f44336' }]}>
                {getStockStatusText(product)}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[
              styles.addToCartButton, 
              { 
                backgroundColor: isInStock ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY,
                opacity: isInStock ? 1 : 0.6 
              }
            ]}
            onPress={() => moveItemToCart(product.id.toString())}
            disabled={!isInStock}
          >
            <Ionicons
              name="cart-outline"
              size={16}
              color="#FFFFFF"
              style={styles.cartIcon}
            />
            <Text style={styles.addToCartText}>
              {isInStock ? 'Ajouter au panier' : 'Indisponible'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'} 
      />
      
      {/* Updated Header with standardized back button */}
      <View style={[styles.headerContainer, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        <View style={{ width: 40 }}></View>
      </View>
      
      {/* Content */}
      {isEmpty ? (
        <View style={styles.centerContent}>
          <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' }]}>
            <Ionicons 
              name="heart-outline" 
              size={60} 
              color={PRIMARY_COLOR} 
            />
          </View>
          <Text style={[styles.emptyTitle, { color: TEXT_COLOR }]}>
            Liste de favoris vide
          </Text>
          <Text style={[styles.emptySubtitle, { color: TEXT_COLOR_SECONDARY }]}>
            Vous n'avez pas encore ajouté d'articles à vos favoris
          </Text>
          <TouchableOpacity 
            style={[styles.shopButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Ionicons name="bag-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.shopButtonText}>
              Commencer vos achats
            </Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.messageText, { color: TEXT_COLOR_SECONDARY }]}>
            Chargement de vos favoris...
          </Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Ionicons 
                name="heart-outline" 
                size={20} 
                color={PRIMARY_COLOR} 
                style={styles.titleIcon}
              />
              <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
                Mes Produits Favoris
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: PRIMARY_COLOR + '15' }]}>
              <Text style={[styles.productCount, { color: PRIMARY_COLOR }]}>
                {favoriteCount} {favoriteCount > 1 ? 'produits' : 'produit'}
              </Text>
            </View>
          </View>
          
          <View style={styles.productsList}>
            {products.map((item, index) => renderProducts(item, index))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  messageText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 22,
  },
  shopButton: {
    marginTop: 32,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  productCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  productsList: {
    paddingHorizontal: 16,
  },
  productCard: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    width: '85%',
    lineHeight: 22,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  productRef: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  stockIcon: {
    marginRight: 4,
  },
  inStock: {
    fontSize: 12,
    fontWeight: '500',
  },
  outOfStock: {
    fontSize: 12,
    fontWeight: '500',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 18,
    marginTop: 12,
  },
  cartIcon: {
    marginRight: 6,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});