import apiClient from "../axiosInstance/AxiosInstance";

// ==================== TYPE DEFINITIONS ====================

/**
 * Extended Options Interface for enhanced product data
 */
export interface ExtendedOptions {
  health_option_id?: string;
  game_id?: string;
  age_id?: string;
  taste_id?: string;
  nutritional_option_id?: string;
  brand_id?: string;
  category_ids?: number[];
}

/**
 * Enhanced Product Interface with extended options
 */
export interface EnhancedProduct extends Product {
  extended_options?: ExtendedOptions;
}

/**
 * Base Product Interface
 */
export interface Product {
  id: string;
  ref: string;
  ref_ext?: string;
  label: string;
  description?: string;
  type: string;
  price: string;
  price_formated?: string;
  price_ttc: string;
  price_ttc_formated?: string;
  price_min: string;
  price_min_ttc: string;
  price_base_type: string;
  multiprices?: Record<string, string>;
  multiprices_ttc?: Record<string, string>;
  multiprices_base_type?: Record<string, string>;
  multiprices_min?: Record<string, string>;
  multiprices_min_ttc?: Record<string, string>;
  multiprices_tva_tx?: Record<string, string>;
  default_vat_code?: string;
  tva_tx: string;
  localtax1_tx: string;
  localtax2_tx: string;
  localtax1_type: string;
  localtax2_type: string;
  packaging?: string;
  lifetime?: string;
  qc_frequency?: string;
  stock_reel?: string;
  stock_theorique?: string;
  cost_price?: string;
  pmp: string;
  seuil_stock_alerte: string;
  desiredstock: string;
  duration_value?: boolean;
  fk_default_workstation?: string;
  duration_unit: string;
  status: string;
  tosell?: string;
  status_buy: string;
  tobuy?: string;
  finished: string;
  fk_default_bom?: string;
  status_batch: string;
  batch_mask: string;
  customcode: string;
  url?: string;
  weight?: string;
  weight_units: string;
  length?: string;
  length_units: string;
  width?: string;
  width_units: string;
  height?: string;
  height_units: string;
  surface?: string;
  surface_units: string;
  volume?: string;
  volume_units: string;
  net_measure?: string;
  net_measure_units?: string;
  accountancy_code_sell: string;
  accountancy_code_sell_intra: string;
  accountancy_code_sell_export: string;
  accountancy_code_buy: string;
  accountancy_code_buy_intra: string;
  accountancy_code_buy_export: string;
  barcode: string;
  barcode_type: string;
  date_creation: string;
  date_modification: string;
  date_creation_formatted?: string;
  date_modification_formatted?: string;
  stock_warehouse?: StockWarehouse[];
  fk_default_warehouse?: string;
  fk_price_expression?: string;
  fourn_qty?: string;
  fk_unit: string;
  price_autogen: string;
  is_object_used?: boolean;
  mandatory_period: string;
  entity: string;
  import_key?: string;
  array_options?: ProductExtraFields;
  array_languages?: Record<string, any>;
  contacts_ids?: string[];
  linked_objects?: Record<string, any>;
  linkedObjectsIds?: Record<string, any>;
  canvas: string;
  country_id?: string;
  country_code: string;
  state_id?: string;
  region_id?: string;
  barcode_type_coder?: string;
  last_main_doc?: string;
  note_public?: string;
  note_private: string;
  specimen: number;
  duration: string;
  image_link?: string;
  photo_link?: string;
  sousprods?: SubProduct[];
  fk_product_parent?: string;
  categories_ids?: number[];
}

/**
 * Product Extra Fields Interface - Updated with correct Dolibarr field codes
 */
export interface ProductExtraFields {
  options_amers_brand?: string;
  options_nombrep?: string;
  options_nombrep2?: string;
  options_systeme?: string;
  options_societe?: string;
  options_ecommerceng_description_1?: string;
  options_ecommerceng_short_description_1?: string;
  options_ecommerceng_wc_status_2_1?: string;
  options_ecommerceng_tax_class_2_1?: string;
  options_ecommerceng_wc_sale_price_2_1?: string;
  options_ecommerceng_wc_date_on_sale_from_2_1?: string;
  options_ecommerceng_wc_date_on_sale_to_2_1?: string;
  options_ecommerceng_wc_manage_stock_2_1?: string;
  options_ecommerceng_wc_dont_update_stock_2_1?: string;
  options_marque?: string; // Brand field (code: marque)
  options_ftfonctionnalites?: string; // Ages field (code: ftfonctionnalites)
  options_trancheage?: string; // Nutritional options field (code: trancheage)
  options_ref_sage?: string;
  options_cbn?: string;
  options_gamme?: string; // Health options field (code: gamme)
  options_gam1_sage?: string;
  options_sousgamme?: string; // Taste/flavor field (code: sousgamme)
  options_gam2_sage?: string;
  options_origine?: string;
  options_tags?: string; // Tags field
  options_similaire?: string;
  options_ecommerceng_wc_sale_price?: string;
  options_runsoft_review?: string;
}

/**
 * Stock Warehouse Interface
 */
export interface StockWarehouse {
  warehouse_id: string;
  warehouse_ref: string;
  warehouse_label: string;
  stock: string;
  detail_batch?: StockBatch[];
}

/**
 * Stock Batch Interface
 */
export interface StockBatch {
  batch: string;
  qty: string;
  warehouse_id: string;
}

/**
 * Sub Product Interface
 */
export interface SubProduct {
  rowid: string;
  qty: string;
  fk_product_type: string;
  label: string;
  incdec: string;
  ref: string;
  fk_association: string;
  rang: string;
}

/**
 * Brand Interface
 */
export interface Brand {
  id: string;
  name: string;
  label: string;
  productCount: number;
}

/**
 * Category Interface
 */
export interface Category {
  id: string;
  label: string;
  name: string;
  description?: string;
  parent?: string;
  product_count?: number;
  children?: Category[];
}

/**
 * Animal Category Interface
 */
export interface AnimalCategory {
  id: string;
  label: string;
  name: string;
  description?: string;
  parent?: string;
}

/**
 * Price Range Interface
 */
export interface PriceRange {
  min_price: number;
  max_price: number;
  avg_price: number;
  product_count: number;
}

/**
 * Search Suggestion Interface
 */
export interface SearchSuggestion {
  id: string;
  ref: string;
  label: string;
  price: number;
  image_link?: string;
}

/**
 * Filter Data Interface
 */
export interface FilterData {
  categories: Category[];
  brands: Brand[];
  animals: AnimalCategory[];
  success: boolean;
  error?: string;
}

/**
 * Pagination Interface
 */
export interface Pagination {
  total: number;
  page: number;
  page_count: number;
  limit: number;
  date_field?: string;
  date_from?: string;
  date_to?: string;
  requested_ids?: number[];
  found_products?: number;
  missing_ids?: number[];
}

/**
 * API Response with Pagination
 */
export interface PaginatedProductResponse {
  data: Product[];
  pagination: Pagination;
}

/**
 * Enhanced API Response with Pagination
 */
export interface PaginatedEnhancedProductResponse {
  data: EnhancedProduct[];
  pagination: Pagination;
}

/**
 * Simple Product List Response (without pagination)
 */
export type ProductListResponse = Product[];

/**
 * Enhanced Product List Response (without pagination)
 */
export type EnhancedProductListResponse = EnhancedProduct[];

/**
 * API Response Union Type
 */
export type ProductResponse = Product | ProductListResponse | PaginatedProductResponse;

/**
 * Enhanced API Response Union Type
 */
export type EnhancedProductResponse = EnhancedProduct | EnhancedProductListResponse | PaginatedEnhancedProductResponse;

/**
 * Search Parameters Interface - Enhanced with all filter options
 */
export interface SearchParams {
  search_name?: string;
  categories?: string;
  brand?: string;
  game?: string;
  taste?: string;
  ages?: string; // Added ages filter
  health_option?: string; // Added health option filter
  nutritional_option?: string; // Added nutritional option filter
  limit?: number;
  page?: number;
  sortfield?: string;
  sortorder?: 'ASC' | 'DESC';
  pagination_data?: boolean;
  includestockdata?: 0 | 1;
  includesubproducts?: boolean;
  includeparentid?: boolean;
  includetrans?: boolean;
}

/**
 * Product Options Interface
 */
export interface ProductOptions {
  includestockdata?: 0 | 1;
  includesubproducts?: boolean;
  includeparentid?: boolean;
  includetrans?: boolean;
}

/**
 * Enhanced Product Options Interface
 */
export interface EnhancedProductOptions extends ProductOptions {
  includeextendedoptions?: boolean;
}

/**
 * Multiple Products Options Interface
 */
export interface MultipleProductsOptions extends ProductOptions {
  ids: string;
  pagination_data?: boolean;
}

/**
 * Enhanced Multiple Products Options Interface
 */
export interface EnhancedMultipleProductsOptions extends EnhancedProductOptions {
  ids: string;
  pagination_data?: boolean;
}

/**
 * Date Range Parameters Interface
 */
export interface DateRangeParams {
  date_field?: 'creation' | 'modification';
  date_from?: string; // YYYY-MM-DD format
  date_to?: string; // YYYY-MM-DD format
  search_name?: string;
  categories?: string;
  brand?: string;
  limit?: number;
  page?: number;
  sortfield?: string;
  sortorder?: 'ASC' | 'DESC';
  pagination_data?: boolean;
}

/**
 * Filtered Products Parameters Interface - Enhanced with all filter options
 */
export interface FilteredProductsParams {
  sortfield?: string;
  sortorder?: 'ASC' | 'DESC';
  limit?: number;
  page?: number;
  animal_category?: number;
  category?: number;
  brand?: string;
  search?: string;
  game?: string; // Added game filter
  taste?: string; // Added taste filter
  ages?: string; // Added ages filter
  health_option?: string; // Added health option filter
  nutritional_option?: string; // Added nutritional option filter
  price_min?: number;
  price_max?: number;
  pagination_data?: boolean;
  includestockdata?: 0 | 1;
  includeextendedoptions?: boolean; // Added extended options support
}

// ==================== SERVICE CLASS ====================

/**
 * ProductService using your custom PHP endpoints
 * Default limit set to 16 products per request with full TypeScript support
 * Enhanced with extended options support
 */
class ProductService {
  // Default configuration
  static readonly DEFAULT_LIMIT: number = 16;
  static readonly DEFAULT_PAGE: number = 0;
  static readonly DEFAULT_SORT_FIELD: string = "t.label";
  static readonly DEFAULT_SORT_ORDER: 'ASC' | 'DESC' = "ASC";
  static readonly DEFAULT_CATEGORY: string = "1";

  /**
   * Search products with enhanced filtering (uses your search_filtered endpoint)
   */
  static async searchProducts(filters: Partial<SearchParams> = {}): Promise<PaginatedProductResponse | ProductListResponse> {
    const defaultParams: SearchParams = {
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      sortfield: this.DEFAULT_SORT_FIELD,
      sortorder: this.DEFAULT_SORT_ORDER,
      categories: this.DEFAULT_CATEGORY,
      pagination_data: true,
      includestockdata: 0,
      ...filters
    };

    // Log all parameters being sent to API
    console.log('🚀 ProductService.searchProducts - Full params being sent:', defaultParams);

    try {
      const response = await apiClient.get('/products/search_filtered', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID (uses your standard endpoint)
   */
  static async getProductById(id: number | string, options: ProductOptions = {}): Promise<Product> {
    const defaultOptions: ProductOptions = {
      includestockdata: 0,  
      includesubproducts: false,
      includeparentid: false,
      includetrans: false,
      ...options
    };

    try {
      const response = await apiClient.get(`/products/${id}`, { params: defaultOptions });
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get single enhanced product by ID with extended options (uses your enhanced endpoint)
   */
  static async getEnhancedProduct(
    id: number | string, 
    options: EnhancedProductOptions = {}
  ): Promise<EnhancedProduct> {
    const defaultOptions: EnhancedProductOptions = {
      includestockdata: 0,  
      includesubproducts: false,
      includeparentid: false,
      includetrans: false,
      includeextendedoptions: true,
      ...options
    };

    console.log('🚀 ProductService.getEnhancedProduct - Fetching product:', id, 'with options:', defaultOptions);

    try {
      const response = await apiClient.get(`/products/enhanced/${id}`, { params: defaultOptions });
      console.log('✅ Enhanced product received:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching enhanced product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple products by array of IDs (uses your enhanced/multiple endpoint)
   */
  static async getMultipleProducts(
    ids: (number | string)[] | string, 
    options: Partial<MultipleProductsOptions> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    const idString = Array.isArray(ids) ? ids.join(',') : ids;
    
    const defaultOptions: MultipleProductsOptions = {
      ids: idString,
      includestockdata: 0,
      includesubproducts: false,
      includeparentid: false,
      includetrans: false,
      pagination_data: true,
      ...options
    };

    try {
      const response = await apiClient.get('/products/enhanced/multiple', { params: defaultOptions });
      return response.data;
    } catch (error) {
      console.error('Error fetching multiple products:', error);
      throw error;
    }
  }

  /**
   * Get multiple enhanced products by array of IDs with extended options
   */
  static async getMultipleEnhancedProducts(
    ids: (number | string)[] | string, 
    options: Partial<EnhancedMultipleProductsOptions> = {}
  ): Promise<PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    const idString = Array.isArray(ids) ? ids.join(',') : ids;
    
    const defaultOptions: EnhancedMultipleProductsOptions = {
      ids: idString,
      includestockdata: 0,
      includesubproducts: false,
      includeparentid: false,
      includetrans: false,
      includeextendedoptions: true,
      pagination_data: true,
      ...options
    };

    console.log('🚀 ProductService.getMultipleEnhancedProducts - Fetching products:', idString, 'with options:', defaultOptions);

    try {
      const response = await apiClient.get('/products/enhanced/multiple', { params: defaultOptions });
      console.log('✅ Multiple enhanced products received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching multiple enhanced products:', error);
      throw error;
    }
  }

  /**
   * Get products by date range (uses your by_date endpoint)
   */
  static async getProductsByDateRange(
    dateParams: DateRangeParams = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    const defaultParams: DateRangeParams = {
      date_field: 'creation',
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      sortfield: '',
      sortorder: 'DESC',
      pagination_data: true,
      ...dateParams
    };

    try {
      const response = await apiClient.get('/products/by_date', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching products by date range:', error);
      throw error;
    }
  }

  /**
   * Get filtered products (uses your filtered endpoint) - Enhanced with all filter support
   */
  static async getFilteredProducts(params: FilteredProductsParams = {}): Promise<PaginatedProductResponse | ProductListResponse> {
    const defaultParams: FilteredProductsParams = {
      sortfield: this.DEFAULT_SORT_FIELD,
      sortorder: this.DEFAULT_SORT_ORDER,
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      category: 1,
      pagination_data: true,
      includestockdata: 0,
      includeextendedoptions: false, // Standard endpoint doesn't include extended options by default
      ...params
    };

    // Log all parameters being sent to API for debugging
    console.log('🚀 ProductService.getFilteredProducts - Full params being sent:', defaultParams);
    
    // Log specific filter parameters
    const activeFilters = Object.entries(defaultParams)
      .filter(([key, value]) => value !== undefined && value !== null && value !== '')
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    console.log('🔍 Active filters being sent to API:', activeFilters);

    try {
      const response = await apiClient.get('/products/filtered', { params: defaultParams });
      console.log('✅ API Response received:', {
        endpoint: '/products/filtered',
        dataCount: Array.isArray(response.data) ? response.data.length : 
                   'pagination' in response.data ? response.data.data?.length : 'unknown',
        hasData: !!response.data
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching filtered products:', error);
      console.error('Parameters that caused error:', defaultParams);
      throw error;
    }
  }

  /**
   * Get enhanced filtered products with extended options
   */
  static async getEnhancedFilteredProducts(
    params: FilteredProductsParams = {}
  ): Promise<PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    const enhancedParams: FilteredProductsParams = {
      ...params,
      includeextendedoptions: true
    };

    console.log('🚀 ProductService.getEnhancedFilteredProducts - Full params being sent:', enhancedParams);

    try {
      const response = await this.getFilteredProducts(enhancedParams);
      console.log('✅ Enhanced filtered products received');
      return response as PaginatedEnhancedProductResponse | EnhancedProductListResponse;
    } catch (error) {
      console.error('❌ Error fetching enhanced filtered products:', error);
      throw error;
    }
  }

  /**
   * Get products that belong to ALL specified categories (uses your categories/intersection endpoint)
   */
  static async getProductsByCategoriesIntersection(
    categories: string[] | string, 
    searchQuery?: string,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    const categoryString = Array.isArray(categories) ? categories.join(',') : categories;
    
    const params = {
      categories: categoryString,
      search_query: searchQuery || '',
      sortfield: this.DEFAULT_SORT_FIELD,
      sortorder: this.DEFAULT_SORT_ORDER,
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      pagination_data: true,
      ...additionalParams
    };

    try {
      const response = await apiClient.get('/products/categories/intersection', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching products by categories intersection:', error);
      throw error;
    }
  }

  /**
   * Get all brands (uses your brands endpoint)
   */
  static async getBrands(animalCategoryId?: number): Promise<Brand[]> {
    const params = animalCategoryId ? { animal_category_id: animalCategoryId } : {};

    try {
      const response = await apiClient.get('/products/brands', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }

  /**
   * Get categories by animal (uses your categories/by_animal endpoint)
   */
  static async getCategoriesByAnimal(animalCategoryId: number): Promise<Category[]> {
    try {
      const response = await apiClient.get(`/products/categories/by_animal/${animalCategoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories by animal:', error);
      throw error;
    }
  }

  /**
   * Get all animal categories (uses your animals endpoint)
   */
  static async getAnimals(): Promise<AnimalCategory[]> {
    try {
      const response = await apiClient.get('/products/animals');
      return response.data;
    } catch (error) {
      console.error('Error fetching animals:', error);
      throw error;
    }
  }

  /**
   * Get complete filter data (uses your filter_data endpoint)
   */
  static async getFilterData(animalCategoryId?: number): Promise<FilterData> {
    const params = animalCategoryId ? { animal_category_id: animalCategoryId } : {};

    try {
      const response = await apiClient.get('/products/filter_data', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching filter data:', error);
      throw error;
    }
  }

  /**
   * Get price range statistics (uses your price_ranges endpoint)
   */
  static async getPriceRanges(
    animalCategory?: number,
    category?: number,
    brand?: string
  ): Promise<PriceRange> {
    const params: any = {};
    if (animalCategory) params.animal_category = animalCategory;
    if (category) params.category = category;
    if (brand) params.brand = brand;

    try {
      const response = await apiClient.get('/products/price_ranges', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching price ranges:', error);
      throw error;
    }
  }

  /**
   * Get category hierarchy (uses your categories/hierarchy endpoint)
   */
  static async getCategoryHierarchy(parentId: number = 1): Promise<Category[]> {
    try {
      const response = await apiClient.get('/products/categories/hierarchy', { 
        params: { parent_id: parentId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching category hierarchy:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions (uses your search_suggestions endpoint)
   */
  static async getSearchSuggestions(
    query: string,
    limit: number = 10,
    animalCategory?: number
  ): Promise<SearchSuggestion[]> {
    const params: any = { query, limit };
    if (animalCategory) params.animal_category = animalCategory;

    try {
      const response = await apiClient.get('/products/search_suggestions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      throw error;
    }
  }

  // ==================== ENHANCED FILTER METHODS ====================

  /**
   * Search products by name/title with enhanced options
   */
  static async searchByName(
    searchTerm: string, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        search: searchTerm,
        ...additionalParams
      });
    }
    
    return this.searchProducts({
      search_name: searchTerm,
      ...additionalParams
    });
  }

  /**
   * Filter products by categories with enhanced options
   */
  static async filterByCategories(
    categories: string[] | string, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    const categoryString = Array.isArray(categories) ? categories.join(',') : categories;
    
    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        category: parseInt(categoryString),
        ...additionalParams
      });
    }
    
    return this.searchProducts({
      categories: categoryString,
      ...additionalParams
    });
  }

  /**
   * Filter products by brand with enhanced options
   */
  static async filterByBrand(
    brand: string, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        brand: brand,
        ...additionalParams
      });
    }
    
    return this.searchProducts({
      brand: brand,
      ...additionalParams
    });
  }

  /**
   * Filter products by game category with enhanced options
   */
  static async filterByGame(
    game: string, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        game: game,
        ...additionalParams
      });
    }
    
    return this.searchProducts({
      game: game,
      ...additionalParams
    });
  }

  /**
   * Filter products by taste/flavor with enhanced options
   */
  static async filterByTaste(
    taste: string, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        taste: taste,
        ...additionalParams
      });
    }
    
    return this.searchProducts({
      taste: taste,
      ...additionalParams
    });
  }

  /**
   * Filter products by ages with enhanced options
   */
  static async filterByAges(
    ages: string, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        ages: ages,
        ...additionalParams
      });
    }
    
    return this.searchProducts({
      ages: ages,
      ...additionalParams
    });
  }

  /**
   * Filter products by health option with enhanced options
   */
  static async filterByHealthOption(
    healthOption: string, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        health_option: healthOption,
        ...additionalParams
      });
    }
    
    return this.searchProducts({
      health_option: healthOption,
      ...additionalParams
    });
  }

  /**
   * Filter products by nutritional option with enhanced options
   */
  static async filterByNutritionalOption(
    nutritionalOption: string, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        nutritional_option: nutritionalOption,
        ...additionalParams
      });
    }
    
    return this.searchProducts({
      nutritional_option: nutritionalOption,
      ...additionalParams
    });
  }

  // ==================== DATE-BASED METHODS ====================

  /**
   * Get recently created products with enhanced options
   */
  static async getRecentProducts(
    days: number = 7, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<DateRangeParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    const dateParams = {
      date_field: 'creation' as const,
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
      ...additionalParams
    };

    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        ...dateParams,
        includeextendedoptions: true
      });
    }

    return this.getProductsByDateRange(dateParams);
  }

  /**
   * Get recently modified products with enhanced options
   */
  static async getRecentlyModifiedProducts(
    days: number = 7, 
    includeEnhanced: boolean = false,
    additionalParams: Partial<DateRangeParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse | PaginatedEnhancedProductResponse | EnhancedProductListResponse> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    const dateParams = {
      date_field: 'modification' as const,
      date_from: dateFrom.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
      ...additionalParams
    };

    if (includeEnhanced) {
      return this.getEnhancedFilteredProducts({
        ...dateParams,
        includeextendedoptions: true
      });
    }

    return this.getProductsByDateRange(dateParams);
  }

  // ==================== PAGINATION METHODS ====================

  /**
   * Search products with pagination support
   */
  static async searchWithPagination(
    searchParams: Partial<SearchParams> = {}, 
    page: number = 0,
    includeEnhanced: boolean = false
  ): Promise<PaginatedProductResponse | PaginatedEnhancedProductResponse> {
    if (includeEnhanced) {
      const result = await this.getEnhancedFilteredProducts({
        ...searchParams,
        page,
        pagination_data: true
      });

      // Type guard to ensure we return PaginatedEnhancedProductResponse
      if ('pagination' in result) {
        return result as PaginatedEnhancedProductResponse;
      }
      
      // Fallback for non-paginated response
      return {
        data: result as EnhancedProduct[],
        pagination: {
          total: (result as EnhancedProduct[]).length,
          page: 0,
          page_count: 1,
          limit: this.DEFAULT_LIMIT
        }
      };
    }

    const result = await this.searchProducts({
      ...searchParams,
      page,
      pagination_data: true
    });

    // Type guard to ensure we return PaginatedProductResponse
    if ('pagination' in result) {
      return result as PaginatedProductResponse;
    }
    
    // Fallback for non-paginated response
    return {
      data: result as Product[],
      pagination: {
        total: (result as Product[]).length,
        page: 0,
        page_count: 1,
        limit: this.DEFAULT_LIMIT
      }
    };
  }

  /**
   * Get next page of products
   */
  static async getNextPage(
    currentResponse: PaginatedProductResponse | PaginatedEnhancedProductResponse, 
    searchParams: Partial<SearchParams> = {},
    includeEnhanced: boolean = false
  ): Promise<PaginatedProductResponse | PaginatedEnhancedProductResponse | null> {
    const pagination = currentResponse.pagination;
    if (!pagination || pagination.page >= pagination.page_count - 1) {
      return null; // No more pages
    }

    return this.searchWithPagination(searchParams, pagination.page + 1, includeEnhanced);
  }

  /**
   * Get previous page of products
   */
  static async getPreviousPage(
    currentResponse: PaginatedProductResponse | PaginatedEnhancedProductResponse, 
    searchParams: Partial<SearchParams> = {},
    includeEnhanced: boolean = false
  ): Promise<PaginatedProductResponse | PaginatedEnhancedProductResponse | null> {
    const pagination = currentResponse.pagination;
    if (!pagination || pagination.page <= 0) {
      return null; // Already on first page
    }

    return this.searchWithPagination(searchParams, pagination.page - 1, includeEnhanced);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Type guard to check if response is paginated
   */
  static isPaginatedResponse(
    response: ProductResponse | EnhancedProductResponse
  ): response is PaginatedProductResponse | PaginatedEnhancedProductResponse {
    return typeof response === 'object' && response !== null && 'pagination' in response;
  }

  /**
   * Type guard to check if response contains enhanced products
   */
  static isEnhancedProductResponse(
    response: ProductResponse | EnhancedProductResponse
  ): response is EnhancedProductResponse {
    if (Array.isArray(response)) {
      return response.length > 0 && 'extended_options' in response[0];
    }
    if (this.isPaginatedResponse(response)) {
      return response.data.length > 0 && 'extended_options' in response.data[0];
    }
    return 'extended_options' in response;
  }

  /**
   * Extract product data from any response type
   */
  static extractProductData(
    response: ProductResponse | EnhancedProductResponse
  ): Product[] | EnhancedProduct[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (this.isPaginatedResponse(response)) {
      return response.data;
    }
    return [response];
  }

  /**
   * Extract pagination data from response (if available)
   */
  static extractPaginationData(
    response: ProductResponse | EnhancedProductResponse
  ): Pagination | null {
    if (this.isPaginatedResponse(response)) {
      return response.pagination;
    }
    return null;
  }

  /**
   * Convert regular product to enhanced product (with empty extended_options)
   */
  static toEnhancedProduct(product: Product): EnhancedProduct {
    return {
      ...product,
      extended_options: {}
    };
  }

  /**
   * Convert enhanced product to regular product (remove extended_options)
   */
  static toRegularProduct(enhancedProduct: EnhancedProduct): Product {
    const { extended_options, ...regularProduct } = enhancedProduct;
    return regularProduct;
  }

  /**
   * Check if a product has extended options data
   */
  static hasExtendedOptions(product: Product | EnhancedProduct): product is EnhancedProduct {
    return 'extended_options' in product && !!product.extended_options;
  }

  /**
   * Get extended option value by key
   */
  static getExtendedOption(
    product: EnhancedProduct, 
    optionKey: keyof ExtendedOptions
  ): string | number[] | undefined {
    return product.extended_options?.[optionKey];
  }

  /**
   * Check if product has specific extended option
   */
  static hasExtendedOption(
    product: EnhancedProduct, 
    optionKey: keyof ExtendedOptions
  ): boolean {
    return !!(product.extended_options?.[optionKey]);
  }

  /**
   * Filter enhanced products by extended option
   */
  static filterByExtendedOption(
    products: EnhancedProduct[],
    optionKey: keyof ExtendedOptions,
    optionValue: string | number
  ): EnhancedProduct[] {
    return products.filter(product => {
      const value = this.getExtendedOption(product, optionKey);
      if (Array.isArray(value)) {
        return value.includes(optionValue as number);
      }
      return value === optionValue;
    });
  }

  /**
   * Group enhanced products by extended option
   */
  static groupByExtendedOption(
    products: EnhancedProduct[],
    optionKey: keyof ExtendedOptions
  ): Record<string, EnhancedProduct[]> {
    const groups: Record<string, EnhancedProduct[]> = {};
    
    products.forEach(product => {
      const value = this.getExtendedOption(product, optionKey);
      const key = Array.isArray(value) ? value.join(',') : String(value || 'unknown');
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(product);
    });
    
    return groups;
  }

  /**
   * Get unique values for an extended option across products
   */
  static getUniqueExtendedOptionValues(
    products: EnhancedProduct[],
    optionKey: keyof ExtendedOptions
  ): (string | number)[] {
    const values = new Set<string | number>();
    
    products.forEach(product => {
      const value = this.getExtendedOption(product, optionKey);
      if (Array.isArray(value)) {
        value.forEach(v => values.add(v));
      } else if (value !== undefined) {
        values.add(value);
      }
    });
    
    return Array.from(values);
  }

  /**
   * Get configuration object for default settings
   */
  static getDefaultConfig(): {
    DEFAULT_LIMIT: number;
    DEFAULT_PAGE: number;
    DEFAULT_SORT_FIELD: string;
    DEFAULT_SORT_ORDER: 'ASC' | 'DESC';
    DEFAULT_CATEGORY: string;
  } {
    return {
      DEFAULT_LIMIT: this.DEFAULT_LIMIT,
      DEFAULT_PAGE: this.DEFAULT_PAGE,
      DEFAULT_SORT_FIELD: this.DEFAULT_SORT_FIELD,
      DEFAULT_SORT_ORDER: this.DEFAULT_SORT_ORDER,
      DEFAULT_CATEGORY: this.DEFAULT_CATEGORY
    };
  }

  /**
   * Debug helper to log product structure
   */
  static debugProduct(product: Product | EnhancedProduct, label: string = 'Product'): void {
    console.log(`🔍 ${label} Debug:`, {
      id: product.id,
      label: product.label,
      hasArrayOptions: !!product.array_options,
      hasExtendedOptions: this.hasExtendedOptions(product),
      extendedOptions: this.hasExtendedOptions(product) ? product.extended_options : 'Not available',
      arrayOptions: product.array_options || 'Not available'
    });
  }

  /**
   * Debug helper to log response structure
   */
  static debugResponse(
    response: ProductResponse | EnhancedProductResponse, 
    label: string = 'Response'
  ): void {
    const products = this.extractProductData(response);
    const pagination = this.extractPaginationData(response);
    
    console.log(`🔍 ${label} Debug:`, {
      type: Array.isArray(response) ? 'Array' : this.isPaginatedResponse(response) ? 'Paginated' : 'Single',
      productCount: products.length,
      isEnhanced: this.isEnhancedProductResponse(response),
      hasPagination: !!pagination,
      pagination: pagination || 'Not available',
      firstProduct: products.length > 0 ? {
        id: products[0].id,
        label: products[0].label,
        hasExtendedOptions: this.hasExtendedOptions(products[0])
      } : 'No products'
    });
  }
}

export default ProductService;