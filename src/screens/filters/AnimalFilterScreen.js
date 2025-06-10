// MediumAnimalFilterScreen.js - Working Version
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { getBrands, getBrandsWithCount, getCategories } from '../../service/DolibarrBrandService';

const { width } = Dimensions.get('window');

export default function MediumAnimalFilterScreen({ navigation }) {
  const { isDarkMode, colorTheme } = useTheme();

  // Filter states
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Data states
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Colors
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const BACKGROUND_COLOR = isDarkMode ? '#0a0a0a' : '#f8f9fa';
  const CARD_BACKGROUND = isDarkMode ? '#1a1a1a' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#1a1a1a';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#a0a0a0' : '#6c757d';
  const BORDER_COLOR = isDarkMode ? '#2a2a2a' : '#e9ecef';
  const SURFACE_COLOR = isDarkMode ? '#242424' : '#f8f9fa';

  // Animal types
  const animalTypes = [
    { id: '2', name: 'Chien', icon: 'dog', color: '#FF6B6B', lightColor: '#FFE5E5' },
    { id: '3', name: 'Chat', icon: 'cat', color: '#4ECDC4', lightColor: '#E5F9F6' },
    { id: '184', name: 'Lapin', icon: 'rabbit', color: '#9B59B6', lightColor: '#F4E6F7' },
    { id: '21', name: 'Poisson', icon: 'fish', color: '#3498DB', lightColor: '#EBF5FB' },
    { id: '31', name: 'Reptile', icon: 'snake', color: '#27AE60', lightColor: '#E8F8F5' },
    { id: '20', name: 'Oiseau', icon: 'bird', color: '#F39C12', lightColor: '#FEF9E7' },
  ];

  // Load data
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBrands();
      loadCategories();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const brandsData = await getBrandsWithCount();
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading brands:', error);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Category navigation states
  const [categoryNavigation, setCategoryNavigation] = useState([]);
  const [currentCategoryLevel, setCurrentCategoryLevel] = useState(0);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState([]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const categoriesData = await getCategories();
      console.log('Raw categories data:', categoriesData);
      
      // Filter to get only children of Global category (parent: 1) and their children
      const filteredCategories = categoriesData.filter(category => {
        // Include direct children of Global (parent: 1)
        if (category.parent === 1 || category.parent === "1") {
          return true;
        }
        
        // Include children of those categories (grandchildren of Global)
        const parentExists = categoriesData.some(parent => 
          (parent.parent === 1 || parent.parent === "1") && 
          (parent.id === category.parent || parent.id == category.parent)
        );
        
        return parentExists;
      });
      
      console.log('Filtered categories:', filteredCategories);
      setCategories(filteredCategories);
      
      // Initialize navigation with main categories (direct children of Global)
      const mainCategories = filteredCategories.filter(cat => cat.parent === 1 || cat.parent === "1");
      setCategoryNavigation([mainCategories]);
      setCurrentCategoryLevel(0);
      setCategoryBreadcrumb([]);
      
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCategorySelect = (category) => {
    // Find children of selected category
    const children = categories.filter(cat => 
      cat.parent === category.id || cat.parent == category.id
    );
    
    if (children.length > 0) {
      // Has children - navigate deeper
      const newNavigation = [...categoryNavigation];
      newNavigation[currentCategoryLevel + 1] = children;
      setCategoryNavigation(newNavigation);
      setCurrentCategoryLevel(currentCategoryLevel + 1);
      
      const newBreadcrumb = [...categoryBreadcrumb, category];
      setCategoryBreadcrumb(newBreadcrumb);
    } else {
      // No children - this is the final selection
      setSelectedCategory(category.name || category.label);
      setShowCategoryModal(false);
      
      // Reset navigation
      resetCategoryNavigation();
    }
  };

  const handleCategoryDirectSelect = (category) => {
    // Select this category directly, even if it has children
    setSelectedCategory(category.name || category.label);
    setShowCategoryModal(false);
    
    // Reset navigation
    resetCategoryNavigation();
  };

  const handleCategoryBack = () => {
    if (currentCategoryLevel > 0) {
      setCurrentCategoryLevel(currentCategoryLevel - 1);
      const newBreadcrumb = categoryBreadcrumb.slice(0, -1);
      setCategoryBreadcrumb(newBreadcrumb);
    }
  };

  const handleCategoryBreadcrumbClick = (index) => {
    setCurrentCategoryLevel(index + 1);
    const newBreadcrumb = categoryBreadcrumb.slice(0, index + 1);
    setCategoryBreadcrumb(newBreadcrumb);
  };

  const resetCategoryNavigation = () => {
    const mainCategories = categories.filter(cat => cat.parent === 1 || cat.parent === "1");
    setCategoryNavigation([mainCategories]);
    setCurrentCategoryLevel(0);
    setCategoryBreadcrumb([]);
  };

  const resetFilters = () => {
    setSelectedAnimal('');
    setSelectedBrand('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
  };

  const applyFilters = () => {
    const filters = {};
    
    if (selectedAnimal) filters.animal = selectedAnimal;
    if (selectedBrand) filters.brand = selectedBrand;
    if (selectedCategory) filters.category = selectedCategory;
    
    if (priceRange.min || priceRange.max) {
      if (priceRange.min) filters.priceMin = parseFloat(priceRange.min);
      if (priceRange.max) filters.priceMax = parseFloat(priceRange.max);
    }
    
    console.log('🎯 Applied filters:', filters);
    Alert.alert('Filtres appliqués', `${getActiveFilterCount()} filtre(s) actif(s)`);
  };

  const hasActiveFilters = () => {
    return selectedAnimal || selectedBrand || selectedCategory || priceRange.min || priceRange.max;
  };

  const getActiveFilterCount = () => {
    return [
      selectedAnimal, 
      selectedBrand, 
      selectedCategory, 
      (priceRange.min || priceRange.max) ? 'price' : null
    ].filter(Boolean).length;
  };

  const getPriceRangeDisplay = () => {
    console.log('Price range:', priceRange); // Debug log
    
    if (!priceRange.min && !priceRange.max) return '';
    
    if (priceRange.min && priceRange.max) {
      return `${priceRange.min} - ${priceRange.max} DH`;
    } else if (priceRange.min && !priceRange.max) {
      return `À partir de ${priceRange.min} DH`;
    } else if (!priceRange.min && priceRange.max) {
      return `Jusqu'à ${priceRange.max} DH`;
    }
    
    return '';
  };

  const handlePriceInputChange = (field, value) => {
    console.log('Price input change:', field, value); // Debug log
    const numericValue = value.replace(/[^0-9]/g, '');
    setPriceRange(prev => {
      const newRange = { ...prev, [field]: numericValue };
      console.log('New price range:', newRange); // Debug log
      return newRange;
    });
  };

  // Price Range Selector
  const renderPriceRangeSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="pricetag" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Prix</Text>
      </View>
      
      <View style={styles.priceRangeContainer}>
        <View style={styles.priceInputGroup}>
          <Text style={[styles.priceInputLabel, { color: TEXT_COLOR_SECONDARY }]}>
            De
          </Text>
          <View style={[
            styles.priceInputContainer,
            {
              backgroundColor: SURFACE_COLOR,
              borderColor: priceRange.min ? PRIMARY_COLOR : BORDER_COLOR,
              borderWidth: priceRange.min ? 2 : 1.5, // Thicker border when active
            }
          ]}>
            <TextInput
              style={[styles.priceInput, { color: TEXT_COLOR }]}
              value={priceRange.min}
              onChangeText={(text) => handlePriceInputChange('min', text)}
              placeholder="Min"
              placeholderTextColor={TEXT_COLOR_SECONDARY}
              keyboardType="numeric"
            />
            <Text style={[styles.currencyText, { color: TEXT_COLOR_SECONDARY }]}>
              DH
            </Text>
          </View>
        </View>
        
        <View style={styles.priceRangeSeparator}>
          <View style={[styles.separatorLine, { backgroundColor: BORDER_COLOR }]} />
          <Text style={[styles.separatorText, { color: TEXT_COLOR_SECONDARY }]}>à</Text>
          <View style={[styles.separatorLine, { backgroundColor: BORDER_COLOR }]} />
        </View>
        
        <View style={styles.priceInputGroup}>
          <Text style={[styles.priceInputLabel, { color: TEXT_COLOR_SECONDARY }]}>
            Jusqu'à
          </Text>
          <View style={[
            styles.priceInputContainer,
            {
              backgroundColor: SURFACE_COLOR,
              borderColor: priceRange.max ? PRIMARY_COLOR : BORDER_COLOR,
              borderWidth: priceRange.max ? 2 : 1.5, // Thicker border when active
            }
          ]}>
            <TextInput
              style={[styles.priceInput, { color: TEXT_COLOR }]}
              value={priceRange.max}
              onChangeText={(text) => handlePriceInputChange('max', text)}
              placeholder="Max"
              placeholderTextColor={TEXT_COLOR_SECONDARY}
              keyboardType="numeric"
            />
            <Text style={[styles.currencyText, { color: TEXT_COLOR_SECONDARY }]}>
              DH
            </Text>
          </View>
        </View>
      </View>
      
      {/* Show price display whenever there's any value */}
      {(priceRange.min || priceRange.max) && (
        <View style={[styles.priceDisplayContainer, { backgroundColor: PRIMARY_COLOR + '10', borderColor: PRIMARY_COLOR + '30' }]}>
          <Text style={[styles.priceDisplayText, { color: PRIMARY_COLOR }]}>
            {getPriceRangeDisplay()}
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('Clearing price range'); // Debug log
              setPriceRange({ min: '', max: '' });
            }}
            style={[styles.clearPriceButton, { backgroundColor: PRIMARY_COLOR + '20' }]}
            activeOpacity={0.7}>
            <Ionicons name="close" size={14} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Animal Selector
  const renderAnimalSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="paw" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Animal</Text>
      </View>
      <View style={styles.animalGrid}>
        {animalTypes.map((animal) => (
          <TouchableOpacity
            key={animal.id}
            style={[
              styles.animalCard,
              {
                backgroundColor: selectedAnimal === animal.id ? animal.lightColor : SURFACE_COLOR,
                borderColor: selectedAnimal === animal.id ? animal.color : BORDER_COLOR,
                shadowColor: selectedAnimal === animal.id ? animal.color : '#000',
                shadowOpacity: selectedAnimal === animal.id ? 0.2 : 0.05,
                elevation: selectedAnimal === animal.id ? 3 : 1,
              }
            ]}
            onPress={() => setSelectedAnimal(selectedAnimal === animal.id ? '' : animal.id)}
            activeOpacity={0.7}>
            <View style={[
              styles.animalIconContainer,
              { backgroundColor: selectedAnimal === animal.id ? animal.color : animal.color + '15' }
            ]}>
              <MaterialCommunityIcons
                name={animal.icon}
                size={18}
                color={selectedAnimal === animal.id ? '#fff' : animal.color}
              />
            </View>
            <Text style={[styles.animalText, { color: selectedAnimal === animal.id ? animal.color : TEXT_COLOR }]}>
              {animal.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Generic Selector
  const renderSelector = (title, icon, value, placeholder, onPress, loading = false) => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name={icon} size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>{title}</Text>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
            <Text style={[styles.loadingText, { color: TEXT_COLOR_SECONDARY }]}>
              Chargement...
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: value ? PRIMARY_COLOR + '10' : SURFACE_COLOR,
            borderColor: value ? PRIMARY_COLOR : BORDER_COLOR,
            shadowColor: value ? PRIMARY_COLOR : '#000',
            shadowOpacity: value ? 0.1 : 0.05,
            elevation: value ? 2 : 1,
          }
        ]}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.7}>
        <Text style={[styles.selectorText, { color: value ? PRIMARY_COLOR : TEXT_COLOR_SECONDARY }]} numberOfLines={1}>
          {loading ? 'Chargement...' : (value || placeholder)}
        </Text>
        <Ionicons 
          name={loading ? "reload" : "chevron-forward"} 
          size={16} 
          color={TEXT_COLOR_SECONDARY} 
        />
      </TouchableOpacity>
    </View>
  );

  // Enhanced Hierarchical Category Modal
  const renderCategoryModal = () => (
    <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        {/* Header with back button and breadcrumb */}
        <View style={[styles.categoryModalHeader, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
          <View style={styles.categoryHeaderTop}>
            {currentCategoryLevel > 0 ? (
              <TouchableOpacity onPress={handleCategoryBack} style={styles.categoryBackButton}>
                <Ionicons name="arrow-back" size={20} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            ) : (
              <View style={styles.categoryBackButton} />
            )}
            
            <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>Catégories</Text>
            
            <TouchableOpacity onPress={() => {
              setShowCategoryModal(false);
              resetCategoryNavigation();
            }} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={TEXT_COLOR} />
            </TouchableOpacity>
          </View>
          
          {/* Breadcrumb */}
          {categoryBreadcrumb.length > 0 && (
            <View style={styles.breadcrumbContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breadcrumbScroll}>
                <TouchableOpacity 
                  onPress={() => {
                    setCurrentCategoryLevel(0);
                    setCategoryBreadcrumb([]);
                  }}
                  style={styles.breadcrumbItem}>
                  <Text style={[styles.breadcrumbText, { color: PRIMARY_COLOR }]}>Accueil</Text>
                </TouchableOpacity>
                
                {categoryBreadcrumb.map((category, index) => (
                  <View key={category.id} style={styles.breadcrumbItemContainer}>
                    <Ionicons name="chevron-forward" size={14} color={TEXT_COLOR_SECONDARY} style={styles.breadcrumbSeparator} />
                    <TouchableOpacity 
                      onPress={() => handleCategoryBreadcrumbClick(index)}
                      style={styles.breadcrumbItem}>
                      <Text style={[styles.breadcrumbText, { 
                        color: index === categoryBreadcrumb.length - 1 ? TEXT_COLOR : PRIMARY_COLOR 
                      }]}>
                        {category.name || category.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        
        {/* Category List */}
        {categoryNavigation[currentCategoryLevel] && categoryNavigation[currentCategoryLevel].length > 0 && (
          <>
            {/* Select Current Level Option (when viewing children) */}
            {categoryBreadcrumb.length > 0 && (
              <View style={styles.selectCurrentContainer}>
                <TouchableOpacity
                  style={[styles.selectCurrentButton, { 
                    backgroundColor: PRIMARY_COLOR + '10',
                    borderColor: PRIMARY_COLOR + '30',
                  }]}
                  onPress={() => handleCategoryDirectSelect(categoryBreadcrumb[categoryBreadcrumb.length - 1])}
                  activeOpacity={0.7}>
                  <View style={styles.selectCurrentContent}>
                    <View style={[styles.selectCurrentIcon, { backgroundColor: PRIMARY_COLOR }]}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    </View>
                    <View style={styles.selectCurrentText}>
                      <Text style={[styles.selectCurrentTitle, { color: PRIMARY_COLOR }]}>
                        Sélectionner "{categoryBreadcrumb[categoryBreadcrumb.length - 1].name || categoryBreadcrumb[categoryBreadcrumb.length - 1].label}"
                      </Text>
                      <Text style={[styles.selectCurrentSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                        Tous les produits de cette catégorie
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                <View style={[styles.dividerContainer, { backgroundColor: BORDER_COLOR }]}>
                  <Text style={[styles.dividerText, { color: TEXT_COLOR_SECONDARY }]}>ou choisissez une sous-catégorie</Text>
                </View>
              </View>
            )}
            
            {/* Category Items */}
            <FlatList
              data={categoryNavigation[currentCategoryLevel]}
              keyExtractor={(item) => `category-${item.id}`}
              renderItem={({ item }) => {
                const hasChildren = categories.some(cat => cat.parent === item.id || cat.parent == item.id);
                const isSelected = selectedCategory === (item.name || item.label);
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: isSelected ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                        borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
                      }
                    ]}
                    onPress={() => hasChildren ? handleCategorySelect(item) : handleCategoryDirectSelect(item)}
                    activeOpacity={0.7}>
                    
                    <View style={styles.categoryItemContent}>
                      <Text style={[styles.categoryItemText, { 
                        color: isSelected ? PRIMARY_COLOR : TEXT_COLOR 
                      }]} numberOfLines={1}>
                        {item.name || item.label}
                      </Text>
                      {item.description && (
                        <Text style={[styles.categoryItemDescription, { color: TEXT_COLOR_SECONDARY }]} numberOfLines={1}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.categoryItemRight}>
                      {isSelected && <Ionicons name="checkmark" size={18} color={PRIMARY_COLOR} />}
                      {hasChildren && !isSelected && <Ionicons name="chevron-forward" size={16} color={TEXT_COLOR_SECONDARY} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
        
        {(!categoryNavigation[currentCategoryLevel] || categoryNavigation[currentCategoryLevel].length === 0) && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="folder-outline" size={48} color={TEXT_COLOR_SECONDARY} />
            <Text style={[styles.emptyStateText, { color: TEXT_COLOR_SECONDARY }]}>
              Aucune sous-catégorie
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
  // Simple List Modal (for brands only)
  const renderListModal = (visible, title, data, selectedValue, onSelect, onClose, showCount = false) => (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={[styles.modalHeader, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
          <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>
        
        {data.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={TEXT_COLOR_SECONDARY} />
            <Text style={[styles.emptyStateText, { color: TEXT_COLOR_SECONDARY }]}>
              Aucune donnée disponible
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: TEXT_COLOR_SECONDARY }]}>
              Vérifiez votre connexion et réessayez
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => `item-${item.id}`}
            renderItem={({ item }) => {
              const itemName = item.name || item.label;
              const isSelected = selectedValue === itemName;
              
              return (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    {
                      backgroundColor: isSelected ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                      borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
                    }
                  ]}
                  onPress={() => {
                    onSelect(itemName);
                    onClose();
                  }}
                  activeOpacity={0.7}>
                  <View style={styles.modalItemContent}>
                    <Text style={[styles.modalItemText, { color: isSelected ? PRIMARY_COLOR : TEXT_COLOR }]} numberOfLines={1}>
                      {itemName}
                    </Text>
                    {showCount && item.productCount > 0 && (
                      <Text style={[styles.productCountText, { color: TEXT_COLOR_SECONDARY }]}>
                        {item.productCount} produit{item.productCount > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={18} color={PRIMARY_COLOR} />}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Filtres</Text>
          {hasActiveFilters() && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {renderAnimalSelector()}
        {renderSelector('Marque', 'business-outline', selectedBrand, 'Choisir une marque', () => setShowBrandModal(true), loadingBrands)}
        {renderSelector('Catégorie', 'grid-outline', selectedCategory, 'Choisir une catégorie', () => setShowCategoryModal(true), loadingCategories)}
        {renderPriceRangeSelector()}
      </ScrollView>

      {/* Apply Button */}
      <View style={[styles.bottomActions, { backgroundColor: CARD_BACKGROUND, borderTopColor: BORDER_COLOR }]}>
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: hasActiveFilters() ? PRIMARY_COLOR : BORDER_COLOR }]}
          onPress={applyFilters}
          disabled={!hasActiveFilters()}
          activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ opacity: hasActiveFilters() ? 1 : 0.6 }} />
          <Text style={[styles.applyButtonText, { opacity: hasActiveFilters() ? 1 : 0.6 }]}>
            Appliquer les filtres
          </Text>
          {hasActiveFilters() && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderListModal(showBrandModal, 'Marques', brands, selectedBrand, setSelectedBrand, () => setShowBrandModal(false), true)}
      {renderCategoryModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  headerBadgeText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  
  // Content
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16 },
  
  // Sections
  section: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  
  // Loading indicator
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Animal Grid
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  animalCard: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginBottom: 10,
  },
  animalIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  animalText: { 
    fontSize: 11, 
    fontWeight: '600', 
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Selectors
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  selectorText: { fontSize: 14, fontWeight: '600', flex: 1 },
  
  // Price Range
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  priceInputGroup: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  priceRangeSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 8,
  },
  separatorLine: {
    height: 1,
    flex: 1,
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  priceDisplayText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  clearPriceButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Bottom Actions
  bottomActions: { 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    borderTopWidth: 1 
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    borderRadius: 14,
  },
  applyButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  
  // Modal Styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty state
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Modal Items
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalItemContent: { flex: 1 },
  modalItemText: { fontSize: 14, fontWeight: '600' },
  productCountText: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  
  // Category Modal Styles
  categoryModalHeader: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  categoryHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumbContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  breadcrumbScroll: {
    flexDirection: 'row',
  },
  breadcrumbItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '600',
  },
  breadcrumbSeparator: {
    marginHorizontal: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryItemContent: {
    flex: 1,
  },
  categoryItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryItemDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  // Select Current Category Styles
  selectCurrentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  selectCurrentButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectCurrentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectCurrentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCurrentText: {
    flex: 1,
  },
  selectCurrentTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectCurrentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  dividerContainer: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
    backgroundColor: 'inherit',
    position: 'absolute',
  },
});