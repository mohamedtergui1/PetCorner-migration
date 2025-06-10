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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { COLOURS } from '../../database/Database';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-simple-toast';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext'; // Import cart context

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProductCard({navigation, data, theme: propTheme, layoutMode = 'grid'}) {
  const hookTheme = useTheme();
  const theme = propTheme || hookTheme.theme;
  const isDarkMode = hookTheme.isDarkMode;
  
  // Use cart context
  const { addToCart } = useCart();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  
  // State for cart management
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const formattedPrice = data.price_ttc ? parseFloat(data.price_ttc).toFixed(2) : '0.00';
  const isAvailable = data.stock > 0;
  const hasDiscount = data.isOff && data.offPercentage;

  // Enhanced theme colors
  const cardBackground = isDarkMode ? '#1e1e1e' : '#ffffff';
  const shadowColor = isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)';
  const borderColor = isDarkMode ? '#333333' : '#f0f0f0';
  const textColor = isDarkMode ? '#ffffff' : '#2d3748';
  const secondaryTextColor = isDarkMode ? '#a0aec0' : '#718096';
  const accentColor = isDarkMode ? '#2a2a2a' : '#f8f9fa';
  const primaryColor = '#007afe';

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
      const result = await addToCart(data.id);
      
      if (result.success) {
        // Show success message
        if (Platform.OS === 'android') {
          ToastAndroid.show(`${data.label} ajouté au panier!`, ToastAndroid.SHORT);
        } else if (Platform.OS === 'ios') {
          Toast.show(`${data.label} ajouté au panier!`, Toast.SHORT);
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
  }, [data.id, data.label, isAvailable, isAddingToCart, addToCart]);

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

  // Fixed responsive calculations
  const getCardStyle = () => {
    if (layoutMode === 'list') {
      return {
        width: screenWidth - 32, // Full width minus container padding
        height: 120,
        marginVertical: 8,
        marginHorizontal: 0,
        flexDirection: 'row',
        padding: 16,
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
      height: cardWidth * 1.35, // Proper aspect ratio
      marginVertical: 8,
      marginHorizontal: 0,
      flexDirection: 'column',
      padding: 12,
    };
  };

  const getImageStyle = () => {
    const cardStyle = getCardStyle();
    
    if (layoutMode === 'list') {
      const imageSize = 88; // Fixed size for list mode
      return {
        width: imageSize,
        height: imageSize,
        marginRight: 16,
        marginBottom: 0,
      };
    }
    
    // Grid mode
    const imageWidth = cardStyle.width - 24; // Card width minus padding
    const imageHeight = imageWidth * 0.75; // 3:4 aspect ratio
    
    return {
      width: imageWidth,
      height: imageHeight,
      marginRight: 0,
      marginBottom: 12,
    };
  };

  const getContentStyle = () => {
    if (layoutMode === 'list') {
      return {
        flex: 1,
        height: 88,
        justifyContent: 'space-between',
        paddingVertical: 4,
      };
    }
    
    // Grid mode - ensure content takes remaining space
    const cardStyle = getCardStyle();
    const imageStyle = getImageStyle();
    const remainingHeight = cardStyle.height - imageStyle.height - 24 - 12; // minus padding and margin
    
    return {
      height: remainingHeight,
      justifyContent: 'space-between',
    };
  };

  const getStockInfo = () => {
    if (!isAvailable) return { 
      bg: isDarkMode ? '#7f1d1d' : '#fee2e2', 
      text: isDarkMode ? '#fca5a5' : '#dc2626', 
      icon: 'close-circle-outline' 
    };
    if (data.stock <= 5) return { 
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
        onPress={() => navigation.navigate("ProductDetails", {product: data})}
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
                -{data.offPercentage}%
              </Text>
            </View>
          )}
          
          {/* Product Image */}
          <Image
            source={data.photo_link ? { uri: data.photo_link } : require('../../assets/images/image_not_found.png')}
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
        
        {/* Content Container */}
        <View style={[
          styles.contentContainer,
          {
            height: contentStyle.height,
            justifyContent: contentStyle.justifyContent,
            flex: layoutMode === 'list' ? 1 : 0,
          }
        ]}>
          
          {/* Product Name */}
          <View style={styles.nameContainer}>
            <Text 
              numberOfLines={2}
              style={[
                styles.productName, 
                { 
                  color: textColor,
                  fontSize: layoutMode === 'list' ? 15 : 13,
                  lineHeight: layoutMode === 'list' ? 20 : 18,
                }
              ]}
            >
              {data.label}
            </Text>
          </View>
          
          {/* Middle Section - Availability */}
          <View style={styles.middleSection}>
            <View style={[
              styles.availabilityContainer,
              { backgroundColor: stockInfo.bg }
            ]}>
              <MaterialCommunityIcons 
                name={stockInfo.icon}
                size={12}
                color={stockInfo.text}
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.availabilityText,
                {
                  fontSize: layoutMode === 'list' ? 11 : 10,
                  color: stockInfo.text,
                }
              ]}>
                {isAvailable ? "Disponible" : "Indisponible"} 
                {data.stock > 0 ? ` (${data.stock})` : ""}
              </Text>
            </View>
          </View>
          
          {/* Bottom Section - Price */}
          <View style={styles.bottomSection}>
            <View style={styles.priceContainer}>
              <Text style={[
                styles.priceText, 
                { 
                  color: primaryColor,
                  fontSize: layoutMode === 'list' ? 16 : 14,
                  fontWeight: '700',
                }
              ]}>
                {formattedPrice} DH
              </Text>
            </View>
            
            {/* Quick Add Button - Only in grid mode and when available */}
            {isAvailable && layoutMode === 'grid' && (
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity 
                  style={[
                    styles.quickAddButton, 
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
                      size={14} 
                      color="#ffffff"
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  ) : (
                    <MaterialCommunityIcons 
                      name="plus" 
                      size={14} 
                      color="#ffffff"
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
            
            {/* Add to Cart Button for List Mode */}
            {isAvailable && layoutMode === 'list' && (
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
}

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
    minHeight: 36, // Ensure consistent height for product names
  },
  productName: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  middleSection: {
    flex: 0,
    marginVertical: 6,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    marginTop: 'auto', // Push to bottom
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    letterSpacing: 0.3,
  },
  quickAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
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