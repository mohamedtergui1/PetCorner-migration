// services/DolibarrBrandService.ts - Complete TypeScript service

// =====================================
// TYPE DEFINITIONS
// =====================================

export interface DolibarrConfig {
  url: string;
  apiKey: string;
}

// Base interfaces
export interface BaseCategory {
  id: number | string;
  label: string;
  name: string;
  description?: string;
  parent?: number | string;
}

export interface Brand {
  id: string;
  name: string;
  label: string;
  productCount: number;
}

export interface Animal {
  id: number | string;
  label: string;
  name: string;
  description?: string;
  parent?: number | string;
}

export interface Category extends BaseCategory {
  children?: Category[];
  product_count?: number;
}

// Product interfaces
export interface ProductImage {
  image_link?: string;
  photo_link?: string;
}

export interface ProductPrice {
  price: number;
  price_ttc?: number;
  price_min?: number;
  price_min_ttc?: number;
}

export interface ProductStock {
  stock_reel?: number;
  stock_theorique?: number;
  stock_warehouse?: Record<string, any>;
}

export interface ProductDates {
  date_creation?: number;
  date_modification?: number;
  date_creation_formatted?: string;
  date_modification_formatted?: string;
}

export interface BaseProduct extends ProductImage, ProductPrice, ProductDates {
  id: number;
  ref: string;
  ref_ext?: string;
  label: string;
  description?: string;
  barcode?: string;
  fk_product_type?: number;
  entity?: number;
}

export interface Product extends BaseProduct, ProductStock {
  sousprods?: any[];
  fk_product_parent?: number;
  is_object_used?: boolean;
  array_options?: Record<string, any>;
}

export interface EnhancedProduct extends Product {
  image_link: string;
  date_creation_formatted: string;
  date_modification_formatted: string;
}

// Pagination interface
export interface Pagination {
  total: number;
  page: number;
  page_count: number;
  limit: number;
}

// Response interfaces
export interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  data: T[];
  pagination: Pagination;
}

export interface FilterDataResponse extends ApiResponse<never> {
  categories: Category[];
  brands: Brand[];
  animals: Animal[];
  success: boolean;
}

export interface ProductsResponse extends PaginatedResponse<Product> {}

// Filter interfaces
export interface FilterOptions {
  sortfield?: string;
  sortorder?: 'ASC' | 'DESC';
  limit?: number;
  page?: number;
  animal?: number;
  category?: number;
  brand?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  pagination_data?: boolean;
  includestockdata?: number;
}

// =====================================
// CONFIGURATION
// =====================================

const DOLIBARR_URL = 'your-dolibarr-url'; // Replace with your actual URL
const API_KEY = 'your-api-key'; // Replace with your actual API key

const dolibarrHeaders = {
  'DOLAPIKEY': API_KEY,
  'Content-Type': 'application/json',
};

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Create URLSearchParams from object
 */
const createSearchParams = (params: Record<string, any>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams;
};

/**
 * Generic fetch function with error handling
 */
const fetchFromDolibarr = async <T>(
  endpoint: string, 
  params?: Record<string, any>
): Promise<T> => {
  try {
    let url = `${DOLIBARR_URL}/api/index.php/products/${endpoint}`;
    
    if (params) {
      const searchParams = createSearchParams(params);
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    console.log('🌐 Fetching from:', url);
    
    const response = await fetch(url, {
      headers: dolibarrHeaders,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error);
    throw error;
  }
};

// =====================================
// FILTER DATA ENDPOINTS
// =====================================

/**
 * Get complete filter data in one call
 */
export const getFilterData = async (animalCategoryId?: number): Promise<FilterDataResponse> => {
  try {
    console.log('🔄 Loading filter data for animal:', animalCategoryId);
    
    const params = animalCategoryId ? { animal_category_id: animalCategoryId } : undefined;
    
    const response = await fetchFromDolibarr<FilterDataResponse>('filter_data', params);
    
    const result = {
      categories: response.categories || [],
      brands: response.brands || [],
      animals: response.animals || [],
      success: response.success !== false
    };
    
    console.log('✅ Filter data loaded:', {
      categories: result.categories.length,
      brands: result.brands.length,
      animals: result.animals.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching filter data:', error);
    return {
      categories: [],
      brands: [],
      animals: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get all available brands with product count
 */
export const getBrandsWithCount = async (animalCategoryId?: number): Promise<Brand[]> => {
  try {
    const params = animalCategoryId ? { animal_category_id: animalCategoryId } : undefined;
    const brands = await fetchFromDolibarr<Brand[]>('brands', params);
    console.log('🏪 Loaded brands:', brands.length);
    return brands;
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    return [];
  }
};

/**
 * Get categories filtered by animal (parent category)
 */
export const getCategoriesByAnimal = async (animalCategoryId: number): Promise<Category[]> => {
  try {
    if (!animalCategoryId) {
      return [];
    }
    
    const categories = await fetchFromDolibarr<Category[]>(`categories/by_animal/${animalCategoryId}`);
    console.log('🏷️ Loaded categories for animal:', categories.length);
    return categories;
  } catch (error) {
    console.error('❌ Error fetching categories by animal:', error);
    return [];
  }
};

/**
 * Get all main animal categories
 */
export const getAnimals = async (): Promise<Animal[]> => {
  try {
    const animals = await fetchFromDolibarr<Animal[]>('animals');
    console.log('🐾 Loaded animals:', animals.length);
    return animals;
  } catch (error) {
    console.error('❌ Error fetching animals:', error);
    return [];
  }
};

/**
 * Get all categories (legacy function for backward compatibility)
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(
      `${DOLIBARR_URL}/api/index.php/categories?type=product&limit=0`,
      { headers: dolibarrHeaders }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const categories = await response.json() as Category[];
    console.log('🏷️ Loaded all categories:', categories.length);
    return categories;
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return [];
  }
};

// =====================================
// PRODUCT SEARCH AND FILTERING
// =====================================

/**
 * Get products with comprehensive filtering
 */
export const getFilteredProducts = async (filters: FilterOptions = {}): Promise<ProductsResponse> => {
  try {
    const defaultParams = {
      sortfield: 't.ref',
      sortorder: 'ASC',
      limit: 100,
      page: 0,
      pagination_data: true,
      includestockdata: 0
    };
    
    const params = { ...defaultParams, ...filters };
    
    // Rename animal to animal_category for API
    if (params.animal) {
      (params as any).animal_category = params.animal;
      delete params.animal;
    }
    
    console.log('🔍 Filtering products with params:', params);
    
    const response = await fetchFromDolibarr<ProductsResponse>('filtered', params);
    
    const result = {
      data: response.data || [],
      pagination: response.pagination || {
        total: 0,
        page: 0,
        page_count: 0,
        limit: 0
      }
    };
    
    console.log('✅ Products filtered:', result.data.length, 'products found');
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching filtered products:', error);
    return {
      data: [],
      pagination: {
        total: 0,
        page: 0,
        page_count: 0,
        limit: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Build category hierarchy from flat category list
 */
export const buildCategoryHierarchy = (categories: Category[]): Category[] => {
  const categoryMap = new Map<number | string, Category>();
  const result: Category[] = [];
  
  // First pass: create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      children: []
    });
  });
  
  // Second pass: build hierarchy
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id);
    
    if (categoryWithChildren && category.parent && category.parent !== '0' && category.parent !== 0) {
      const parent = categoryMap.get(category.parent);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryWithChildren);
      }
    } else if (categoryWithChildren) {
      result.push(categoryWithChildren);
    }
  });
  
  return result;
};

/**
 * Filter categories by animal ID
 */
export const filterCategoriesByAnimal = (categories: Category[], animalId?: number): Category[] => {
  if (!animalId || !categories.length) {
    return categories.filter(category => 
      category.parent === 1 || category.parent === "1"
    );
  }
  
  return categories.filter(category => {
    // Check if this category is a direct child of the animal
    if (category.parent === animalId || category.parent == animalId) {
      return true;
    }
    
    // Check if this category is a child of a category that belongs to the animal
    const parentExists = categories.some(parent => 
      (parent.parent === animalId || parent.parent == animalId) && 
      (parent.id === category.parent || parent.id == category.parent)
    );
    
    return parentExists;
  });
};

/**
 * Format filters for API request
 */
export const formatFiltersForAPI = (filters: Record<string, any>): FilterOptions => {
  const apiFilters: FilterOptions = {};
  
  if (filters.animal) apiFilters.animal = Number(filters.animal);
  if (filters.brand) apiFilters.brand = String(filters.brand);
  if (filters.category) apiFilters.category = Number(filters.category);
  if (filters.search) apiFilters.search = String(filters.search);
  if (filters.priceMin !== undefined) apiFilters.priceMin = Number(filters.priceMin);
  if (filters.priceMax !== undefined) apiFilters.priceMax = Number(filters.priceMax);
  
  return apiFilters;
};

// =====================================
// LEGACY SUPPORT FUNCTIONS
// =====================================

/**
 * Legacy function: Get categories filtered by animal
 */
export const getCategoriesFilteredByAnimal = async (animalCategoryId: number): Promise<Category[]> => {
  return await getCategoriesByAnimal(animalCategoryId);
};

/**
 * Legacy function: Get brands with product count
 */
export const getBrandsWithProductCount = async (animalCategoryId?: number): Promise<Brand[]> => {
  return await getBrandsWithCount(animalCategoryId);
};

// =====================================
// DEFAULT EXPORT
// =====================================

const DolibarrBrandService = {
  // Filter data
  getFilterData,
  getBrandsWithCount,
  getCategoriesByAnimal,
  getAnimals,
  getCategories,
  
  // Product search and filtering
  getFilteredProducts,
  
  // Utility functions
  buildCategoryHierarchy,
  filterCategoriesByAnimal,
  formatFiltersForAPI,
  
  // Legacy support
  getCategoriesFilteredByAnimal,
  getBrandsWithProductCount,
};

export default DolibarrBrandService;