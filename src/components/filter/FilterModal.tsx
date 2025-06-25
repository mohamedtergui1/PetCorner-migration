// FilterModal.tsx - Enhanced with Complete Dolibarr Integration
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

// Import the ProductService
import ProductService, { 
  Brand, 
  Category, 
  AnimalCategory, 
  FilterData 
} from '../../service/CustomProductApiService';

// Types
interface AppliedFilters {
  animal_category?: number;
  brand?: string;
  category?: number;
  priceMin?: number;
  priceMax?: number;
  ages?: string;
  taste?: string;
  health_option?: string;
  nutritional_option?: string;
  game?: string; // Added game filter (product line/gamme)
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AppliedFilters) => void;
  initialFilters?: Partial<AppliedFilters>;
  showAnimalFilter?: boolean;
  showBrandFilter?: boolean;
  showCategoryFilter?: boolean;
  showPriceFilter?: boolean;
  showAgeFilter?: boolean;
  showTasteFilter?: boolean;
  showHealthFilter?: boolean;
  showNutritionalFilter?: boolean;
  showGameFilter?: boolean; // Added game filter option
}

interface FilterState {
  selectedAnimal: string;
  selectedBrand: string;
  selectedCategoryId: string;
  selectedCategoryName: string;
  selectedPriceRange: string;
  customPriceRange: { min: string; max: string };
  selectedAge: string;
  selectedTaste: string;
  selectedHealthOption: string;
  selectedNutritionalOption: string;
  selectedGame: string; // Added game state
}

interface CategoryHierarchy extends Category {
  children?: CategoryHierarchy[];
  level: number;
  parentId?: string;
}

interface AgeRange {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface TasteOption {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface HealthOption {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface NutritionalOption {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface GameOption {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
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

// Constants - Based on Dolibarr product structure
const ANIMAL_CATEGORIES: AnimalCategory[] = [
  { id: '2', name: 'Chien', label: 'Chien' },
  { id: '3', name: 'Chat', label: 'Chat' },
  { id: '184', name: 'Lapin', label: 'Lapin' },
  { id: '21', name: 'Poisson', label: 'Poisson' },
  { id: '31', name: 'Reptile', label: 'Reptile' },
  { id: '20', name: 'Oiseau', label: 'Oiseau' },
];

// Age ranges based on Dolibarr options_ages field
const AGE_RANGES: AgeRange[] = [
  { id: '1', label: 'Adulte', value: '1', icon: 'star', color: '#45B7D1' },
  { id: '2', label: 'Senior', value: '2', icon: 'medal', color: '#96CEB4' },
  { id: '3', label: 'Junior', value: '3', icon: 'happy', color: '#4ECDC4' },
  { id: '4', label: 'Première âge', value: '4', icon: 'baby', color: '#FF9500' },
  { id: '5', label: 'Chatons', value: '5', icon: 'heart', color: '#FF69B4' },
  { id: '6', label: 'Chiots', value: '6', icon: 'heart-outline', color: '#FF6B6B' },
];


const TASTE_OPTIONS: TasteOption[] = [
 { id: '1', label: 'Boeuf', value: '1', icon: 'nutrition', color: '#8B4513' },
 { id: '2', label: 'Poulet', value: '2', icon: 'restaurant', color: '#FF6B6B' },
 { id: '3', label: 'Canard', value: '3', icon: 'water', color: '#87CEEB' },
 { id: '4', label: 'Poisson', value: '4', icon: 'fish', color: '#4ECDC4' },
 { id: '5', label: 'Agneau', value: '5', icon: 'leaf', color: '#90EE90' },
 { id: '6', label: 'Autre', value: '6', icon: 'ellipsis-horizontal', color: '#9B59B6' },
];

const HEALTH_OPTIONS: HealthOption[] = [
 { id: '1', label: 'Stériles', value: '1', icon: 'medical', color: '#FF6B6B' },
 { id: '2', label: 'Allergies', value: '2', icon: 'alert-circle', color: '#FF9500' },
 { id: '3', label: 'Vessies', value: '3', icon: 'water', color: '#4ECDC4' },
 { id: '4', label: 'Croissances', value: '4', icon: 'trending-up', color: '#32CD32' },
 { id: '5', label: 'Vieillissements', value: '5', icon: 'time', color: '#96CEB4' },
 { id: '6', label: 'Respirations', value: '6', icon: 'leaf', color: '#87CEEB' },
 { id: '7', label: 'Poils et peaux', value: '7', icon: 'sparkles', color: '#DDA0DD' },
 { id: '8', label: 'Digestifs', value: '8', icon: 'fitness', color: '#F0E68C' },
 { id: '9', label: 'Surpoids', value: '9', icon: 'scale', color: '#CD853F' },
 { id: '10', label: 'Sensibles', value: '10', icon: 'shield', color: '#FFA07A' },
 { id: '11', label: 'Allaitantes ou gestantes', value: '11', icon: 'heart', color: '#FF69B4' },
 { id: '12', label: 'Immunités', value: '12', icon: 'shield-checkmark', color: '#9370DB' },
 { id: '13', label: 'Dentaires', value: '13', icon: 'medical', color: '#20B2AA' },
];

const NUTRITIONAL_OPTIONS: NutritionalOption[] = [
 { id: '1', label: 'Sans céréales', value: '1', icon: 'close-circle', color: '#FF6B6B' },
 { id: '2', label: 'Ingrédient limité', value: '2', icon: 'remove-circle', color: '#FF9500' },
 { id: '3', label: 'Bio', value: '3', icon: 'leaf', color: '#32CD32' },
 { id: '4', label: 'Sans OGM', value: '4', icon: 'shield', color: '#4ECDC4' },
 { id: '5', label: 'Sans gluten', value: '5', icon: 'checkmark-circle', color: '#45B7D1' },
 { id: '6', label: 'Sans sucre', value: '6', icon: 'ban', color: '#96CEB4' },
 { id: '7', label: 'Végétarien', value: '7', icon: 'leaf-outline', color: '#90EE90' },
 { id: '8', label: 'Riche en protéine', value: '8', icon: 'fitness', color: '#FF6347' },
 { id: '9', label: 'Équilibré', value: '9', icon: 'balance', color: '#9B59B6' },
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
  showAgeFilter = true,
  showTasteFilter = true,
  showHealthFilter = true,
  showNutritionalFilter = true,
  showGameFilter = true, // Added game filter prop
}) => {
  const { isDarkMode, colorTheme } = useTheme();

  // =====================================
  // STATE
  // =====================================

  const [filterState, setFilterState] = useState<FilterState>({
    selectedAnimal: initialFilters.animal_category?.toString() || '',
    selectedBrand: initialFilters.brand || '',
    selectedCategoryId: initialFilters.category?.toString() || '',
    selectedCategoryName: '',
    selectedPriceRange: '',
    customPriceRange: { min: '', max: '' },
    selectedAge: initialFilters.ages || '',
    selectedTaste: initialFilters.taste || '',
    selectedHealthOption: initialFilters.health_option || '',
    selectedNutritionalOption: initialFilters.nutritional_option || '',
    selectedGame: initialFilters.game || '', // Added game state
  });

  const [filterData, setFilterData] = useState({
    brands: [] as Brand[],
    categories: [] as Category[],
    categoryHierarchy: [] as CategoryHierarchy[],
    animals: ANIMAL_CATEGORIES,
    loadingBrands: false,
    loadingCategories: false,
    loadingAnimals: false,
  });

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<CategoryHierarchy[]>([]);
  const [currentCategoryLevel, setCurrentCategoryLevel] = useState<CategoryHierarchy[]>([]);

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
    // Initialize price range from initial filters
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
      
      // Animals are already set in the initial state
      setFilterData(prev => ({ ...prev, loadingAnimals: false }));
      
      console.log('✅ Animals loaded:', ANIMAL_CATEGORIES.length);
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
      
      // Load categories for the specific animal with hierarchy
      const categories = await ProductService.getCategoriesByAnimal(Number(animalId));
      const categoryHierarchy = await ProductService.getCategoryHierarchy(Number(animalId));
      
      // Load brands for the specific animal  
      const brands = await ProductService.getBrands(Number(animalId));
      
      // Build hierarchical structure
      const hierarchicalCategories = buildCategoryHierarchy(categories);
      
      setFilterData(prev => ({
        ...prev,
        categories,
        categoryHierarchy: hierarchicalCategories,
        brands,
        loadingBrands: false,
        loadingCategories: false,
      }));
      
      // Initialize category navigation
      setCurrentCategoryLevel(hierarchicalCategories);
      setSelectedCategoryPath([]);
      
      // Update category name if category is selected
      if (filterState.selectedCategoryId) {
        const category = categories.find(cat => cat.id == filterState.selectedCategoryId);
        if (category) {
          setFilterState(prev => ({
            ...prev,
            selectedCategoryName: category.label || category.name,
          }));
          
          // Build the path to the selected category
          const path = buildCategoryPath(hierarchicalCategories, filterState.selectedCategoryId);
          setSelectedCategoryPath(path);
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
        brands: brands.length,
        hierarchy: hierarchicalCategories.length
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
  // CATEGORY HIERARCHY FUNCTIONS
  // =====================================

  const buildCategoryHierarchy = (categories: Category[]): CategoryHierarchy[] => {
    const categoryMap = new Map<string, CategoryHierarchy>();
    const rootCategories: CategoryHierarchy[] = [];

    // First pass: create all category objects
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        level: 0,
        parentId: cat.parent
      });
    });

    // Second pass: build hierarchy
    categories.forEach(cat => {
      const categoryNode = categoryMap.get(cat.id);
      if (!categoryNode) return;

      if (cat.parent && categoryMap.has(cat.parent)) {
        const parent = categoryMap.get(cat.parent);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(categoryNode);
          categoryNode.level = parent.level + 1;
          categoryNode.parentId = cat.parent;
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  };

  const buildCategoryPath = (hierarchy: CategoryHierarchy[], targetId: string): CategoryHierarchy[] => {
    const findPath = (categories: CategoryHierarchy[], path: CategoryHierarchy[]): CategoryHierarchy[] | null => {
      for (const category of categories) {
        const newPath = [...path, category];
        
        if (category.id === targetId) {
          return newPath;
        }
        
        if (category.children && category.children.length > 0) {
          const result = findPath(category.children, newPath);
          if (result) return result;
        }
      }
      return null;
    };

    return findPath(hierarchy, []) || [];
  };

  // =====================================
  // HANDLERS
  // =====================================

  const handleAnimalSelect = useCallback((animalId: string) => {
    console.log('🐾 Animal selected:', animalId);
    
    const newAnimalId = filterState.selectedAnimal === animalId ? '' : animalId;
    
    setFilterState(prev => ({
      ...prev,
      selectedAnimal: newAnimalId,
      // When animal changes, clear category selection since animal becomes the main category
      ...(newAnimalId !== filterState.selectedAnimal && {
        selectedCategoryId: '',
        selectedCategoryName: '',
        selectedBrand: '',
      }),
    }));
  }, [filterState.selectedAnimal]);

  const handleCategorySelect = useCallback((category: CategoryHierarchy) => {
    console.log('🏷️ Category selected:', { id: category.id, name: category.label || category.name });
    
    setFilterState(prev => ({
      ...prev,
      selectedCategoryId: String(category.id),
      selectedCategoryName: category.label || category.name,
    }));
    
    // Update the path and current level
    const newPath = buildCategoryPath(filterData.categoryHierarchy, category.id);
    setSelectedCategoryPath(newPath);
    
    setShowCategoryModal(false);
  }, [filterData.categoryHierarchy]);

  const handleCategoryNavigation = useCallback((category: CategoryHierarchy) => {
    if (category.children && category.children.length > 0) {
      // Navigate to children
      const newPath = [...selectedCategoryPath, category];
      setSelectedCategoryPath(newPath);
      setCurrentCategoryLevel(category.children);
    } else {
      // Select this category (leaf node)
      handleCategorySelect(category);
    }
  }, [selectedCategoryPath, handleCategorySelect]);

  const handleCategoryBack = useCallback(() => {
    if (selectedCategoryPath.length > 0) {
      const newPath = selectedCategoryPath.slice(0, -1);
      setSelectedCategoryPath(newPath);
      
      if (newPath.length === 0) {
        setCurrentCategoryLevel(filterData.categoryHierarchy);
      } else {
        const parent = newPath[newPath.length - 1];
        setCurrentCategoryLevel(parent.children || []);
      }
    } else {
      setCurrentCategoryLevel(filterData.categoryHierarchy);
    }
  }, [selectedCategoryPath, filterData.categoryHierarchy]);

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
      }
    }));
  }, []);

  const handleAgeSelect = useCallback((ageId: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedAge: prev.selectedAge === ageId ? '' : ageId
    }));
  }, []);

  const handleTasteSelect = useCallback((tasteId: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedTaste: prev.selectedTaste === tasteId ? '' : tasteId
    }));
  }, []);

  const handleHealthOptionSelect = useCallback((optionId: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedHealthOption: prev.selectedHealthOption === optionId ? '' : optionId
    }));
  }, []);

  const handleNutritionalOptionSelect = useCallback((optionId: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedNutritionalOption: prev.selectedNutritionalOption === optionId ? '' : optionId
    }));
  }, []);

  const handleGameSelect = useCallback((gameId: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedGame: prev.selectedGame === gameId ? '' : gameId
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
      selectedAge: '',
      selectedTaste: '',
      selectedHealthOption: '',
      selectedNutritionalOption: '',
      selectedGame: '',
    });
    setSelectedCategoryPath([]);
    setCurrentCategoryLevel(filterData.categoryHierarchy);
  }, [filterData.categoryHierarchy]);

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  const hasActiveFilters = useCallback((): boolean => {
    return !!(
      filterState.selectedAnimal ||
      filterState.selectedBrand ||
      filterState.selectedCategoryId ||
      filterState.selectedPriceRange ||
      filterState.selectedAge ||
      filterState.selectedTaste ||
      filterState.selectedHealthOption ||
      filterState.selectedNutritionalOption ||
      filterState.selectedGame
    );
  }, [filterState]);

  const getActiveFilterCount = useCallback((): number => {
    return [
      filterState.selectedAnimal,
      filterState.selectedBrand,
      filterState.selectedCategoryId,
      filterState.selectedPriceRange,
      filterState.selectedAge,
      filterState.selectedTaste,
      filterState.selectedHealthOption,
      filterState.selectedNutritionalOption,
      filterState.selectedGame,
    ].filter(Boolean).length;
  }, [filterState]);

  const getAppliedFilters = useCallback((): AppliedFilters => {
    const filters: AppliedFilters = {};
    
    if (filterState.selectedAnimal) filters.animal_category = Number(filterState.selectedAnimal);
    if (filterState.selectedBrand) filters.brand = filterState.selectedBrand;
    
    // Category logic: if specific category is selected, use it; otherwise animal becomes the category
    if (filterState.selectedCategoryId) {
      filters.category = Number(filterState.selectedCategoryId);
    }
    // Note: We don't set category here if only animal is selected, 
    // the ProductScreen will handle the logic: category || animal_category || 1
    
    if (filterState.selectedAge) filters.ages = filterState.selectedAge;
    if (filterState.selectedTaste) filters.taste = filterState.selectedTaste;
    if (filterState.selectedHealthOption) filters.health_option = filterState.selectedHealthOption;
    if (filterState.selectedNutritionalOption) filters.nutritional_option = filterState.selectedNutritionalOption;
    if (filterState.selectedGame) filters.game = filterState.selectedGame;
    
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

  const applyFilters = useCallback(() => {
    const appliedFilters = getAppliedFilters();
    console.log('🔍 Applied filters (complete):', appliedFilters);
    console.log('🏷️ Category logic: Selected animal will be used as category if no specific category selected');
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
      </View>
      <View style={styles.optionGrid}>
        {ANIMAL_CATEGORIES.map((animal) => (
          <TouchableOpacity
            key={animal.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: filterState.selectedAnimal === animal.id ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                borderColor: filterState.selectedAnimal === animal.id ? PRIMARY_COLOR : BORDER_COLOR,
              }
            ]}
            onPress={() => handleAnimalSelect(animal.id)}
            activeOpacity={0.7}>
            <Text style={[styles.optionText, { 
              color: filterState.selectedAnimal === animal.id ? PRIMARY_COLOR : TEXT_COLOR 
            }]}>
              {animal.label || animal.name}
            </Text>
            {filterState.selectedAnimal === animal.id && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={16} color={PRIMARY_COLOR} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAgeSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="time" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Âge</Text>
      </View>
      <View style={styles.optionGrid}>
        {AGE_RANGES.map((age) => (
          <TouchableOpacity
            key={age.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: filterState.selectedAge === age.value ? age.color + '15' : SURFACE_COLOR,
                borderColor: filterState.selectedAge === age.value ? age.color : BORDER_COLOR,
              }
            ]}
            onPress={() => handleAgeSelect(age.value)}
            activeOpacity={0.7}>
            <View style={[styles.optionIconContainer, { 
              backgroundColor: filterState.selectedAge === age.value ? age.color : age.color + '20' 
            }]}>
              <Ionicons 
                name={age.icon as any} 
                size={14} 
                color={filterState.selectedAge === age.value ? '#fff' : age.color} 
              />
            </View>
            <Text style={[styles.optionText, { 
              color: filterState.selectedAge === age.value ? age.color : TEXT_COLOR 
            }]} numberOfLines={2}>
              {age.label}
            </Text>
            {filterState.selectedAge === age.value && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={16} color={age.color} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTasteSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="restaurant" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Goût</Text>
      </View>
      <View style={styles.optionGrid}>
        {TASTE_OPTIONS.map((taste) => (
          <TouchableOpacity
            key={taste.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: filterState.selectedTaste === taste.value ? taste.color + '15' : SURFACE_COLOR,
                borderColor: filterState.selectedTaste === taste.value ? taste.color : BORDER_COLOR,
              }
            ]}
            onPress={() => handleTasteSelect(taste.value)}
            activeOpacity={0.7}>
            <View style={[styles.optionIconContainer, { 
              backgroundColor: filterState.selectedTaste === taste.value ? taste.color : taste.color + '20' 
            }]}>
              <Ionicons 
                name={taste.icon as any} 
                size={14} 
                color={filterState.selectedTaste === taste.value ? '#fff' : taste.color} 
              />
            </View>
            <Text style={[styles.optionText, { 
              color: filterState.selectedTaste === taste.value ? taste.color : TEXT_COLOR 
            }]} numberOfLines={2}>
              {taste.label}
            </Text>
            {filterState.selectedTaste === taste.value && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={16} color={taste.color} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHealthOptionSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="medical" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Options Santé</Text>
      </View>
      <View style={styles.optionGrid}>
        {HEALTH_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: filterState.selectedHealthOption === option.value ? option.color + '15' : SURFACE_COLOR,
                borderColor: filterState.selectedHealthOption === option.value ? option.color : BORDER_COLOR,
              }
            ]}
            onPress={() => handleHealthOptionSelect(option.value)}
            activeOpacity={0.7}>
            <View style={[styles.optionIconContainer, { 
              backgroundColor: filterState.selectedHealthOption === option.value ? option.color : option.color + '20' 
            }]}>
              <Ionicons 
                name={option.icon as any} 
                size={14} 
                color={filterState.selectedHealthOption === option.value ? '#fff' : option.color} 
              />
            </View>
            <Text style={[styles.optionText, { 
              color: filterState.selectedHealthOption === option.value ? option.color : TEXT_COLOR 
            }]} numberOfLines={2}>
              {option.label}
            </Text>
            {filterState.selectedHealthOption === option.value && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={16} color={option.color} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNutritionalOptionSelector = () => (
    <View style={[styles.section, { backgroundColor: CARD_BACKGROUND }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
          <Ionicons name="nutrition" size={18} color={PRIMARY_COLOR} />
        </View>
        <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Options Nutritionnelles</Text>
      </View>
      <View style={styles.optionGrid}>
        {NUTRITIONAL_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: filterState.selectedNutritionalOption === option.value ? option.color + '15' : SURFACE_COLOR,
                borderColor: filterState.selectedNutritionalOption === option.value ? option.color : BORDER_COLOR,
              }
            ]}
            onPress={() => handleNutritionalOptionSelect(option.value)}
            activeOpacity={0.7}>
            <View style={[styles.optionIconContainer, { 
              backgroundColor: filterState.selectedNutritionalOption === option.value ? option.color : option.color + '20' 
            }]}>
              <Ionicons 
                name={option.icon as any} 
                size={14} 
                color={filterState.selectedNutritionalOption === option.value ? '#fff' : option.color} 
              />
            </View>
            <Text style={[styles.optionText, { 
              color: filterState.selectedNutritionalOption === option.value ? option.color : TEXT_COLOR 
            }]} numberOfLines={2}>
              {option.label}
            </Text>
            {filterState.selectedNutritionalOption === option.value && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={16} color={option.color} />
              </View>
            )}
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
      
      {filterState.selectedPriceRange === 'custom' && (
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
          <View style={styles.modalHeaderLeft}>
            {selectedCategoryPath.length > 0 && (
              <TouchableOpacity onPress={handleCategoryBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            )}
            <View style={styles.modalTitleContainer}>
              <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>
                Catégories
              </Text>
              {selectedCategoryPath.length > 0 && (
                <Text style={[styles.modalSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                  {selectedCategoryPath[selectedCategoryPath.length - 1].label}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>
        
        {/* Breadcrumb */}
        {selectedCategoryPath.length > 0 && (
          <View style={[styles.breadcrumb, { backgroundColor: SURFACE_COLOR, borderBottomColor: BORDER_COLOR }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                onPress={() => {
                  setSelectedCategoryPath([]);
                  setCurrentCategoryLevel(filterData.categoryHierarchy);
                }}
                style={styles.breadcrumbItem}
              >
                <Ionicons name="home" size={14} color={PRIMARY_COLOR} />
                <Text style={[styles.breadcrumbText, { color: PRIMARY_COLOR }]}>Accueil</Text>
              </TouchableOpacity>
              {selectedCategoryPath.map((category, index) => (
                <View key={category.id} style={styles.breadcrumbItem}>
                  <Ionicons name="chevron-forward" size={12} color={TEXT_COLOR_SECONDARY} />
                  <TouchableOpacity 
                    onPress={() => {
                      const newPath = selectedCategoryPath.slice(0, index + 1);
                      setSelectedCategoryPath(newPath);
                      setCurrentCategoryLevel(category.children || []);
                    }}
                  >
                    <Text style={[styles.breadcrumbText, { 
                      color: index === selectedCategoryPath.length - 1 ? TEXT_COLOR : PRIMARY_COLOR 
                    }]}>
                      {category.label || category.name}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        {currentCategoryLevel.length > 0 ? (
          <FlatList
            data={currentCategoryLevel}
            keyExtractor={(item) => `category-${item.id}`}
            renderItem={({ item }) => {
              const isSelected = filterState.selectedCategoryId == item.id;
              const hasChildren = item.children && item.children.length > 0;
              
              return (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    {
                      backgroundColor: isSelected ? PRIMARY_COLOR + '15' : SURFACE_COLOR,
                      borderColor: isSelected ? PRIMARY_COLOR : BORDER_COLOR,
                    }
                  ]}
                  onPress={() => hasChildren ? handleCategoryNavigation(item) : handleCategorySelect(item)}
                  activeOpacity={0.7}>
                  
                  <View style={styles.modalItemContent}>
                    <View style={styles.categoryItemHeader}>
                      <Text style={[styles.modalItemText, { 
                        color: isSelected ? PRIMARY_COLOR : TEXT_COLOR 
                      }]} numberOfLines={1}>
                        {item.label || item.name}
                      </Text>
                      {hasChildren && (
                        <View style={[styles.childrenBadge, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                          <Text style={[styles.childrenBadgeText, { color: PRIMARY_COLOR }]}>
                            {item.children!.length}
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.description && (
                      <Text style={[styles.modalItemDescription, { color: TEXT_COLOR_SECONDARY }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.categoryItemActions}>
                    {!hasChildren && isSelected && (
                      <Ionicons name="checkmark" size={18} color={PRIMARY_COLOR} />
                    )}
                    {hasChildren && (
                      <Ionicons name="chevron-forward" size={18} color={TEXT_COLOR_SECONDARY} />
                    )}
                  </View>
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
                ? `Aucune catégorie trouvée pour cet animal`
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
          <TouchableOpacity style={styles.headerBackButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Filtres Complets</Text>
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
              ? `Catégories disponibles` 
              : 'Sélectionnez un animal d\'abord', 
            () => setShowCategoryModal(true), 
            filterData.loadingCategories
          )}
          
           
          {showAgeFilter && renderAgeSelector()}
          {showTasteFilter && renderTasteSelector()}
          {showHealthFilter && renderHealthOptionSelector()}
          {showNutritionalFilter && renderNutritionalOptionSelector()}
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
  headerBackButton: {
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
  
  // Option Grid (for ages, tastes, health, nutritional, game)
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  optionCard: {
    width: (width - 80) / 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 70,
    position: 'relative',
  },
  optionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
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
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Breadcrumb
  breadcrumb: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  breadcrumbText: {
    fontSize: 12,
    fontWeight: '600',
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
  categoryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalItemText: { fontSize: 14, fontWeight: '600', flex: 1 },
  modalItemDescription: { fontSize: 12, marginTop: 2 },
  productCountText: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  childrenBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  childrenBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  categoryItemActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // No categories state
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