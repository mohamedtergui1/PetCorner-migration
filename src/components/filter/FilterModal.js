// FilterModal.js - Updated to filter categories based on selected animal
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
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
import { getBrandsWithCount, getCategories } from '../../service/DolibarrBrandService';

const { width } = Dimensions.get('window');

export default function FilterModal({ 
  visible,
  onClose, 
  onApplyFilters,
  initialFilters = {},
  showAnimalFilter = true,
  showBrandFilter = true,
  showCategoryFilter = true,
  showPriceFilter = true,
}) {
  const { isDarkMode, colorTheme } = useTheme();

  // Filter states
  const [selectedAnimal, setSelectedAnimal] = useState(initialFilters.animal || '');
  const [selectedBrand, setSelectedBrand] = useState(initialFilters.brand || '');
  
  // FIXED: Store both category ID and name for display
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialFilters.category || '');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [customPriceRange, setCustomPriceRange] = useState({
    min: '',
    max: ''
  });
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Data states
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]); // Store all categories
  const [filteredCategories, setFilteredCategories] = useState([]); // Categories filtered by animal
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Colors (same as before)
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const BACKGROUND_COLOR = isDarkMode ? '#0a0a0a' : '#f8f9fa';
  const CARD_BACKGROUND = isDarkMode ? '#1a1a1a' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#1a1a1a';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#a0a0a0' : '#6c757d';
  const BORDER_COLOR = isDarkMode ? '#2a2a2a' : '#e9ecef';
  const SURFACE_COLOR = isDarkMode ? '#242424' : '#f8f9fa';

  // Same predefined ranges and animals as before
  const priceRanges = [
    { id: 'under50', label: 'Moins de 50 DH', min: 0, max: 49, icon: 'cash-outline' },
    { id: '50to100', label: '50 - 100 DH', min: 50, max: 100, icon: 'card-outline' },
    { id: '100to200', label: '100 - 200 DH', min: 100, max: 200, icon: 'wallet-outline' },
    { id: '200to500', label: '200 - 500 DH', min: 200, max: 500, icon: 'diamond-outline' },
    { id: '500to1000', label: '500 - 1000 DH', min: 500, max: 1000, icon: 'star-outline' },
    { id: 'over1000', label: 'Plus de 1000 DH', min: 1000, max: null, icon: 'trophy-outline' },
    { id: 'custom', label: 'Personnalisé', min: null, max: null, icon: 'settings-outline' },
  ];

  const animalTypes = [
    { id: '2', name: 'Chien', icon: 'dog', color: '#FF6B6B', lightColor: '#FFE5E5' },
    { id: '3', name: 'Chat', icon: 'cat', color: '#4ECDC4', lightColor: '#E5F9F6' },
    { id: '184', name: 'Lapin', icon: 'rabbit', color: '#9B59B6', lightColor: '#F4E6F7' },
    { id: '21', name: 'Poisson', icon: 'fish', color: '#3498DB', lightColor: '#EBF5FB' },
    { id: '31', name: 'Reptile', icon: 'snake', color: '#27AE60', lightColor: '#E8F8F5' },
    { id: '20', name: 'Oiseau', icon: 'bird', color: '#F39C12', lightColor: '#FEF9E7' },
  ];

  // Category navigation states
  const [categoryNavigation, setCategoryNavigation] = useState([]);
  const [currentCategoryLevel, setCurrentCategoryLevel] = useState(0);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState([]);

  // NEW: Function to filter categories based on selected animal
  const filterCategoriesByAnimal = (categoriesData, animalId) => {
    if (!animalId || !categoriesData.length) {
      // If no animal selected, show all categories (children of Global category)
      return categoriesData.filter(category => {
        if (category.parent === 1 || category.parent === "1") {
          return true;
        }
        
        const parentExists = categoriesData.some(parent => 
          (parent.parent === 1 || parent.parent === "1") && 
          (parent.id === category.parent || parent.id == category.parent)
        );
        
        return parentExists;
      });
    }

    console.log('🐾 Filtering categories for animal:', animalId);
    
    // Filter categories that belong to the selected animal
    const animalCategories = categoriesData.filter(category => {
      // Check if this category is a direct child of the animal
      if (category.parent === animalId || category.parent == animalId) {
        return true;
      }
      
      // Check if this category is a child of a category that belongs to the animal
      const parentExists = categoriesData.some(parent => 
        (parent.parent === animalId || parent.parent == animalId) && 
        (parent.id === category.parent || parent.id == category.parent)
      );
      
      return parentExists;
    });

    console.log('🏷️ Filtered categories:', animalCategories.length, 'categories found for animal', animalId);
    return animalCategories;
  };

  // NEW: Effect to filter categories when animal selection changes
  useEffect(() => {
    if (allCategories.length > 0) {
      const filtered = filterCategoriesByAnimal(allCategories, selectedAnimal);
      setFilteredCategories(filtered);
      setCategories(filtered);
      
      // Reset category selection if current category doesn't belong to selected animal
      if (selectedAnimal && selectedCategoryId) {
        const categoryStillValid = filtered.some(cat => cat.id == selectedCategoryId);
        if (!categoryStillValid) {
          console.log('🚫 Current category not valid for selected animal, clearing...');
          setSelectedCategoryId('');
          setSelectedCategoryName('');
        }
      }
      
      // Reset category navigation
      resetCategoryNavigation(filtered);
    }
  }, [selectedAnimal, allCategories]);

  // Load data when modal becomes visible
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        if (showBrandFilter) loadBrands();
        if (showCategoryFilter) loadCategories();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // FIXED: Reset filters when initialFilters change
  useEffect(() => {
    setSelectedAnimal(initialFilters.animal || '');
    setSelectedBrand(initialFilters.brand || '');
    
    // FIXED: Handle category ID and find the corresponding name
    const categoryId = initialFilters.category || '';
    setSelectedCategoryId(categoryId);
    
    if (categoryId && allCategories.length > 0) {
      const category = allCategories.find(cat => cat.id == categoryId);
      setSelectedCategoryName(category ? (category.name || category.label) : '');
    } else {
      setSelectedCategoryName('');
    }
    
    // Handle price range (same as before)
    if (initialFilters.priceMin !== undefined || initialFilters.priceMax !== undefined) {
      const matchingRange = priceRanges.find(range => 
        range.min === initialFilters.priceMin && range.max === initialFilters.priceMax
      );
      
      if (matchingRange && matchingRange.id !== 'custom') {
        setSelectedPriceRange(matchingRange.id);
        setCustomPriceRange({ min: '', max: '' });
      } else {
        setSelectedPriceRange('custom');
        setCustomPriceRange({
          min: initialFilters.priceMin?.toString() || '',
          max: initialFilters.priceMax?.toString() || ''
        });
      }
    } else {
      setSelectedPriceRange('');
      setCustomPriceRange({ min: '', max: '' });
    }
  }, [initialFilters, allCategories]);

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

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const categoriesData = await getCategories();
      
      // Store all categories for filtering
      setAllCategories(categoriesData);
      
      // Apply initial filtering based on selected animal
      const filtered = filterCategoriesByAnimal(categoriesData, selectedAnimal);
      setFilteredCategories(filtered);
      setCategories(filtered);
      
      // Initialize navigation with filtered categories
      resetCategoryNavigation(filtered);
      
    } catch (error) {
      console.error('Error loading categories:', error);
      setAllCategories([]);
      setFilteredCategories([]);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // MODIFIED: Animal selection handler to clear category when animal changes
  const handleAnimalSelect = (animalId) => {
    console.log('🐾 Animal selected:', animalId);
    
    const previousAnimal = selectedAnimal;
    setSelectedAnimal(selectedAnimal === animalId ? '' : animalId);
    
    // Clear category selection when animal changes (not when clearing animal)
    if (previousAnimal !== animalId && animalId !== '') {
      console.log('🚫 Animal changed, clearing category selection');
      setSelectedCategoryId('');
      setSelectedCategoryName('');
    }
  };

  // MODIFIED: Reset category navigation with filtered categories
  const resetCategoryNavigation = (categoriesToUse = categories) => {
    const mainCategories = categoriesToUse.filter(cat => {
      if (!selectedAnimal) {
        // If no animal selected, show children of Global category (parent: 1)
        return cat.parent === 1 || cat.parent === "1";
      } else {
        // If animal selected, show children of that animal
        return cat.parent === selectedAnimal || cat.parent == selectedAnimal;
      }
    });
    
    console.log('🔄 Reset category navigation with', mainCategories.length, 'main categories');
    setCategoryNavigation([mainCategories]);
    setCurrentCategoryLevel(0);
    setCategoryBreadcrumb([]);
  };

  // FIXED: Category selection handlers (using filtered categories)
  const handleCategorySelect = (category) => {
    console.log('🏷️ Category selected (navigation):', { id: category.id, name: category.name || category.label });
    
    const children = filteredCategories.filter(cat => 
      cat.parent === category.id || cat.parent == category.id
    );
    
    if (children.length > 0) {
      // Has children, navigate deeper
      const newNavigation = [...categoryNavigation];
      newNavigation[currentCategoryLevel + 1] = children;
      setCategoryNavigation(newNavigation);
      setCurrentCategoryLevel(currentCategoryLevel + 1);
      
      const newBreadcrumb = [...categoryBreadcrumb, category];
      setCategoryBreadcrumb(newBreadcrumb);
    } else {
      // No children, select this category
      setSelectedCategoryId(category.id);
      setSelectedCategoryName(category.name || category.label);
      setShowCategoryModal(false);
      resetCategoryNavigation();
    }
  };

  const handleCategoryDirectSelect = (category) => {
    console.log('🏷️ Category selected (direct):', { id: category.id, name: category.name || category.label });
    
    setSelectedCategoryId(category.id);
    setSelectedCategoryName(category.name || category.label);
    setShowCategoryModal(false);
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

  // FIXED: Reset filters function
  const resetFilters = () => {
    setSelectedAnimal('');
    setSelectedBrand('');
    setSelectedCategoryId('');
    setSelectedCategoryName('');
    setSelectedPriceRange('');
    setCustomPriceRange({ min: '', max: '' });
  };

  // Price handling functions (same as before)
  const handlePriceRangeSelect = (rangeId) => {
    console.log('Selected price range:', rangeId);
    setSelectedPriceRange(rangeId);
    
    if (rangeId !== 'custom') {
      setCustomPriceRange({ min: '', max: '' });
    }
  };

  const handleCustomPriceChange = (field, value) => {
    console.log(`Custom price ${field}:`, value);
    
    const numericValue = value.replace(/[^0-9]/g, '');
    
    setCustomPriceRange(prev => {
      const newRange = { ...prev, [field]: numericValue };
      
      if (newRange.min && newRange.max) {
        const minVal = parseInt(newRange.min, 10);
        const maxVal = parseInt(newRange.max, 10);
        
        if (minVal > maxVal) {
          if (field === 'min') {
            newRange.max = newRange.min;
          } else {
            newRange.min = newRange.max;
          }
        }
      }
      
      return newRange;
    });
  };

  // FIXED: Apply filters with category ID
  const applyFilters = () => {
    const filters = {};
    
    if (selectedAnimal) filters.animal = selectedAnimal;
    if (selectedBrand) filters.brand = selectedBrand;
    
    // FIXED: Use category ID instead of name
    if (selectedCategoryId) {
      filters.category = selectedCategoryId;
      console.log('✅ Category filter applied with ID:', selectedCategoryId);
    }
    
    // Handle price range (same as before)
    if (selectedPriceRange) {
      if (selectedPriceRange === 'custom') {
        if (customPriceRange.min) {
          filters.priceMin = parseFloat(customPriceRange.min);
        }
        if (customPriceRange.max) {
          filters.priceMax = parseFloat(customPriceRange.max);
        }
      } else {
        const selectedRange = priceRanges.find(range => range.id === selectedPriceRange);
        if (selectedRange) {
          if (selectedRange.min !== null) filters.priceMin = selectedRange.min;
          if (selectedRange.max !== null) filters.priceMax = selectedRange.max;
        }
      }
    }
    
    console.log('🔍 Applied filters (with category ID):', filters);
    onApplyFilters(filters);
    onClose();
  };

  // FIXED: Update hasActiveFilters and getActiveFilterCount
  const hasActiveFilters = () => {
    return selectedAnimal || selectedBrand || selectedCategoryId || selectedPriceRange;
  };

  const getActiveFilterCount = () => {
    return [
      selectedAnimal, 
      selectedBrand, 
      selectedCategoryId,  // FIXED: Use category ID
      selectedPriceRange
    ].filter(Boolean).length;
  };

  // Price range display functions (same as before)
  const getPriceRangeDisplay = () => {
    if (!selectedPriceRange) return '';
    
    if (selectedPriceRange === 'custom') {
      if (!customPriceRange.min && !customPriceRange.max) {
        return 'Personnalisé';
      }
      
      const min = customPriceRange.min ? parseInt(customPriceRange.min, 10) : null;
      const max = customPriceRange.max ? parseInt(customPriceRange.max, 10) : null;
      
      if (min && max) {
        if (min === max) {
          return `${min} DH`;
        }
        return `${min} - ${max} DH`;
      } else if (min && !max) {
        return `À partir de ${min} DH`;
      } else if (!min && max) {
        return `Jusqu'à ${max} DH`;
      }
      
      return 'Personnalisé';
    } else {
      const selectedRange = priceRanges.find(range => range.id === selectedPriceRange);
      return selectedRange ? selectedRange.label : '';
    }
  };

  const shouldShowCustomPrice = () => {
    return selectedPriceRange === 'custom';
  };

  // Render functions (same as before, but updated animal selector)
  const renderPriceRangeSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="pricetag" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Prix</Text>
      </View>
      
      <View style={styles.priceRangeGrid}>
        {priceRanges.map((range) => (
          <TouchableOpacity
            key={range.id}
            style={[
              styles.priceRangeCard,
              {
                backgroundColor: selectedPriceRange === range.id ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                borderColor: selectedPriceRange === range.id ? PRIMARY_COLOR : BORDER_COLOR,
                borderWidth: selectedPriceRange === range.id ? 2 : 1,
              }
            ]}
            onPress={() => handlePriceRangeSelect(range.id)}
            activeOpacity={0.7}>
            
            <View style={[
              styles.priceRangeIconContainer,
              { 
                backgroundColor: selectedPriceRange === range.id ? PRIMARY_COLOR : PRIMARY_COLOR + '20'
              }
            ]}>
              <Ionicons 
                name={range.icon} 
                size={16} 
                color={selectedPriceRange === range.id ? '#fff' : PRIMARY_COLOR} 
              />
            </View>
            
            <Text style={[
              styles.priceRangeText, 
              { 
                color: selectedPriceRange === range.id ? PRIMARY_COLOR : TEXT_COLOR,
                fontWeight: selectedPriceRange === range.id ? '700' : '600'
              }
            ]} numberOfLines={2}>
              {range.label}
            </Text>
            
            {selectedPriceRange === range.id && (
              <View style={styles.priceRangeCheckmark}>
                <Ionicons name="checkmark-circle" size={18} color={PRIMARY_COLOR} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {shouldShowCustomPrice() && (
        <View style={[styles.customPriceContainer, { backgroundColor: SURFACE_COLOR, borderColor: PRIMARY_COLOR + '30' }]}>
          <Text style={[styles.customPriceTitle, { color: PRIMARY_COLOR }]}>
            Prix personnalisé
          </Text>
          
          <View style={styles.customPriceInputs}>
            <View style={styles.customPriceInputGroup}>
              <Text style={[styles.customPriceLabel, { color: TEXT_COLOR_SECONDARY }]}>
                De
              </Text>
              <View style={[
                styles.customPriceInputContainer,
                {
                  backgroundColor: CARD_BACKGROUND,
                  borderColor: customPriceRange.min ? PRIMARY_COLOR : BORDER_COLOR,
                  borderWidth: customPriceRange.min ? 2 : 1,
                }
              ]}>
                <TextInput
                  style={[styles.customPriceInput, { color: TEXT_COLOR }]}
                  value={customPriceRange.min}
                  onChangeText={(text) => handleCustomPriceChange('min', text)}
                  placeholder="Min"
                  placeholderTextColor={TEXT_COLOR_SECONDARY}
                  keyboardType="numeric"
                />
                <Text style={[styles.customPriceCurrency, { color: TEXT_COLOR_SECONDARY }]}>
                  DH
                </Text>
              </View>
            </View>
            
            <View style={styles.customPriceSeparator}>
              <View style={[styles.customPriceSeparatorLine, { backgroundColor: BORDER_COLOR }]} />
              <Text style={[styles.customPriceSeparatorText, { color: TEXT_COLOR_SECONDARY }]}>à</Text>
              <View style={[styles.customPriceSeparatorLine, { backgroundColor: BORDER_COLOR }]} />
            </View>
            
            <View style={styles.customPriceInputGroup}>
              <Text style={[styles.customPriceLabel, { color: TEXT_COLOR_SECONDARY }]}>
                Jusqu'à
              </Text>
              <View style={[
                styles.customPriceInputContainer,
                {
                  backgroundColor: CARD_BACKGROUND,
                  borderColor: customPriceRange.max ? PRIMARY_COLOR : BORDER_COLOR,
                  borderWidth: customPriceRange.max ? 2 : 1,
                }
              ]}>
                <TextInput
                  style={[styles.customPriceInput, { color: TEXT_COLOR }]}
                  value={customPriceRange.max}
                  onChangeText={(text) => handleCustomPriceChange('max', text)}
                  placeholder="Max"
                  placeholderTextColor={TEXT_COLOR_SECONDARY}
                  keyboardType="numeric"
                />
                <Text style={[styles.customPriceCurrency, { color: TEXT_COLOR_SECONDARY }]}>
                  DH
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {selectedPriceRange && (
        <View style={[styles.selectedPriceDisplay, { backgroundColor: PRIMARY_COLOR + '10', borderColor: PRIMARY_COLOR + '30' }]}>
          <Text style={[styles.selectedPriceText, { color: PRIMARY_COLOR }]}>
            {getPriceRangeDisplay()}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedPriceRange('');
              setCustomPriceRange({ min: '', max: '' });
            }}
            style={[styles.clearPriceButton, { backgroundColor: PRIMARY_COLOR + '20' }]}
            activeOpacity={0.7}>
            <Ionicons name="close" size={14} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // UPDATED: Animal selector with modified handler
  const renderAnimalSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="paw" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Animal</Text>
        {selectedAnimal && (
          <Text style={[styles.animalFilterNote, { color: TEXT_COLOR_SECONDARY }]}>
            (filtre les catégories)
          </Text>
        )}
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
            onPress={() => handleAnimalSelect(animal.id)}
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

  // FIXED: Generic selector - use selectedCategoryName for display
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

  // Category Modal (using filtered categories)
  const renderCategoryModal = () => (
    <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={[styles.categoryModalHeader, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
          <View style={styles.categoryHeaderTop}>
            {currentCategoryLevel > 0 ? (
              <TouchableOpacity onPress={handleCategoryBack} style={styles.categoryBackButton}>
                <Ionicons name="arrow-back" size={20} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            ) : (
              <View style={styles.categoryBackButton} />
            )}
            
            <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>
              Catégories
              {selectedAnimal && (
                <Text style={[styles.categoryModalSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                  {' '}pour {animalTypes.find(a => a.id === selectedAnimal)?.name}
                </Text>
              )}
            </Text>
            
            <TouchableOpacity onPress={() => {
              setShowCategoryModal(false);
              resetCategoryNavigation();
            }} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={TEXT_COLOR} />
            </TouchableOpacity>
          </View>
          
          {categoryBreadcrumb.length > 0 && (
            <View style={styles.breadcrumbContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    <Ionicons name="chevron-forward" size={14} color={TEXT_COLOR_SECONDARY} />
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
        
        {categoryNavigation[currentCategoryLevel] && categoryNavigation[currentCategoryLevel].length > 0 ? (
          <>
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
              </View>
            )}
            
            <FlatList
              data={categoryNavigation[currentCategoryLevel]}
              keyExtractor={(item) => `category-${item.id}`}
              renderItem={({ item }) => {
                const hasChildren = filteredCategories.some(cat => cat.parent === item.id || cat.parent == item.id);
                const isSelected = selectedCategoryId == item.id;
                
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
        ) : (
          <View style={styles.noCategoriesContainer}>
            <View style={[styles.noCategoriesIcon, { backgroundColor: PRIMARY_COLOR + '15' }]}>
              <Ionicons name="grid-outline" size={32} color={PRIMARY_COLOR} />
            </View>
            <Text style={[styles.noCategoriesTitle, { color: TEXT_COLOR }]}>
              Aucune catégorie disponible
            </Text>
            <Text style={[styles.noCategoriesSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
              {selectedAnimal 
                ? `Aucune catégorie trouvée pour ${animalTypes.find(a => a.id === selectedAnimal)?.name}`
                : 'Aucune catégorie trouvée'
              }
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  // Brand Modal (same as before)
  const renderBrandModal = () => (
    <Modal visible={showBrandModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={[styles.modalHeader, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
          <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>Marques</Text>
          <TouchableOpacity onPress={() => setShowBrandModal(false)} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={brands}
          keyExtractor={(item) => `brand-${item.id}`}
          renderItem={({ item }) => {
            const itemName = item.name || item.label;
            const isSelected = selectedBrand === itemName;
            
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
                  setSelectedBrand(itemName);
                  setShowBrandModal(false);
                }}
                activeOpacity={0.7}>
                <View style={styles.modalItemContent}>
                  <Text style={[styles.modalItemText, { color: isSelected ? PRIMARY_COLOR : TEXT_COLOR }]} numberOfLines={1}>
                    {itemName}
                  </Text>
                  {item.productCount > 0 && (
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
      </SafeAreaView>
    </Modal>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
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
          {showAnimalFilter && renderAnimalSelector()}
          {showBrandFilter && renderSelector('Marque', 'business-outline', selectedBrand, 'Choisir une marque', () => setShowBrandModal(true), loadingBrands)}
          {/* FIXED: Display category name but store category ID */}
          {showCategoryFilter && renderSelector('Catégorie', 'grid-outline', selectedCategoryName, selectedAnimal ? `Catégories ${animalTypes.find(a => a.id === selectedAnimal)?.name}` : 'Choisir une catégorie', () => setShowCategoryModal(true), loadingCategories)}
          {showPriceFilter && renderPriceRangeSelector()}
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
        {renderBrandModal()}
        {renderCategoryModal()}
      </SafeAreaView>
    </Modal>
  );
}

// Updated styles with new additions
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
  
  // NEW: Animal filter note
  animalFilterNote: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  
  // Loading indicator
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  
  // Price Range Grid
  priceRangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  priceRangeCard: {
    width: (width - 80) / 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 70,
    position: 'relative',
  },
  priceRangeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceRangeText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  priceRangeCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  
  // Custom Price Range
  customPriceContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  customPriceTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  customPriceInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  customPriceInputGroup: {
    flex: 1,
  },
  customPriceLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  customPriceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
  },
  customPriceInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  customPriceCurrency: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  customPriceSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    gap: 4,
  },
  customPriceSeparatorLine: {
    height: 1,
    flex: 1,
  },
  customPriceSeparatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Selected Price Display
  selectedPriceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedPriceText: {
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
  modalTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  
  // NEW: Category modal subtitle
  categoryModalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // NEW: No categories state
  noCategoriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  noCategoriesIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noCategoriesTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  noCategoriesSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});