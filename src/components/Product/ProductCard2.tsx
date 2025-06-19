// ProductCard2.tsx - Fixed Hidden Content Under Price
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCart } from '../../context/CartContext';

const { width: screenWidth } = Dimensions.get('window');

// =====================================
// TYPES AND INTERFACES
// =====================================

interface Product {
  id: number;
  ref?: string;
  label?: string;
  name?: string;
  description?: string;
  price?: number;
  price_ttc?: number;
  price_min?: number;
  image_link?: string;
  photo_link?: string;
  date_creation?: number;
  stock_reel?: number;
  barcode?: string;
  array_options?: {
    options_marque?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ProductCard2Props {
  navigation?: any;
  product: any;
  onPress?: (product: any) => void;
  viewMode?: 'grid' | 'list';
  isDarkMode?: boolean;
  colorTheme?: 'blue' | 'orange';
}

// =====================================
// MAIN COMPONENT
// =====================================

const ProductCard2: React.FC<ProductCard2Props> = ({ 
  navigation,
  product: data,
  onPress, 
  viewMode = 'grid', 
  isDarkMode = false,
  colorTheme = 'blue',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { addToCart, getItemQuantityInCart, canAddMoreItems } = useCart();
  const [quantityInCart, setQuantityInCart] = useState(0);
  const [stockInfo, setStockInfo] = useState(null);

  // =====================================
  // DATA EXTRACTION AND VALIDATION
  // =====================================

  const productName = data?.label || data?.name || data?.ref || 'Produit sans nom';
  const productBrand = data?.array_options?.options_marque || '';
  const productImage = data?.image_link || data?.photo_link;
  const productRef = data?.ref || data?.barcode || '';
  const productStock = data?.stock_reel ? parseInt(String(data.stock_reel)) : null;
  const isAvailable = productStock !== null ? productStock > 0 : false;
  
  const productPrice = data?.price_ttc;
  const formattedPrice = productPrice ? parseFloat(String(productPrice)).toFixed(2) : null;
  
  const productDescription = data?.description || '';

  // =====================================
  // THEME COLORS
  // =====================================
  
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  
  const cardBackground = isDarkMode ? '#1e1e1e' : '#ffffff';
  const shadowColor = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)';
  const borderColor = isDarkMode ? '#333333' : '#f0f0f0';
  const textColor = isDarkMode ? '#ffffff' : '#2d3748';
  const secondaryTextColor = isDarkMode ? '#a0aec0' : '#718096';
  const accentColor = isDarkMode ? '#2a2a2a' : '#f8f9fa';
  const priceColor = PRIMARY_COLOR;

  // =====================================
  // EFFECTS
  // =====================================

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (data?.id) {
      const quantity = getItemQuantityInCart(data.id);
      setQuantityInCart(quantity);
    }
  }, [data?.id, getItemQuantityInCart]);

  useEffect(() => {
    const checkStockAvailability = async () => {
      if (data?.id) {
        try {
          const availability = await canAddMoreItems(data.id);
          setStockInfo(availability);
        } catch (error) {
          console.error('Error checking stock availability:', error);
        }
      }
    };

    checkStockAvailability();
  }, [data?.id, canAddMoreItems, quantityInCart]);

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  const getStockDisplayInfo = () => {
    if (productStock === null || productStock === undefined) {
      return { 
        bg: isDarkMode ? '#3f3f3f' : '#e5e5e5', 
        textColor: isDarkMode ? '#d4d4d4' : '#525252', 
        icon: 'help-circle-outline',
        status: 'Stock inconnu'
      };
    }
    
    if (!isAvailable || productStock <= 0) {
      if (quantityInCart > 0) {
        return { 
          bg: isDarkMode ? '#7f1d1d' : '#fee2e2', 
          textColor: isDarkMode ? '#fca5a5' : '#dc2626', 
          icon: 'cart',
          status: `${quantityInCart} au panier - Stock épuisé`
        };
      }
      return { 
        bg: isDarkMode ? '#7f1d1d' : '#fee2e2', 
        textColor: isDarkMode ? '#fca5a5' : '#dc2626', 
        icon: 'close-circle-outline',
        status: 'Stock épuisé'
      };
    }
    
    const remainingStock = Math.max(0, productStock - quantityInCart);
    
    if (quantityInCart > 0) {
      if (remainingStock <= 0) {
        return { 
          bg: isDarkMode ? '#7f1d1d' : '#fee2e2', 
          textColor: isDarkMode ? '#fca5a5' : '#dc2626', 
          icon: 'cart',
          status: `${quantityInCart} au panier - Stock épuisé`
        };
      } else if (remainingStock <= 3) {
        return { 
          bg: isDarkMode ? '#78350f' : '#fef3c7', 
          textColor: isDarkMode ? '#fcd34d' : '#d97706', 
          icon: 'cart',
          status: `${quantityInCart} au panier - ${remainingStock} restant`
        };
      } else {
        return { 
          bg: isDarkMode ? '#14532d' : '#dcfce7', 
          textColor: isDarkMode ? '#86efac' : '#16a34a', 
          icon: 'cart',
          status: `${quantityInCart} au panier - ${remainingStock} dispo`
        };
      }
    }
    
    if (productStock <= 5) {
      return { 
        bg: isDarkMode ? '#78350f' : '#fef3c7', 
        textColor: isDarkMode ? '#fcd34d' : '#d97706', 
        icon: 'alert-circle-outline',
        status: `Stock faible (${productStock})`
      };
    }
    
    return { 
      bg: isDarkMode ? '#14532d' : '#dcfce7', 
      textColor: isDarkMode ? '#86efac' : '#16a34a', 
      icon: 'check-circle-outline',
      status: `En stock (${productStock})`
    };
  };

  const stockDisplayInfo = getStockDisplayInfo();

  const getCardDimensions = () => {
    const isListMode = viewMode === 'list';
    const cardWidth = isListMode ? screenWidth - 32 : (screenWidth - 44) / 2;
    const cardHeight = isListMode ? 200 : cardWidth * 1.55; // Increased height from 180 to 200
    const imageWidth = isListMode ? 120 : cardWidth - 24;
    const imageHeight = isListMode ? 120 : (cardWidth - 24) * 0.6;
    
    return {
      cardWidth,
      cardHeight,
      imageWidth,
      imageHeight,
      isListMode,
    };
  };

  const dimensions = getCardDimensions();

  // =====================================
  // EVENT HANDLERS
  // =====================================

  const handlePress = () => {
    if (onPress) {
      onPress(data);
      return;
    }
    
    console.log('ProductCard2: Product tapped:', {
      id: data?.id,
      label: data?.label,
      price: formattedPrice
    });
  };

  const handleAddToCart = async () => {
    if (!isAvailable || isAddingToCart || !data?.id) return;

    if (stockInfo && !stockInfo.canAdd) {
      Alert.alert(
        'Stock épuisé', 
        `Vous avez déjà ${stockInfo.currentInCart} article(s) au panier. Stock disponible: ${stockInfo.availableStock}`
      );
      return;
    }

    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsAddingToCart(true);

    try {
      const result = await addToCart(data.id);
      
      if (result.success) {
        Animated.sequence([
          Animated.timing(buttonScaleAnim, {
            toValue: 1.05,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        if (result.message) {
          console.log('Cart success:', result.message);
        }
      } else {
        throw new Error(result.error || 'Erreur lors de l\'ajout au panier');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter le produit au panier');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

  const renderProductImage = () => (
    <View style={[
      styles.imageContainer,
      {
        width: dimensions.imageWidth,
        height: dimensions.imageHeight,
        marginRight: dimensions.isListMode ? 16 : 0,
        marginBottom: dimensions.isListMode ? 0 : 8,
        backgroundColor: accentColor,
        borderColor: borderColor,
      }
    ]}>
      <Image
        source={
          productImage 
            ? { uri: productImage } 
            : require('../../assets/images/image_not_found.png')
        }
        style={styles.productImage}
        resizeMode="contain"
        onError={(error) => {
          console.warn('Image loading error for product:', data.id, error);
        }}
      />
      
      <View style={[
        styles.stockIndicator, 
        { 
          backgroundColor: stockDisplayInfo.bg,
          width: dimensions.isListMode ? 20 : 18,
          height: dimensions.isListMode ? 20 : 18,
          borderRadius: dimensions.isListMode ? 10 : 9,
        }
      ]}>
        <MaterialCommunityIcons 
          name={stockDisplayInfo.icon} 
          size={dimensions.isListMode ? 14 : 10}
          color={stockDisplayInfo.textColor}
        />
      </View>
    </View>
  );

  const renderProductInfo = () => {
    if (dimensions.isListMode) {
      // List Mode Layout - Fixed to show all content
      return (
        <View style={[styles.listContentContainer]}>
          {/* Top Section: Name and Brand */}
          <View style={styles.listTopSection}>
            <Text 
              numberOfLines={2}
              style={[
                styles.productName, 
                { 
                  color: textColor,
                  fontSize: 15,
                  lineHeight: 19, // Reduced line height to save space
                  marginBottom: 3, // Reduced margin
                }
              ]}
            >
              {productName}
            </Text>
            
            {productBrand && (
              <Text 
                numberOfLines={1}
                style={[
                  styles.productBrand, 
                  { 
                    color: SECONDARY_COLOR,
                    fontSize: 12,
                    marginBottom: 8, // Reduced from 12 to 8
                  }
                ]}
              >
                {productBrand}
              </Text>
            )}
          </View>

          {/* Middle Section: Price */}
          <View style={styles.listMiddleSection}>
            {formattedPrice && (
              <Text style={[
                styles.priceText,
                {
                  color: priceColor,
                  fontSize: 17,
                  fontWeight: '700',
                  marginBottom: 6, // Reduced from 8 to 6
                  paddingVertical: 2, // Reduced from 4 to 2
                }
              ]}>
                {formattedPrice} DH
              </Text>
            )}
          </View>

          {/* Bottom Section: Stock and Cart Button - Ensured visibility */}
          <View style={styles.listBottomSection}>
            <View style={[
              styles.availabilityContainer,
              { 
                backgroundColor: stockDisplayInfo.bg,
                flex: 1,
                marginRight: 10,
                minHeight: 28, // Added minimum height to ensure visibility
              }
            ]}>
              <MaterialCommunityIcons 
                name={stockDisplayInfo.icon}
                size={11}
                color={stockDisplayInfo.textColor}
                style={{ marginRight: 4 }}
              />
              <Text 
                numberOfLines={1}
                style={[
                  styles.availabilityText,
                  {
                    fontSize: 10,
                    color: stockDisplayInfo.textColor,
                    flex: 1,
                  }
                ]}
              >
                {stockDisplayInfo.status}
              </Text>
            </View>
            
            {/* Add to Cart Button for List Mode */}
            {renderListAddToCartButton()}
          </View>
        </View>
      );
    }

    // Grid Mode Layout (unchanged)
    return (
      <View style={[
        styles.contentContainer,
        {
          flex: 0,
          justifyContent: 'space-between',
          height: dimensions.cardHeight - dimensions.imageHeight - 80,
          marginBottom: 50,
        }
      ]}>
        <View style={styles.nameContainer}>
          <Text 
            numberOfLines={2}
            style={[
              styles.productName, 
              { 
                color: textColor,
                fontSize: 13,
                lineHeight: 18,
              }
            ]}
          >
            {productName}
          </Text>
          
          {productBrand && (
            <Text 
              numberOfLines={1}
              style={[
                styles.productBrand, 
                { 
                  color: SECONDARY_COLOR,
                  fontSize: 11,
                  marginTop: 2,
                }
              ]}
            >
              {productBrand}
            </Text>
          )}
        </View>
        
        <View style={[styles.bottomContainer, { marginBottom: 8 }]}>
          {formattedPrice && (
            <View style={styles.priceContainer}>
              <Text style={[
                styles.priceText,
                {
                  color: priceColor,
                  fontSize: 14,
                  fontWeight: '700',
                  marginBottom: 4,
                }
              ]}>
                {formattedPrice} DH
              </Text>
            </View>
          )}
          
          <View style={[
            styles.availabilityContainer,
            { 
              backgroundColor: stockDisplayInfo.bg,
              alignSelf: 'flex-start',
              marginTop: 2,
            }
          ]}>
            <MaterialCommunityIcons 
              name={stockDisplayInfo.icon}
              size={11}
              color={stockDisplayInfo.textColor}
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.availabilityText,
              {
                fontSize: 10,
                color: stockDisplayInfo.textColor,
              }
            ]}>
              {stockDisplayInfo.status}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // New function for list mode add to cart button
  const renderListAddToCartButton = () => {
    const remainingStock = Math.max(0, (productStock || 0) - quantityInCart);
    const canAdd = isAvailable && remainingStock > 0;
    
    return (
      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={!canAdd || isAddingToCart}
          style={[
            styles.listAddToCartButton,
            {
              backgroundColor: canAdd ? PRIMARY_COLOR : (isDarkMode ? '#444' : '#ccc'),
              opacity: isAddingToCart ? 0.7 : 1,
              width: 36,
              height: 36,
              borderRadius: 18,
            }
          ]}
          activeOpacity={0.8}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <MaterialCommunityIcons 
              name={quantityInCart > 0 ? "cart" : "cart-plus"} 
              size={16}
              color="#ffffff" 
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderAddToCartButton = () => {
    if (dimensions.isListMode) return null; // Now handled in renderProductInfo for list mode

    const remainingStock = Math.max(0, (productStock || 0) - quantityInCart);
    const canAdd = isAvailable && remainingStock > 0;
    
    let buttonText = 'Ajouter';
    
    if (!isAvailable || (productStock !== null && productStock <= 0)) {
      buttonText = 'Stock épuisé';
    } else if (remainingStock <= 0) {
      buttonText = `Stock épuisé (${quantityInCart} au panier)`;
    } else if (quantityInCart > 0) {
      buttonText = `Ajouter (${quantityInCart} au panier)`;
    }

    return (
      <View style={styles.addToCartContainer}>
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={!canAdd || isAddingToCart}
            style={[
              styles.addToCartButton,
              {
                backgroundColor: canAdd ? PRIMARY_COLOR : (isDarkMode ? '#444' : '#ccc'),
                opacity: isAddingToCart ? 0.7 : 1,
              }
            ]}
            activeOpacity={0.8}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons 
                  name={quantityInCart > 0 ? "cart" : "cart-plus"} 
                  size={16} 
                  color="#ffffff" 
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.addToCartButtonText}>
                  {buttonText}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // =====================================
  // MAIN RENDER
  // =====================================

  if (!data || !data.id) {
    console.warn('ProductCard2: Invalid product data', data);
    return null;
  }

  return (
    <Animated.View style={{ 
      opacity: fadeAnim, 
      width: dimensions.cardWidth, 
      marginBottom: dimensions.isListMode ? 8 : 12 
    }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          styles.cardContainer,
          {
            width: dimensions.cardWidth,
            height: dimensions.cardHeight,
            flexDirection: dimensions.isListMode ? 'row' : 'column',
            padding: 12,
            backgroundColor: cardBackground,
            borderColor: borderColor,
            shadowColor: shadowColor,
          }
        ]}
      >
        {renderProductImage()}
        {renderProductInfo()}
        {renderAddToCartButton()}
      </TouchableOpacity>
    </Animated.View>
  );
};

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  stockIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  productImage: {
    width: '85%',
    height: '85%',
  },
  contentContainer: {
    // Grid mode content container
  },
  // Fixed styles for list mode to ensure all content is visible
  listContentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 6, // Reduced from 8 to 6
    paddingHorizontal: 4,
    minHeight: 160, // Added minimum height to ensure content fits
  },
  listTopSection: {
    flex: 3, // Increased from 2 to 3 for more space
    justifyContent: 'flex-start',
    paddingBottom: 4,
    minHeight: 60, // Added minimum height
  },
  listMiddleSection: {
    flex: 2, // Increased from 1 to 2
    justifyContent: 'center',
    paddingVertical: 4, // Reduced from 8 to 4
    minHeight: 40, // Added minimum height
  },
  listBottomSection: {
    flex: 2, // Increased from 1 to 2
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    minHeight: 40, // Added minimum height to ensure visibility
  },
  listAddToCartButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  productName: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  productBrand: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productRef: {
    opacity: 0.8,
    fontWeight: '500',
  },
  bottomContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  priceContainer: {
    // Price container
  },
  priceText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addToCartContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addToCartButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default ProductCard2;