// types/FilterModal.types.ts - Complete TypeScript interfaces for FilterModal

import { 
  Category, 
  Brand, 
  Animal, 
  FilterOptions,
  ProductsResponse 
} from '../service/DolibarrBrandService';

// =====================================
// REACT NATIVE IMPORTS (if needed)
// =====================================
import React from 'react';

// =====================================
// FILTER MODAL INTERFACES
// =====================================

export interface AnimalType {
  id: string;
  name: string;
  icon: string;
  color: string;
  lightColor: string;
}

export interface PriceRange {
  id: string;
  label: string;
  min: number | null;
  max: number | null;
  icon: string;
}

export interface CustomPriceRange {
  min: string;
  max: string;
}

export interface FilterState {
  selectedAnimal: string;
  selectedBrand: string;
  selectedCategoryId: string;
  selectedCategoryName: string;
  selectedPriceRange: string;
  customPriceRange: CustomPriceRange;
}

export interface FilterModalData {
  brands: Brand[];
  categories: Category[];
  animals: Animal[];
  loadingBrands: boolean;
  loadingCategories: boolean;
}

export interface AppliedFilters {
  animal?: string;
  brand?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
}

// =====================================
// FILTER MODAL PROPS
// =====================================

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AppliedFilters) => void;
  initialFilters?: AppliedFilters;
  showAnimalFilter?: boolean;
  showBrandFilter?: boolean;
  showCategoryFilter?: boolean;
  showPriceFilter?: boolean;
}

// =====================================
// COMPONENT STATE INTERFACES
// =====================================

export interface FilterModalState extends FilterState, FilterModalData {
  showBrandModal: boolean;
  showCategoryModal: boolean;
}

// =====================================
// HOOK INTERFACES
// =====================================

export interface UseFilterDataReturn {
  filterData: FilterModalData;
  loadFilterDataForAnimal: (animalId?: string) => Promise<void>;
  resetFilterData: () => void;
}

export interface UseFilterStateReturn {
  filterState: FilterState;
  updateFilterState: (updates: Partial<FilterState>) => void;
  resetFilterState: () => void;
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
  getAppliedFilters: () => AppliedFilters;
}

// =====================================
// PRICE HANDLING INTERFACES
// =====================================

export interface PriceHandlers {
  handlePriceRangeSelect: (rangeId: string) => void;
  handleCustomPriceChange: (field: 'min' | 'max', value: string) => void;
  getPriceRangeDisplay: () => string;
  shouldShowCustomPrice: () => boolean;
  clearPriceSelection: () => void;
}

// =====================================
// CATEGORY NAVIGATION INTERFACES
// =====================================

export interface CategoryNavigation {
  categoryNavigation: Category[][];
  currentCategoryLevel: number;
  categoryBreadcrumb: Category[];
}

export interface CategoryNavigationHandlers {
  handleCategorySelect: (category: Category) => void;
  handleCategoryDirectSelect: (category: Category) => void;
  handleCategoryBack: () => void;
  handleCategoryBreadcrumbClick: (index: number) => void;
  resetCategoryNavigation: (categories?: Category[]) => void;
}

// =====================================
// THEME INTERFACES
// =====================================

export interface ThemeColors {
  PRIMARY_COLOR: string;
  BACKGROUND_COLOR: string;
  CARD_BACKGROUND: string;
  TEXT_COLOR: string;
  TEXT_COLOR_SECONDARY: string;
  BORDER_COLOR: string;
  SURFACE_COLOR: string;
}

export interface ThemeContext {
  isDarkMode: boolean;
  colorTheme: 'blue' | 'orange';
}

// =====================================
// ERROR HANDLING
// =====================================

export interface FilterModalError {
  type: 'network' | 'validation' | 'server';
  message: string;
  field?: keyof AppliedFilters;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FilterModalError[];
}

export interface FilterValidationRules {
  priceMin?: {
    min?: number;
    max?: number;
  };
  priceMax?: {
    min?: number;
    max?: number;
  };
  requiredFields?: (keyof AppliedFilters)[];
}

// =====================================
// CONSTANTS
// =====================================

export const ANIMAL_TYPES: AnimalType[] = [
  { id: '2', name: 'Chien', icon: 'dog', color: '#FF6B6B', lightColor: '#FFE5E5' },
  { id: '3', name: 'Chat', icon: 'cat', color: '#4ECDC4', lightColor: '#E5F9F6' },
  { id: '184', name: 'Lapin', icon: 'rabbit', color: '#9B59B6', lightColor: '#F4E6F7' },
  { id: '21', name: 'Poisson', icon: 'fish', color: '#3498DB', lightColor: '#EBF5FB' },
  { id: '31', name: 'Reptile', icon: 'snake', color: '#27AE60', lightColor: '#E8F8F5' },
  { id: '20', name: 'Oiseau', icon: 'bird', color: '#F39C12', lightColor: '#FEF9E7' },
];

export const PRICE_RANGES: PriceRange[] = [
  { id: 'under50', label: 'Moins de 50 DH', min: 0, max: 49, icon: 'cash-outline' },
  { id: '50to100', label: '50 - 100 DH', min: 50, max: 100, icon: 'card-outline' },
  { id: '100to200', label: '100 - 200 DH', min: 100, max: 200, icon: 'wallet-outline' },
  { id: '200to500', label: '200 - 500 DH', min: 200, max: 500, icon: 'diamond-outline' },
  { id: '500to1000', label: '500 - 1000 DH', min: 500, max: 1000, icon: 'star-outline' },
  { id: 'over1000', label: 'Plus de 1000 DH', min: 1000, max: null, icon: 'trophy-outline' },
  { id: 'custom', label: 'Personnalisé', min: null, max: null, icon: 'settings-outline' },
];

// =====================================
// TYPE GUARDS
// =====================================

export const isValidAnimalId = (id: string): boolean => {
  return ANIMAL_TYPES.some(animal => animal.id === id);
};

export const isValidPriceRangeId = (id: string): boolean => {
  return PRICE_RANGES.some(range => range.id === id);
};

export const hasValidFilters = (filters: AppliedFilters): boolean => {
  return Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  );
};

export const isCategory = (item: any): item is Category => {
  return item && typeof item.id !== 'undefined' && typeof item.label === 'string';
};

export const isBrand = (item: any): item is Brand => {
  return item && typeof item.name === 'string' && typeof item.productCount === 'number';
};

// =====================================
// EXPORT ALL TYPES
// =====================================

export type {
  // Main interfaces
  FilterModalProps,
  FilterModalState,
  AppliedFilters,
  FilterState,
  AnimalType,
  PriceRange,
  CustomPriceRange,
  
  // Hook returns
  UseFilterDataReturn,
  UseFilterStateReturn,
  PriceHandlers,
  CategoryNavigationHandlers,
  CategoryNavigation,
    
  // Theme and styling
  ThemeColors,
  ThemeContext,
  
  // Error handling
  FilterModalError,
  ValidationResult,
  FilterValidationRules,
  
  // Re-export service types
  Category,
  Brand,
  Animal,
  FilterOptions,
  ProductsResponse
};