import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import customProductApiService from '../service/CustomProductApiService';

const ProductImage = ({ 
  product, 
  style, 
  resizeMode = 'cover',
  showPlaceholder = true,
  placeholderColor = '#e0e0e0',
  onLoadStart,
  onLoadEnd,
  onError,  
  showDebugInfo = false
}) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [loadingUrls, setLoadingUrls] = useState(false);

  useEffect(() => {
    if (product) {
      loadImageUrls();
    }
  }, [product]);

  const loadImageUrls = async () => {
    if (!product) return;
    
    try {
      setLoadingUrls(true);
      setIsLoading(true);
      setHasError(false);
      
      // Try to get URLs from the image endpoint first
      const urls = await customProductApiService.getProductImageUrls(
        product.id,
        product.photo_link,
        product.ref
      );
      
      if (urls && urls.length > 0) {
        if (showDebugInfo) {
          console.log('=== ProductImage: URLs from endpoint ===');
          console.log('Product ID:', product.id);
          console.log('Photo Link:', product.photo_link);
          console.log('Retrieved URLs:', urls);
          console.log('=====================================');
        }
        setImageUrls(urls);
        setCurrentUrlIndex(0);
      } else {
        // Fallback to service method if endpoint fails
        const fallbackUrl = customProductApiService.getProductImageUrl(product);
        if (fallbackUrl) {
          setImageUrls([fallbackUrl]);
          setCurrentUrlIndex(0);
        } else {
          setHasError(true);
        }
      }
      
    } catch (error) {
      console.error('Error loading image URLs:', error);
      
      // Fallback to service method
      const fallbackUrl = customProductApiService.getProductImageUrl(product);
      if (fallbackUrl) {
        setImageUrls([fallbackUrl]);
        setCurrentUrlIndex(0);
      } else {
        setHasError(true);
      }
    } finally {
      setLoadingUrls(false);
    }
  };

  const handleImageError = (error) => {
    if (showDebugInfo) {
      console.log(`❌ Image failed (${currentUrlIndex + 1}/${imageUrls.length}):`, imageUrls[currentUrlIndex]);
      console.log('Error details:', error?.nativeEvent);
    }
    
    // Try next URL if available
    if (currentUrlIndex < imageUrls.length - 1) {
      setCurrentUrlIndex(prev => prev + 1);
      setIsLoading(true);
      setHasError(false);
    } else {
      // All URLs failed
      setHasError(true);
      setIsLoading(false);
      if (onError) onError(error);
    }
  };

  const handleImageLoad = () => {
    if (showDebugInfo) {
      console.log('✅ Image loaded successfully:', imageUrls[currentUrlIndex]);
    }
    setIsLoading(false);
    setHasError(false);
    if (onLoadEnd) onLoadEnd();
  };

  const handleLoadStart = () => {
    if (showDebugInfo) {
      console.log('🔄 Loading image:', imageUrls[currentUrlIndex]);
    }
    setIsLoading(true);
    if (onLoadStart) onLoadStart();
  };

  // Loading URLs from endpoint
  if (loadingUrls) {
    return (
      <View style={[styles.placeholderContainer, style, { backgroundColor: placeholderColor }]}>
        <ActivityIndicator size="small" color="#666" />
        {showDebugInfo && <Text style={styles.debugText}>Loading URLs...</Text>}
      </View>
    );
  }

  // No URLs available
  if (!imageUrls.length || hasError) {
    return (
      <View style={[styles.placeholderContainer, style, { backgroundColor: placeholderColor }]}>
        {showPlaceholder && (
          <>
            <MaterialCommunityIcons 
              name={hasError ? "image-broken-variant" : "image-off-outline"} 
              size={40} 
              color="#999" 
            />
            {showDebugInfo && (
              <Text style={styles.debugText}>
                {hasError ? `Failed: ${imageUrls.length} URLs tried` : 'No URLs available'}
              </Text>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[style, styles.imageContainer]}>
      <Image
        source={{ 
          uri: imageUrls[currentUrlIndex],
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MyApp/1.0)',
            'Accept': 'image/*',
          }
        }}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#666" />
          {showDebugInfo && (
            <Text style={styles.debugText}>
              Trying {currentUrlIndex + 1}/{imageUrls.length}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    overflow: 'hidden',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ProductImage;