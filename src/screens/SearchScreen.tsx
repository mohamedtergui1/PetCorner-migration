import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  TextInput,
  Alert,
  Keyboard,
  ActivityIndicator,
  useWindowDimensions,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import ProductCard2 from '../components/Product/ProductCard2';

// Import the ProductService
import ProductService, { 
  Product, 
  PaginatedProductResponse,
  ProductListResponse,
  FilteredProductsParams 
} from '../service/CustomProductApiService';

// =====================================
// TYPES AND INTERFACES
// =====================================

interface SearchScreenProps {
  navigation: any;
}

interface AnimalCategory {
  id: number;
  name: string;
  icon: string;
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

const ANIMAL_CATEGORIES: AnimalCategory[] = [
  { id: 1, name: 'Chiens', icon: '🐕' },
  { id: 2, name: 'Chats', icon: '🐱' },
  { id: 3, name: 'Oiseaux', icon: '🦜' },
  { id: 4, name: 'Poissons', icon: '🐠' },
  { id: 5, name: 'Rongeurs', icon: '🐹' },
  { id: 6, name: 'Reptiles', icon: '🦎' },
];

const PAGE_SIZE = 10;

// =====================================
// MAIN COMPONENT
// =====================================

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const { isDarkMode, colorTheme } = useTheme();
  const { width, height } = useWindowDimensions();
  
  // =====================================
  // STATE MANAGEMENT
  // =====================================
  
  // UI States
  const [modalVisible, setModalVisible] = useState(false);
  const [textInputFocussed, setTextInputFocussed] = useState(false);
  const [showAnimalSelection, setShowAnimalSelection] = useState(false);
  
  // Search States
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    total: 0,
    page: 0,
    page_count: 0,
    limit: PAGE_SIZE,
    current_count: 0,
    has_more: false
  });
  
  // Animal Selection
  const [selectedAnimal, setSelectedAnimal] = useState<number>(1); // Default to dogs
  
  const textInput = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // =====================================
  // THEME COLORS
  // =====================================
  
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';

  // =====================================
  // API FUNCTIONS
  // =====================================

  // Load products
  const loadProducts = async (resetPagination = true, search = '') => {
    try {
      if (resetPagination) {
        setLoading(true);
        setCurrentPage(0);
        setProducts([]);
      } else {
        setLoadingMore(true);
      }

      const pageToLoad = resetPagination ? 0 : currentPage;
      
      const params: FilteredProductsParams = {
        limit: PAGE_SIZE,
        page: pageToLoad,
        pagination_data: true,
        includestockdata: 0,
        animal_category: selectedAnimal,
        sortfield: 'datec',
        sortorder: 'DESC'
      };

      // Add search if provided
      if (search && search.trim()) {
        params.search = search.trim();
      }

      console.log('🔍 Loading products with params:', params);
      
      const result = await ProductService.getFilteredProducts(params);
      
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

      if (resetPagination) {
        setProducts(newProducts);
        setCurrentPage(0);
        setPaginationData(newPaginationData);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setCurrentPage(pageToLoad + 1);
        setPaginationData(prev => ({
          ...newPaginationData,
          current_count: prev.current_count + newProducts.length
        }));
      }

      console.log('✅ Products loaded:', {
        search,
        results: newProducts.length,
        total: newPaginationData.total,
        page: newPaginationData.page,
        animal: ANIMAL_CATEGORIES.find(cat => cat.id === selectedAnimal)?.name
      });

    } catch (error) {
      console.error('❌ Error loading products:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du chargement des produits.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Load more products
  const loadMoreProducts = () => {
    const hasMore = (currentPage + 1) < paginationData.page_count;
    
    if (!loadingMore && hasMore && !loading) {
      console.log('📄 Loading more products - page:', currentPage + 1);
      loadProducts(false, searchText);
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
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      loadProducts(true, text);
    }, 500);
  };

  // Handle search submission
  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      loadProducts(true, searchText.trim());
      setModalVisible(false);
      Keyboard.dismiss();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchText('');
    textInput.current?.clear();
    loadProducts(true, '');
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setTextInputFocussed(false);
    setShowAnimalSelection(false);
  };

  // Handle animal selection
  const handleAnimalSelect = (animalId: number) => {
    setSelectedAnimal(animalId);
    setShowAnimalSelection(false);
    
    // Reload products for new animal
    loadProducts(true, searchText);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(true, searchText);
  };

  // Navigate to product details
  const navigateToProductDetails = (product: Product) => {
    console.log('🔍 Navigate to ProductDetails:', product.id);
    navigation.navigate('ProductDetails', { 
      productId: product.id,
      product: product 
    });
  };

  // =====================================
  // EFFECTS
  // =====================================

  // Load products when screen focuses or animal changes
  useFocusEffect(
    useCallback(() => {
      loadProducts(true, searchText);
    }, [selectedAnimal])
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
  );

  // Render animal selection modal
  const renderAnimalSelection = () => (
    <Modal
      visible={showAnimalSelection}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAnimalSelection(false)}
    >
      <View style={styles.animalModalOverlay}>
        <View style={[styles.animalModalContent, { backgroundColor: CARD_BACKGROUND }]}>
          <View style={styles.animalModalHeader}>
            <Text style={[styles.animalModalTitle, { color: TEXT_COLOR }]}>
              Choisir un animal
            </Text>
            <TouchableOpacity 
              onPress={() => setShowAnimalSelection(false)}
              style={styles.animalModalClose}
            >
              <Ionicons name="close" size={24} color={TEXT_COLOR_SECONDARY} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={ANIMAL_CATEGORIES}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.animalItem,
                  { 
                    backgroundColor: selectedAnimal === item.id ? PRIMARY_COLOR + '15' : 'transparent',
                    borderColor: selectedAnimal === item.id ? PRIMARY_COLOR : BORDER_COLOR
                  }
                ]}
                onPress={() => handleAnimalSelect(item.id)}
              >
                <Text style={styles.animalIcon}>{item.icon}</Text>
                <Text style={[
                  styles.animalName, 
                  { 
                    color: selectedAnimal === item.id ? PRIMARY_COLOR : TEXT_COLOR,
                    fontWeight: selectedAnimal === item.id ? '600' : '400'
                  }
                ]}>
                  {item.name}
                </Text>
                {selectedAnimal === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );

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

  // Render header info
  const renderHeaderInfo = () => (
    <View style={[styles.headerInfo, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
      <View style={styles.headerInfoLeft}>
        <Ionicons name="paw" size={18} color={PRIMARY_COLOR} />
        <Text style={[styles.headerInfoText, { color: TEXT_COLOR }]}>
          {paginationData.total} produits pour {ANIMAL_CATEGORIES.find(cat => cat.id === selectedAnimal)?.name?.toLowerCase()}
        </Text>
      </View>
      {searchText && (
        <TouchableOpacity onPress={clearSearch} style={[styles.clearSearchButton, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="close" size={14} color={PRIMARY_COLOR} />
          <Text style={[styles.clearSearchText, { color: PRIMARY_COLOR }]}>Effacer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // =====================================
  // MAIN RENDER
  // =====================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={BACKGROUND_COLOR} 
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recherche</Text>
        <TouchableOpacity 
          style={styles.animalButton}
          onPress={() => setShowAnimalSelection(true)}
        >
          <Text style={styles.animalButtonText}>
            {ANIMAL_CATEGORIES.find(cat => cat.id === selectedAnimal)?.icon || '🐕'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(true)}>
          <View style={[styles.searchArea, { 
            backgroundColor: CARD_BACKGROUND, 
            borderColor: BORDER_COLOR,
            shadowColor: isDarkMode ? '#000' : PRIMARY_COLOR,
          }]}>
            <Ionicons 
              name="search" 
              size={22} 
              color={TEXT_COLOR_SECONDARY}
              style={styles.searchIcon}
            />
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
            <TouchableOpacity 
              style={styles.modalBackButton}
              onPress={handleModalClose}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Rechercher</Text>
            <TouchableOpacity 
              style={styles.animalButton}
              onPress={() => setShowAnimalSelection(true)}
            >
              <Text style={styles.animalButtonText}>
                {ANIMAL_CATEGORIES.find(cat => cat.id === selectedAnimal)?.icon || '🐕'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <View style={[styles.searchInputWrapper, { 
              borderColor: textInputFocussed ? PRIMARY_COLOR : BORDER_COLOR,
              backgroundColor: CARD_BACKGROUND,
              shadowColor: isDarkMode ? '#000' : PRIMARY_COLOR,
            }]}>
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
              Recherche dans la catégorie {ANIMAL_CATEGORIES.find(cat => cat.id === selectedAnimal)?.name?.toLowerCase()}
            </Text>
            <Text style={[styles.infoSubText, { color: TEXT_COLOR_SECONDARY }]}>
              Appuyez sur l'icône animal pour changer de catégorie
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: TEXT_COLOR }]}>
            Chargement des produits...
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {renderHeaderInfo()}
          <FlatList
            data={products}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderProduct}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyResults}>
                <Ionicons name="search-outline" size={64} color={TEXT_COLOR_SECONDARY} />
                <Text style={[styles.emptyResultsTitle, { color: TEXT_COLOR }]}>
                  {searchText ? 'Aucun résultat trouvé' : 'Aucun produit disponible'}
                </Text>
                <Text style={[styles.emptyResultsText, { color: TEXT_COLOR_SECONDARY }]}>
                  {searchText 
                    ? `Aucun produit ne correspond à "${searchText}" pour ${ANIMAL_CATEGORIES.find(cat => cat.id === selectedAnimal)?.name?.toLowerCase()}`
                    : `Aucun produit disponible pour ${ANIMAL_CATEGORIES.find(cat => cat.id === selectedAnimal)?.name?.toLowerCase()}`
                  }
                </Text>
                {searchText && (
                  <TouchableOpacity 
                    style={[styles.clearButton2, { backgroundColor: PRIMARY_COLOR }]}
                    onPress={clearSearch}
                  >
                    <Text style={styles.clearButtonText}>Effacer la recherche</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      )}

      {/* Animal Selection Modal */}
      {renderAnimalSelection()}
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
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  animalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  animalButtonText: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchArea: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoSubText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfoText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  clearSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '600',
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
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyResultsText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  clearButton2: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Animal Selection Modal Styles
  animalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  animalModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  animalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  animalModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  animalModalClose: {
    padding: 4,
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  animalIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  animalName: {
    flex: 1,
    fontSize: 16,
  },
});