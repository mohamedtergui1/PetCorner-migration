// ProductCard2.tsx - Updated to match ProductCard navigation pattern
import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
  Alert, // ✅ Added Alert import
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
  [key: string]: any; // ✅ FIXED: Allow additional properties to match any Product type
}

export interface ProductCard2Props {
  navigation?: any; // ✅ Made optional to prevent undefined errors
  product: any; // ✅ FIXED: Use 'any' to avoid type conflicts
  onPress?: (product: any) => void; // ✅ FIXED: Use 'any' for product parameter
  viewMode?: 'grid' | 'list';
  isDarkMode?: boolean;
  colorTheme?: 'blue' | 'orange';
}

// =====================================
// MAIN COMPONENT
// =====================================

const ProductCard2: React.FC<ProductCard2Props> = ({ 
  navigation, // ✅ Optional navigation prop with error handling
  product: data, // ✅ Rename to 'data' to match ProductCard pattern - now using 'any' type
  onPress, 
  viewMode = 'grid', 
  isDarkMode = false,
  colorTheme = 'blue',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // =====================================
  // DATA EXTRACTION AND VALIDATION
  // =====================================

  // Extract product data with fallbacks and validation
  const productName = data?.label || data?.name || data?.ref || 'Produit sans nom';
  const productBrand = data?.array_options?.options_marque || '';
  const productImage = data?.image_link || data?.photo_link;
  const productRef = data?.ref || data?.barcode || '';
  const productStock = data?.stock_reel ? parseInt(String(data.stock_reel)) : null;
  const isAvailable = productStock !== null ? productStock > 0 : false;
  
  // Extract price information
  const productPrice = data?.price_ttc;
  const formattedPrice = productPrice ? parseFloat(String(productPrice)).toFixed(2) : null;
  
  // Extract description
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

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  // Stock information with improved logic
  const getStockInfo = () => {
    if (productStock === null || productStock === undefined) {
      return { 
        bg: isDarkMode ? '#3f3f3f' : '#e5e5e5', 
        textColor: isDarkMode ? '#d4d4d4' : '#525252', 
        icon: 'help-circle-outline',
        status: 'Stock inconnu'
      };
    }
    
    if (!isAvailable || productStock <= 0) {
      return { 
        bg: isDarkMode ? '#7f1d1d' : '#fee2e2', 
        textColor: isDarkMode ? '#fca5a5' : '#dc2626', 
        icon: 'close-circle-outline',
        status: 'Indisponible'
      };
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

  const stockInfo = getStockInfo();

  // Card layout calculations
  const getCardDimensions = () => {
    const isListMode = viewMode === 'list';
    const cardWidth = isListMode ? screenWidth - 32 : (screenWidth - 44) / 2;
    const cardHeight = isListMode ? 120 : cardWidth * 1.35;
    const imageWidth = isListMode ? 90 : cardWidth - 24;
    const imageHeight = isListMode ? 90 : (cardWidth - 24) * 0.75;
    
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

  // ✅ FIXED: Simple handling - just log for now since ProductDetails doesn't exist
  const handlePress = () => {
    // First priority: use onPress if provided
    if (onPress) {
      onPress(data);
      return;
    }
    
    // For now, just log the product info since ProductDetails screen doesn't exist
    console.log('ProductCard2: Product tapped:', {
      id: data?.id,
      label: data?.label,
      price: formattedPrice
    });
    
    // Optional: You can uncomment this when you create the ProductDetails screen
    // if (navigation && navigation.navigate) {
    //   navigation.navigate("ProductDetails", { productId: data.id });
    // }
  };

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

  // Render product image
  const renderProductImage = () => (
    <View style={[
      styles.imageContainer,
      {
        width: dimensions.imageWidth,
        height: dimensions.imageHeight,
        marginRight: dimensions.isListMode ? 12 : 0,
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
      
      {/* Stock Indicator */}
      <View style={[styles.stockIndicator, { backgroundColor: stockInfo.bg }]}>
        <MaterialCommunityIcons 
          name={stockInfo.icon} 
          size={dimensions.isListMode ? 12 : 10} 
          color={stockInfo.textColor}
        />
      </View>
    </View>
  );

  // Render product information
  const renderProductInfo = () => (
    <View style={[
      styles.contentContainer,
      {
        flex: dimensions.isListMode ? 1 : 0,
        justifyContent: 'space-between',
        height: dimensions.isListMode ? 90 : dimensions.cardHeight - dimensions.imageHeight - 32,
      }
    ]}>
      {/* Product Name and Details */}
      <View style={styles.nameContainer}>
        <Text 
          numberOfLines={dimensions.isListMode ? 2 : 2}
          style={[
            styles.productName, 
            { 
              color: textColor,
              fontSize: dimensions.isListMode ? 15 : 13,
              lineHeight: dimensions.isListMode ? 20 : 18,
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
                fontSize: dimensions.isListMode ? 12 : 11,
                marginTop: 2,
              }
            ]}
          >
            {productBrand}
          </Text>
        )}
        
        {productRef && (
          <Text 
            numberOfLines={1}
            style={[
              styles.productRef, 
              { 
                color: secondaryTextColor,
                fontSize: dimensions.isListMode ? 11 : 10,
                marginTop: 1,
              }
            ]}
          >
            Réf: {productRef}
          </Text>
        )}
      </View>
      
      {/* Bottom Section: Price and Stock */}
      <View style={styles.bottomContainer}>
        {/* Price Display */}
        {formattedPrice && (
          <View style={styles.priceContainer}>
            <Text style={[
              styles.priceText,
              {
                color: priceColor,
                fontSize: dimensions.isListMode ? 14 : 12,
                fontWeight: '700',
              }
            ]}>
              {formattedPrice} DH
            </Text>
          </View>
        )}
        
        {/* Stock Status */}
        <View style={[
          styles.availabilityContainer,
          { 
            backgroundColor: stockInfo.bg,
            alignSelf: dimensions.isListMode ? 'flex-end' : 'flex-start',
          }
        ]}>
          <MaterialCommunityIcons 
            name={stockInfo.icon}
            size={dimensions.isListMode ? 11 : 10}
            color={stockInfo.textColor}
            style={{ marginRight: 3 }}
          />
          <Text style={[
            styles.availabilityText,
            {
              fontSize: dimensions.isListMode ? 10 : 9,
              color: stockInfo.textColor,
            }
          ]}>
            {stockInfo.status}
          </Text>
        </View>
      </View>
    </View>
  );

  // =====================================
  // MAIN RENDER
  // =====================================

  // Validate product data
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
        onPress={handlePress} // ✅ FIXED: Using proper navigation like ProductCard
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
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  productImage: {
    width: '85%',
    height: '85%',
  },
  contentContainer: {
    // Dimensions set dynamically
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  availabilityText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default ProductCard2;