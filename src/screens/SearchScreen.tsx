import { useCallback, useRef, useState, useEffect } from "react"
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  TextInput,
  Keyboard,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useTheme } from "../context/ThemeContext"
import ProductCard2 from "../components/Product/ProductCard2"
import { filterData } from "../database/Database"
import FilterModal from "../components/filter/FilterModal" // Import FilterModal

// Import the ProductService and CategoryService
import ProductService, { type Product, type FilteredProductsParams } from "../service/CustomProductApiService"

// =====================================
// TYPES AND INTERFACES
// =====================================

interface SearchScreenProps {
  navigation: any
}

interface PaginationData {
  total: number
  page: number
  page_count: number
  limit: number
  current_count: number
  has_more: boolean
}

interface CategoryData {
  id: string
  name: string
  image: any
}

// Enhanced FilterOptions interface
interface FilterOptions {
  animal_category?: number
  brand?: string
  category?: number
  priceMin?: number
  priceMax?: number
}

// =====================================
// CONSTANTS
// =====================================

const PAGE_SIZE = 10

// Category mapping from filterData IDs to API category IDs
const CATEGORY_MAPPING: { [key: string]: number } = {
  "2": 2, // Chien -> API category 2
  "3": 3, // Chat -> API category 3
  "184": 184, // Lapin -> API category 184
  "21": 21, // Poisson -> API category 21
  "31": 31, // Reptile -> API category 31
  "20": 20, // Oiseau -> API category 20
}

// =====================================
// MAIN COMPONENT
// =====================================

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const { isDarkMode, colorTheme } = useTheme()
  const { width, height } = useWindowDimensions()

  // =====================================
  // STATE MANAGEMENT
  // =====================================

  // UI States
  const [modalVisible, setModalVisible] = useState(false)
  const [textInputFocussed, setTextInputFocussed] = useState(false)

  // Search States
  const [searchText, setSearchText] = useState("")
  const [products, setProducts] = useState<Product[]>([])

  // Loading States
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Error States
  const [error, setError] = useState<string | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)

  // Pagination States
  const [currentPage, setCurrentPage] = useState(0)
  const [paginationData, setPaginationData] = useState<PaginationData>({
    total: 0,
    page: 0,
    page_count: 0,
    limit: PAGE_SIZE,
    current_count: 0,
    has_more: false,
  })

  // Category Selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("2") // Default to Chien
  const [categoryName, setCategoryName] = useState("Chien")

  // NEW FILTER STATES - Same as ProductCategoryScreen
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false)
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({})
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [failedImageLoads, setFailedImageLoads] = useState<Set<string>>(new Set())

  const textInput = useRef<TextInput>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef<boolean>(false)

  // =====================================
  // THEME COLORS
  // =====================================

  const PRIMARY_COLOR = colorTheme === "blue" ? "#007afe" : "#fe9400"
  const SECONDARY_COLOR = colorTheme === "blue" ? "#fe9400" : "#007afe"
  const BACKGROUND_COLOR = isDarkMode ? "#121212" : "#f8f8f8"
  const CARD_BACKGROUND = isDarkMode ? "#1e1e1e" : "#ffffff"
  const TEXT_COLOR = isDarkMode ? "#ffffff" : "#000000"
  const TEXT_COLOR_SECONDARY = isDarkMode ? "#b3b3b3" : "#666666"
  const BORDER_COLOR = isDarkMode ? "#2c2c2c" : "#e0e0e0"
  const SURFACE_COLOR = isDarkMode ? "#1E1E1E" : "#f5f5f5"

  // =====================================
  // UTILITY FUNCTIONS - Same as ProductCategoryScreen
  // =====================================

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

  // =====================================
  // CATEGORY FUNCTIONS
  // =====================================

  // Load categories from Dolibarr API
  const loadApiCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const categories = await getCategories()
      setApiCategories(categories)
    } catch (error) {
      console.error("Error loading API categories:", error)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  // Filter categories based on search text
  const getFilteredCategories = () => {
    if (!searchCategoryText.trim()) {
      return apiCategories
    }
    return categoryService.searchCategories(apiCategories, searchCategoryText)
  }

  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Handle category selection from API categories
  const handleApiCategorySelect = useCallback(
    async (category) => {
      const categoryId = category.id.toString()
      setSelectedCategoryId(categoryId)
      setCategoryName(category.label)
      setShowCategoryFilter(false)

      // Reload products for new category
      loadProducts(true, searchText, activeFilters)
    },
    [searchText, activeFilters],
  )

  // Handle category selection from filter data
  const handleFilterCategorySelect = useCallback(
    (categoryData) => {
      setSelectedCategoryId(categoryData.id)
      setCategoryName(categoryData.name)
      setShowCategoryFilter(false)

      // Reload products for new category
      loadProducts(true, searchText, activeFilters)
    },
    [searchText, activeFilters],
  )

  // =====================================
  // ENHANCED API FUNCTIONS WITH FILTERS
  // =====================================

  // Enhanced loadProducts function with filtering - Same logic as ProductCategoryScreen
  const loadProducts = async (resetPagination = true, search = "", filters: FilterOptions = {}) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      if (resetPagination) {
        setLoading(true)
        setCurrentPage(0)
        setProducts([])
        setError(null)
        setIsNotFound(false)
        setFailedImageLoads(new Set());
      } else {
        setLoadingMore(true)
      }

      const pageToLoad = resetPagination ? 0 : currentPage
      const apiCategoryId = CATEGORY_MAPPING[selectedCategoryId]

      const params: FilteredProductsParams = {
        limit: PAGE_SIZE,
        page: pageToLoad,
        pagination_data: true,
        includestockdata: 0,
        category: apiCategoryId,
        sortfield: getSortField(sortBy),
        sortorder: getSortOrder(sortBy),
      }

      // Add search if provided
      if (search && search.trim()) {
        params.search = search.trim()
      }

      // Add filters - Same as ProductCategoryScreen
      if (filters.animal_category) params.animal_category = filters.animal_category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.priceMin !== undefined) params.price_min = filters.priceMin;
      if (filters.priceMax !== undefined) params.price_max = filters.priceMax;

      console.log("🔍 Loading products with params:", params)

      const result = await ProductService.getFilteredProducts(params)

      let newProducts: Product[] = []
      let newPaginationData: PaginationData = {
        total: 0,
        page: pageToLoad,
        page_count: 0,
        limit: PAGE_SIZE,
        current_count: 0,
        has_more: false,
      }

      if ("pagination" in result) {
        newProducts = result.data || []
        newPaginationData = {
          total: result.pagination.total || 0,
          page: result.pagination.page || pageToLoad,
          page_count: result.pagination.page_count || 0,
          limit: result.pagination.limit || PAGE_SIZE,
          current_count: newProducts.length,
          has_more: (result.pagination.page || 0) < (result.pagination.page_count || 0) - 1,
        }
      } else {
        newProducts = result as Product[]
        newPaginationData = {
          total: newProducts.length,
          page: 0,
          page_count: 1,
          limit: PAGE_SIZE,
          current_count: newProducts.length,
          has_more: false,
        }
      }

      // Apply local sorting
      const sortedProducts = sortProducts(newProducts, sortBy);

      if (resetPagination) {
        const uniqueProducts = removeDuplicateProducts(sortedProducts);
        setProducts(uniqueProducts);
        setCurrentPage(0)
        setPaginationData(newPaginationData)
      } else {
        setProducts((prev: Product[]) => {
          const combinedProducts = [...prev, ...sortedProducts];
          return removeDuplicateProducts(combinedProducts);
        });
        setCurrentPage(pageToLoad + 1)
        setPaginationData((prev) => ({
          ...newPaginationData,
          current_count: prev.current_count + newProducts.length,
        }))
      }

      setActiveFilters(filters);

      console.log("✅ Products loaded:", {
        search,
        results: newProducts.length,
        total: newPaginationData.total,
        page: newPaginationData.page,
        category: categoryName,
        filters
      })
    } catch (error) {
      console.error("❌ Error loading products:", error)

      // Check if it's a 404 error or no products found
      if (error?.response?.status === 404 || error?.message?.includes("404") || error?.message?.includes("Not Found")) {
        setIsNotFound(true)
        setError("No products found")
      } else {
        setError("Une erreur est survenue lors du chargement des produits")
      }

      // Reset products on error
      if (resetPagination) {
        setProducts([])
        setPaginationData({
          total: 0,
          page: 0,
          page_count: 0,
          limit: PAGE_SIZE,
          current_count: 0,
          has_more: false,
        })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
      isLoadingRef.current = false;
    }
  }

  // Load more products
  const loadMoreProducts = () => {
    const hasMore = currentPage + 1 < paginationData.page_count

    if (!loadingMore && hasMore && !loading && !error && !isLoadingRef.current) {
      console.log("📄 Loading more products - page:", currentPage + 1)
      loadProducts(false, searchText, activeFilters)
    }
  }

  // =====================================
  // FILTER EVENT HANDLERS - Same as ProductCategoryScreen
  // =====================================

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
    loadProducts(true, searchText, convertedFilters);
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
            loadProducts(true, searchText, {});
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
    
    loadProducts(true, searchText, activeFilters);
  };

  // Helper functions for filters
  const hasActiveFilters = (): boolean => {
    return Object.keys(activeFilters).length > 0;
  };

  const getActiveFilterCount = (): number => {
    return Object.keys(activeFilters).length;
  };

  // =====================================
  // EVENT HANDLERS
  // =====================================

  // Handle search input change
  const handleSearchInputChange = (text: string) => {
    setSearchText(text)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Reset error states when user types
    setError(null)
    setIsNotFound(false)

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      loadProducts(true, text, activeFilters)
    }, 500)
  }

  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      loadProducts(true, searchText.trim(), activeFilters)
      setModalVisible(false)
      Keyboard.dismiss()
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchText("")
    textInput.current?.clear()
    setError(null)
    setIsNotFound(false)
    loadProducts(true, "", activeFilters)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false)
    setTextInputFocussed(false)
  }

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true)
    setError(null)
    setIsNotFound(false)
    loadProducts(true, searchText, activeFilters)
  }

  // Navigate to product details
  const navigateToProductDetails = (product: Product) => {
    console.log("🔍 Navigate to ProductDetails:", product.id)
    navigation.navigate("ProductDetails", {
      productId: product.id,
      product: product,
    })
  }

  // Clear category search
  const clearCategorySearch = () => {
    setSearchCategoryText("")
  }

  const expandAll = () => {
    const allCategoryIds = new Set()
    const addCategoryIds = (cats) => {
      cats.forEach((cat) => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          allCategoryIds.add(cat.id)
          addCategoryIds(cat.subcategories)
        }
      })
    }
    addCategoryIds(apiCategories)
    setExpandedCategories(allCategoryIds)
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  const handleImageError = useCallback((productId: string): void => {
    setFailedImageLoads((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });
  }, []);

  // =====================================
  // EFFECTS
  // =====================================

  // Load products when screen focuses or category changes
  useFocusEffect(
    useCallback(() => {
      loadProducts(true, searchText, activeFilters)
    }, [selectedCategoryId]),
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

  // Enhanced render product item with view modes
  const renderProduct = ({ item, index }: { item: Product, index: number }) => {
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
              ? searchText
                ? `Aucun produit ne correspond à "${searchText}" dans ${categoryName}`
                : `Aucun produit disponible dans ${categoryName}`
              : error || "Une erreur est survenue lors du chargement"}
          </Text>
          <View style={styles.emptyActions}>
            {searchText && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} onPress={clearSearch}>
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Effacer la recherche</Text>
              </TouchableOpacity>
            )}
            {(hasActiveFilters() || searchText) && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={() => {
                  if (searchText) {
                    clearSearch();
                  } else {
                    handleClearFilters();
                  }
                }}
              >
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {searchText ? 'Effacer la recherche' : 'Supprimer les filtres'}
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
              onPress={() => loadProducts(true, searchText, activeFilters)}
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
          {searchText ? "Aucun résultat trouvé" : "Aucun produit disponible"}
        </Text>
        <Text style={[styles.emptyResultsText, { color: TEXT_COLOR_SECONDARY }]}>
          {searchText
            ? `Aucun produit ne correspond à "${searchText}" pour ${categoryName}`
            : `Aucun produit disponible pour ${categoryName}`}
        </Text>
        {(searchText || hasActiveFilters()) && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} 
            onPress={() => {
              if (searchText) {
                clearSearch();
              } else {
                handleClearFilters();
              }
            }}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {searchText ? 'Effacer la recherche' : 'Supprimer les filtres'}
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

  // Enhanced render header info with filter indicators
  const renderHeaderInfo = () => (
    <View style={[styles.headerInfo, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
      <View style={styles.headerInfoLeft}>
        <Ionicons name="paw" size={18} color={PRIMARY_COLOR} />
        <Text style={[styles.headerInfoText, { color: TEXT_COLOR }]}>
          {paginationData.total} produits pour {categoryName}
        </Text>
        {hasActiveFilters() && (
          <View style={[styles.filterBadge, { backgroundColor: PRIMARY_COLOR }]}>
            <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
          </View>
        )}
      </View>
      <View style={styles.headerInfoRight}>
        {searchText && (
          <TouchableOpacity
            onPress={clearSearch}
            style={[styles.clearSearchButton, { backgroundColor: PRIMARY_COLOR + "15" }]}
          >
            <Ionicons name="close" size={14} color={PRIMARY_COLOR} />
            <Text style={[styles.clearSearchText, { color: PRIMARY_COLOR }]}>Effacer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  // NEW: Render toolbar - Same as ProductCategoryScreen
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={BACKGROUND_COLOR} />

      {/* Enhanced Header with Filter Button */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recherche</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerIconButton, { 
              backgroundColor: hasActiveFilters() ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
            }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="funnel" size={18} color="#fff" />
            {hasActiveFilters() && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{getActiveFilterCount()}</Text>
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
            <View style={styles.headerRight}>
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
          {!error && !isNotFound && renderHeaderInfo()}
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
        </View>
      )}

      {/* Filter Modal - Same as ProductCategoryScreen */}
      {showFilterModal && (
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={activeFilters}
          showAnimalFilter={true}
          showBrandFilter={true}
          showCategoryFilter={true} // Enable category filter in the FilterModal
          showPriceFilter={true}
        />
      )}
    </SafeAreaView>
  )
}

// =====================================
// ENHANCED STYLES
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  // NEW: Enhanced header right section
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
  contentContainer: {
    flex: 1,
  },
  // Enhanced header info with filter indicators
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  headerInfoText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
  },
  headerInfoRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // NEW: Toolbar styles - Same as ProductCategoryScreen
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  toolbarLeft: {
    flexDirection: "row",
    gap: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toolbarRight: {
    flexDirection: "row",
    gap: 4,
  },
  viewModeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
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
  // Enhanced product container styles for different view modes
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
    paddingBottom: 20,
  },
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
})