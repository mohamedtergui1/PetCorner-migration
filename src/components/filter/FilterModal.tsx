// components/FilterModal.tsx - Updated to use new ProductService

import React, { useState, useEffect, useCallback } from 'react';
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

// Icons
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

// Import the new ProductService
import ProductService, { 
  Brand, 
  Category, 
  AnimalCategory, 
  FilterData 
} from '../../service/CustomProductApiService';

// Types
interface AppliedFilters {
  animal?: string;
  brand?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AppliedFilters) => void;
  initialFilters?: AppliedFilters;
  showAnimalFilter?: boolean;
  showBrandFilter?: boolean;
  showCategoryFilter?: boolean;
  showPriceFilter?: boolean;
}

interface FilterState {
  selectedAnimal: string;
  selectedBrand: string;
  selectedCategoryId: string;
  selectedCategoryName: string;
  selectedPriceRange: string;
  customPriceRange: { min: string; max: string };
}

interface AnimalType {
  id: string;
  name: string;
  icon: string;
  color: string;
  lightColor: string;
}

interface PriceRange {
  id: string;
  label: string;
  min: number | null;
  max: number | null;
  icon: string;
}

// Theme context
interface ThemeContextType {
  isDarkMode: boolean;
  colorTheme: 'blue' | 'orange';
}

const useTheme = (): ThemeContextType => ({
  isDarkMode: false,
  colorTheme: 'blue',
});

const { width } = Dimensions.get('window');

// Constants
const ANIMAL_TYPES: AnimalType[] = [
  { id: '2', name: 'Chien', icon: 'dog', color: '#FF6B6B', lightColor: '#FFE5E5' },
  { id: '3', name: 'Chat', icon: 'cat', color: '#4ECDC4', lightColor: '#E5F9F6' },
  { id: '184', name: 'Lapin', icon: 'rabbit', color: '#9B59B6', lightColor: '#F4E6F7' },
  { id: '21', name: 'Poisson', icon: 'fish', color: '#3498DB', lightColor: '#EBF5FB' },
  { id: '31', name: 'Reptile', icon: 'snake', color: '#27AE60', lightColor: '#E8F8F5' },
  { id: '20', name: 'Oiseau', icon: 'bird', color: '#F39C12', lightColor: '#FEF9E7' },
];

const PRICE_RANGES: PriceRange[] = [
  { id: 'under50', label: 'Moins de 50 DH', min: 0, max: 49, icon: 'cash-outline' },
  { id: '50to100', label: '50 - 100 DH', min: 50, max: 100, icon: 'card-outline' },
  { id: '100to200', label: '100 - 200 DH', min: 100, max: 200, icon: 'wallet-outline' },
  { id: '200to500', label: '200 - 500 DH', min: 200, max: 500, icon: 'diamond-outline' },
  { id: '500to1000', label: '500 - 1000 DH', min: 500, max: 1000, icon: 'star-outline' },
  { id: 'over1000', label: 'Plus de 1000 DH', min: 1000, max: null, icon: 'trophy-outline' },
  { id: 'custom', label: 'Personnalisé', min: null, max: null, icon: 'settings-outline' },
];

// =====================================
// MAIN COMPONENT
// =====================================

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = {},
  showAnimalFilter = true,
  showBrandFilter = true,
  showCategoryFilter = true,
  showPriceFilter = true,
}) => {
  const { isDarkMode, colorTheme } = useTheme();

  // =====================================
  // STATE
  // =====================================

  const [filterState, setFilterState] = useState<FilterState>({
    selectedAnimal: initialFilters.animal || '',
    selectedBrand: initialFilters.brand || '',
    selectedCategoryId: initialFilters.category || '',
    selectedCategoryName: '',
    selectedPriceRange: '',
    customPriceRange: { min: '', max: '' },
  });

  const [filterData, setFilterData] = useState({
    brands: [] as Brand[],
    categories: [] as Category[],
    animals: [] as AnimalCategory[],
    loadingBrands: false,
    loadingCategories: false,
    loadingAnimals: false,
  });

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // =====================================
  // THEME COLORS
  // =====================================

  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const BACKGROUND_COLOR = isDarkMode ? '#0a0a0a' : '#f8f9fa';
  const CARD_BACKGROUND = isDarkMode ? '#1a1a1a' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#1a1a1a';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#a0a0a0' : '#6c757d';
  const BORDER_COLOR = isDarkMode ? '#2a2a2a' : '#e9ecef';
  const SURFACE_COLOR = isDarkMode ? '#242424' : '#f8f9fa';

  // =====================================
  // EFFECTS
  // =====================================

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  useEffect(() => {
    if (filterState.selectedAnimal) {
      loadFilterDataForAnimal(filterState.selectedAnimal);
    }
  }, [filterState.selectedAnimal]);

  useEffect(() => {
    setFilterState(prev => ({
      ...prev,
      selectedAnimal: initialFilters.animal || '',
      selectedBrand: initialFilters.brand || '',
      selectedCategoryId: initialFilters.category || '',
    }));
    
    if (initialFilters.priceMin !== undefined || initialFilters.priceMax !== undefined) {
      const matchingRange = PRICE_RANGES.find(range => 
        range.min === initialFilters.priceMin && range.max === initialFilters.priceMax
      );
      
      if (matchingRange && matchingRange.id !== 'custom') {
        setFilterState(prev => ({
          ...prev,
          selectedPriceRange: matchingRange.id,
          customPriceRange: { min: '', max: '' },
        }));
      } else {
        setFilterState(prev => ({
          ...prev,
          selectedPriceRange: 'custom',
          customPriceRange: {
            min: initialFilters.priceMin?.toString() || '',
            max: initialFilters.priceMax?.toString() || '',
          },
        }));
      }
    }
  }, [initialFilters]);

  // =====================================
  // DATA LOADING FUNCTIONS
  // =====================================

  const loadInitialData = useCallback(async () => {
    try {
      setFilterData(prev => ({ ...prev, loadingAnimals: true }));
      
      // Load animals first
      const animals = await ProductService.getAnimals();
      setFilterData(prev => ({
        ...prev,
        animals,
        loadingAnimals: false
      }));
      
      console.log('✅ Animals loaded:', animals.length);
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setFilterData(prev => ({ ...prev, loadingAnimals: false }));
    }
  }, []);

  const loadFilterDataForAnimal = useCallback(async (animalId?: string) => {
    if (!animalId) return;

    setFilterData(prev => ({
      ...prev,
      loadingBrands: true,
      loadingCategories: true,
    }));

    try {
      console.log('🔄 Loading filter data for animal:', animalId);
      
      // Load filter data for the specific animal
      const data = await ProductService.getFilterData(Number(animalId));
      
      // Load categories for the specific animal
      const categories = await ProductService.getCategoriesByAnimal(Number(animalId));
      
      // Load brands for the specific animal  
      const brands = await ProductService.getBrands(Number(animalId));
      
      setFilterData(prev => ({
        ...prev,
        categories,
        brands,
        loadingBrands: false,
        loadingCategories: false,
      }));
      
      // Update category name if category is selected
      if (filterState.selectedCategoryId) {
        const category = categories.find(cat => cat.id == filterState.selectedCategoryId);
        if (category) {
          setFilterState(prev => ({
            ...prev,
            selectedCategoryName: category.label || category.name,
          }));
        } else {
          console.log('🚫 Current category not valid for selected animal, clearing...');
          setFilterState(prev => ({
            ...prev,
            selectedCategoryId: '',
            selectedCategoryName: '',
          }));
        }
      }
      
      console.log('✅ Filter data loaded successfully:', {
        categories: categories.length,
        brands: brands.length
      });
      
    } catch (error) {
      console.error('❌ Error loading filter data:', error);
      setFilterData(prev => ({
        ...prev,
        loadingBrands: false,
        loadingCategories: false,
      }));
    }
  }, [filterState.selectedCategoryId]);

  // =====================================
  // HANDLERS
  // =====================================

  const handleAnimalSelect = useCallback((animalId: string) => {
    console.log('🐾 Animal selected:', animalId);
    
    const newAnimalId = filterState.selectedAnimal === animalId ? '' : animalId;
    
    setFilterState(prev => ({
      ...prev,
      selectedAnimal: newAnimalId,
      ...(newAnimalId !== filterState.selectedAnimal && {
        selectedCategoryId: '',
        selectedCategoryName: '',
        selectedBrand: '',
      }),
    }));
  }, [filterState.selectedAnimal]);

  const handleCategorySelect = useCallback((category: Category) => {
    console.log('🏷️ Category selected:', { id: category.id, name: category.label || category.name });
    
    setFilterState(prev => ({
      ...prev,
      selectedCategoryId: String(category.id),
      selectedCategoryName: category.label || category.name,
    }));
    setShowCategoryModal(false);
  }, []);

  const handleBrandSelect = useCallback((brand: string) => {
    setFilterState(prev => ({ ...prev, selectedBrand: brand }));
    setShowBrandModal(false);
  }, []);

  const handlePriceRangeSelect = useCallback((rangeId: string) => {
    console.log('Selected price range:', rangeId);
    setFilterState(prev => ({
      ...prev,
      selectedPriceRange: rangeId,
      ...(rangeId !== 'custom' && { customPriceRange: { min: '', max: '' } })
    }));
  }, []);

  const handleCustomPriceChange = useCallback((field: 'min' | 'max', value: string) => {
    console.log(`Custom price ${field}:`, value);
    
    const numericValue = value.replace(/[^0-9]/g, '');
    
    setFilterState(prev => ({
      ...prev,
      customPriceRange: {
        ...prev.customPriceRange,
        [field]: numericValue,
        ...(field === 'min' && prev.customPriceRange.max && 
            parseInt(numericValue, 10) > parseInt(prev.customPriceRange.max, 10) &&
            { max: numericValue }),
        ...(field === 'max' && prev.customPriceRange.min && 
            parseInt(numericValue, 10) < parseInt(prev.customPriceRange.min, 10) &&
            { min: numericValue }),
      }
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState({
      selectedAnimal: '',
      selectedBrand: '',
      selectedCategoryId: '',
      selectedCategoryName: '',
      selectedPriceRange: '',
      customPriceRange: { min: '', max: '' },
    });
  }, []);

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  const hasActiveFilters = useCallback((): boolean => {
    return !!(
      filterState.selectedAnimal ||
      filterState.selectedBrand ||
      filterState.selectedCategoryId ||
      filterState.selectedPriceRange
    );
  }, [filterState]);

  const getActiveFilterCount = useCallback((): number => {
    return [
      filterState.selectedAnimal,
      filterState.selectedBrand,
      filterState.selectedCategoryId,
      filterState.selectedPriceRange,
    ].filter(Boolean).length;
  }, [filterState]);

  const getAppliedFilters = useCallback((): AppliedFilters => {
    const filters: AppliedFilters = {};
    
    if (filterState.selectedAnimal) filters.animal = filterState.selectedAnimal;
    if (filterState.selectedBrand) filters.brand = filterState.selectedBrand;
    if (filterState.selectedCategoryId) filters.category = filterState.selectedCategoryId;
    
    if (filterState.selectedPriceRange) {
      if (filterState.selectedPriceRange === 'custom') {
        if (filterState.customPriceRange.min) {
          filters.priceMin = parseFloat(filterState.customPriceRange.min);
        }
        if (filterState.customPriceRange.max) {
          filters.priceMax = parseFloat(filterState.customPriceRange.max);
        }
      } else {
        const selectedRange = PRICE_RANGES.find(range => range.id === filterState.selectedPriceRange);
        if (selectedRange) {
          if (selectedRange.min !== null) filters.priceMin = selectedRange.min;
          if (selectedRange.max !== null) filters.priceMax = selectedRange.max;
        }
      }
    }
    
    return filters;
  }, [filterState]);

  const getPriceRangeDisplay = useCallback((): string => {
    if (!filterState.selectedPriceRange) return '';
    
    if (filterState.selectedPriceRange === 'custom') {
      if (!filterState.customPriceRange.min && !filterState.customPriceRange.max) {
        return 'Personnalisé';
      }
      
      const min = filterState.customPriceRange.min ? parseInt(filterState.customPriceRange.min, 10) : null;
      const max = filterState.customPriceRange.max ? parseInt(filterState.customPriceRange.max, 10) : null;
      
      if (min && max) {
        if (min === max) return `${min} DH`;
        return `${min} - ${max} DH`;
      } else if (min && !max) {
        return `À partir de ${min} DH`;
      } else if (!min && max) {
        return `Jusqu'à ${max} DH`;
      }
      
      return 'Personnalisé';
    } else {
      const selectedRange = PRICE_RANGES.find(range => range.id === filterState.selectedPriceRange);
      return selectedRange ? selectedRange.label : '';
    }
  }, [filterState.selectedPriceRange, filterState.customPriceRange]);

  const shouldShowCustomPrice = useCallback((): boolean => {
    return filterState.selectedPriceRange === 'custom';
  }, [filterState.selectedPriceRange]);

  const applyFilters = useCallback(() => {
    const appliedFilters = getAppliedFilters();
    console.log('🔍 Applied filters:', appliedFilters);
    onApplyFilters(appliedFilters);
    onClose();
  }, [getAppliedFilters, onApplyFilters, onClose]);

  // =====================================
  // RENDER FUNCTIONS
  // =====================================

  const renderAnimalSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="paw" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Animal</Text>
        {filterData.loadingAnimals && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          </View>
        )}
      </View>
      <View style={styles.animalGrid}>
        {ANIMAL_TYPES.map((animal: AnimalType) => (
          <TouchableOpacity
            key={animal.id}
            style={[
              styles.animalCard,
              {
                backgroundColor: filterState.selectedAnimal === animal.id ? animal.lightColor : SURFACE_COLOR,
                borderColor: filterState.selectedAnimal === animal.id ? animal.color : BORDER_COLOR,
              }
            ]}
            onPress={() => handleAnimalSelect(animal.id)}
            activeOpacity={0.7}>
            <View style={[
              styles.animalIconContainer,
              { backgroundColor: filterState.selectedAnimal === animal.id ? animal.color : animal.color + '15' }
            ]}>
              <MaterialCommunityIcons
                name={animal.icon as any}
                size={18}
                color={filterState.selectedAnimal === animal.id ? '#fff' : animal.color}
              />
            </View>
            <Text style={[styles.animalText, { color: filterState.selectedAnimal === animal.id ? animal.color : TEXT_COLOR }]}>
              {animal.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSelector = (title: string, icon: string, value: string, placeholder: string, onPress: () => void, loading: boolean = false) => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name={icon as any} size={18} color={PRIMARY_COLOR} />
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

  const renderPriceRangeSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="pricetag" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Prix</Text>
      </View>
      
      <View style={styles.priceRangeGrid}>
        {PRICE_RANGES.map((range: PriceRange) => (
          <TouchableOpacity
            key={range.id}
            style={[
              styles.priceRangeCard,
              {
                backgroundColor: filterState.selectedPriceRange === range.id ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                borderColor: filterState.selectedPriceRange === range.id ? PRIMARY_COLOR : BORDER_COLOR,
                borderWidth: filterState.selectedPriceRange === range.id ? 2 : 1,
              }
            ]}
            onPress={() => handlePriceRangeSelect(range.id)}
            activeOpacity={0.7}>
            
            <View style={[
              styles.priceRangeIconContainer,
              { 
                backgroundColor: filterState.selectedPriceRange === range.id ? PRIMARY_COLOR : PRIMARY_COLOR + '20'
              }
            ]}>
              <Ionicons 
                name={range.icon as any} 
                size={16} 
                color={filterState.selectedPriceRange === range.id ? '#fff' : PRIMARY_COLOR} 
              />
            </View>
            
            <Text style={[
              styles.priceRangeText, 
              { 
                color: filterState.selectedPriceRange === range.id ? PRIMARY_COLOR : TEXT_COLOR,
                fontWeight: filterState.selectedPriceRange === range.id ? '700' : '600'
              }
            ]} numberOfLines={2}>
              {range.label}
            </Text>
            
            {filterState.selectedPriceRange === range.id && (
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
                  borderColor: filterState.customPriceRange.min ? PRIMARY_COLOR : BORDER_COLOR,
                  borderWidth: filterState.customPriceRange.min ? 2 : 1,
                }
              ]}>
                <TextInput
                  style={[styles.customPriceInput, { color: TEXT_COLOR }]}
                  value={filterState.customPriceRange.min}
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
                  borderColor: filterState.customPriceRange.max ? PRIMARY_COLOR : BORDER_COLOR,
                  borderWidth: filterState.customPriceRange.max ? 2 : 1,
                }
              ]}>
                <TextInput
                  style={[styles.customPriceInput, { color: TEXT_COLOR }]}
                  value={filterState.customPriceRange.max}
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
      
      {filterState.selectedPriceRange && (
        <View style={[styles.selectedPriceDisplay, { backgroundColor: PRIMARY_COLOR + '10', borderColor: PRIMARY_COLOR + '30' }]}>
          <Text style={[styles.selectedPriceText, { color: PRIMARY_COLOR }]}>
            {getPriceRangeDisplay()}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setFilterState(prev => ({
                ...prev,
                selectedPriceRange: '',
                customPriceRange: { min: '', max: '' },
              }));
            }}
            style={[styles.clearPriceButton, { backgroundColor: PRIMARY_COLOR + '20' }]}
            activeOpacity={0.7}>
            <Ionicons name="close" size={14} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
          data={filterData.brands}
          keyExtractor={(item) => `brand-${item.id}`}
          renderItem={({ item }) => {
            const itemName = item.name || item.label;
            const isSelected = filterState.selectedBrand === itemName;
            
            return (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  {
                    backgroundColor: isSelected ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                    borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
                  }
                ]}
                onPress={() => handleBrandSelect(itemName)}
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

  const renderCategoryModal = () => (
    <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: BACKGROUND_COLOR }]}>
        <View style={[styles.modalHeader, { backgroundColor: CARD_BACKGROUND, borderBottomColor: BORDER_COLOR }]}>
          <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>
            Catégories
            {filterState.selectedAnimal && (
              <Text style={[styles.modalSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                {' '}pour {ANIMAL_TYPES.find(a => a.id === filterState.selectedAnimal)?.name}
              </Text>
            )}
          </Text>
          <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>
        
        {filterData.categories.length > 0 ? (
          <FlatList
            data={filterData.categories}
            keyExtractor={(item) => `category-${item.id}`}
            renderItem={({ item }) => {
              const isSelected = filterState.selectedCategoryId == item.id;
              
              return (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    {
                      backgroundColor: isSelected ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                      borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
                    }
                  ]}
                  onPress={() => handleCategorySelect(item)}
                  activeOpacity={0.7}>
                  
                  <View style={styles.modalItemContent}>
                    <Text style={[styles.modalItemText, { 
                      color: isSelected ? PRIMARY_COLOR : TEXT_COLOR 
                    }]} numberOfLines={1}>
                      {item.label || item.name}
                    </Text>
                    {item.description && (
                      <Text style={[styles.modalItemDescription, { color: TEXT_COLOR_SECONDARY }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  
                  {isSelected && <Ionicons name="checkmark" size={18} color={PRIMARY_COLOR} />}
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View style={styles.noCategoriesContainer}>
            <View style={[styles.noCategoriesIcon, { backgroundColor: PRIMARY_COLOR + '15' }]}>
              <Ionicons name="grid-outline" size={32} color={PRIMARY_COLOR} />
            </View>
            <Text style={[styles.noCategoriesTitle, { color: TEXT_COLOR }]}>
              {filterData.loadingCategories ? 'Chargement...' : 'Aucune catégorie disponible'}
            </Text>
            <Text style={[styles.noCategoriesSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
              {filterState.selectedAnimal 
                ? `Aucune catégorie trouvée pour ${ANIMAL_TYPES.find(a => a.id === filterState.selectedAnimal)?.name}`
                : 'Sélectionnez un animal pour voir les catégories'
              }
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  // =====================================
  // MAIN RENDER
  // =====================================

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
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
          {showBrandFilter && renderSelector(
            'Marque', 
            'business-outline', 
            filterState.selectedBrand, 
            filterState.selectedAnimal ? 'Marques disponibles' : 'Choisir une marque', 
            () => setShowBrandModal(true), 
            filterData.loadingBrands
          )}
          {showCategoryFilter && renderSelector(
            'Catégorie', 
            'grid-outline', 
            filterState.selectedCategoryName, 
            filterState.selectedAnimal 
              ? `Catégories ${ANIMAL_TYPES.find(a => a.id === filterState.selectedAnimal)?.name}` 
              : 'Sélectionnez un animal d\'abord', 
            () => setShowCategoryModal(true), 
            filterData.loadingCategories
          )}
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
};

// =====================================
// STYLES
// =====================================

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
    shadowOpacity: 0.1,
    elevation: 2,
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
    shadowOpacity: 0.05,
    elevation: 1,
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
  modalSubtitle: {
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
  modalItemDescription: { fontSize: 12, marginTop: 2 },
  productCountText: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  
  // No categories state
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

export default FilterModal;