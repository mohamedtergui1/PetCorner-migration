// ProductCard2.js - Component for displaying product data from Dolibarr API with fixed spacing
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  ToastAndroid
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ProductCard2 = ({ 
  navigation,
  product, 
  onPress, 
  viewMode = 'grid', 
  isDarkMode = false,
  colorTheme = 'blue'
}) => {
  // Safety check - return null if no product data
  if (!product || typeof product !== 'object') {
    console.warn('ProductCard2: Invalid product data received:', product);
    return null;
  }

  const hookTheme = useTheme();
  const { addToCart } = useCart();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  
  // State for cart management
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Extract product data with fallbacks - Based on actual API response
  const productName = product?.label || product?.ref || product?.name || 'Produit sans nom';
  const productBrand = product?.array_options?.options_marque || '';
  const productImage = product?.image_link || product?.image || product?.photo_link;
  
  // Price handling - Use multiprices_ttc["1"] as primary, fallback to price_ttc
  const productPrice = product?.multiprices_ttc?.["1"] || product?.price_ttc || product?.price || '0';
  const productOldPrice = (product?.multiprices_ttc?.["2"] && product?.multiprices_ttc?.["2"] !== product?.multiprices_ttc?.["1"]) 
    ? product?.multiprices_ttc?.["2"] : null;
  
  const productStock = parseInt(product?.stock_reel || 0);
  const productRef = product?.ref || product?.barcode || '';
  const remisePercent = product?.remise_percent ? parseFloat(product.remise_percent) : 0;

  const formattedPrice = productPrice ? parseFloat(productPrice).toFixed(2) : '0.00';
  const isAvailable = productStock > 0;
  const hasDiscount = remisePercent > 0;

  // Enhanced theme colors
  const cardBackground = isDarkMode ? '#1e1e1e' : '#ffffff';
  const shadowColor = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)';
  const borderColor = isDarkMode ? '#333333' : '#f0f0f0';
  const textColor = isDarkMode ? '#ffffff' : '#2d3748';
  const secondaryTextColor = isDarkMode ? '#a0aec0' : '#718096';
  const accentColor = isDarkMode ? '#2a2a2a' : '#f8f9fa';
  const primaryColor = colorTheme === 'blue' ? '#007afe' : '#fe9400';

  // Add to cart function using context
  const handleAddToCart = useCallback(async () => {
    if (!isAvailable || isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    // Button animation
    Animated.sequence([
      Animated.spring(buttonScaleAnim, {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      })
    ]).start();

    try {
      const result = await addToCart(product.id);
      
      if (result.success) {
        // Show success message
        if (Platform.OS === 'android') {
          ToastAndroid.show(`${productName} ajouté au panier!`, ToastAndroid.SHORT);
        } else if (Platform.OS === 'ios') {
          Toast.show(`${productName} ajouté au panier!`, Toast.SHORT);
        }
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Show error message
      if (Platform.OS === 'android') {
        ToastAndroid.show('Erreur lors de l\'ajout au panier', ToastAndroid.SHORT);
      } else {
        Alert.alert('Erreur', 'Erreur lors de l\'ajout au panier');
      }
    } finally {
      setIsAddingToCart(false);
    }
  }, [product.id, productName, isAvailable, isAddingToCart, addToCart]);

  // Animate on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scaleAnim]);

  // Fixed responsive calculations with proper spacing
  const getCardStyle = () => {
    if (viewMode === 'list') {
      return {
        width: screenWidth - 32, // Full width minus container padding
        height: 110, // Slightly reduced height
        marginVertical: 6,
        marginHorizontal: 0,
        flexDirection: 'row',
        padding: 12, // Reduced padding
        alignItems: 'center',
      };
    }
    
    // Grid mode - ensure proper two-column layout
    const containerPadding = 32; // 16px on each side
    const cardSpacing = 12; // Space between cards
    const availableWidth = screenWidth - containerPadding - cardSpacing;
    const cardWidth = availableWidth / 2;
    
    return {
      width: cardWidth,
      height: cardWidth * 1.4, // Increased height for better proportions
      marginVertical: 8,
      marginHorizontal: 0,
      flexDirection: 'column',
      padding: 12,
    };
  };

  const getImageStyle = () => {
    const cardStyle = getCardStyle();
    
    if (viewMode === 'list') {
      const imageSize = 80; // Slightly smaller for better proportions
      return {
        width: imageSize,
        height: imageSize,
        marginRight: 12,
        marginBottom: 0,
      };
    }
    
    // Grid mode - Reduced image height to leave more space for content
    const imageWidth = cardStyle.width - 24; // Card width minus padding
    const imageHeight = imageWidth * 0.65; // Reduced from 0.75 to 0.65 for more content space
    
    return {
      width: imageWidth,
      height: imageHeight,
      marginRight: 0,
      marginBottom: 8, // Reduced from 12 to 8
    };
  };

  const getContentStyle = () => {
    if (viewMode === 'list') {
      return {
        flex: 1,
        height: 80, // Fixed height for list content
        justifyContent: 'space-between',
        paddingVertical: 0,
      };
    }
    
    // Grid mode - Calculate remaining space more accurately
    const cardStyle = getCardStyle();
    const imageStyle = getImageStyle();
    const cardPadding = 24; // 12px top + 12px bottom
    const imagePadding = imageStyle.marginBottom;
    const remainingHeight = cardStyle.height - imageStyle.height - cardPadding - imagePadding;
    
    return {
      height: remainingHeight,
      justifyContent: 'space-between',
      minHeight: 80, // Ensure minimum content height
    };
  };

  const getStockInfo = () => {
    if (!isAvailable) return { 
      bg: isDarkMode ? '#7f1d1d' : '#fee2e2', 
      text: isDarkMode ? '#fca5a5' : '#dc2626', 
      icon: 'close-circle-outline' 
    };
    if (productStock <= 5) return { 
      bg: isDarkMode ? '#78350f' : '#fef3c7', 
      text: isDarkMode ? '#fcd34d' : '#d97706', 
      icon: 'alert-circle-outline' 
    };
    return { 
      bg: isDarkMode ? '#14532d' : '#dcfce7', 
      text: isDarkMode ? '#86efac' : '#16a34a', 
      icon: 'check-circle-outline' 
    };
  };

  const stockInfo = getStockInfo();
  const cardStyle = getCardStyle();
  const imageStyle = getImageStyle();
  const contentStyle = getContentStyle();
  
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        width: cardStyle.width,
        marginBottom: cardStyle.marginVertical,
        marginHorizontal: cardStyle.marginHorizontal,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          if (onPress) {
            onPress(product);
          } else if (navigation) {
            navigation.navigate("ProductDetails", { productId: product.id });
          }
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.cardContainer,
          {
            width: cardStyle.width,
            height: cardStyle.height,
            flexDirection: cardStyle.flexDirection,
            padding: cardStyle.padding,
            backgroundColor: cardBackground,
            borderColor: borderColor,
            shadowColor: shadowColor,
          }
        ]}
      >
        
        {/* Image Container */}
        <View style={[
          styles.imageContainer,
          {
            width: imageStyle.width,
            height: imageStyle.height,
            marginRight: imageStyle.marginRight,
            marginBottom: imageStyle.marginBottom,
            backgroundColor: accentColor,
            borderColor: borderColor,
          }
        ]}>
          
          {/* Discount Badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{remisePercent}%
              </Text>
            </View>
          )}
          
          {/* Product Image */}
          <Image
            source={productImage ? { uri: productImage } : require('../../assets/images/image_not_found.png')}
            style={styles.productImage}
            resizeMode="contain"
          />
          
          {/* Stock Indicator */}
          <View style={[styles.stockIndicator, { backgroundColor: stockInfo.bg }]}>
            <MaterialCommunityIcons 
              name={stockInfo.icon} 
              size={10} 
              color={stockInfo.text}
            />
          </View>
        </View>
        
        {/* Content Container with better spacing */}
        <View style={[
          styles.contentContainer,
          {
            height: viewMode === 'list' ? contentStyle.height : contentStyle.height,
            minHeight: viewMode === 'grid' ? contentStyle.minHeight : undefined,
            justifyContent: 'space-between', // Always space-between for proper distribution
            flex: viewMode === 'list' ? 1 : 0,
          }
        ]}>
          
          {/* Product Name Section - Fixed height allocation */}
          <View style={[styles.nameContainer, { 
            minHeight: viewMode === 'grid' ? 32 : 30,
            maxHeight: viewMode === 'list' ? 40 : undefined 
          }]}>
            <Text 
              numberOfLines={viewMode === 'grid' ? 2 : 2}
              style={[
                styles.productName, 
                { 
                  color: textColor,
                  fontSize: viewMode === 'list' ? 14 : 12, // Balanced sizes
                  lineHeight: viewMode === 'list' ? 18 : 16,
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
                    color: secondaryTextColor,
                    fontSize: viewMode === 'list' ? 11 : 10,
                  }
                ]}
              >
                {productBrand}
              </Text>
            )}
          </View>
          
          {/* Middle Section - Availability - Compact */}
          <View style={[styles.middleSection, { 
            marginVertical: viewMode === 'grid' ? 4 : 2,
            alignSelf: viewMode === 'list' ? 'flex-start' : 'flex-start'
          }]}>
            <View style={[
              styles.availabilityContainer,
              { backgroundColor: stockInfo.bg }
            ]}>
              <MaterialCommunityIcons 
                name={stockInfo.icon}
                size={viewMode === 'grid' ? 10 : 11}
                color={stockInfo.text}
                style={{ marginRight: 3 }}
              />
              <Text style={[
                styles.availabilityText,
                {
                  fontSize: viewMode === 'list' ? 10 : 9,
                  color: stockInfo.text,
                }
              ]}>
                {isAvailable ? "Disponible" : "Indisponible"} 
                {productStock > 0 && viewMode === 'list' ? ` (${productStock})` : ""}
              </Text>
            </View>
          </View>
          
          {/* Bottom Section - Price and Button */}
          <View style={[styles.bottomSection, { 
            minHeight: viewMode === 'grid' ? 24 : 28,
            alignItems: 'center'
          }]}>
            <View style={styles.priceContainer}>
              {productOldPrice && (
                <Text style={[
                  styles.oldPriceText, 
                  { 
                    color: secondaryTextColor,
                    fontSize: viewMode === 'list' ? 11 : 10,
                  }
                ]}>
                  {parseFloat(productOldPrice).toFixed(2)} DH
                </Text>
              )}
              <Text style={[
                styles.priceText, 
                { 
                  color: primaryColor,
                  fontSize: viewMode === 'list' ? 15 : 13, // Balanced sizes
                  fontWeight: '700',
                }
              ]}>
                {formattedPrice} DH
              </Text>
            </View>
            
            {/* Quick Add Button - Only in grid mode and when available */}
            {isAvailable && viewMode === 'grid' && (
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity 
                  style={[
                    styles.quickAddButton, 
                    { 
                      backgroundColor: isAddingToCart ? '#94a3b8' : primaryColor,
                      opacity: isAddingToCart ? 0.7 : 1,
                      width: 24, // Smaller for compact layout
                      height: 24,
                      borderRadius: 12,
                    }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent card navigation
                    handleAddToCart();
                  }}
                  disabled={isAddingToCart}
                  activeOpacity={0.8}
                >
                  {isAddingToCart ? (
                    <MaterialCommunityIcons 
                      name="loading" 
                      size={12} 
                      color="#ffffff"
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name="plus" 
                      size={12} 
                      color="#ffffff"
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
            
            {/* Add to Cart Button for List Mode */}
            {isAvailable && viewMode === 'list' && (
              <TouchableOpacity 
                style={[
                  styles.listAddButton, 
                  { 
                    backgroundColor: isAddingToCart ? '#94a3b8' : primaryColor,
                    opacity: isAddingToCart ? 0.7 : 1,
                  }
                ]}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent card navigation
                  handleAddToCart();
                }}
                disabled={isAddingToCart}
                activeOpacity={0.8}
              >
                {isAddingToCart ? (
                  <MaterialCommunityIcons 
                    name="loading" 
                    size={16} 
                    color="#ffffff"
                    style={{ marginRight: 6 }}
                  />
                ) : (
                  <MaterialCommunityIcons 
                    name="cart-plus" 
                    size={16} 
                    color="#ffffff"
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={styles.listAddButtonText}>
                  {isAddingToCart ? 'Ajout...' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
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
  discountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    minWidth: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  discountText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  stockIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  contentContainer: {
    // Dynamic height and justifyContent set in component
  },
  nameContainer: {
    flex: 0,
    // minHeight set dynamically in component
  },
  productName: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  productBrand: {
    fontWeight: '500',
    marginTop: 2,
    fontStyle: 'italic',
  },
  middleSection: {
    flex: 0,
    // marginVertical set dynamically
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6, // Reduced padding for compact layout
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    fontWeight: '600',
  },
  bottomSection: {
    flex: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // minHeight set dynamically
  },
  priceContainer: {
    flex: 1,
  },
  oldPriceText: {
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  priceText: {
    letterSpacing: 0.3,
  },
  quickAddButton: {
    // Size set dynamically in component
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  listAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  listAddButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProductCard2;