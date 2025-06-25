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
import FilterModal from '../components/filter/FilterModal';

// Import the ProductService
import ProductService, { 
  Product, 
  PaginatedProductResponse, 
  ProductListResponse,
  SearchParams,
  FilteredProductsParams
} from '../service/CustomProductApiService';

// Type definitions
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

// Enhanced FilterOptions interface (same as ProductScreen)
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

interface PaginationData {
  total: number;
  page: number;
  page_count: number;
  limit: number;
  current_count: number;
  has_more: boolean;
}

const ProductCategoryScreen: React.FC<ProductCategoryScreenProps> = ({ navigation, route }) => {
  // Theme colors with explicit types
  const { isDarkMode, colorTheme } = useTheme();
  const PRIMARY_COLOR: string = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR: string = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR: string = isDarkMode ? '#0a0a0a' : '#f8f9fa';
  const CARD_BACKGROUND: string = isDarkMode ? '#1a1a1a' : '#ffffff';
  const TEXT_COLOR: string = isDarkMode ? '#ffffff' : '#1a1a1a';
  const TEXT_COLOR_SECONDARY: string = isDarkMode ? '#a0a0a0' : '#6c757d';
  const BORDER_COLOR: string = isDarkMode ? '#2a2a2a' : '#e9ecef';

  // Enhanced state management (same as ProductScreen)
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    route.params?.categoryId || filterData[0]?.id || "2"
  );
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [failedImageLoads, setFailedImageLoads] = useState<Set<string>>(new Set());

  // Pagination states (same as ProductScreen)
  const [currentPage, setCurrentPage] = useState(0);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    total: 0,
    page: 0,
    page_count: 0,
    limit: 20,
    current_count: 0,
    has_more: false
  });
  const [pageSize] = useState(20);
  
  // Filter and search states (same as ProductScreen)
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isLoadingRef = useRef<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // =====================================
  // UTILITY FUNCTIONS (same as ProductScreen)
  // =====================================

  // Apply client-side filters for advanced filtering (using correct Dolibarr fields)
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
            const dateFields = [
              'date_creation',
              'date_modification',
              'date_creation_formatted',
              'date_modification_formatted'
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

  // Get active filter display with proper labels (same as ProductScreen)
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
  // DATA LOADING FUNCTIONS (Enhanced like ProductScreen)
  // =====================================

  // Enhanced loadProducts function with complete filter support
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
        setProducts([]);
        setPaginationData({
          total: 0,
          page: 0,
          page_count: 0,
          limit: pageSize,
          current_count: 0,
          has_more: false
        });
        setFailedImageLoads(new Set());
      } else {
        setLoadingMore(true);
      }

      const pageToLoad: number = resetPagination ? 0 : currentPage;
      const selectedCategory: Category | undefined = filterData.find(
        (cat: Category) => cat.id === categoryId
      );

      console.log('📦 Chargement des produits - Page:', pageToLoad);
      console.log('🔍 Filtres complets:', filters, 'Recherche:', search);
      console.log('📊 Sort by:', sortBy);
      
      // Calculate category to use (same logic as ProductScreen)
      const categoryToUse = filters.category || parseInt(categoryId) || 1;
      
      console.log('🏷️ Category logic:', {
        selected_category: filters.category,
        category_from_route: categoryId,
        final_category: categoryToUse,
        logic: 'category || categoryId || 1'
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
        filters.game
      );

      if (needsFilteredEndpoint) {
        // Use the filtered endpoint for complex filtering
        const filteredParams: FilteredProductsParams = {
          limit: pageSize,
          page: pageToLoad,
          sortfield: getSortField(sortBy),
          sortorder: getSortOrder(sortBy),
          pagination_data: true,
          includestockdata: 0,
        };

        // Add all available filters to filtered endpoint
        if (filters.animal_category) filteredParams.animal_category = filters.animal_category;
        
        // Always set the category using our logic
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
          limit: pageSize,
          page: pageToLoad,
          pagination_data: true,
          includestockdata: 0,
          sortfield: getSortField(sortBy),
          sortorder: getSortOrder(sortBy),
        };

        // Add basic filters using our category logic
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

      // Handle response (same logic as ProductScreen)
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
      
      setCategoryName(selectedCategory?.name || '');
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
        console.log('🔍 Filtres appliqués:', filters);
        console.log('🔍 Recherche:', search);
      }

    } catch (error) {
      console.error('❌ Error loading products:', error);
      
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
        setCurrentPage(0);
      }
      
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      setSearchLoading(false);
      isLoadingRef.current = false;
    }
  }, [removeDuplicateProducts, sortBy, pageSize]);

  // =====================================
  // EVENT HANDLERS (Enhanced like ProductScreen)
  // =====================================

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

  // Filter functionality (Enhanced with all filter types)
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

  // Load more products (same logic as ProductScreen)
  const loadMoreProducts = useCallback((): void => {
    const hasMore = (currentPage + 1) < paginationData.page_count;
    
    if (!loadingMore && hasMore && !loading) {
      console.log('📄 Chargement de la page suivante:', currentPage + 1);
      loadProducts(selectedCategoryId, false, activeFilters, searchQuery);
    }
  }, [loadingMore, loading, currentPage, paginationData.page_count, selectedCategoryId, activeFilters, searchQuery, loadProducts]);

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
      setPaginationData({
        total: 0,
        page: 0,
        page_count: 0,
        limit: pageSize,
        current_count: 0,
        has_more: false
      });
      setCurrentPage(0);
      setFailedImageLoads(new Set());
      setSelectedCategoryId(categoryId);
    }
  }, [selectedCategoryId, pageSize]);

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

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

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

  // Render search bar (same as ProductScreen)
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

  // Render filter header (same as ProductScreen)
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

  // Render toolbar (same as ProductScreen)
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

      {/* Enhanced Header with Search and Filter (same as ProductScreen) */}
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
              {paginationData.total}
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
            onEndReachedThreshold={0.3}
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

      {/* Filter Modal with all filters enabled */}
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
          showAgeFilter={true}
          showTasteFilter={true}
          showHealthFilter={true}
          showNutritionalFilter={true}
          showGameFilter={true}
        />
      )}
    </SafeAreaView>
  );
};

// Enhanced styles (same as ProductScreen)
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