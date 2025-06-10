// ProductScreen.js - Fixed search functionality - No modal/toast on empty results
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
import { getProductsOnlyWithPagination, getProductCategories } from '../service/ProductService';

const { width } = Dimensions.get('window');

export default function ProductScreen({ navigation, route }) {
  const { isDarkMode, colorTheme } = useTheme();
  
  // États principaux
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  
  // États de recherche - FIXED
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState(''); // Separate state for input display
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  // États d'affichage
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'price', 'name'

  // États de pagination - Updated to use Dolibarr's pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [paginationData, setPaginationData] = useState({
    total: 0,
    page: 0,
    page_count: 0,
    limit: 20,
    current_count: 0,
    has_more: false
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageSize] = useState(20); // Nombre de produits par page

  // Couleurs dynamiques
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#0a0a0a' : '#f8f9fa';
  const CARD_BACKGROUND = isDarkMode ? '#1a1a1a' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#1a1a1a';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#a0a0a0' : '#6c757d';
  const BORDER_COLOR = isDarkMode ? '#2a2a2a' : '#e9ecef';
  const SUCCESS_COLOR = '#28a745';
  const WARNING_COLOR = '#ffc107';

  // Charger les produits au focus de l'écran
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  // Charger les données initiales (produits et catégories)
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
      
      // Charger les catégories en parallèle
      const categoriesPromise = loadCategories();
      const productsPromise = loadProducts(true); // true = reset data
      
      await Promise.all([categoriesPromise, productsPromise]);
      
    } catch (error) {
      console.error('Erreur lors du chargement initial:', error);
      // Only show alert for critical connection errors, not empty results
      if (error.message && !error.message.includes('404') && !error.message.includes('empty')) {
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

  // Charger les catégories
  const loadCategories = async () => {
    try {
      const categoriesData = await getProductCategories();
      setCategories(categoriesData || []);
      console.log(`✅ ${categoriesData?.length || 0} catégories chargées`);
    } catch (error) {
      console.warn('⚠️ Impossible de charger les catégories:', error);
      setCategories([]);
    }
  };

  // FIXED: Charger les produits avec pagination Dolibarr - No modal on empty results
  const loadProducts = async (resetPagination = false, filters = {}, search = '') => {
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
      
      // Use getProductsOnlyWithPagination which filters by type = "0" (products only)
      const result = await getProductsOnlyWithPagination(
        pageSize,
        pageToLoad,
        filters,
        search
      );
      
      console.log('📊 Résultat pagination:', result.pagination);
      
      // Extract products and pagination from Dolibarr response
      const newProducts = result.data || [];
      const newPaginationData = result.pagination || {
        total: 0,
        page: pageToLoad,
        page_count: 0,
        limit: pageSize,
        current_count: newProducts.length,
        has_more: false
      };
      
      // Tri des produits
      const sortedProducts = sortProducts(newProducts, sortBy);
      
      if (resetPagination) {
        // Première page ou reset complet
        setProducts(sortedProducts);
        setCurrentPage(0);
        setPaginationData(newPaginationData);
      } else {
        // Pages suivantes - ajouter aux produits existants
        setProducts(prevProducts => {
          const combinedProducts = [...prevProducts, ...sortedProducts];
          return combinedProducts;
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
        total_affichés: resetPagination ? sortedProducts.length : products.length + sortedProducts.length,
        total_disponible: newPaginationData.total,
        page_actuelle: newPaginationData.page,
        total_pages: newPaginationData.page_count
      });
      
      // Log empty results but don't show modal/alert
      if (newProducts.length === 0) {
        console.log('ℹ️ Aucun produit trouvé pour cette recherche/filtre');
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      
      // FIXED: Only show alert for actual network/server errors, not for empty results
      // Check if it's a real error vs just no results found
      const isRealError = error.response?.status >= 500 || 
                         error.code === 'NETWORK_ERROR' || 
                         error.message?.includes('Network') ||
                         error.message?.includes('timeout');
      
      if (isRealError) {
        Alert.alert(
          'Erreur',
          'Impossible de charger les produits. Vérifiez votre connexion.',
          [{ text: 'OK' }]
        );
      } else {
        // For other errors (like 404, empty results), just log them
        console.log('ℹ️ Pas de produits trouvés ou erreur mineure:', error.message);
        
        // Set empty state gracefully
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

  // Charger plus de produits (pagination infinie)
  const loadMoreProducts = () => {
    const hasMore = (currentPage + 1) < paginationData.page_count;
    
    if (!loadingMore && hasMore && !loading) {
      console.log('📄 Chargement de la page suivante:', currentPage + 1);
      loadProducts(false, activeFilters, searchQuery);
    }
  };

  // Trier les produits
  const sortProducts = (productsList, sortType) => {
    if (!Array.isArray(productsList)) return [];
    
    const sorted = [...productsList];
    
    switch (sortType) {
      case 'price':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.price_ttc || a.price || a.price_min || 0);
          const priceB = parseFloat(b.price_ttc || b.price || b.price_min || 0);
          return priceA - priceB;
        });
      case 'name':
        return sorted.sort((a, b) => {
          const nameA = (a.name || a.label || '').toLowerCase();
          const nameB = (b.name || b.label || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'date':
      default:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.date_creation || a.datec || 0);
          const dateB = new Date(b.date_creation || b.datec || 0);
          return dateB - dateA; // Plus récent en premier
        });
    }
  };

  // Rafraîchir les produits
  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(true, activeFilters, searchQuery);
  };

  // FIXED: Handle search input change
  const handleSearchInputChange = (text) => {
    setSearchInputValue(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  };

  // FIXED: Perform actual search - No modal on empty results
  const performSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length > 2) {
      setSearchLoading(true);
      await loadProducts(true, activeFilters, query.trim());
    } else if (query.trim().length === 0) {
      setSearchLoading(true);
      await loadProducts(true, activeFilters, '');
    }
    // Note: No alert/modal shown for empty search results
  };

  // FIXED: Clear search
  const clearSearch = () => {
    setSearchInputValue('');
    setSearchQuery('');
    loadProducts(true, activeFilters, '');
  };

  // Appliquer les filtres - No modal on empty results
  const handleApplyFilters = (filters) => {
    console.log('✅ Filtres appliqués:', filters);
    setShowFilterModal(false); // Close modal immediately
    loadProducts(true, filters, searchQuery);
    // Note: No alert/modal shown for empty filter results
  };

  // Supprimer tous les filtres
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

  // Changer le mode de tri
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    const sortedProducts = sortProducts(products, newSortBy);
    setProducts(sortedProducts);
  };

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = () => {
    return Object.keys(activeFilters).length > 0;
  };

  // Compter les filtres actifs
  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length;
  };

  // Naviguer vers les détails du produit
  const navigateToProductDetails = (product) => {
    navigation.navigate('ProductDetails', { 
      productId: product.id,
      product: product 
    });
  };

  // FIXED: Rendu d'un produit - Correct props for ProductCard2
  const renderProduct = ({ item, index }) => {
    // Debug log to check product data
    if (!item) {
      console.warn(`ProductScreen: Item at index ${index} is undefined/null`);
      return null;
    }
    
    // Additional debug info - only log if item seems problematic
    if (!item.label && !item.ref && !item.name) {
      console.warn(`ProductScreen: Item at index ${index} missing name fields:`, {
        id: item.id,
        hasLabel: !!item.label,
        hasRef: !!item.ref, 
        hasName: !!item.name,
        hasImageLink: !!item.image_link,
        keys: Object.keys(item).slice(0, 10) // First 10 keys for debugging
      });
    }
    
    return (
      <ProductCard2
        product={item}                    // ✅ FIXED: Use 'product' not 'data'
        onPress={navigateToProductDetails} // ✅ FIXED: Added onPress handler
        viewMode={viewMode}               // ✅ FIXED: Use 'viewMode' not 'layoutMode'
        isDarkMode={isDarkMode}           // ✅ FIXED: Added missing isDarkMode
        colorTheme={colorTheme}           // ✅ FIXED: Use 'colorTheme' not 'theme'
      />
    );
  };

  // Rendu du footer de chargement
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

  // Rendu de l'état de chargement
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      <Text style={[styles.loadingText, { color: TEXT_COLOR_SECONDARY }]}>
        Chargement des produits...
      </Text>
    </View>
  );

  // FIXED: Rendu de l'état vide - No modal/toast, just clean empty state
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

  // Rendu de l'en-tête avec les filtres actifs et le total - FIXED
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

  // Rendu de l'indicateur de pagination - FIXED
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

  // FIXED: Rendu de la barre de recherche
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

  // Rendu de la barre d'outils
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header - FIXED to show correct totals */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
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

      {/* Barre de recherche */}
      {renderSearchBar()}

      {/* Contenu principal */}
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
                // Create a unique key combining item ID and index to avoid duplicates
                const uniqueId = item.id || item.rowid || index;
                return `product-${uniqueId}-${index}`;
              }}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode} // Force re-render when view mode changes
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

      {/* Modal de filtrage - Only show when explicitly requested */}
      {showFilterModal && (
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={activeFilters}
          categories={categories}
          showAnimalFilter={true}
          showBrandFilter={true}
          showCategoryFilter={true}
          showPriceFilter={true}
        />
      )}
    </SafeAreaView>
  );
}

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
    paddingBottom: 80, // Extra space for pagination indicator
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