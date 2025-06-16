import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Alert,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ImageSourcePropType,
  ListRenderItemInfo,
  TextInput,
  RefreshControl
} from 'react-native';
import { COLOURS, filterData } from '../database/Database';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import ProductCard2, { ProductCard2Props } from '../components/Product/ProductCard2';
import ProductService from '../service/CustomProductApiService';
import FilterModal from '../components/filter/FilterModal'; // Import FilterModal

// Type definitions
interface Product {
  id: string;
  image_link?: string | null;
  photo_link?: string | null;
  label?: string;
  price_ttc?: number;
  price?: number;
  [key: string]: any;
}

interface Category {
  id: string;
  name: string;
  image?: ImageSourcePropType;
}

interface ProductCategoryScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params: { productId: string; product: Product }) => void;
  };
  route: {
    params?: {
      categoryId?: string;
    };
  };
}

interface PaginationResponse {
  data: Product[];
  pagination?: {
    total: number;
    page: number;
    page_count: number;
  };
}

// Enhanced FilterOptions interface
interface FilterOptions {
  animal_category?: number;
  brand?: string;
  category?: number;
  priceMin?: number;
  priceMax?: number;
}

interface FilterParams {
  limit: number;
  page: number;
  category: number;
  sortfield: string;
  sortorder: string;
  animal_category?: number;
  brand?: string;
  price_min?: number;
  price_max?: number;
  search?: string;
}

const ProductCategoryScreen: React.FC<ProductCategoryScreenProps> = ({ navigation, route }) => {
  // Theme colors with explicit types
  const { isDarkMode, colorTheme } = useTheme();
  const PRIMARY_COLOR: string = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR: string = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR: string = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND: string = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR: string = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY: string = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR: string = isDarkMode ? '#2c2c2c' : '#e0e0e0';

  // Enhanced state management
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    route.params?.categoryId || filterData[0]?.id || "2"
  );
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [failedImageLoads, setFailedImageLoads] = useState<Set<string>>(new Set());
  
  // New filter and search states
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const PAGE_SIZE: number = 10;
  const isLoadingRef = useRef<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Utility functions from ProductScreen
  const getSortField = (sortType: string): string => {
    switch (sortType) {
      case 'price':
        return 'price_ttc';
      case 'name':
        return 'label';
      case 'date':
      default:
        return 'datec';
    }
  };

  const getSortOrder = (sortType: string): 'ASC' | 'DESC' => {
    switch (sortType) {
      case 'price':
      case 'name':
        return 'ASC';
      case 'date':
      default:
        return 'DESC';
    }
  };

  const sortProducts = (productsList: Product[], sortType: string) => {
    if (!Array.isArray(productsList)) return [];
    
    const sorted = [...productsList];
    
    switch (sortType) {
      case 'price':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(String(a.price_ttc || a.price || 0));
          const priceB = parseFloat(String(b.price_ttc || b.price || 0));
          return priceA - priceB;
        });
      case 'name':
        return sorted.sort((a, b) => {
          const nameA = (a.label || '').toLowerCase();
          const nameB = (b.label || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'date':
      default:
        return sorted.sort((a, b) => {
          const getProductDate = (product: Product): number => {
            const dateFields = ['date_creation', 'datec', 'tms', 'date_add'];
            
            for (const field of dateFields) {
              const dateValue = (product as any)[field];
              if (dateValue) {
                const timestamp = typeof dateValue === 'string' ? 
                  new Date(dateValue).getTime() : 
                  typeof dateValue === 'number' ? dateValue * 1000 :
                  new Date(dateValue).getTime();
                
                if (!isNaN(timestamp)) {
                  return timestamp;
                }
              }
            }
            
            const productId = product.id ? parseInt(String(product.id)) : 0;
            return productId;
          };
          
          const dateA = getProductDate(a);
          const dateB = getProductDate(b);
          
          return dateB - dateA;
        });
    }
  };

  // Helper function to remove duplicate products
  const removeDuplicateProducts = useCallback((productsList: Product[]): Product[] => {
    const uniqueProducts = new Map<string, Product>();
    
    productsList.forEach((product) => {
      const id = product.id?.toString();
      if (id && !uniqueProducts.has(id)) {
        uniqueProducts.set(id, product);
      }
    });
    
    return Array.from(uniqueProducts.values());
  }, []);

  // Enhanced loadProducts function with filtering
  const loadProducts = useCallback(async (
    categoryId: string, 
    resetPagination: boolean = true,
    filters: FilterOptions = {},
    search: string = ''
  ): Promise<void> => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      if (resetPagination) {
        setLoading(true);
        setCurrentPage(0);
        setFailedImageLoads(new Set());
      } else {
        setLoadingMore(true);
      }

      const pageToLoad: number = resetPagination ? 0 : currentPage;
      const selectedCategory: Category | undefined = filterData.find(
        (cat: Category) => cat.id === categoryId
      );

      // Enhanced params with filters
      const params: FilterParams = {
        limit: PAGE_SIZE,
        page: pageToLoad,
        category: parseInt(categoryId),
        sortfield: getSortField(sortBy),
        sortorder: getSortOrder(sortBy)
      };

      // Add filters
      if (filters.animal_category) params.animal_category = filters.animal_category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.priceMin !== undefined) params.price_min = filters.priceMin;
      if (filters.priceMax !== undefined) params.price_max = filters.priceMax;
      if (search && search.trim()) params.search = search.trim();

      console.log('🚀 API Params:', params);

      const result: Product[] | PaginationResponse = await ProductService.getFilteredProducts(params);

      const newProducts: Product[] = Array.isArray(result) ? result : (result.data || []);
      const total: number = Array.isArray(result)
        ? newProducts.length
        : (result.pagination?.total || newProducts.length);

      // Apply local sorting
      const sortedProducts = sortProducts(newProducts, sortBy);

      // Remove duplicates before setting state
      if (resetPagination) {
        const uniqueProducts = removeDuplicateProducts(sortedProducts);
        setProducts(uniqueProducts);
      } else {
        setProducts((prev: Product[]) => {
          const combinedProducts = [...prev, ...sortedProducts];
          return removeDuplicateProducts(combinedProducts);
        });
      }
      
      setTotalProducts(total);
      setCategoryName(selectedCategory?.name || '');
      setCurrentPage(pageToLoad + 1);
      setActiveFilters(filters);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les produits. Vérifiez votre connexion.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      setSearchLoading(false);
      isLoadingRef.current = false;
    }
  }, [removeDuplicateProducts, sortBy]);

  // Search functionality
  const handleSearchInputChange = (text: string) => {
    setSearchInputValue(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  };

  const performSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length > 2) {
      setSearchLoading(true);
      await loadProducts(selectedCategoryId, true, activeFilters, query.trim());
    } else if (query.trim().length === 0) {
      setSearchLoading(true);
      await loadProducts(selectedCategoryId, true, activeFilters, '');
    }
  };

  const clearSearch = () => {
    setSearchInputValue('');
    setSearchQuery('');
    loadProducts(selectedCategoryId, true, activeFilters, '');
  };

  // Filter functionality
  const handleApplyFilters = (filters: any) => {
    console.log('✅ Filtres appliqués:', filters);
    
    const convertedFilters: FilterOptions = {};
    
    if (filters.animal) convertedFilters.animal_category = parseInt(filters.animal);
    if (filters.brand) convertedFilters.brand = filters.brand;
    if (filters.category) convertedFilters.category = parseInt(filters.category);
    if (filters.priceMin !== undefined) convertedFilters.priceMin = filters.priceMin;
    if (filters.priceMax !== undefined) convertedFilters.priceMax = filters.priceMax;
    
    setShowFilterModal(false);
    loadProducts(selectedCategoryId, true, convertedFilters, searchQuery);
  };

  const handleClearFilters = () => {
    Alert.alert(
      'Supprimer les filtres',
      'Êtes-vous sûr de vouloir supprimer tous les filtres?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            setActiveFilters({});
            loadProducts(selectedCategoryId, true, {}, searchQuery);
          }
        }
      ]
    );
  };

  const handleSortChange = (newSortBy: 'date' | 'price' | 'name') => {
    console.log('🔄 Changement de tri:', sortBy, '->', newSortBy);
    setSortBy(newSortBy);
    
    if (products.length > 0) {
      const sortedProducts = sortProducts(products, newSortBy);
      setProducts(sortedProducts);
    }
    
    loadProducts(selectedCategoryId, true, activeFilters, searchQuery);
  };

  // Helper functions for filters
  const hasActiveFilters = (): boolean => {
    return Object.keys(activeFilters).length > 0;
  };

  const getActiveFilterCount = (): number => {
    return Object.keys(activeFilters).length;
  };

  // Effect for initial load and category changes
  useEffect(() => {
    loadProducts(selectedCategoryId, true, activeFilters, searchQuery);
  }, [selectedCategoryId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Load more products
  const loadMoreProducts = useCallback((): void => {
    if (!loadingMore && products.length < totalProducts && !isLoadingRef.current) {
      loadProducts(selectedCategoryId, false, activeFilters, searchQuery);
    }
  }, [loadingMore, products.length, totalProducts, selectedCategoryId, activeFilters, searchQuery, loadProducts]);

  // Refresh functionality
  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(selectedCategoryId, true, activeFilters, searchQuery);
  };

  // Category selection handler
  const handleCategorySelect = useCallback((categoryId: string): void => {
    if (selectedCategoryId !== categoryId) {
      setLoading(true);
      setProducts([]);
      setTotalProducts(0);
      setCurrentPage(0);
      setFailedImageLoads(new Set());
      setSelectedCategoryId(categoryId);
    }
  }, [selectedCategoryId]);

  const handleImageError = useCallback((productId: string): void => {
    setFailedImageLoads((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });
  }, []);

  const getProductKey = useCallback((item: Product, index: number): string => {
    const productId = item.id?.toString() || `unknown-${index}`;
    return `product-${productId}-${index}`;
  }, []);

  // Render functions
  const renderProduct = useCallback(({ item, index }: ListRenderItemInfo<Product>): JSX.Element => {
    const hasImageFailed: boolean = failedImageLoads.has(item.id);
    const productCardProps: ProductCard2Props = {
      navigation,
      product: {
        ...item,
        image_link: hasImageFailed ? null : item.image_link,
        photo_link: hasImageFailed ? null : item.photo_link
      },
      onPress: () => navigation.navigate('ProductDetails', {
        productId: item.id,
        product: item
      }),
      viewMode: viewMode,
      isDarkMode,
      colorTheme,
      onImageError: () => handleImageError(item.id)
    };

    return (
      <View style={styles.productContainer}>
        <ProductCard2 {...productCardProps} />
      </View>
    );
  }, [navigation, isDarkMode, colorTheme, failedImageLoads, handleImageError, viewMode]);

  const renderCategoryItem = useCallback(({ item }: ListRenderItemInfo<Category>): JSX.Element => {
    const isSelected: boolean = selectedCategoryId === item.id;
    const cardStyle: StyleProp<ViewStyle> = [
      styles.categoryCard,
      {
        backgroundColor: isSelected
          ? PRIMARY_COLOR
          : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0')
      }
    ];

    const imageWrapperStyle: StyleProp<ViewStyle> = [
      styles.categoryImageWrapper,
      {
        backgroundColor: isSelected
          ? 'rgba(255,255,255,0.15)'
          : (isDarkMode ? '#333' : '#e0e0e0')
      }
    ];

    const textStyle: StyleProp<TextStyle> = [
      styles.categoryText,
      {
        color: isSelected ? '#ffffff' : TEXT_COLOR_SECONDARY,
        fontWeight: isSelected ? '600' : '500'
      }
    ];

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleCategorySelect(item.id)}
        style={styles.categoryButton}
      >
        <View style={cardStyle}>
          <View style={imageWrapperStyle}>
            {item.image ? (
              <Image source={item.image} style={styles.categoryImage} />
            ) : (
              <Ionicons
                name="paw-outline"
                size={30}
                color={isSelected ? '#ffffff' : PRIMARY_COLOR}
              />
            )}
          </View>
          <Text style={textStyle} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [selectedCategoryId, isDarkMode, PRIMARY_COLOR, TEXT_COLOR_SECONDARY, handleCategorySelect]);

  // Render search bar
  const renderSearchBar = () => {
    if (!showSearchBar) return null;

    return (
      <View style={[styles.searchBarContainer, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: BACKGROUND_COLOR, borderColor: BORDER_COLOR }]}>
          <Ionicons name="search" size={20} color={TEXT_COLOR_SECONDARY} />
          <TextInput
            style={[styles.searchInput, { color: TEXT_COLOR }]}
            placeholder="Rechercher des produits..."
            placeholderTextColor={TEXT_COLOR_SECONDARY}
            value={searchInputValue}
            onChangeText={handleSearchInputChange}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(searchInputValue)}
          />
          {searchLoading && <ActivityIndicator size="small" color={PRIMARY_COLOR} />}
          {searchInputValue.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={TEXT_COLOR_SECONDARY} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render filter header
  const renderFilterHeader = () => {
    return (
      <></>
    );
  };

  // Render toolbar
  const renderToolbar = () => (
    <View style={[styles.toolbar, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
      <View style={styles.toolbarLeft}>
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: sortBy === 'date' ? PRIMARY_COLOR + '20' : 'transparent' }]}
          onPress={() => handleSortChange('date')}
        >
          <Ionicons name="time-outline" size={16} color={sortBy === 'date' ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY} />
          <Text style={[styles.sortButtonText, { color: sortBy === 'date' ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY }]}>
            Récent
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: sortBy === 'price' ? PRIMARY_COLOR + '20' : 'transparent' }]}
          onPress={() => handleSortChange('price')}
        >
          <Ionicons name="pricetag-outline" size={16} color={sortBy === 'price' ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY} />
          <Text style={[styles.sortButtonText, { color: sortBy === 'price' ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY }]}>
            Prix
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: sortBy === 'name' ? PRIMARY_COLOR + '20' : 'transparent' }]}
          onPress={() => handleSortChange('name')}
        >
          <Ionicons name="text-outline" size={16} color={sortBy === 'name' ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY} />
          <Text style={[styles.sortButtonText, { color: sortBy === 'name' ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY }]}>
            Nom
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.toolbarRight}>
        <TouchableOpacity
          style={[styles.viewModeButton, { backgroundColor: viewMode === 'grid' ? PRIMARY_COLOR + '20' : 'transparent' }]}
          onPress={() => setViewMode('grid')}
        >
          <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, { backgroundColor: viewMode === 'list' ? PRIMARY_COLOR + '20' : 'transparent' }]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Main render
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      />

      {/* Enhanced Header with Search and Filter */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Catégories</Text>
            {totalProducts > 0 && (
              <Text style={styles.headerCount}>({totalProducts})</Text>
            )}
          </View>
          {totalProducts > 0 && (
            <Text style={styles.headerSubtitle}>
              {products.length} chargés
            </Text>
          )}
          {hasActiveFilters() && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: showSearchBar ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)' }]}
            onPress={() => setShowSearchBar(!showSearchBar)}
          >
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, { 
              backgroundColor: hasActiveFilters() ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
              marginLeft: 8
            }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="funnel" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {renderSearchBar()}

      {/* Categories Filter */}
      <View style={[styles.categoriesContainer, {
        backgroundColor: CARD_BACKGROUND,
        borderColor: BORDER_COLOR
      }]}>
        <FlatList<Category>
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterData}
          keyExtractor={(item: Category) => `cat-${item.id}`}
          renderItem={renderCategoryItem}
          extraData={selectedCategoryId}
          contentContainerStyle={styles.categoriesListContent}
        />
      </View>

      {/* Category info */}
      {categoryName && (
        <View style={[styles.categoryBadge, { backgroundColor: `${PRIMARY_COLOR}15` }]}>
          <MaterialCommunityIcons
            name="tag-outline"
            size={18}
            color={PRIMARY_COLOR}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.categoryName, { color: TEXT_COLOR }]}>
            {categoryName}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: PRIMARY_COLOR }]}>
            <Text style={styles.countText}>
              {totalProducts}
            </Text>
          </View>
        </View>
      )}

      {/* Product List with Enhanced Features */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: TEXT_COLOR_SECONDARY }]}>
            Chargement en cours...
          </Text>
        </View>
      ) : (
        <>
          {renderFilterHeader()}
          {renderToolbar()}
          <FlatList<Product>
            data={products}
            keyExtractor={getProductKey}
            renderItem={renderProduct}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode}
            columnWrapperStyle={viewMode === 'grid' ? styles.productRow : null}
            contentContainerStyle={styles.productsListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[PRIMARY_COLOR]}
                tintColor={PRIMARY_COLOR}
              />
            }
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.5}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIcon, { backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' }]}>
                  <Feather name="package" size={60} color={PRIMARY_COLOR} />
                </View>
                <Text style={[styles.emptyTitle, { color: TEXT_COLOR }]}>
                  {searchQuery 
                    ? 'Aucun résultat trouvé' 
                    : hasActiveFilters() 
                      ? 'Aucun produit trouvé' 
                      : 'Aucun produit disponible'
                  }
                </Text>
                <Text style={[styles.emptySubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                  {searchQuery 
                    ? `Aucun produit ne correspond à "${searchQuery}"`
                    : hasActiveFilters() 
                      ? 'Essayez de modifier vos filtres de recherche'
                      : 'Aucun produit disponible dans cette catégorie'
                  }
                </Text>
                {(hasActiveFilters() || searchQuery) && (
                  <TouchableOpacity
                    style={[styles.clearButton, { backgroundColor: PRIMARY_COLOR }]}
                    onPress={() => {
                      if (searchQuery) {
                        clearSearch();
                      } else {
                        handleClearFilters();
                      }
                    }}
                  >
                    <Text style={styles.clearButtonText}>
                      {searchQuery ? 'Effacer la recherche' : 'Supprimer les filtres'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  <Text style={[styles.loadingFooterText, { color: TEXT_COLOR_SECONDARY }]}>
                    Chargement des produits supplémentaires...
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={activeFilters}
          showAnimalFilter={true}
          showBrandFilter={true}
          showCategoryFilter={false} // Disable category filter since we're already filtering by category
          showPriceFilter={true}
        />
      )}
    </SafeAreaView>
  );
};

// Enhanced styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
    paddingTop: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  
  // Search Bar
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Filter Header
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  productCountContainer: {
    flex: 1,
  },
  filterHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  filterSubText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  sortIndicator: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  filterHeaderRight: {
    flexDirection: 'row',
    gap: 8,
  },
  clearFiltersButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  clearFiltersTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 4,
  },
  viewModeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

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
  categoriesListContent: {
    paddingHorizontal: 8,
  },
  categoryButton: {
    marginHorizontal: 5,
    marginVertical: 8,
  },
  categoryCard: {
    width: 90,
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingFooterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 22,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productContainer: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: 8,
  },
});

export default ProductCategoryScreen;