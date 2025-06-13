// hooks/useFilterModal.ts - TypeScript hooks for FilterModal

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FilterState,
  FilterModalData,
  AppliedFilters,
  UseFilterDataReturn,
  UseFilterStateReturn,
  PriceHandlers,
  CategoryNavigationHandlers,
  CategoryNavigation,
  CustomPriceRange,
  Category,
  PRICE_RANGES,
  ANIMAL_TYPES,
  FilterModalError,
  ValidationResult,
  FilterValidationRules
} from '../types/FilterModal.types';

import {
  getFilterData,
  formatFiltersForAPI
} from '../service/DolibarrBrandService';

// =====================================
// FILTER DATA HOOK
// =====================================

export const useFilterData = (): UseFilterDataReturn => {
  const [filterData, setFilterData] = useState<FilterModalData>({
    brands: [],
    categories: [],
    animals: [],
    loadingBrands: false,
    loadingCategories: false,
  });

  const loadFilterDataForAnimal = useCallback(async (animalId?: string) => {
    setFilterData(prev => ({
      ...prev,
      loadingBrands: true,
      loadingCategories: true,
    }));

    try {
      console.log('🔄 Loading filter data for animal:', animalId);
      
      const data = await getFilterData(animalId ? Number(animalId) : undefined);
      
      if (data.success) {
        setFilterData({
          categories: data.categories,
          brands: data.brands,
          animals: data.animals,
          loadingBrands: false,
          loadingCategories: false,
        });
        
        console.log('✅ Filter data loaded successfully');
      } else {
        throw new Error(data.error || 'Failed to load filter data');
      }
    } catch (error) {
      console.error('❌ Error loading filter data:', error);
      setFilterData(prev => ({
        ...prev,
        loadingBrands: false,
        loadingCategories: false,
      }));
    }
  }, []);

  const resetFilterData = useCallback(() => {
    setFilterData({
      brands: [],
      categories: [],
      animals: [],
      loadingBrands: false,
      loadingCategories: false,
    });
  }, []);

  return {
    filterData,
    loadFilterDataForAnimal,
    resetFilterData,
  };
};

// =====================================
// FILTER STATE HOOK
// =====================================

export const useFilterState = (initialFilters: AppliedFilters = {}): UseFilterStateReturn => {
  const [filterState, setFilterState] = useState<FilterState>({
    selectedAnimal: initialFilters.animal || '',
    selectedBrand: initialFilters.brand || '',
    selectedCategoryId: initialFilters.category || '',
    selectedCategoryName: '',
    selectedPriceRange: '',
    customPriceRange: { min: '', max: '' },
  });

  // Initialize price range from initial filters
  useEffect(() => {
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
  }, [initialFilters.priceMin, initialFilters.priceMax]);

  const updateFilterState = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilterState = useCallback(() => {
    setFilterState({
      selectedAnimal: '',
      selectedBrand: '',
      selectedCategoryId: '',
      selectedCategoryName: '',
      selectedPriceRange: '',
      customPriceRange: { min: '', max: '' },
    });
  }, []);

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
    
    // Handle price range
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

  return {
    filterState,
    updateFilterState,
    resetFilterState,
    hasActiveFilters,
    getActiveFilterCount,
    getAppliedFilters,
  };
};

// =====================================
// PRICE HANDLING HOOK
// =====================================

export const usePriceHandlers = (
  filterState: FilterState,
  updateFilterState: (updates: Partial<FilterState>) => void
): PriceHandlers => {
  
  const handlePriceRangeSelect = useCallback((rangeId: string) => {
    console.log('Selected price range:', rangeId);
    updateFilterState({
      selectedPriceRange: rangeId,
      ...(rangeId !== 'custom' && { customPriceRange: { min: '', max: '' } })
    });
  }, [updateFilterState]);

  const handleCustomPriceChange = useCallback((field: 'min' | 'max', value: string) => {
    console.log(`Custom price ${field}:`, value);
    
    const numericValue = value.replace(/[^0-9]/g, '');
    
    updateFilterState({
      customPriceRange: {
        ...filterState.customPriceRange,
        [field]: numericValue,
        // Auto-adjust max if min is higher
        ...(field === 'min' && filterState.customPriceRange.max && 
            parseInt(numericValue, 10) > parseInt(filterState.customPriceRange.max, 10) &&
            { max: numericValue }),
        // Auto-adjust min if max is lower
        ...(field === 'max' && filterState.customPriceRange.min && 
            parseInt(numericValue, 10) < parseInt(filterState.customPriceRange.min, 10) &&
            { min: numericValue }),
      }
    });
  }, [filterState.customPriceRange, updateFilterState]);

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

  const clearPriceSelection = useCallback(() => {
    updateFilterState({
      selectedPriceRange: '',
      customPriceRange: { min: '', max: '' },
    });
  }, [updateFilterState]);

  return {
    handlePriceRangeSelect,
    handleCustomPriceChange,
    getPriceRangeDisplay,
    shouldShowCustomPrice,
    clearPriceSelection,
  };
};

// =====================================
// CATEGORY NAVIGATION HOOK
// =====================================

export const useCategoryNavigation = (
  categories: Category[],
  selectedAnimal: string,
  onCategorySelect: (categoryId: string, categoryName: string) => void
): CategoryNavigationHandlers & CategoryNavigation => {
  
  const [categoryNavigation, setCategoryNavigation] = useState<Category[][]>([]);
  const [currentCategoryLevel, setCurrentCategoryLevel] = useState<number>(0);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState<Category[]>([]);

  const resetCategoryNavigation = useCallback((categoriesToUse: Category[] = categories) => {
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
  }, [categories, selectedAnimal]);

  const handleCategorySelect = useCallback((category: Category) => {
    console.log('🏷️ Category selected (navigation):', { id: category.id, name: category.name || category.label });
    
    const children = categories.filter(cat => 
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
      onCategorySelect(String(category.id), category.name || category.label);
    }
  }, [categories, categoryNavigation, currentCategoryLevel, categoryBreadcrumb, onCategorySelect]);

  const handleCategoryDirectSelect = useCallback((category: Category) => {
    console.log('🏷️ Category selected (direct):', { id: category.id, name: category.name || category.label });
    onCategorySelect(String(category.id), category.name || category.label);
    resetCategoryNavigation();
  }, [onCategorySelect, resetCategoryNavigation]);

  const handleCategoryBack = useCallback(() => {
    if (currentCategoryLevel > 0) {
      setCurrentCategoryLevel(currentCategoryLevel - 1);
      const newBreadcrumb = categoryBreadcrumb.slice(0, -1);
      setCategoryBreadcrumb(newBreadcrumb);
    }
  }, [currentCategoryLevel, categoryBreadcrumb]);

  const handleCategoryBreadcrumbClick = useCallback((index: number) => {
    setCurrentCategoryLevel(index + 1);
    const newBreadcrumb = categoryBreadcrumb.slice(0, index + 1);
    setCategoryBreadcrumb(newBreadcrumb);
  }, [categoryBreadcrumb]);

  // Reset navigation when categories or animal changes
  useEffect(() => {
    resetCategoryNavigation(categories);
  }, [resetCategoryNavigation, categories]);

  return {
    // Navigation state
    categoryNavigation,
    currentCategoryLevel,
    categoryBreadcrumb,
    
    // Navigation handlers
    handleCategorySelect,
    handleCategoryDirectSelect,
    handleCategoryBack,
    handleCategoryBreadcrumbClick,
    resetCategoryNavigation,
  };
};

// =====================================
// VALIDATION HOOK
// =====================================

export const useFilterValidation = (rules: FilterValidationRules = {}): {
  validateFilters: (filters: AppliedFilters) => ValidationResult;
  validatePriceRange: (min?: number, max?: number) => ValidationResult;
} => {

  const validatePriceRange = useCallback((min?: number, max?: number): ValidationResult => {
    const errors: FilterModalError[] = [];
    
    // Check minimum price rules
    if (min !== undefined && rules.priceMin) {
      if (rules.priceMin.min !== undefined && min < rules.priceMin.min) {
        errors.push({
          type: 'validation',
          message: `Le prix minimum doit être d'au moins ${rules.priceMin.min} DH`,
          field: 'priceMin'
        });
      }
      if (rules.priceMin.max !== undefined && min > rules.priceMin.max) {
        errors.push({
          type: 'validation',
          message: `Le prix minimum ne peut pas dépasser ${rules.priceMin.max} DH`,
          field: 'priceMin'
        });
      }
    }
    
    // Check maximum price rules
    if (max !== undefined && rules.priceMax) {
      if (rules.priceMax.min !== undefined && max < rules.priceMax.min) {
        errors.push({
          type: 'validation',
          message: `Le prix maximum doit être d'au moins ${rules.priceMax.min} DH`,
          field: 'priceMax'
        });
      }
      if (rules.priceMax.max !== undefined && max > rules.priceMax.max) {
        errors.push({
          type: 'validation',
          message: `Le prix maximum ne peut pas dépasser ${rules.priceMax.max} DH`,
          field: 'priceMax'
        });
      }
    }
    
    // Check min vs max relationship
    if (min !== undefined && max !== undefined && min > max) {
      errors.push({
        type: 'validation',
        message: 'Le prix minimum ne peut pas être supérieur au prix maximum',
        field: 'priceMin'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [rules]);

  const validateFilters = useCallback((filters: AppliedFilters): ValidationResult => {
    const errors: FilterModalError[] = [];
    
    // Check required fields
    if (rules.requiredFields) {
      for (const field of rules.requiredFields) {
        if (!filters[field]) {
          errors.push({
            type: 'validation',
            message: `Le champ ${field} est requis`,
            field
          });
        }
      }
    }
    
    // Validate price range
    const priceValidation = validatePriceRange(filters.priceMin, filters.priceMax);
    errors.push(...priceValidation.errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [rules, validatePriceRange]);

  return {
    validateFilters,
    validatePriceRange,
  };
};

// =====================================
// COMPLETE FILTER MODAL HOOK
// =====================================

export const useFilterModal = (
  initialFilters: AppliedFilters = {},
  validationRules: FilterValidationRules = {}
) => {
  const filterData = useFilterData();
  const filterState = useFilterState(initialFilters);
  const priceHandlers = usePriceHandlers(filterState.filterState, filterState.updateFilterState);
  const { validateFilters } = useFilterValidation(validationRules);
  
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [errors, setErrors] = useState<FilterModalError[]>([]);

  // Handle animal selection with category clearing
  const handleAnimalSelect = useCallback((animalId: string) => {
    console.log('🐾 Animal selected:', animalId);
    
    const newAnimalId = filterState.filterState.selectedAnimal === animalId ? '' : animalId;
    
    filterState.updateFilterState({
      selectedAnimal: newAnimalId,
      // Clear category and brand when animal changes
      ...(newAnimalId !== filterState.filterState.selectedAnimal && {
        selectedCategoryId: '',
        selectedCategoryName: '',
        selectedBrand: '',
      }),
    });
    
    // Load new filter data for the selected animal
    if (newAnimalId) {
      filterData.loadFilterDataForAnimal(newAnimalId);
    } else {
      filterData.loadFilterDataForAnimal();
    }
  }, [filterState, filterData]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string, categoryName: string) => {
    filterState.updateFilterState({
      selectedCategoryId: categoryId,
      selectedCategoryName: categoryName,
    });
    setShowCategoryModal(false);
  }, [filterState]);

  // Handle brand selection
  const handleBrandSelect = useCallback((brand: string) => {
    filterState.updateFilterState({ selectedBrand: brand });
    setShowBrandModal(false);
  }, [filterState]);

  // Category navigation
  const categoryNavigation = useCategoryNavigation(
    filterData.filterData.categories,
    filterState.filterState.selectedAnimal,
    handleCategorySelect
  );

  // Apply filters with validation
  const applyFilters = useCallback((onApplyFilters: (filters: AppliedFilters) => void) => {
    const appliedFilters = filterState.getAppliedFilters();
    const validation = validateFilters(appliedFilters);
    
    if (validation.isValid) {
      setErrors([]);
      console.log('🔍 Applied filters:', appliedFilters);
      onApplyFilters(appliedFilters);
    } else {
      setErrors(validation.errors);
      console.warn('❌ Filter validation failed:', validation.errors);
    }
  }, [filterState, validateFilters]);

  // Load initial data
  useEffect(() => {
    filterData.loadFilterDataForAnimal(filterState.filterState.selectedAnimal);
  }, []);

  return {
    // State
    ...filterState,
    ...filterData,
    showBrandModal,
    setShowBrandModal,
    showCategoryModal,
    setShowCategoryModal,
    errors,
    
    // Handlers
    handleAnimalSelect,
    handleCategorySelect,
    handleBrandSelect,
    applyFilters,
    ...priceHandlers,
    
    // Category navigation
    ...categoryNavigation,
    
    // Utilities
    animalTypes: ANIMAL_TYPES,
    priceRanges: PRICE_RANGES,
  };
};

export default useFilterModal;