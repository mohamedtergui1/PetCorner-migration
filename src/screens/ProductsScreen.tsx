// ProductScreen.tsx - Fixed sort by creation date
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  TextInput,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import FilterModal from '../components/filter/FilterModal';
import ProductCard2 from '../components/Product/ProductCard2';

// Import the new ProductService
import ProductService, { 
  Product, 
  PaginatedProductResponse, 
  ProductListResponse,
  FilteredProductsParams 
} from '../service/CustomProductApiService';

const { width } = Dimensions.get('window');

// =====================================
// TYPES AND INTERFACES
// =====================================

interface FilterOptions {
  animal_category?: number;
  brand?: string;
  category?: number;
  priceMin?: number;
  priceMax?: number;
}

interface ProductScreenProps {
  navigation: any;
  route: any;
}

interface PaginationData {
  total: number;
  page: number;
  page_count: number;
  limit: number;
  current_count: number;
  has_more: boolean;
}

// =====================================
// MAIN COMPONENT
// =====================================

export default function ProductScreen({ navigation, route }: ProductScreenProps) {
  const { isDarkMode, colorTheme } = useTheme();
  
  // =====================================
  // STATE MANAGEMENT
  // =====================================
  
  // Main data states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Display states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    total: 0,
    page: 0,
    page_count: 0,
    limit: 20,
    current_count: 0,
    has_more: false
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageSize] = useState(20);

  // =====================================
  // THEME COLORS
  // =====================================
  
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#0a0a0a' : '#f8f9fa';
  const CARD_BACKGROUND = isDarkMode ? '#1a1a1a' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#1a1a1a';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#a0a0a0' : '#6c757d';
  const BORDER_COLOR = isDarkMode ? '#2a2a2a' : '#e9ecef';

  // =====================================
  // EFFECTS
  // =====================================

  // Load products when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // =====================================
  // DATA LOADING FUNCTIONS
  // =====================================

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setShowFilterModal(false);
      
      // Reset pagination
      setCurrentPage(0);
      setProducts([]);
      setPaginationData({
        total: 0,
        page: 0,
        page_count: 0,
        limit: pageSize,
        current_count: 0,
        has_more: false
      });
      
      // Load products
      await loadProducts(true);
      
    } catch (error) {
      console.error('Erreur lors du chargement initial:', error);
      if (error instanceof Error && error.message && !error.message.includes('404') && !error.message.includes('empty')) {
        Alert.alert(
          'Erreur de chargement',
          'Impossible de charger les données. Vérifiez votre connexion.',
          [{ text: 'Réessayer', onPress: loadInitialData }, { text: 'Annuler' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Load products using the new service
  const loadProducts = async (resetPagination = false, filters: FilterOptions = {}, search = '') => {
    try {
      if (resetPagination) {
        setLoading(true);
        setCurrentPage(0);
        setProducts([]);
      } else {
        setLoadingMore(true);
      }

      const pageToLoad = resetPagination ? 0 : currentPage;
      
      console.log('📦 Chargement des produits - Page:', pageToLoad);
      console.log('🔍 Filtres:', filters, 'Recherche:', search);
      console.log('📊 Sort by:', sortBy);
      
      // Prepare parameters for the new service
      const params: FilteredProductsParams = {
        limit: pageSize,
        page: pageToLoad,
        pagination_data: true,
        includestockdata: 0,
        sortfield: getSortField(sortBy),  
        sortorder: getSortOrder(sortBy),
      };

      // Add filters
      if (filters.animal_category) params.animal_category = filters.animal_category;
      if (filters.category) params.category = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.priceMin !== undefined) params.price_min = filters.priceMin;
      if (filters.priceMax !== undefined) params.price_max = filters.priceMax;
      if (search && search.trim()) params.search = search.trim();

      console.log('🚀 API Params:', params);

      // Use the appropriate service method
      let result: PaginatedProductResponse | ProductListResponse;
      
      params.animal_category = params.animal_category ? params.animal_category : 1;
      result = await ProductService.getFilteredProducts(params);
      
      // Handle response
      let newProducts: Product[] = [];
      let newPaginationData: PaginationData = {
        total: 0,
        page: pageToLoad,
        page_count: 0,
        limit: pageSize,
        current_count: 0,
        has_more: false
      };

      if ('pagination' in result) {
        // Paginated response
        newProducts = result.data || [];
        newPaginationData = {
          total: result.pagination.total || 0,
          page: result.pagination.page || pageToLoad,
          page_count: result.pagination.page_count || 0,
          limit: result.pagination.limit || pageSize,
          current_count: newProducts.length,
          has_more: (result.pagination.page || 0) < (result.pagination.page_count || 0) - 1
        };
      } else {
        // Simple array response
        newProducts = result as Product[];
        newPaginationData = {
          total: newProducts.length,
          page: 0,
          page_count: 1,
          limit: pageSize,
          current_count: newProducts.length,
          has_more: false
        };
      }
      
      console.log('📊 Résultat pagination:', newPaginationData);
      console.log('📦 Produits reçus:', newProducts.length);
      
      // Apply local sorting if API sorting doesn't work properly
      if (newProducts.length > 0) {
        newProducts = sortProducts(newProducts, sortBy);
        console.log('🔄 Tri local appliqué:', sortBy);
      }
      
      if (resetPagination) {
        setProducts(newProducts);
        setCurrentPage(0);
        setPaginationData(newPaginationData);
      } else {
        setProducts(prevProducts => {
          const combinedProducts = [...prevProducts, ...newProducts];
          return sortProducts(combinedProducts, sortBy);
        });
        setCurrentPage(pageToLoad + 1);
        setPaginationData(prev => ({
          ...newPaginationData,
          current_count: prev.current_count + newProducts.length
        }));
      }
      
      setActiveFilters(filters);
      
      console.log('✅ Produits chargés:', {
        nouveaux: newProducts.length,
        total_affichés: resetPagination ? newProducts.length : products.length + newProducts.length,
        total_disponible: newPaginationData.total,
        page_actuelle: newPaginationData.page,
        total_pages: newPaginationData.page_count,
        tri_appliqué: sortBy
      });
      
      if (newProducts.length === 0) {
        console.log('ℹ️ Aucun produit trouvé pour cette recherche/filtre');
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      
      const isRealError = (error as any).response?.status >= 500 || 
                         (error as any).code === 'NETWORK_ERROR' || 
                         (error as Error).message?.includes('Network') ||
                         (error as Error).message?.includes('timeout');
      
      if (isRealError) {
        Alert.alert(
          'Erreur',
          'Impossible de charger les produits. Vérifiez votre connexion.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('ℹ️ Pas de produits trouvés ou erreur mineure:', (error as Error).message);
        
        if (resetPagination) {
          setProducts([]);
          setPaginationData({
            total: 0,
            page: 0,
            page_count: 0,
            limit: pageSize,
            current_count: 0,
            has_more: false
          });
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  // Get sort field for API - FIXED
  const getSortField = (sortType: string): string => {
    switch (sortType) {
      case 'price':
        return 'price_ttc';
      case 'name':
        return 'label';
      case 'date':
      default:
        // Try multiple possible field names for creation date
        // The API might use different field names
        return 'datec'; // Common Dolibarr field name
        // Alternative options to try: 'date_creation', 'tms', 'date_add', 'date_creation'
    }
  };

  // Get sort order for API
  const getSortOrder = (sortType: string): 'ASC' | 'DESC' => {
    switch (sortType) {
      case 'price':
      case 'name':
        return 'ASC';
      case 'date':
      default:
        return 'DESC'; // Most recent first
    }
  };

  // Sort products locally (for immediate UI feedback) - IMPROVED
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
          // Try multiple date fields that might exist in the product object
          const getProductDate = (product: Product): number => {
            // Try different possible date field names
            const dateFields = [
              'date_creation',
              'datec', 
              'tms',
              'date_add',
              'date_modif',
              'date_modification',
              'created_at',
              'updated_at'
            ];
            
            for (const field of dateFields) {
              const dateValue = (product as any)[field];
              if (dateValue) {
                const timestamp = typeof dateValue === 'string' ? 
                  new Date(dateValue).getTime() : 
                  typeof dateValue === 'number' ? dateValue * 1000 : // Unix timestamp
                  new Date(dateValue).getTime();
                
                if (!isNaN(timestamp)) {
                  console.log(`📅 Date trouvée pour ${product.label}: ${field} = ${dateValue} (${new Date(timestamp)})`);
                  return timestamp;
                }
              }
            }
            
            // Fallback: use product ID as a rough creation order indicator
            const productId = product.id ? parseInt(String(product.id)) : 0;
            console.log(`⚠️ Aucune date trouvée pour ${product.label}, utilisation de l'ID: ${productId}`);
            return productId;
          };
          
          const dateA = getProductDate(a);
          const dateB = getProductDate(b);
          
          return dateB - dateA; // Most recent first
        });
    }
  };

  // Load more products
  const loadMoreProducts = () => {
    const hasMore = (currentPage + 1) < paginationData.page_count;
    
    if (!loadingMore && hasMore && !loading) {
      console.log('📄 Chargement de la page suivante:', currentPage + 1);
      loadProducts(false, activeFilters, searchQuery);
    }
  };

  // =====================================
  // EVENT HANDLERS
  // =====================================

  // Refresh products
  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(true, activeFilters, searchQuery);
  };

  // Handle search input change
  const handleSearchInputChange = (text: string) => {
    setSearchInputValue(text);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  };

  // Perform search
  const performSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length > 2) {
      setSearchLoading(true);
      await loadProducts(true, activeFilters, query.trim());
    } else if (query.trim().length === 0) {
      setSearchLoading(true);
      await loadProducts(true, activeFilters, '');
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchInputValue('');
    setSearchQuery('');
    loadProducts(true, activeFilters, '');
  };

  // Apply filters - Updated to use new filter structure
  const handleApplyFilters = (filters: any) => {
    console.log('✅ Filtres appliqués:', filters);
    
    // Convert the filter format to match our internal structure
    const convertedFilters: FilterOptions = {};
    
    if (filters.animal) convertedFilters.animal_category = parseInt(filters.animal);
    if (filters.brand) convertedFilters.brand = filters.brand;
    if (filters.category) convertedFilters.category = parseInt(filters.category);
    if (filters.priceMin !== undefined) convertedFilters.priceMin = filters.priceMin;
    if (filters.priceMax !== undefined) convertedFilters.priceMax = filters.priceMax;
    
    setShowFilterModal(false);
    loadProducts(true, convertedFilters, searchQuery);
  };

  // Clear filters
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
            loadProducts(true, {}, searchQuery);
          }
        }
      ]
    );
  };

  // Change sort - IMPROVED
  const handleSortChange = (newSortBy: 'date' | 'price' | 'name') => {
    console.log('🔄 Changement de tri:', sortBy, '->', newSortBy);
    setSortBy(newSortBy);
    
    // Apply local sorting immediately for better UX
    if (products.length > 0) {
      const sortedProducts = sortProducts(products, newSortBy);
      setProducts(sortedProducts);
    }
    
    // Reload products with new sort from API
    loadProducts(true, activeFilters, searchQuery);
  };

  // Check active filters
  const hasActiveFilters = (): boolean => {
    return Object.keys(activeFilters).length > 0;
  };

  // Count active filters
  const getActiveFilterCount = (): number => {
    return Object.keys(activeFilters).length;
  };

  // Navigate to product details
  const navigateToProductDetails = (product: any) => {
    console.log('🔍 Navigate to ProductDetails called with:', { 
      productId: product.id, 
      productLabel: product.label 
    });
    
    try {
      // Navigate to ProductDetails with both productId and product for compatibility
      navigation.navigate('ProductDetails', { 
        productId: product.id,
        product: product 
      });
      console.log('✅ Navigation.navigate called successfully');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

  // Render product item
  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    if (!item) {
      console.warn(`ProductScreen: Item at index ${index} is undefined/null`);
      return null;
    }
    
    return (
      <ProductCard2
        navigation={navigation}
        product={item}
        onPress={navigateToProductDetails}
        viewMode={viewMode}
        isDarkMode={isDarkMode}
        colorTheme={colorTheme}
      />
    );
  };

  // Render loading footer
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        <Text style={[styles.loadingFooterText, { color: TEXT_COLOR_SECONDARY }]}>
          Chargement...
        </Text>
      </View>
    );
  };

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      <Text style={[styles.loadingText, { color: TEXT_COLOR_SECONDARY }]}>
        Chargement des produits...
      </Text>
    </View>
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={searchQuery ? "search-outline" : "basket-outline"} 
        size={64} 
        color={TEXT_COLOR_SECONDARY} 
      />
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
            : 'Revenez plus tard pour découvrir nos nouveaux produits'
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
  );

  // Render filter header
  const renderFilterHeader = () => {
    return (
      <View style={[styles.filterHeader, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
        <View style={styles.filterHeaderLeft}>
          <Ionicons name="apps-outline" size={18} color={PRIMARY_COLOR} />
          <View style={styles.productCountContainer}>
            <Text style={[styles.filterHeaderText, { color: TEXT_COLOR }]}>
              Affichage de {products.length} sur {paginationData.total} produits
            </Text>
            {(hasActiveFilters() || searchQuery) && (
              <Text style={[styles.filterSubText, { color: TEXT_COLOR_SECONDARY }]}>
                {searchQuery && `Recherche: "${searchQuery}"`}
                {hasActiveFilters() && searchQuery && ' • '}
                {hasActiveFilters() && `${getActiveFilterCount()} filtre${getActiveFilterCount() > 1 ? 's' : ''} actif${getActiveFilterCount() > 1 ? 's' : ''}`}
              </Text>
            )}
            <Text style={[styles.sortIndicator, { color: PRIMARY_COLOR }]}>
              Trié par: {sortBy === 'date' ? 'Date de création' : sortBy === 'price' ? 'Prix' : 'Nom'}
            </Text>
          </View>
        </View>
        
        <View style={styles.filterHeaderRight}>
          {hasActiveFilters() && (
            <TouchableOpacity
              style={[styles.clearFiltersButtonSmall, { backgroundColor: SECONDARY_COLOR + '20', borderColor: SECONDARY_COLOR }]}
              onPress={handleClearFilters}
            >
              <Ionicons name="close" size={14} color={SECONDARY_COLOR} />
              <Text style={[styles.clearFiltersTextSmall, { color: SECONDARY_COLOR }]}>Filtres</Text>
            </TouchableOpacity>
          )}
          
          {searchQuery && (
            <TouchableOpacity
              style={[styles.clearFiltersButtonSmall, { backgroundColor: PRIMARY_COLOR + '20', borderColor: PRIMARY_COLOR }]}
              onPress={clearSearch}
            >
              <Ionicons name="close" size={14} color={PRIMARY_COLOR} />
              <Text style={[styles.clearFiltersTextSmall, { color: PRIMARY_COLOR }]}>Recherche</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render pagination info
  const renderPaginationInfo = () => {
    if (paginationData.page_count <= 1) return null;
    
    const hasMore = (currentPage + 1) < paginationData.page_count;
    const currentPageDisplay = Math.floor(products.length / pageSize) + (products.length % pageSize > 0 ? 1 : 0);
    
    return (
      <View style={[styles.paginationInfo, { backgroundColor: CARD_BACKGROUND + '80', borderColor: BORDER_COLOR }]}>
        <Text style={[styles.paginationText, { color: TEXT_COLOR_SECONDARY }]}>
          Page {currentPageDisplay} / {paginationData.page_count}
        </Text>
        {hasMore && (
          <View style={styles.paginationIndicator}>
            <Text style={[styles.paginationIndicatorText, { color: PRIMARY_COLOR }]}>
              Faites défiler pour plus
            </Text>
            <Ionicons name="chevron-down" size={14} color={PRIMARY_COLOR} />
          </View>
        )}
      </View>
    );
  };

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

  // =====================================
  // MAIN RENDER
  // =====================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name='arrow-back' size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Produits</Text>
            {paginationData.total > 0 && (
              <Text style={styles.headerCount}>({paginationData.total})</Text>
            )}
          </View>
          {paginationData.total > 0 && (
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

      {/* Main content */}
      <View style={styles.content}>
        {loading ? (
          renderLoading()
        ) : (
          <>
            {renderFilterHeader()}
            {renderToolbar()}
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item, index) => {
                const uniqueId = item.id || index;
                return `product-${uniqueId}-${index}`;
              }}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode}
              columnWrapperStyle={viewMode === 'grid' ? styles.productRow : null}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[PRIMARY_COLOR]}
                  tintColor={PRIMARY_COLOR}
                />
              }
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderFooter}
              onEndReached={loadMoreProducts}
              onEndReachedThreshold={0.5}
            />
            {renderPaginationInfo()}
          </>
        )}
      </View>

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={activeFilters}
          showAnimalFilter={true}
          showBrandFilter={true}
          showCategoryFilter={true}
          showPriceFilter={true}
        />
      )}
    </SafeAreaView>
  );
}

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
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
  headerButton: {
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
  
  // Content
  content: {
    flex: 1,
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
  
  // Pagination Info
  paginationInfo: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paginationText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  paginationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paginationIndicatorText: {
    fontSize: 10,
    fontWeight: '500',
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
  
  // Product List
  productList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  
  // Loading Footer
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
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
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
});