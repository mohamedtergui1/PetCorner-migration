"use client"

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
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useTheme } from "../context/ThemeContext"
import ProductCard2 from "../components/Product/ProductCard2"
import { filterData } from "../database/Database"

// Import the ProductService and CategoryService
import ProductService, { type Product, type FilteredProductsParams } from "../service/CustomProductApiService"

import categoryService, { getCategories } from "../service/CategoryService"

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
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  // Search States
  const [searchText, setSearchText] = useState("")
  const [products, setProducts] = useState<Product[]>([])

  // Loading States
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)

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

  // Category filtering states
  const [searchCategoryText, setSearchCategoryText] = useState("")
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  // API Categories data
  const [apiCategories, setApiCategories] = useState([])

  const textInput = useRef<TextInput>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      loadProducts(true, searchText)
    },
    [searchText],
  )

  // Handle category selection from filter data
  const handleFilterCategorySelect = useCallback(
    (categoryData) => {
      setSelectedCategoryId(categoryData.id)
      setCategoryName(categoryData.name)
      setShowCategoryFilter(false)

      // Reload products for new category
      loadProducts(true, searchText)
    },
    [searchText],
  )

  // =====================================
  // API FUNCTIONS
  // =====================================

  // Load products
  const loadProducts = async (resetPagination = true, search = "") => {
    try {
      if (resetPagination) {
        setLoading(true)
        setCurrentPage(0)
        setProducts([])
        setError(null)
        setIsNotFound(false)
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
        sortfield: "datec",
        sortorder: "DESC",
      }

      // Add search if provided
      if (search && search.trim()) {
        params.search = search.trim()
      }

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

      if (resetPagination) {
        setProducts(newProducts)
        setCurrentPage(0)
        setPaginationData(newPaginationData)
      } else {
        setProducts((prev) => [...prev, ...newProducts])
        setCurrentPage(pageToLoad + 1)
        setPaginationData((prev) => ({
          ...newPaginationData,
          current_count: prev.current_count + newProducts.length,
        }))
      }

      console.log("✅ Products loaded:", {
        search,
        results: newProducts.length,
        total: newPaginationData.total,
        page: newPaginationData.page,
        category: categoryName,
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
    }
  }

  // Load more products
  const loadMoreProducts = () => {
    const hasMore = currentPage + 1 < paginationData.page_count

    if (!loadingMore && hasMore && !loading && !error) {
      console.log("📄 Loading more products - page:", currentPage + 1)
      loadProducts(false, searchText)
    }
  }

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
      loadProducts(true, text)
    }, 500)
  }

  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      loadProducts(true, searchText.trim())
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
    loadProducts(true, "")

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
    loadProducts(true, searchText)
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

  // =====================================
  // EFFECTS
  // =====================================

  // Load API categories on component mount
  useEffect(() => {
    loadApiCategories()
  }, [loadApiCategories])

  // Load products when screen focuses or category changes
  useFocusEffect(
    useCallback(() => {
      loadProducts(true, searchText)
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

  // Render product item
  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard2
      navigation={navigation}
      product={item}
      onPress={navigateToProductDetails}
      viewMode="grid"
      isDarkMode={isDarkMode}
      colorTheme={colorTheme}
    />
  )

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
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: PRIMARY_COLOR,
                },
              ]}
              onPress={() => loadProducts(true, searchText)}
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
        {searchText && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} onPress={clearSearch}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Effacer la recherche</Text>
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

  // Render header info
  const renderHeaderInfo = () => (
    <View style={[styles.headerInfo, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
      <View style={styles.headerInfoLeft}>
        <Ionicons name="paw" size={18} color={PRIMARY_COLOR} />
        <Text style={[styles.headerInfoText, { color: TEXT_COLOR }]}>
          {paginationData.total} produits pour {categoryName}
        </Text>
      </View>
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
  )

  const filteredCategories = getFilteredCategories()

  // =====================================
  // MAIN RENDER
  // =====================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={BACKGROUND_COLOR} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recherche</Text>
        <TouchableOpacity
          style={styles.categoryFilterButton}
          onPress={() => setShowCategoryFilter(true)}
          disabled={categoriesLoading}
        >
          {categoriesLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.categoryDisplayButton}>
              <Text style={styles.categoryDisplayText}>
                {filterData.find((cat) => cat.id === selectedCategoryId)?.name || categoryName}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
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
            <TouchableOpacity style={styles.categoryFilterButton} onPress={() => setShowCategoryFilter(true)}>
              <View style={styles.categoryDisplayButton}>
                <Text style={styles.categoryDisplayText}>
                  {filterData.find((cat) => cat.id === selectedCategoryId)?.name || categoryName}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
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
              Recherche dans la catégorie {categoryName}
            </Text>
            <Text style={[styles.infoSubText, { color: TEXT_COLOR_SECONDARY }]}>
              Appuyez sur la catégorie en haut pour changer
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
          <FlatList
            data={products}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderProduct}
            numColumns={2}
            columnWrapperStyle={products.length > 0 ? styles.productRow : null}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyOrError}
          />
        </View>
      )}

      {/* Simple Category Filter Modal */}
      <Modal
        visible={showCategoryFilter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryFilter(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
          {/* Modal Header */}
          <View
            style={[
              styles.modalHeaderContainer,
              {
                backgroundColor: CARD_BACKGROUND,
                borderBottomColor: BORDER_COLOR,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setShowCategoryFilter(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={TEXT_COLOR} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>Choisir une catégorie</Text>
            <Text style={[styles.modalSubtitle, { color: TEXT_COLOR_SECONDARY }]}>{filterData.length} catégories</Text>
          </View>

          {/* Simple Categories List */}
          <ScrollView style={styles.simpleCategoriesList} showsVerticalScrollIndicator={false}>
            {filterData.map((category) => {
              const isSelected = selectedCategoryId === category.id
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.simpleCategoryItem,
                    {
                      backgroundColor: isSelected ? `${PRIMARY_COLOR}15` : CARD_BACKGROUND,
                      borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
                    },
                  ]}
                  onPress={() => handleFilterCategorySelect(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.simpleCategoryContent}>
                    <View style={styles.categoryImageContainer}>
                      <Image style={styles.categoryImageSmall} source={category.image} />
                    </View>

                    <View style={styles.simpleCategoryText}>
                      <Text
                        style={[
                          styles.simpleCategoryLabel,
                          {
                            color: isSelected ? PRIMARY_COLOR : TEXT_COLOR,
                            fontWeight: isSelected ? "600" : "500",
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </View>

                    <View style={styles.simpleCategoryActions}>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />}
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

// =====================================
// STYLES
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
  categoryFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 120,
  },
  categoryDisplayButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryDisplayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 80,
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
  },
  headerInfoText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
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
  productRow: {
    justifyContent: "space-between",
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

  // Simple Category Filter Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeaderContainer: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: "center",
    position: "relative",
  },
  modalCloseButton: {
    position: "absolute",
    left: 16,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  simpleCategoriesList: {
    flex: 1,
    padding: 16,
  },
  simpleCategoryItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
  },
  simpleCategoryContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  categoryImageContainer: {
    marginRight: 16,
  },
  categoryImageSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  simpleCategoryText: {
    flex: 1,
  },
  simpleCategoryLabel: {
    fontSize: 16,
  },
  simpleCategoryActions: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
  },
})
