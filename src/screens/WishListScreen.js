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
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-simple-toast';
import Token from '../../config/TokenDolibar';
import API_BASE_URL from '../../config/Api';
import {COLOURS} from '../database/Database';
import { useTheme } from '../context/ThemeContext';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function WishListScreen({navigation}) {
  const { theme, isDarkMode, colorTheme } = useTheme();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [total, setTotal] = useState(0);
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
    const unsubscribe = navigation.addListener('focus', getDataFromDB);
    return unsubscribe;
  }, [navigation]);

  const getDataFromDB = useCallback(async () => {
    setIsEmpty(false);
    try {
      const items = JSON.parse(await AsyncStorage.getItem('wishlistItem')) || [];

      if (items.length === 0) {
        setIsEmpty(true);
        setIsLoading(false);
        return;
      }
      
      const itemIds = items.join(',');

      const response = await axios.get(API_BASE_URL + 'categories/byid', {
        headers: {
          'Content-Type': 'application/json',
          DOLAPIKEY: Token,
        },
        params: {
          sqlfilters: itemIds,
        },
      });
      const products = response.data.products;
      setProducts(products);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load wishlist items:', error);
      setIsLoading(false);
    }
  }, []);

  const removeItemFromCart = async id => {
    const itemArray = JSON.parse(await AsyncStorage.getItem('wishlistItem')) || [];
    const updatedArray = itemArray.filter(item => item != id);
    await AsyncStorage.setItem('wishlistItem', JSON.stringify(updatedArray));
    getDataFromDB();
  };

  const moveItemToCart = async id => {
    try {
      const wishlistItems = JSON.parse(await AsyncStorage.getItem('wishlistItem')) || [];
      
      // Remove the item from wishlist
      const updatedWishlist = wishlistItems.filter(item => item !== id);
      await AsyncStorage.setItem('wishlistItem', JSON.stringify(updatedWishlist));
  
      // Add the item to cart
      const cartItems = JSON.parse(await AsyncStorage.getItem('cartItems')) || [];
      if (!cartItems.includes(id)) {
        cartItems.push(id);
        await AsyncStorage.setItem('cartItems', JSON.stringify(cartItems));
      }
  
      if (Platform.OS === 'android') {
        ToastAndroid.show('Produit ajouté au panier!', ToastAndroid.SHORT);
      } else {
        Toast.show('Produit ajouté au panier!', Toast.SHORT);
      }
      
      getDataFromDB();
    } catch (error) {
      console.error('Failed to move item to cart:', error);
    }
  }

  const renderProducts = ({
    id,
    label,
    price_ttc,
    photo_link,
    description,
    stock,
  }, index) => {
    const quantity = quantities[id] || 1;
    const data = {
      id,
      label,
      price_ttc,
      photo_link,
      description,
      stock,
    };
    
    return (
      <Animatable.View 
        key={id} 
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
          onPress={() => navigation.navigate('ProductDetails', {product: data})}
          style={[styles.imageContainer, { backgroundColor: isDarkMode ? '#252525' : '#f5f5f5' }]}>
          {photo_link ? (
            <Image 
              source={{uri: photo_link}} 
              style={styles.productImage} 
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Feather name="image" size={24} color={TEXT_COLOR_SECONDARY} />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={[styles.productTitle, { color: TEXT_COLOR }]} numberOfLines={2}>
              {label}
            </Text>
            <TouchableOpacity
              onPress={() => removeItemFromCart(id)}
              style={[styles.removeButton, { backgroundColor: 'rgba(244,67,54,0.9)' }]}>
              <Feather
                name="trash-2"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: PRIMARY_COLOR }]}>
              {(parseFloat(price_ttc) || 0).toFixed(2)} DH
            </Text>
            <Text style={[styles.originalPrice, { color: TEXT_COLOR_SECONDARY }]}>
              (~{(price_ttc * quantity + price_ttc / 20).toFixed(2)} DH)
            </Text>
          </View>
          
          {stock && stock > 0 ? (
            <View style={[styles.stockContainer, { backgroundColor: 'rgba(76,175,80,0.1)', borderColor: '#4caf50' }]}>
              <Feather name="check-circle" size={12} color="#4caf50" style={styles.stockIcon} />
              <Text style={[styles.inStock, { color: '#4caf50' }]}>
                En stock
              </Text>
            </View>
          ) : (
            <View style={[styles.stockContainer, { backgroundColor: 'rgba(244,67,54,0.1)', borderColor: '#f44336' }]}>
              <Feather name="x-circle" size={12} color="#f44336" style={styles.stockIcon} />
              <Text style={[styles.outOfStock, { color: '#f44336' }]}>
                Rupture de stock
              </Text>
            </View>
          )}

          <TouchableOpacity 
            activeOpacity={0.8} 
            style={[styles.addToCartButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={() => moveItemToCart(id)}
          >
            <Feather
              name="shopping-cart"
              size={16}
              color="#FFFFFF"
              style={styles.cartIcon}
            />
            <Text style={styles.addToCartText}>
              Ajouter au panier
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
          <Feather 
            name="arrow-left" 
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
            <Feather 
              name="heart" 
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
            <Feather name="shopping-bag" size={18} color="#fff" style={{ marginRight: 8 }} />
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
              <Feather 
                name="heart" 
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
                {products.length} {products.length > 1 ? 'produits' : 'produit'}
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
    marginTop: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
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