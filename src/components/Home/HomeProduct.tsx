import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { TouchableOpacity } from 'react-native';
import Swiper from 'react-native-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProductCard2 from '../Product/ProductCard2';
import { filterData } from '../../database/Database';

// Import ProductService
import ProductService, { 
  Product, 
  FilteredProductsParams,
  PaginatedProductResponse,
  ProductListResponse 
} from '../../service/CustomProductApiService';

// =====================================
// TYPES AND INTERFACES
// =====================================

interface HomeProductProps {
  navigation: any;
}

interface CategoryWithProducts {
  id: string;
  name: string;
  image: any;
  products: Product[];
  loading: boolean;
  error?: string;
}

interface UserDetails {
  id: string;
  name: string;
  email?: string;
}

interface CarouselSlide {
  id: string;
  title: string;
  imageUri: string;
}

// =====================================
// CONSTANTS
// =====================================

const SCREEN_WIDTH = Dimensions.get('window').width;
const PRODUCTS_PER_CATEGORY = 4;

// Category mapping from filterData IDs to API category IDs
const CATEGORY_MAPPING: { [key: string]: number } = {
  "2": 2,     // Chien -> API category 2
  "3": 3,     // Chat -> API category 3
  "184": 184, // Lapin -> API category 184
  "21": 21,   // Poisson -> API category 21
  "31": 31,   // Reptile -> API category 31
  "20": 20,   // Oiseau -> API category 20
};

const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: '1',
    title: 'Offres Spéciales',
    imageUri: 'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/clothing-store-banner-design-template-e7332aaf6402c88cb4623bf8eb6f97e2_screen.jpg?ts=1620867237'
  },
  {
    id: '2',
    title: 'Nourriture Premium',
    imageUri: 'https://t4.ftcdn.net/jpg/03/06/69/49/360_F_306694930_S3Z8H9Qk1MN79ZUe7bEWqTFuonRZdemw.jpg'
  },
  {
    id: '3',
    title: 'Essentiels Chat',
    imageUri: 'https://t4.ftcdn.net/jpg/03/20/46/13/360_F_320461388_5Snqf6f2tRIqiWlaIzNWrCUm1Ocaqhfm.jpg'
  },
  {
    id: '4',
    title: 'Jouets Amusants',
    imageUri: 'https://t4.ftcdn.net/jpg/03/65/85/47/360_F_365854716_ZHB0YN3i3s0H7NjI9hiezH53D5nvoF0E.jpg'
  },
];

// =====================================
// MAIN COMPONENT
// =====================================

export default function HomeProduct({ navigation }: HomeProductProps) {
  const { theme, isDarkMode, colorTheme } = useTheme();
  
  // =====================================
  // STATE MANAGEMENT
  // =====================================
  
  const [delivery, setDelivery] = useState<boolean>(true);
  const [indexCheck, setIndexCheck] = useState<string>("2"); // Default to first category (Chien)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [backPressCount, setBackPressCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // =====================================
  // THEME COLORS
  // =====================================
  
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  const toggleLayout = (): void => {
    setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid');
  };

  // =====================================
  // TIME MANAGEMENT
  // =====================================

  useFocusEffect(
    useCallback(() => {
      const updateTime = (): void => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        setCurrentTime(`${hours}:${minutes}`);
      };

      updateTime();
      const intervalId = setInterval(updateTime, 60000);

      return () => clearInterval(intervalId);
    }, [])
  );

  // =====================================
  // NAVIGATION AND LIFECYCLE
  // =====================================

  // Load initial data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsLoading(false); // Don't show global loader
      loadAllCategories();
    });
    return unsubscribe;
  }, [navigation]);

  // Back button handling
  useEffect(() => {
    const backAction = (): boolean => {
      setBackPressCount(prevCount => prevCount + 1);

      if (backPressCount === 0) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Cliquez à nouveau sur Retour pour quitter', ToastAndroid.SHORT);
        } else {
          Toast.show('Cliquez à nouveau sur Retour pour quitter', Toast.SHORT);
        }
        setTimeout(() => {
          setBackPressCount(0);
        }, 2000);
        return true;
      } else if (backPressCount === 1) {
        BackHandler.exitApp();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [backPressCount]);

  // =====================================
  // DATA LOADING FUNCTIONS
  // =====================================

  // Initialize categories from filterData
  const initializeCategories = (): CategoryWithProducts[] => {
    return filterData.map(category => ({
      id: category.id,
      name: category.name,
      image: category.image,
      products: [],
      loading: true,
    }));
  };

  // Load products for a specific category
  const loadCategoryProducts = async (categoryId: string): Promise<Product[]> => {
    try {
      const apiCategoryId = CATEGORY_MAPPING[categoryId];
      if (!apiCategoryId) {
        console.warn(`No category mapping found for filterData category ${categoryId}`);
        return [];
      }

      // Use the filterData category ID directly as it should match the API category ID
      const params: FilteredProductsParams = {
        limit: PRODUCTS_PER_CATEGORY,
        page: 0,
        pagination_data: true,
        includestockdata: 0,
        category: apiCategoryId, // Use the mapped API category ID
        sortfield: 'datec',
        sortorder: 'DESC'
      };

      console.log(`🔍 Loading products for filterData category ${categoryId} (API Category: ${apiCategoryId}):`, params);

      const result = await ProductService.getFilteredProducts(params);
      
      let products: Product[] = [];
      if ('pagination' in result) {
        products = result.data || [];
        console.log(`📊 Pagination result for category ${apiCategoryId}:`, {
          total: result.pagination?.total || 0,
          page: result.pagination?.page || 0,
          page_count: result.pagination?.page_count || 0,
          productsReceived: products.length
        });
      } else {
        products = (result as Product[]).slice(0, PRODUCTS_PER_CATEGORY);
        console.log(`📋 Array result for category ${apiCategoryId}: ${products.length} products`);
      }

      // Log detailed product info for debugging
      if (products.length > 0) {
        console.log(`✅ Loaded ${products.length} products for category ${apiCategoryId}:`, 
          products.map(p => ({ id: p.id, label: p.label, price: p.price_ttc }))
        );
      } else {
        console.warn(`⚠️ No products found for category ${apiCategoryId} (filterData: ${categoryId})`);
        
        // Try without category filter to test API connectivity
        try {
          const testParams: FilteredProductsParams = {
            limit: 1,
            page: 0,
            pagination_data: true,
            includestockdata: 0,
            sortfield: 'datec',
            sortorder: 'DESC'
          };
          
          console.log(`🧪 Testing API connectivity without category filter...`);
          const testResult = await ProductService.getFilteredProducts(testParams);
          const hasProducts = ('pagination' in testResult) ? (testResult.data?.length || 0) > 0 : (testResult as Product[]).length > 0;
          
          if (hasProducts) {
            console.log(`🔍 Products exist in general, but none for category ${apiCategoryId}`);
            
            // Try with a different category to test if the issue is category-specific
            const alternativeCategories = [2, 3, 21, 20,184,31]; // Your actual category IDs
            for (const altCat of alternativeCategories) {
              if (altCat !== apiCategoryId) {
                try {
                  const altParams: FilteredProductsParams = {
                    limit: 1,
                    page: 0,
                    pagination_data: true,
                    includestockdata: 0,
                    category: altCat,
                    sortfield: '',
                    sortorder: 'DESC'
                  };
                  
                  const altResult = await ProductService.getFilteredProducts(altParams);
                  const hasAltProducts = ('pagination' in altResult) ? (altResult.data?.length || 0) > 0 : (altResult as Product[]).length > 0;
                  
                  if (hasAltProducts) {
                    console.log(`✅ Found products in alternative category ${altCat}, issue is category-specific`);
                    break;
                  }
                } catch (altError) {
                  console.log(`❌ Error testing alternative category ${altCat}:`, altError);
                }
              }
            }
          } else {
            console.log(`🔍 No products found in the system at all`);
          }
        } catch (testError) {
          console.error(`❌ Error testing product availability:`, testError);
        }
      }

      return products;

    } catch (error) {
      console.error(`❌ Error loading products for filterData category ${categoryId} (API: ${CATEGORY_MAPPING[categoryId]}):`, error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        if (error.stack) {
          console.error(`Error stack: ${error.stack}`);
        }
      }
      
      // Log the exact parameters that failed
      console.error(`Failed params:`, {
        categoryId,
        apiCategoryId: CATEGORY_MAPPING[categoryId],
        limit: PRODUCTS_PER_CATEGORY
      });
      
      return [];
    }
  };

  // Load all categories with their products
  const loadAllCategories = async (): Promise<void> => {
    try {
      const initialCategories = initializeCategories();
      setCategories(initialCategories);

      console.log('🚀 Starting to load all categories...');
      console.log('📋 Category mappings:', CATEGORY_MAPPING);

      // Load products for each category one by one
      for (let i = 0; i < initialCategories.length; i++) {
        const category = initialCategories[i];
        console.log(`📦 Loading category: ${category.name} (ID: ${category.id})`);
        
        try {
          const products = await loadCategoryProducts(category.id);
          
          // Update this specific category in state
          setCategories(prevCategories => 
            prevCategories.map(cat => 
              cat.id === category.id 
                ? {
                    ...cat,
                    products,
                    loading: false,
                    error: products.length === 0 ? 'No products found' : undefined
                  }
                : cat
            )
          );
          
          // Small delay between categories to show progressive loading
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (categoryError) {
          console.error(`❌ Failed to load category ${category.name}:`, categoryError);
          
          // Update this category with error state
          setCategories(prevCategories => 
            prevCategories.map(cat => 
              cat.id === category.id 
                ? {
                    ...cat,
                    products: [],
                    loading: false,
                    error: 'Failed to load products'
                  }
                : cat
            )
          );
        }
      }

      console.log('✅ All categories loading completed');

    } catch (error) {
      console.error('❌ Error loading categories:', error);
      Toast.show('Erreur lors du chargement des produits', Toast.SHORT);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = (): void => {
    setRefreshing(true);
    setIsLoading(false); // Don't show global loader on refresh
    loadAllCategories();
  };

  // =====================================
  // USER DATA FUNCTIONS
  // =====================================

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async (): Promise<void> => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserDetails(userData);
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
  };

  // =====================================
  // NAVIGATION FUNCTIONS
  // =====================================

  const navigateToCategory = (categoryId: string): void => {
    setIndexCheck(categoryId);
    navigation.navigate('ProductCategoryScreen', { categoryId });
  };

  const navigateToProductDetails = (product: Product): void => {
    navigation.navigate('ProductDetails', { 
      productId: product.id,
      product: product 
    });
  };

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

  // Render carousel slide
  const renderCarouselSlide = (slide: CarouselSlide) => (
    <View key={slide.id} style={styles.slide}>
      <Image
        source={{ uri: slide.imageUri }}
        style={styles.slideImage}
      />
      <View style={[styles.slideGradient, { 
        backgroundColor: 'rgba(0,0,0,0.5)'
      }]}>
        <Text style={styles.slideText}>{slide.title}</Text>
      </View>
    </View>
  );

  // Render category item
  const renderCategoryItem = ({ item }: { item: CategoryWithProducts }) => {
    const isSelected = indexCheck === item.id;
    
    return (
      <Pressable onPress={() => navigateToCategory(item.id)}>
        <View style={[
          styles.categoryCard,
          {
            backgroundColor: isSelected 
              ? PRIMARY_COLOR 
              : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0'),
            shadowColor: isDarkMode ? '#000' : PRIMARY_COLOR,
          }
        ]}>
          <Image
            style={styles.categoryImage}
            source={getCategoryImage(item.id)}
          />
          <Text style={[
            styles.categoryText,
            { 
              color: isSelected 
                ? '#ffffff' 
                : (isDarkMode ? '#FFFFFF' : theme.textSecondary) // ✅ Changed to white in dark mode
            }
          ]} 
          numberOfLines={2}
          >
            {item.name}
          </Text>
          
        
          
          {/* Error indicator */}
          {item.error && !item.loading && (
            <View style={styles.errorIndicator}>
              <Ionicons name="warning" size={12} color="#ff4444" />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  // Render category section with products
  const renderCategorySection = (category: CategoryWithProducts) => {
    if (category.loading) {
      return (
        <View key={category.id} style={styles.categorySection}>
          <View style={styles.categorySectionHeader}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonButton} />
          </View>
          <View style={styles.skeletonProductsList}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.skeletonProduct} />
            ))}
          </View>
        </View>
      );
    }

    if (category.products.length === 0) {
      return (
        <View key={category.id} style={styles.categorySection}>
          <View style={styles.categorySectionHeader}>
            <Text style={[styles.categoryTitle, { color: theme.textColor }]}>
              {category.name}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {category.error || 'Aucun produit disponible'}
            </Text>
          </View>
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={category.error === 'Failed to load products' ? "cloud-offline-outline" : "paw-outline"} 
              size={48} 
              color={theme.textSecondary} 
            />
            <Text style={[styles.emptyMessage, { color: theme.textSecondary }]}>
              {category.error === 'Failed to load products' 
                ? 'Erreur de chargement'
                : 'Pas de produits dans cette catégorie'
              }
            </Text>
            {category.error === 'Failed to load products' && (
              <TouchableOpacity 
                style={[styles.retrySmallButton, { borderColor: PRIMARY_COLOR }]}
                onPress={() => {
                  setCategories(prevCategories => 
                    prevCategories.map(cat => 
                      cat.id === category.id 
                        ? { ...cat, loading: true, error: undefined }
                        : cat
                    )
                  );
                  loadCategoryProducts(category.id).then(products => {
                    setCategories(prevCategories => 
                      prevCategories.map(cat => 
                        cat.id === category.id 
                          ? { ...cat, products, loading: false, error: products.length === 0 ? 'No products found' : undefined }
                          : cat
                      )
                    );
                  });
                }}
              >
                <Ionicons name="refresh" size={14} color={PRIMARY_COLOR} />
                <Text style={[styles.retrySmallButtonText, { color: PRIMARY_COLOR }]}>Réessayer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return (
      <View key={category.id} style={styles.categorySection}>
        <View style={styles.categorySectionHeader}>
          <Text style={[styles.categoryTitle, { color: theme.textColor }]}>
            {category.name}
          </Text>
          <TouchableOpacity 
            onPress={() => navigateToCategory(category.id)}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: PRIMARY_COLOR }]}>
              Voir tout 
            </Text>
            <Ionicons name="chevron-forward" size={16} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={category.products}
          keyExtractor={(item, index) => `${category.id}-${item.id}-${index}`}
          contentContainerStyle={styles.productsList}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <ProductCard2
              navigation={navigation}
              product={item}
              onPress={navigateToProductDetails}
              viewMode="grid"
              isDarkMode={isDarkMode}
              colorTheme={colorTheme}
            />
          )}
        />
      </View>
    );
  };

  // =====================================
  // MAIN RENDER
  // =====================================

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={true}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
      >
        
        {/* Carousel Section */}
        <View style={[styles.carouselSection, {
          shadowColor: isDarkMode ? '#000' : '#000',
        }]}>
          <Swiper 
            autoplay={true} 
            height={200}
            showsPagination={true}
            paginationStyle={styles.pagination}
            dotStyle={[styles.dot, { 
              backgroundColor: 'rgba(255,255,255,0.5)'
            }]}
            activeDotStyle={[styles.activeDot, { backgroundColor: PRIMARY_COLOR }]}
            autoplayTimeout={5}
          >
            {CAROUSEL_SLIDES.map(renderCarouselSlide)}
          </Swiper>
        </View>

        {/* Categories Section */}
        <View style={[styles.categoriesContainer, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            Catégories
          </Text>
          
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={item => item.id}
            extraData={indexCheck}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => {
                  setIndexCheck(item.id);
                  navigation.navigate('ProductCategoryScreen', { categoryId: item.id });
                }}
              >
                <View style={[
                  styles.categoryCard,
                  {
                    backgroundColor: indexCheck === item.id
                      ? PRIMARY_COLOR
                      : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0'),
                    shadowColor: '#000',
                  }
                ]}>
                  <Image
                    style={styles.categoryImage}
                    source={item.image}
                  />
                  <Text style={[
                    styles.categoryText,
                    {
                      color: indexCheck === item.id
                        ? '#FFFFFF'
                        : (isDarkMode ? '#FFFFFF' : theme.textSecondary) // ✅ Changed to white in dark mode
                    }
                  ]}
                  numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  
                 
                  
                  {/* Error indicator */}
                  {item.error && !item.loading && (
                    <View style={styles.errorIndicator}>
                      <Ionicons name="warning" size={12} color="#ff4444" />
                    </View>
                  )}
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Products by Category Sections */}
        <View style={styles.productsWrapper}>
          {categories.map(renderCategorySection)}
          
          {categories.length > 0 && categories.every(cat => cat.products.length === 0 && !cat.loading) && (
            <View style={styles.allEmptyContainer}>
              <Ionicons name="storefront-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.allEmptyTitle, { color: theme.textColor }]}>
                Aucun produit disponible
              </Text>
              <Text style={[styles.allEmptyText, { color: theme.textSecondary }]}>
                Aucun produit n'a été trouvé dans toutes les catégories
              </Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={loadAllCategories}
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Carousel Styles
  carouselSection: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  slide: {
    flex: 1,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  slideGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  slideText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pagination: {
    bottom: 15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  activeDot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },

  // Categories Styles
  categoriesContainer: {
    margin: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  categoriesList: {
    paddingHorizontal: 8,
  },
  categoryCard: {
    width: 90,
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 5,
    marginVertical: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  productCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  errorIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Products Styles
  productsWrapper: {
    flex: 1,
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 30,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  productsList: {
    paddingHorizontal: 20,
    paddingRight: 40, // Extra padding for last item
  },

  // Skeleton Styles
  skeletonTitle: {
    height: 20,
    width: 120,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    opacity: 0.7,
  },
  skeletonButton: {
    height: 16,
    width: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    opacity: 0.7,
  },
  skeletonProductsList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  skeletonProduct: {
    width: 160,
    height: 220,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    opacity: 0.7,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },

  // Debug Styles (removed)

  // Empty States
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  allEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  allEmptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  allEmptyText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  retrySmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 8,
    gap: 4,
  },
  retrySmallButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});