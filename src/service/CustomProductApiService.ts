import apiClient from "../axiosInstance/AxiosInstance";

// ==================== TYPE DEFINITIONS ====================

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
  sousprods?: SubProduct[];
  fk_product_parent?: string;
}

/**
 * Product Extra Fields Interface
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
  options_marque?: string; // Brand field
  options_ftfonctionnalites?: string;
  options_trancheage?: string;
  options_ref_sage?: string;
  options_cbn?: string;
  options_gamme?: string; // Game/Product line field
  options_gam1_sage?: string;
  options_sousgamme?: string;
  options_gam2_sage?: string;
  options_origine?: string;
  options_tags?: string; // Tags field (includes taste/flavor info)
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
 * Simple Product List Response (without pagination)
 */
export type ProductListResponse = Product[];

/**
 * API Response Union Type
 */
export type ProductResponse = Product | ProductListResponse | PaginatedProductResponse;

/**
 * Search Parameters Interface
 */
export interface SearchParams {
  search_name?: string;
  categories?: string;
  brand?: string;
  game?: string;
  taste?: string;
  limit?: number;
  page?: number;
  sortfield?: string;
  sortorder?: 'ASC' | 'DESC';
  pagination_data?: boolean;
  includestockdata?: 0 | 1;
  includesubproducts?: boolean;
  includeparentid?: boolean;
  includetrans?: boolean;
  mode?: 0 | 1 | 2; // 0=all, 1=products only, 2=services only
  variant_filter?: 0 | 1 | 2 | 3;
  sqlfilters?: string;
  ids_only?: boolean;
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
 * Advanced Search Criteria Interface
 */
export interface AdvancedSearchCriteria {
  name?: string;
  categories?: string[] | string;
  brand?: string;
  game?: string;
  taste?: string;
  limit?: number;
  page?: number;
  sortfield?: string;
  sortorder?: 'ASC' | 'DESC';
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
 * Multiple Products Options Interface
 */
export interface MultipleProductsOptions extends ProductOptions {
  ids: string;
  pagination_data?: boolean;
}

/**
 * Product Category Interface
 */
export interface ProductCategory {
  id: string;
  ref: string;
  label: string;
  description?: string;
  color?: string;
  position?: number;
  visible?: number;
  type?: number;
}

/**
 * Stock Response Interface
 */
export interface StockResponse {
  stock_warehouses: Record<string, StockWarehouse>;
}

/**
 * API Error Response Interface
 */
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: number;
  };
}

/**
 * Product Creation Data Interface
 */
export interface ProductCreateData {
  ref: string;
  label: string;
  description?: string;
  type?: string;
  price?: string;
  price_base_type?: string;
  tva_tx?: string;
  status?: string;
  status_buy?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  barcode?: string;
  array_options?: Partial<ProductExtraFields>;
}

/**
 * Product Update Data Interface
 */
export interface ProductUpdateData extends Partial<ProductCreateData> {
  id?: string;
}

// ==================== SERVICE CLASS ====================

/**
 * Complete ProductService with all enhanced filtering and search capabilities
 * Default limit set to 16 products per request with full TypeScript support
 */
class ProductService {
  // Default configuration
  static readonly DEFAULT_LIMIT: number = 16;
  static readonly DEFAULT_PAGE: number = 0;
  static readonly DEFAULT_SORT_FIELD: string = "t.label";
  static readonly DEFAULT_SORT_ORDER: 'ASC' | 'DESC' = "ASC";

  /**
   * Get all products with basic parameters (original index endpoint)
   */
  static async getAllProducts(params: Partial<SearchParams> = {}): Promise<PaginatedProductResponse | ProductListResponse> {
    const defaultParams: SearchParams = {
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      sortfield: this.DEFAULT_SORT_FIELD,
      sortorder: this.DEFAULT_SORT_ORDER,
      pagination_data: true,
      includestockdata: 0,
      ...params
    };

    try {
      const response = await apiClient.get('/products', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error;
    }
  }

  /**
   * Search products with enhanced filtering (main search function)
   */
  static async searchProducts(filters: Partial<SearchParams> = {}): Promise<PaginatedProductResponse | ProductListResponse> {
    const defaultParams: SearchParams = {
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      sortfield: this.DEFAULT_SORT_FIELD,
      sortorder: this.DEFAULT_SORT_ORDER,
      pagination_data: true,
      includestockdata: 0,
      ...filters
    };

    try {
      const response = await apiClient.get('/products/search_filtered', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Search products by name/title
   */
  static async searchByName(
    searchTerm: string, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    return this.searchProducts({
      search_name: searchTerm,
      ...additionalParams
    });
  }

  /**
   * Filter products by categories (OR logic - product in any of the categories)
   */
  static async filterByCategories(
    categories: string[] | string, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    const categoryString = Array.isArray(categories) ? categories.join(',') : categories;
    
    return this.searchProducts({
      categories: categoryString,
      ...additionalParams
    });
  }

  /**
   * Filter products by brand
   */
  static async filterByBrand(
    brand: string, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    return this.searchProducts({
      brand: brand,
      ...additionalParams
    });
  }

  /**
   * Filter products by game category
   */
  static async filterByGame(
    game: string, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    return this.searchProducts({
      game: game,
      ...additionalParams
    });
  }

  /**
   * Filter products by taste/flavor
   */
  static async filterByTaste(
    taste: string, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    return this.searchProducts({
      taste: taste,
      ...additionalParams
    });
  }

  /**
   * Advanced search with multiple filters
   */
  static async advancedSearch(searchCriteria: AdvancedSearchCriteria = {}): Promise<PaginatedProductResponse | ProductListResponse> {
    const {
      name,
      categories,
      brand,
      game,
      taste,
      limit = this.DEFAULT_LIMIT,
      page = this.DEFAULT_PAGE,
      sortfield = this.DEFAULT_SORT_FIELD,
      sortorder = this.DEFAULT_SORT_ORDER
    } = searchCriteria;

    const categoryString = Array.isArray(categories) ? categories.join(',') : categories;

    return this.searchProducts({
      search_name: name || '',
      categories: categoryString || '',
      brand: brand || '',
      game: game || '',
      taste: taste || '',
      limit,
      page,
      sortfield,
      sortorder
    });
  }

  /**
   * Get products that belong to ALL specified categories (AND logic)
   */
  static async getProductsByCategoriesIntersection(
    categories: string[] | string, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    const categoryString = Array.isArray(categories) ? categories.join(',') : categories;
    
    const defaultParams: SearchParams = {
      categories: categoryString,
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      sortfield: this.DEFAULT_SORT_FIELD,
      sortorder: this.DEFAULT_SORT_ORDER,
      pagination_data: true,
      ...additionalParams
    };

    try {
      const response = await apiClient.get('/products/categories/intersection', { params: defaultParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching products by categories intersection:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID
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
   * Get enhanced single product by ID with additional data
   */
  static async getEnhancedProduct(id: number | string, options: ProductOptions = {}): Promise<Product> {
    const defaultOptions: ProductOptions = {
      includestockdata: 0,
      includesubproducts: false,
      includeparentid: false,
      includetrans: false,
      ...options
    };

    try {
      const response = await apiClient.get(`/products/enhanced/${id}`, { params: defaultOptions });
      return response.data;
    } catch (error) {
      console.error(`Error fetching enhanced product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple products by array of IDs
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
   * Get products by date range
   */
  static async getProductsByDateRange(
    dateParams: DateRangeParams = {}, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    const defaultParams: DateRangeParams = {
      date_field: 'creation',
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      sortfield: 't.datec',
      sortorder: 'DESC',
      pagination_data: true,
      ...dateParams,
      ...additionalParams
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
   * Get recently created products
   */
  static async getRecentProducts(
    days: number = 7, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return this.getProductsByDateRange({
      date_field: 'creation',
      date_from: dateFrom.toISOString().split('T')[0], // YYYY-MM-DD format
      date_to: new Date().toISOString().split('T')[0]
    }, additionalParams);
  }

  /**
   * Get recently modified products
   */
  static async getRecentlyModifiedProducts(
    days: number = 7, 
    additionalParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | ProductListResponse> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return this.getProductsByDateRange({
      date_field: 'modification',
      date_from: dateFrom.toISOString().split('T')[0], // YYYY-MM-DD format
      date_to: new Date().toISOString().split('T')[0]
    }, additionalParams);
  }

  /**
   * Get product by reference
   */
  static async getProductByRef(ref: string, options: ProductOptions = {}): Promise<Product> {
    const defaultOptions: ProductOptions = {
      includestockdata: 0,
      includesubproducts: false,
      includeparentid: false,
      includetrans: false,
      ...options
    };

    try {
      const response = await apiClient.get(`/products/ref/${ref}`, { params: defaultOptions });
      return response.data;
    } catch (error) {
      console.error(`Error fetching product by ref ${ref}:`, error);
      throw error;
    }
  }

  /**
   * Get product by barcode
   */
  static async getProductByBarcode(barcode: string, options: ProductOptions = {}): Promise<Product> {
    const defaultOptions: ProductOptions = {
      includestockdata: 0,
      includesubproducts: false,
      includeparentid: false,
      includetrans: false,
      ...options
    };

    try {
      const response = await apiClient.get(`/products/barcode/${barcode}`, { params: defaultOptions });
      return response.data;
    } catch (error) {
      console.error(`Error fetching product by barcode ${barcode}:`, error);
      throw error;
    }
  }

  /**
   * Get product categories
   */
  static async getProductCategories(
    productId: number | string, 
    options: Partial<SearchParams> = {}
  ): Promise<ProductCategory[]> {
    const defaultOptions = {
      sortfield: 's.rowid',
      sortorder: 'ASC' as const,
      limit: 0,
      page: 0,
      ...options
    };

    try {
      const response = await apiClient.get(`/products/${productId}/categories`, { params: defaultOptions });
      return response.data;
    } catch (error) {
      console.error(`Error fetching categories for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get product stock information
   */
  static async getProductStock(
    productId: number | string, 
    warehouseId?: number | string
  ): Promise<StockResponse> {
    const params = warehouseId ? { selected_warehouse_id: warehouseId } : {};

    try {
      const response = await apiClient.get(`/products/${productId}/stock`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching stock for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Search products with pagination support
   */
  static async searchWithPagination(
    searchParams: Partial<SearchParams> = {}, 
    page: number = 0
  ): Promise<PaginatedProductResponse> {
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
    currentResponse: PaginatedProductResponse, 
    searchParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | null> {
    const pagination = currentResponse.pagination;
    if (!pagination || pagination.page >= pagination.page_count - 1) {
      return null; // No more pages
    }

    return this.searchWithPagination(searchParams, pagination.page + 1);
  }

  /**
   * Get previous page of products
   */
  static async getPreviousPage(
    currentResponse: PaginatedProductResponse, 
    searchParams: Partial<SearchParams> = {}
  ): Promise<PaginatedProductResponse | null> {
    const pagination = currentResponse.pagination;
    if (!pagination || pagination.page <= 0) {
      return null; // Already on first page
    }

    return this.searchWithPagination(searchParams, pagination.page - 1);
  }

  /**
   * Create a new product
   */
  static async createProduct(productData: ProductCreateData): Promise<{ id: string }> {
    try {
      const response = await apiClient.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  static async updateProduct(id: number | string, productData: ProductUpdateData): Promise<Product> {
    try {
      const response = await apiClient.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: number | string): Promise<{ success: { code: number; message: string } }> {
    try {
      const response = await apiClient.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Utility function to build search URL for direct API calls
   */
  static buildSearchUrl(params: Partial<SearchParams> = {}): string {
    const baseUrl = 'https://ipos.ma/fide/api/index.php/products/search_filtered';
    const defaultParams = {
      limit: this.DEFAULT_LIMIT,
      page: this.DEFAULT_PAGE,
      pagination_data: true,
      ...params
    };

    const queryString = new URLSearchParams(defaultParams as Record<string, string>).toString();
    return `${baseUrl}?${queryString}`;
  }

  /**
   * Get configuration object for default settings
   */
  static getDefaultConfig(): {
    DEFAULT_LIMIT: number;
    DEFAULT_PAGE: number;
    DEFAULT_SORT_FIELD: string;
    DEFAULT_SORT_ORDER: 'ASC' | 'DESC';
  } {
    return {
      DEFAULT_LIMIT: this.DEFAULT_LIMIT,
      DEFAULT_PAGE: this.DEFAULT_PAGE,
      DEFAULT_SORT_FIELD: this.DEFAULT_SORT_FIELD,
      DEFAULT_SORT_ORDER: this.DEFAULT_SORT_ORDER
    };
  }
}

export default ProductService;