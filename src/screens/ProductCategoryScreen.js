import { 
  ActivityIndicator, 
  FlatList, 
  Image, 
  Pressable, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { COLOURS, filterData } from '../database/Database';
import ProductCard from '../components/Home/ProductCard';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import categoryService, { getCategories, getCategoryProducts, getSubcategories } from '../service/CategoryService';

export default function ProductCategoryScreen({ navigation, route }) {
  const { theme, isDarkMode, colorTheme } = useTheme();
  const { categoryId } = route.params || {};
  const [count, setCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(parseInt(categoryId) || filterData[0]?.id || 0);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Category filtering states
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // API Categories data
  const [apiCategories, setApiCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // State for subcategory navigation
  const [currentLevel, setCurrentLevel] = useState(0); // 0: main categories, 1: subcategories
  const [currentParentCategory, setCurrentParentCategory] = useState(null);
  const [allProducts, setAllProducts] = useState([]); // All products from parent category
  const [filteredProducts, setFilteredProducts] = useState([]); // Filtered by subcategory
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  
  // Define theme colors
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';
  const SURFACE_COLOR = isDarkMode ? '#1E1E1E' : '#f5f5f5';

  // Updated load category data function - moved before other functions that use it
  const loadCategoryData = useCallback(async (categoryId, loadAllForFiltering = false) => {
    if (!categoryId) return;
    
    setLoading(true);
    
    try {
      const { category, products: loadedProducts, count: productCount } = 
        await getCategoryProducts(categoryId);
      
      if (loadAllForFiltering) {
        // Store all products for filtering
        setAllProducts(loadedProducts);
        setFilteredProducts(loadedProducts);
        setProducts(loadedProducts);
        setCount(loadedProducts.length);
      } else {
        // Regular product loading
        setCategoryName(category?.label || '');
        setCount(productCount);
        setProducts(loadedProducts);
      }
    } catch (error) {
      console.error('Error loading category data:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les produits pour cette catégorie. Veuillez réessayer.'
      );
      setProducts([]);
      if (loadAllForFiltering) {
        setAllProducts([]);
        setFilteredProducts([]);
      }
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories from Dolibarr API
  const loadApiCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const categories = await getCategories();
      setApiCategories(categories);
    } catch (error) {
      console.error('Error loading API categories:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger les catégories. Utilisation des catégories par défaut.'
      );
      // Keep using static categories as fallback
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Load API categories on component mount
  useEffect(() => {
    loadApiCategories();
  }, [loadApiCategories]);
  
  // Filter categories based on search text
  const getFilteredCategories = () => {
    if (!searchText.trim()) {
      return apiCategories;
    }
    return categoryService.searchCategories(apiCategories, searchText);
  };

  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Handle category selection from API categories
  const handleApiCategorySelect = useCallback(async (category) => {
    const categoryId = Number(category.id);
    setSelectedCategoryId(categoryId);
    setCategoryName(category.label);
    setShowCategoryFilter(false);
    
    // Clear current products and load new ones
    setProducts([]);
    setCount(0);
    
    // Reset to single level first
    setCurrentLevel(0);
    setCurrentParentCategory(null);
    setBreadcrumb([]);
    setAvailableSubcategories([]);
    setSelectedSubcategoryId(null);
    setAllProducts([]);
    setFilteredProducts([]);
    
    // Check if category has subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      // Load subcategories from API
      try {
        const subcategories = await getSubcategories(categoryId);
        if (subcategories.length > 0) {
          // Show subcategories and load ALL products from parent category
          setCurrentLevel(1);
          setCurrentParentCategory(category);
          setBreadcrumb([category]);
          setAvailableSubcategories(subcategories.map(sub => 
            categoryService.transformCategoryForUI(sub)
          ));
          setSelectedSubcategoryId(null);
          
          // Load ALL products from the parent category
          loadCategoryData(categoryId, true);
        } else {
          // No subcategories found, load products directly
          loadCategoryData(categoryId, false);
        }
      } catch (error) {
        console.error('Error loading subcategories:', error);
        // Fallback to direct product loading
        loadCategoryData(categoryId, false);
      }
    } else {
      // No subcategories, load products directly
      loadCategoryData(categoryId, false);
    }
  }, [loadCategoryData]);

  // Find category in API data
  const findCategoryInApi = (categoryId) => {
    const findInCategory = (category) => {
      if (category.id === categoryId.toString()) {
        return category;
      }
      if (category.subcategories) {
        for (const sub of category.subcategories) {
          const found = findInCategory(sub);
          if (found) return found;
        }
      }
      return null;
    };

    for (const category of apiCategories) {
      const found = findInCategory(category);
      if (found) return found;
    }
    return null;
  };

  // Reset to single level view
  const resetToSingleLevel = () => {
    setCurrentLevel(0);
    setCurrentParentCategory(null);
    setBreadcrumb([]);
    setAvailableSubcategories([]);
    setSelectedSubcategoryId(null);
    setAllProducts([]);
    setFilteredProducts([]);
    setCategoryName('');
    setCount(0);
  };

  // Handle category selection from filter data with subcategory support
  const handleFilterCategorySelect = useCallback(async (id) => {
    const categoryId = Number(id);
    setSelectedCategoryId(categoryId);

    // Check if this category exists in our API data and has subcategories
    const apiCategory = findCategoryInApi(categoryId);
    
    if (apiCategory && apiCategory.subcategories && apiCategory.subcategories.length > 0) {
      // Load subcategories from API for more up-to-date data
      try {
        const subcategories = await getSubcategories(categoryId);
        if (subcategories.length > 0) {
          // Show subcategories and load ALL products from parent category
          setCurrentLevel(1);
          setCurrentParentCategory(apiCategory);
          setBreadcrumb([apiCategory]);
          setAvailableSubcategories(subcategories.map(sub => 
            categoryService.transformCategoryForUI(sub)
          ));
          setSelectedSubcategoryId(null);
          
          setCategoryName(apiCategory.label);
          
          // Load ALL products from the parent category
          loadCategoryData(categoryId, true);
        } else {
          // No subcategories found, load products directly
          resetToSingleLevel();
          loadCategoryData(categoryId, false);
        }
      } catch (error) {
        console.error('Error loading subcategories:', error);
        // Fallback to direct product loading
        resetToSingleLevel();
        loadCategoryData(categoryId, false);
      }
    } else {
      // No subcategories, load products directly
      resetToSingleLevel();
      loadCategoryData(categoryId, false);
    }
  }, [apiCategories, loadCategoryData]);

  // Handle subcategory filter selection
  const handleSubcategoryFilter = useCallback(async (subcategoryId) => {
    if (selectedSubcategoryId === subcategoryId) {
      // Deselect - show all products
      setSelectedSubcategoryId(null);
      setFilteredProducts(allProducts);
      setCount(allProducts.length);
    } else {
      // Select subcategory - load products from this subcategory
      setSelectedSubcategoryId(subcategoryId);
      
      try {
        setLoading(true);
        const { products: subcategoryProducts, count: subcategoryCount } = 
          await getCategoryProducts(subcategoryId);
        
        setFilteredProducts(subcategoryProducts);
        setCount(subcategoryCount);
      } catch (error) {
        console.error('Error loading subcategory products:', error);
        Alert.alert(
          'Erreur',
          'Impossible de charger les produits de cette sous-catégorie.'
        );
        // Fallback to showing all products
        setFilteredProducts(allProducts);
        setCount(allProducts.length);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedSubcategoryId, allProducts]);

  // Go back to parent level
  const goBackToParent = () => {
    if (currentLevel === 1) {
      // Go back to main categories
      resetToSingleLevel();
      
      // Reset to first category or clear
      if (filterData.length > 0) {
        const firstCatId = filterData[0].id;
        setSelectedCategoryId(firstCatId);
        loadCategoryData(firstCatId, false);
      }
    }
  };
  
  // Load initial data when screen is focused
  useFocusEffect(
    useCallback(() => {
      // If there's a categoryId in route params, use it
      if (categoryId) {
        const catId = Number(categoryId);
        setSelectedCategoryId(catId);
        loadCategoryData(catId);
      } else if (filterData && filterData.length > 0) {
        // Otherwise use the first category
        const firstCatId = filterData[0].id;
        setSelectedCategoryId(firstCatId);
        loadCategoryData(firstCatId);
      }
    }, [categoryId, loadCategoryData])
  );
  
  // Render product item
  const renderProduct = useCallback(({ item }) => (
    <ProductCard 
      navigation={navigation} 
      data={item} 
      theme={theme} 
    />
  ), [navigation, theme]);
  
  // Render category item for horizontal scroll
  const renderCategoryItem = useCallback(({ item }) => {
    const isSelected = Number(selectedCategoryId) === Number(item.id);
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleFilterCategorySelect(item.id)}
        style={{
          marginHorizontal: 5,
          marginVertical: 8,
        }}
      >
        <View
          style={[
            styles.categoryCard,
            isSelected 
              ? { backgroundColor: PRIMARY_COLOR } 
              : { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : (COLOURS.grey5 || '#f0f0f0') }
          ]}
        >
          {item.image ? (
            <Image
              style={styles.categoryImage}
              source={item.image}
            />
          ) : (
            <View style={[styles.categoryImage, { backgroundColor: PRIMARY_COLOR + '20', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="apps-outline" size={30} color={PRIMARY_COLOR} />
            </View>
          )}
          <Text
            style={[
              styles.categoryText,
              isSelected 
                ? { color: '#ffffff', fontWeight: 'bold' } 
                : { color: TEXT_COLOR_SECONDARY }
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [selectedCategoryId, handleFilterCategorySelect, isDarkMode, PRIMARY_COLOR, TEXT_COLOR_SECONDARY]);

  // Render subcategory filter chip
  const renderSubcategoryChip = useCallback(({ item }) => {
    const isSelected = selectedSubcategoryId === item.id;
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSubcategoryFilter(item.id)}
        style={[
          styles.subcategoryChip,
          {
            backgroundColor: isSelected ? PRIMARY_COLOR : (isDarkMode ? '#333' : '#f0f0f0'),
            borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
          }
        ]}
      >
        <Text
          style={[
            styles.subcategoryChipText,
            {
              color: isSelected ? '#ffffff' : TEXT_COLOR,
              fontWeight: isSelected ? '600' : '500'
            }
          ]}
        >
          {item.label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
        )}
      </TouchableOpacity>
    );
  }, [selectedSubcategoryId, handleSubcategoryFilter, isDarkMode, PRIMARY_COLOR, TEXT_COLOR, BORDER_COLOR]);

  // Render API category for modal
  const renderApiCategory = (category, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = Number(selectedCategoryId) === Number(category.id);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const categoryColor = category.color ? `#${category.color}` : SECONDARY_COLOR;

    return (
      <View key={category.id} style={[styles.modalCategoryContainer, { marginLeft: level * 20 }]}>
        <TouchableOpacity
          style={[
            styles.modalCategoryItem,
            {
              backgroundColor: isSelected ? `${PRIMARY_COLOR}20` : SURFACE_COLOR,
              borderLeftColor: categoryColor,
              borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
            }
          ]}
          onPress={() => handleApiCategorySelect(category)}
          activeOpacity={0.7}
        >
          <View style={styles.modalCategoryContent}>
            <View style={[styles.colorIndicator, { backgroundColor: categoryColor }]} />
            
            <View style={styles.modalCategoryText}>
              <Text style={[
                styles.modalCategoryLabel,
                {
                  color: isSelected ? PRIMARY_COLOR : TEXT_COLOR,
                  fontWeight: level === 0 ? 'bold' : '600'
                }
              ]}>
                {category.label}
              </Text>
              {category.description && category.description !== category.label && (
                <Text style={[styles.modalCategoryDescription, { color: TEXT_COLOR_SECONDARY }]}>
                  {category.description}
                </Text>
              )}
            </View>

            <View style={styles.modalCategoryActions}>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={PRIMARY_COLOR} />
              )}
              {hasSubcategories && (
                <TouchableOpacity
                  onPress={() => toggleCategoryExpansion(category.id)}
                  style={styles.expandButton}
                >
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={TEXT_COLOR_SECONDARY}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {hasSubcategories && isExpanded && (
          <View style={styles.subcategoriesContainer}>
            {category.subcategories.map(subcat => renderApiCategory(subcat, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const clearSearch = () => {
    setSearchText('');
  };

  const expandAll = () => {
    const allCategoryIds = new Set();
    const addCategoryIds = (cats) => {
      cats.forEach(cat => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          allCategoryIds.add(cat.id);
          addCategoryIds(cat.subcategories);
        }
      });
    };
    addCategoryIds(apiCategories);
    setExpandedCategories(allCategoryIds);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const filteredCategories = getFilteredCategories();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'} 
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Catégories</Text>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowCategoryFilter(true)}
          disabled={categoriesLoading}
        >
          {categoriesLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="filter" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Categories Filter (Horizontal) with Navigation */}
      <View style={[styles.categoriesContainer, { 
        backgroundColor: CARD_BACKGROUND,
        borderColor: BORDER_COLOR
      }]}>
        {/* Breadcrumb and Back Button */}
        {currentLevel > 0 && (
          <View style={[styles.breadcrumbContainer, { borderBottomColor: BORDER_COLOR }]}>
            <TouchableOpacity 
              style={[styles.backToCategoriesButton, { backgroundColor: PRIMARY_COLOR }]}
              onPress={goBackToParent}
            >
              <Ionicons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.backToCategoriesText}>Retour</Text>
            </TouchableOpacity>
            <View style={styles.breadcrumbPath}>
              {breadcrumb.map((crumb, index) => (
                <View key={crumb.id} style={styles.breadcrumbItem}>
                  <Text style={[styles.breadcrumbText, { color: TEXT_COLOR_SECONDARY }]}>
                    {crumb.label}
                  </Text>
                  {index < breadcrumb.length - 1 && (
                    <Ionicons name="chevron-forward" size={16} color={TEXT_COLOR_SECONDARY} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
        
        {currentLevel === 0 ? (
          // Show main categories
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filterData}
            keyExtractor={(item) => `cat-${item.id}`}
            renderItem={renderCategoryItem}
            extraData={selectedCategoryId}
            contentContainerStyle={{ paddingHorizontal: 8 }}
          />
        ) : (
          // Show subcategory filters
          <View style={styles.subcategoryFilters}>
            <Text style={[styles.filterTitle, { color: TEXT_COLOR }]}>
              Filtrer par:
            </Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={availableSubcategories}
              keyExtractor={(item) => `subcat-${item.id}`}
              renderItem={renderSubcategoryChip}
              extraData={selectedSubcategoryId}
              contentContainerStyle={{ paddingHorizontal: 8 }}
            />
          </View>
        )}
      </View>
      
      {/* Category info with filtering status */}
      {categoryName && (
        <View style={[styles.categoryBadge, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <MaterialCommunityIcons 
            name={currentLevel === 0 ? "tag-outline" : "filter-variant"} 
            size={18} 
            color={PRIMARY_COLOR}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.categoryName, { color: TEXT_COLOR }]}>
            {categoryName}
            {selectedSubcategoryId && availableSubcategories.find(sub => sub.id === selectedSubcategoryId) && 
              ` - ${availableSubcategories.find(sub => sub.id === selectedSubcategoryId).label}`
            }
          </Text>
          <View style={[styles.countBadge, { backgroundColor: PRIMARY_COLOR }]}>
            <Text style={styles.countText}>
              {currentLevel === 1 ? (selectedSubcategoryId ? filteredProducts.length : allProducts.length) : count}
            </Text>
          </View>
        </View>
      )}
      
      {/* Content - Show filtered products */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: TEXT_COLOR_SECONDARY }]}>
            Chargement des produits...
          </Text>
        </View>
      ) : (currentLevel === 1 ? filteredProducts : products).length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' }]}>
            <Feather name="package" size={60} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.emptyTitle, { color: TEXT_COLOR }]}>
            Aucun produit
          </Text>
          <Text style={[styles.emptySubtitle, { color: TEXT_COLOR_SECONDARY }]}>
            {currentLevel === 1 && selectedSubcategoryId 
              ? "Aucun produit dans cette sous-catégorie"
              : "Aucun produit disponible dans cette catégorie"
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentLevel === 1 ? filteredProducts : products}
          keyExtractor={(item) => `product-${item.id}`}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ padding: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Advanced Category Filter Modal */}
      <Modal
        visible={showCategoryFilter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryFilter(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { 
            backgroundColor: CARD_BACKGROUND, 
            borderBottomColor: BORDER_COLOR 
          }]}>
            <TouchableOpacity
              onPress={() => setShowCategoryFilter(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={TEXT_COLOR} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>
              Toutes les catégories
            </Text>
            <Text style={[styles.modalSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
              {apiCategories.length} catégories
            </Text>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: CARD_BACKGROUND }]}>
            <View style={[styles.searchInput, { 
              backgroundColor: BACKGROUND_COLOR, 
              borderColor: BORDER_COLOR 
            }]}>
              <Ionicons name="search" size={20} color={TEXT_COLOR_SECONDARY} />
              <TextInput
                style={[styles.searchText, { color: TEXT_COLOR }]}
                placeholder="Rechercher une catégorie..."
                placeholderTextColor={TEXT_COLOR_SECONDARY}
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color={TEXT_COLOR_SECONDARY} />
                </TouchableOpacity>
              )}
            </View>

            {/* Control Buttons */}
            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={expandAll}
              >
                <Text style={styles.controlButtonText}>Tout ouvrir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: SECONDARY_COLOR }]}
                onPress={collapseAll}
              >
                <Text style={styles.controlButtonText}>Tout fermer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories List */}
          <ScrollView 
            style={styles.modalCategoriesList}
            showsVerticalScrollIndicator={false}
          >
            {categoriesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={[styles.loadingText, { color: TEXT_COLOR_SECONDARY }]}>
                  Chargement des catégories...
                </Text>
              </View>
            ) : filteredCategories.length > 0 ? (
              filteredCategories.map(category => renderApiCategory(category))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color={TEXT_COLOR_SECONDARY} />
                <Text style={[styles.emptyText, { color: TEXT_COLOR_SECONDARY }]}>
                  {searchText ? 'Aucune catégorie trouvée' : 'Aucune catégorie disponible'}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Breadcrumb styles
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backToCategoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  backToCategoriesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  breadcrumbPath: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  // Subcategory filter styles
  subcategoryFilters: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  subcategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  subcategoryChipText: {
    fontSize: 14,
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCategoriesList: {
    flex: 1,
    padding: 10,
  },
  modalCategoryContainer: {
    marginBottom: 5,
  },
  modalCategoryItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  modalCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  modalCategoryText: {
    flex: 1,
  },
  modalCategoryLabel: {
    fontSize: 16,
  },
  modalCategoryDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCategoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    padding: 4,
  },
  subcategoriesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});