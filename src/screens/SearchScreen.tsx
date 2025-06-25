// SearchScreen.tsx - Enhanced with Complete Filter Integration (Matching ProductScreen)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FilterModal from '../components/filter/FilterModal';
import ProductCard2 from '../components/Product/ProductCard2';

// Import the ProductService
import ProductService, { 
  Product, 
  PaginatedProductResponse, 
  ProductListResponse,
  SearchParams,
  FilteredProductsParams
} from '../service/CustomProductApiService';

// =====================================
// TYPES AND INTERFACES
// =====================================

interface FilterOptions {
  animal_category?: number;
  brand?: string;
  category?: number;
  priceMin?: number;
  priceMax?: number;
  ages?: string;
  taste?: string;
  health_option?: string;
  nutritional_option?: string;
  game?: string;
}

interface SearchScreenProps {
  navigation: any;
  route?: any;
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
// CONSTANTS
// =====================================

const PAGE_SIZE = 20;

// Category mapping from filterData IDs to API category IDs
const CATEGORY_MAPPING: { [key: string]: number } = {
  "2": 2, // Chien -> API category 2
  "3": 3, // Chat -> API category 3
  "184": 184, // Lapin -> API category 184
  "21": 21, // Poisson -> API category 21
  "31": 31, // Reptile -> API category 31
  "20": 20, // Oiseau -> API category 20
};

// =====================================
// MAIN COMPONENT
// =====================================

export default function SearchScreen({ navigation, route }: SearchScreenProps) {
  const { isDarkMode, colorTheme } = useTheme();
  
  // =====================================
  // STATE MANAGEMENT
  // =====================================
  
  // UI States
  const [modalVisible, setModalVisible] = useState(false);
  const [textInputFocussed, setTextInputFocussed] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Search States
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  
  // Filter States
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    total: 0,
    page: 0,
    page_count: 0,
    limit: PAGE_SIZE,
    current_count: 0,
    has_more: false,
  });
  
  // Category Selection (Default to category 1 for search)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("1");
  const [categoryName, setCategoryName] = useState("Toutes catégories");
  
  // Failed image loads tracking
  const [failedImageLoads, setFailedImageLoads] = useState<Set<string>>(new Set());
  
  // Refs
  const textInput = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef<boolean>(false);

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
  // UTILITY FUNCTIONS
  // =====================================

  // Apply client-side filters for advanced filtering
  const applyClientSideFilters = (productsList: Product[], filters: FilterOptions): Product[] => {
    let filteredProducts = [...productsList];

    // Filter by ages (using correct field: options_ftfonctionnalites)
    if (filters.ages) {
      filteredProducts = filteredProducts.filter(product => {
        const productAges = product.array_options?.options_ftfonctionnalites;
        if (!productAges) return false;
        return productAges.toString().includes(filters.ages!.toString());
      });
    }

    // Filter by taste (using correct field: options_sousgamme)
    if (filters.taste) {
      filteredProducts = filteredProducts.filter(product => {
        const productTaste = product.array_options?.options_sousgamme;
        if (!productTaste) return false;
        return productTaste.toString().includes(filters.taste!.toString());
      });
    }

    // Filter by health options (using correct field: options_gamme)
    if (filters.health_option) {
      filteredProducts = filteredProducts.filter(product => {
        const healthOption = product.array_options?.options_gamme;
        if (!healthOption) return false;
        return healthOption.toString().includes(filters.health_option!.toString());
      });
    }

    // Filter by nutritional options (using correct field: options_trancheage)
    if (filters.nutritional_option) {
      filteredProducts = filteredProducts.filter(product => {
        const nutritionalOption = product.array_options?.options_trancheage;
        if (!nutritionalOption) return false;
        return nutritionalOption.toString().includes(filters.nutritional_option!.toString());
      });
    }

    // Filter by game/product line
    if (filters.game) {
      filteredProducts = filteredProducts.filter(product => {
        const productGame = product.array_options?.options_gamme;
        if (!productGame) return false;
        return productGame.toString().includes(filters.game!.toString());
      });
    }

    console.log('🔍 Client-side filtering applied:', {
      original: productsList.length,
      filtered: filteredProducts.length,
      filters_applied: Object.keys(filters).filter(key => (filters as any)[key]).length,
      filter_details: {
        ages: filters.ages,
        taste: filters.taste,
        health_option: filters.health_option,
        nutritional_option: filters.nutritional_option,
        game: filters.game
      }
    });

    return filteredProducts;
  };

  // Get sort field for API
  const getSortField = (sortType: string): string => {
    switch (sortType) {
      case 'price':
        return 'price_ttc';
      case 'name':
        return 't.label';
      case 'date':
      default:
        return 'ref';
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
        return 'DESC';
    }
  };

  // Sort products locally
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
            const dateFields = [
              'date_creation',
              'date_modification', 
              'datec',
              'tms',
              'date_add'
            ];
            
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
            
            return product.id ? parseInt(String(product.id)) : 0;
          };
          
          const dateA = getProductDate(a);
          const dateB = getProductDate(b);
          
          return dateB - dateA;
        });
    }
  };

  // Remove duplicate products
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

  // =====================================
  // ENHANCED API FUNCTIONS WITH FILTERS
  // =====================================

  // Enhanced loadProducts function with complete filter support - Matching ProductScreen
  const loadProducts = async (resetPagination = false, filters: FilterOptions = {}, search = '') => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      if (resetPagination) {
        setLoading(true);
        setCurrentPage(0);
        setProducts([]);
        setError(null);
        setIsNotFound(false);
        setFailedImageLoads(new Set());
      } else {
        setLoadingMore(true);
      }

      const pageToLoad = resetPagination ? 0 : currentPage;
      
      console.log('📦 Chargement des produits - Page:', pageToLoad);
      console.log('🔍 Filtres complets:', filters, 'Recherche:', search);
      console.log('📊 Sort by:', sortBy);
      
      // Calculate category to use - Default to category 1 for search when no specific category is selected
      const categoryToUse = filters.category || filters.animal_category || 1;
      
      console.log('🏷️ Category logic:', {
        selected_category: filters.category,
        selected_animal: filters.animal_category,
        final_category: categoryToUse,
        logic: 'category || animal_category || 1 (default to 1 for search)'
      });
      
      // Determine which endpoint to use based on filters
      let result: PaginatedProductResponse | ProductListResponse;
      
      // Check if we need to use the filtered endpoint (for complex filtering)
      const needsFilteredEndpoint = !!(
        filters.animal_category || 
        filters.priceMin || 
        filters.priceMax ||
        filters.ages ||
        filters.taste ||
        filters.health_option ||
        filters.nutritional_option ||
        filters.game ||
        true // Always use filtered endpoint since we always have a default category (1)
      );

      if (needsFilteredEndpoint) {
        // Use the filtered endpoint for complex filtering
        const filteredParams: FilteredProductsParams = {
          limit: PAGE_SIZE,
          page: pageToLoad,
          sortfield: getSortField(sortBy),
          sortorder: getSortOrder(sortBy),
          pagination_data: true,
          includestockdata: 0,
        };

        // Add all available filters to filtered endpoint
        if (filters.animal_category) filteredParams.animal_category = filters.animal_category;
        
        // Always set the category using our logic (default to 1)
        filteredParams.category = categoryToUse;
        if (filters.brand) filteredParams.brand = filters.brand;
        if (search && search.trim()) filteredParams.search = search.trim();
        if (filters.priceMin !== undefined) filteredParams.price_min = filters.priceMin;
        if (filters.priceMax !== undefined) filteredParams.price_max = filters.priceMax;
        
        // Add all Dolibarr-specific filters
        if (filters.ages) filteredParams.ages = filters.ages;
        if (filters.taste) filteredParams.taste = filters.taste;
        if (filters.health_option) filteredParams.health_option = filters.health_option;
        if (filters.nutritional_option) filteredParams.nutritional_option = filters.nutritional_option;
        if (filters.game) filteredParams.game = filters.game;

        console.log('🚀 Using filtered endpoint with params:', filteredParams);
        result = await ProductService.getFilteredProducts(filteredParams);
        
      } else {
        // Use the standard search endpoint for simple filtering
        const searchParams: SearchParams = {
          limit: PAGE_SIZE,
          page: pageToLoad,
          pagination_data: true,
          includestockdata: 0,
          sortfield: getSortField(sortBy),
          sortorder: getSortOrder(sortBy),
        };

        // For search, set default category to 1 unless specified
        searchParams.categories = categoryToUse.toString();
        
        if (filters.brand) searchParams.brand = filters.brand;
        if (search && search.trim()) searchParams.search_name = search.trim();
        
        // Add all Dolibarr-specific filters to search endpoint too
        if (filters.game) searchParams.game = filters.game;
        if (filters.taste) searchParams.taste = filters.taste;
        if (filters.ages) searchParams.ages = filters.ages;
        if (filters.health_option) searchParams.health_option = filters.health_option;
        if (filters.nutritional_option) searchParams.nutritional_option = filters.nutritional_option;

        console.log('🚀 Using search endpoint with params:', searchParams);
        result = await ProductService.searchProducts(searchParams);
      }
      
      // Handle response
      let newProducts: Product[] = [];
      let newPaginationData: PaginationData = {
        total: 0,
        page: pageToLoad,
        page_count: 0,
        limit: PAGE_SIZE,
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
          limit: result.pagination.limit || PAGE_SIZE,
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
          limit: PAGE_SIZE,
          current_count: newProducts.length,
          has_more: false
        };
      }
      
      // Apply client-side filtering for advanced filters not supported by API
      if (newProducts.length > 0) {
        console.log('🔧 Before client-side filtering:', newProducts.length);
        newProducts = applyClientSideFilters(newProducts, filters);
        console.log('🔧 After client-side filtering:', newProducts.length);
        newProducts = sortProducts(newProducts, sortBy);
        console.log('🔧 After sorting:', newProducts.length);
      }
      
      console.log('📊 Résultat pagination:', newPaginationData);
      console.log('📦 Produits reçus:', newProducts.length);
      
      if (resetPagination) {
        const uniqueProducts = removeDuplicateProducts(newProducts);
        setProducts(uniqueProducts);
        setCurrentPage(0);
        setPaginationData(newPaginationData);
      } else {
        setProducts(prevProducts => {
          const combinedProducts = [...prevProducts, ...newProducts];
          return removeDuplicateProducts(sortProducts(combinedProducts, sortBy));
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
        tri_appliqué: sortBy,
        filtres_actifs: Object.keys(filters).length,
        catégorie_finale: categoryToUse,
        filtres_détails: filters
      });
      
      if (newProducts.length === 0) {
        console.log('ℹ️ Aucun produit trouvé pour cette recherche/filtre');
        setIsNotFound(true);
        setError("No products found");
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      
      // Check if it's a 404 error or no products found
      if (error?.response?.status === 404 || error?.message?.includes("404") || error?.message?.includes("Not Found")) {
        setIsNotFound(true);
        setError("No products found");
      } else {
        setError("Une erreur est survenue lors du chargement des produits");
      }

      // Reset products on error
      if (resetPagination) {
        setProducts([]);
        setPaginationData({
          total: 0,
          page: 0,
          page_count: 0,
          limit: PAGE_SIZE,
          current_count: 0,
          has_more: false,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearchLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  // Load more products
  const loadMoreProducts = () => {
    const hasMore = (currentPage + 1) < paginationData.page_count;
    
    if (!loadingMore && hasMore && !loading && !error && !isLoadingRef.current) {
      console.log('📄 Loading more products - page:', currentPage + 1);
      loadProducts(false, activeFilters, searchQuery);
    }
  };

  // =====================================
  // EVENT HANDLERS
  // =====================================

  // Handle search input change
  const handleSearchInputChange = (text: string) => {
    setSearchText(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Reset error states when user types
    setError(null);
    setIsNotFound(false);

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(text);
      loadProducts(true, activeFilters, text);
    }, 500);
  };

  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      setSearchQuery(searchText.trim());
      loadProducts(true, activeFilters, searchText.trim());
      setModalVisible(false);
      Keyboard.dismiss();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchText("");
    setSearchQuery('');
    textInput.current?.clear();
    setError(null);
    setIsNotFound(false);
    
    // Ensure we maintain default category 1 when clearing search
    const filtersToUse = Object.keys(activeFilters).length > 0 ? activeFilters : { category: 1 };
    loadProducts(true, filtersToUse, "");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setTextInputFocussed(false);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    setIsNotFound(false);
    loadProducts(true, activeFilters, searchQuery);
  };

  // Navigate to product details
  const navigateToProductDetails = (product: Product) => {
    console.log("🔍 Navigate to ProductDetails:", product.id);
    navigation.navigate("ProductDetails", {
      productId: product.id,
      product: product,
    });
  };

  // Apply filters - Enhanced to handle all filter types like ProductScreen
  const handleApplyFilters = (filters: any) => {
    console.log('✅ Filtres appliqués (complets):', filters);
    
    // Convert the filter format to match our internal structure
    const convertedFilters: FilterOptions = {};
    
    if (filters.animal_category !== undefined) convertedFilters.animal_category = parseInt(filters.animal_category);
    if (filters.brand) convertedFilters.brand = filters.brand;
    if (filters.category !== undefined) convertedFilters.category = parseInt(filters.category);
    if (filters.priceMin !== undefined) convertedFilters.priceMin = filters.priceMin;
    if (filters.priceMax !== undefined) convertedFilters.priceMax = filters.priceMax;
    if (filters.ages) convertedFilters.ages = filters.ages;
    if (filters.taste) convertedFilters.taste = filters.taste;
    if (filters.health_option) convertedFilters.health_option = filters.health_option;
    if (filters.nutritional_option) convertedFilters.nutritional_option = filters.nutritional_option;
    if (filters.game) convertedFilters.game = filters.game;
    
    // If no category is specified, default to category 1
    if (!convertedFilters.category && !convertedFilters.animal_category) {
      convertedFilters.category = 1;
    }
    
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
            // Reset to default category 1 when clearing filters
            const defaultFilters = { category: 1 };
            setActiveFilters(defaultFilters);
            loadProducts(true, defaultFilters, searchQuery);
          }
        }
      ]
    );
  };

  // Change sort
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

  // Handle image error
  const handleImageError = useCallback((productId: string): void => {
    setFailedImageLoads((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });
  }, []);

  // Get active filter display with proper labels - Matching ProductScreen
  const getActiveFilterDisplay = (): string => {
    const filterLabels: string[] = [];
    
    // Animal names mapping
    if (activeFilters.animal_category) {
      const animalNames: { [key: number]: string } = {
        2: 'Chien', 3: 'Chat', 184: 'Lapin', 21: 'Poisson', 31: 'Reptile', 20: 'Oiseau'
      };
      filterLabels.push(animalNames[activeFilters.animal_category] || `Animal ${activeFilters.animal_category}`);
    }
    
    // Brand (already a string)
    if (activeFilters.brand) filterLabels.push(activeFilters.brand);
    
    // Ages mapping
    if (activeFilters.ages) {
      const ageNames: { [key: string]: string } = {
        '1': 'Adulte',
        '2': 'Senior', 
        '3': 'Junior',
        '4': 'Première âge',
        '5': 'Chatons',
        '6': 'Chiots'
      };
      const ageName = ageNames[activeFilters.ages] || activeFilters.ages;
      filterLabels.push(`Âge: ${ageName}`);
    }
    
    // Taste mapping
    if (activeFilters.taste) {
      const tasteNames: { [key: string]: string } = {
        '1': 'Boeuf',
        '2': 'Poulet',
        '3': 'Canard', 
        '4': 'Poisson',
        '5': 'Agneau',
        '6': 'Autre'
      };
      const tasteName = tasteNames[activeFilters.taste] || activeFilters.taste;
      filterLabels.push(`Goût: ${tasteName}`);
    }
    
    // Health options mapping
    if (activeFilters.health_option) {
      const healthNames: { [key: string]: string } = {
        '1': 'Stériles',
        '2': 'Allergies',
        '3': 'Vessies',
        '4': 'Croissances',
        '5': 'Vieillissements',
        '6': 'Respirations',
        '7': 'Poils et peaux',
        '8': 'Digestifs',
        '9': 'Surpoids',
        '10': 'Sensibles',
        '11': 'Allaitantes ou gestantes',
        '12': 'Immunités',
        '13': 'Dentaires'
      };
      const healthName = healthNames[activeFilters.health_option] || activeFilters.health_option;
      filterLabels.push(`Santé: ${healthName}`);
    }
    
    // Nutritional options mapping
    if (activeFilters.nutritional_option) {
      const nutritionalNames: { [key: string]: string } = {
        '1': 'Sans céréales',
        '2': 'Ingrédient limité',
        '3': 'Bio',
        '4': 'Sans OGM',
        '5': 'Sans gluten',
        '6': 'Sans sucre',
        '7': 'Végétarien',
        '8': 'Riche en protéine',
        '9': 'Équilibré'
      };
      const nutritionalName = nutritionalNames[activeFilters.nutritional_option] || activeFilters.nutritional_option;
      filterLabels.push(`Nutrition: ${nutritionalName}`);
    }
    
    // Game/Product line
    if (activeFilters.game) {
      filterLabels.push(`Gamme: ${activeFilters.game}`);
    }
    
    // Price range
    if (activeFilters.priceMin || activeFilters.priceMax) {
      const priceRange = `${activeFilters.priceMin || 0} - ${activeFilters.priceMax || '∞'} DH`;
      filterLabels.push(`Prix: ${priceRange}`);
    }
    
    return filterLabels.join(' • ');
  };

  // =====================================
  // EFFECTS
  // =====================================

  // Load products when screen focuses - Load with default category 1
  useFocusEffect(
    useCallback(() => {
      // Ensure we have a default category (1) when first loading
      const initialFilters = Object.keys(activeFilters).length > 0 ? activeFilters : { category: 1 };
      loadProducts(true, initialFilters, searchQuery);
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
  // RENDER FUNCTIONS
  // =====================================

  // Enhanced render product item with view modes
  const renderProduct = ({ item, index }: { item: Product, index: number }) => {
    if (!item) {
      console.warn(`SearchScreen: Item at index ${index} is undefined/null`);
      return null;
    }
    
    const hasImageFailed: boolean = failedImageLoads.has(item.id);
    const productCardProps = {
      navigation,
      product: {
        ...item,
        image_link: hasImageFailed ? null : item.image_link,
        photo_link: hasImageFailed ? null : item.photo_link
      },
      onPress: () => navigateToProductDetails(item),
      viewMode: viewMode,
      isDarkMode,
      colorTheme,
      onImageError: () => handleImageError(item.id)
    };

    return (
      <View style={viewMode === 'grid' ? styles.productContainer : styles.productContainerList}>
        <ProductCard2 {...productCardProps} />
      </View>
    );
  };

  // Enhanced Empty/Error Component
  const renderEmptyOrError = () => {
    if (error || isNotFound) {
      return (
        <View style={styles.emptyResults}>
          <Ionicons
            name={isNotFound ? "search-outline" : "alert-circle-outline"}
            size={64}
            color={TEXT_COLOR_SECONDARY}
          />
          <Text style={[styles.emptyResultsTitle, { color: TEXT_COLOR }]}>
            {isNotFound ? "Aucun produit trouvé" : "Erreur de chargement"}
          </Text>
          <Text style={[styles.emptyResultsText, { color: TEXT_COLOR_SECONDARY }]}>
            {isNotFound
              ? searchQuery
                ? `Aucun produit ne correspond à "${searchQuery}"`
                : hasActiveFilters() 
                  ? 'Aucun produit trouvé avec ces filtres'
                  : `Aucun produit disponible`
              : error || "Une erreur est survenue lors du chargement"}
          </Text>
          <View style={styles.emptyActions}>
            {(searchQuery || hasActiveFilters()) && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={() => {
                  if (searchQuery) {
                    clearSearch();
                  } else {
                    handleClearFilters();
                  }
                }}
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {searchQuery ? 'Effacer la recherche' : 'Supprimer les filtres'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: PRIMARY_COLOR,
                },
              ]}
              onPress={() => loadProducts(true, activeFilters, searchQuery)}
            >
              <Ionicons name="reload" size={16} color={PRIMARY_COLOR} />
              <Text style={[styles.actionButtonText, { color: PRIMARY_COLOR }]}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    // Default empty state (no error)
    return (
      <View style={styles.emptyResults}>
        <Ionicons name="search-outline" size={64} color={TEXT_COLOR_SECONDARY} />
        <Text style={[styles.emptyResultsTitle, { color: TEXT_COLOR }]}>
          {searchQuery ? "Aucun résultat trouvé" : "Commencez votre recherche"}
        </Text>
        <Text style={[styles.emptyResultsText, { color: TEXT_COLOR_SECONDARY }]}>
          {searchQuery
            ? `Aucun produit ne correspond à "${searchQuery}"`
            : "Utilisez la barre de recherche pour trouver des produits"}
        </Text>
        {(searchQuery || hasActiveFilters()) && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} 
            onPress={() => {
              if (searchQuery) {
                clearSearch();
              } else {
                handleClearFilters();
              }
            }}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {searchQuery ? 'Effacer la recherche' : 'Supprimer les filtres'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // Render loading footer
  const renderFooter = () => {
    if (!loadingMore) return null

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        <Text style={[styles.loadingFooterText, { color: TEXT_COLOR_SECONDARY }]}>Chargement...</Text>
      </View>
    )
  }

  // Enhanced render header info with filter indicators - Matching ProductScreen
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
              <Text style={[styles.filterSubText, { color: TEXT_COLOR_SECONDARY }]} numberOfLines={2}>
                {searchQuery && `Recherche: "${searchQuery}"`}
                {hasActiveFilters() && searchQuery && ' • '}
                {hasActiveFilters() && getActiveFilterDisplay()}
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

  // Render toolbar - Same as ProductScreen
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

  // Render pagination info - Same as ProductScreen
  const renderPaginationInfo = () => {
    if (paginationData.page_count <= 1) return null;
    
    const hasMore = (currentPage + 1) < paginationData.page_count;
    const currentPageDisplay = Math.floor(products.length / PAGE_SIZE) + (products.length % PAGE_SIZE > 0 ? 1 : 0);
    
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

  // =====================================
  // MAIN RENDER
  // =====================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={BACKGROUND_COLOR} />

      {/* Enhanced Header with Filter Button */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Recherche</Text>
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
            style={[styles.headerIconButton, { 
              backgroundColor: hasActiveFilters() ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
            }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="funnel" size={18} color="#fff" />
            {hasActiveFilters() && (
              <View style={styles.headerBadgeIcon}>
                <Text style={styles.headerBadgeIconText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(true)}>
          <View
            style={[
              styles.searchArea,
              {
                backgroundColor: CARD_BACKGROUND,
                borderColor: BORDER_COLOR,
                shadowColor: isDarkMode ? "#000" : PRIMARY_COLOR,
              },
            ]}
          >
            <Ionicons name="search" size={22} color={TEXT_COLOR_SECONDARY} style={styles.searchIcon} />
            <Text style={[styles.searchPlaceholder, { color: searchText ? TEXT_COLOR : TEXT_COLOR_SECONDARY }]}>
              {searchText || "Qu'est-ce que vous cherchez ?"}
            </Text>
            {searchText && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearSearchIcon}>
                <Ionicons name="close-circle" size={20} color={TEXT_COLOR_SECONDARY} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Search Modal */}
      <Modal animationType="slide" transparent={false} visible={modalVisible}>
        <SafeAreaView style={[styles.modal, { backgroundColor: BACKGROUND_COLOR }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: PRIMARY_COLOR }]}>
            <TouchableOpacity style={styles.modalBackButton} onPress={handleModalClose}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Rechercher</Text>
            <View style={styles.headerRightSpace}>
              {/* Empty space for symmetry */}
            </View>
          </View>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <View
              style={[
                styles.searchInputWrapper,
                {
                  borderColor: textInputFocussed ? PRIMARY_COLOR : BORDER_COLOR,
                  backgroundColor: CARD_BACKGROUND,
                  shadowColor: isDarkMode ? "#000" : PRIMARY_COLOR,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={20}
                color={textInputFocussed ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: TEXT_COLOR }]}
                placeholder="Tapez votre recherche..."
                placeholderTextColor={TEXT_COLOR_SECONDARY}
                autoFocus={true}
                ref={textInput}
                value={searchText}
                onFocus={() => setTextInputFocussed(true)}
                onBlur={() => setTextInputFocussed(false)}
                onChangeText={handleSearchInputChange}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color={TEXT_COLOR_SECONDARY} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: TEXT_COLOR_SECONDARY }]}>
              Recherche dans toutes les catégories
            </Text>
            <Text style={[styles.infoSubText, { color: TEXT_COLOR_SECONDARY }]}>
              Utilisez les filtres pour affiner votre recherche
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>Chargement des produits...</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {!error && !isNotFound && renderFilterHeader()}
          {!error && !isNotFound && renderToolbar()}
          <FlatList
            data={products}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderProduct}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode}
            columnWrapperStyle={viewMode === 'grid' && products.length > 0 ? styles.productRow : null}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[PRIMARY_COLOR]}
                tintColor={PRIMARY_COLOR}
              />
            }
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyOrError}
          />
          {renderPaginationInfo()}
        </View>
      )}

      {/* Filter Modal - Same as ProductScreen with all filter options */}
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
          showAgeFilter={true}
          showTasteFilter={true}
          showHealthFilter={true}
          showNutritionalFilter={true}
        />
      )}
    </SafeAreaView>
  )
}

// =====================================
// ENHANCED STYLES - Matching ProductScreen
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
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  headerBadgeIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  headerBadgeIconText: {
    fontSize: 10,
    color: '#007afe',
    fontWeight: '700',
  },
  headerRightSpace: {
    width: 36,
  },

  // Search Container
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchArea: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  clearSearchIcon: {
    padding: 4,
  },
  
  // Modal
  modal: {
    flex: 1,
  },
  modalHeader: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  infoSubText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  
  // Content
  contentContainer: {
    flex: 1,
  },
  
  // Filter Header - Same as ProductScreen
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
  
  // Pagination Info - Same as ProductScreen
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
  
  // Toolbar - Same as ProductScreen
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
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  loadingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingFooterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  
  // Product container styles for different view modes
  productRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productContainer: {
    flex: 1,
    maxWidth: "50%",
    paddingHorizontal: 8,
  },
  productContainerList: {
    flex: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  productsList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  
  // Empty/Error states
  emptyResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyResultsTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyResultsText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});