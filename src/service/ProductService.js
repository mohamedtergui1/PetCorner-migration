// ProductService.js - Service for handling Dolibarr API calls
import apiClient from "../axiosInstance/AxiosInstance";

// Simple API call wrapper
const makeApiCall = async (endpoint, params = {}, options = {}) => {
  try {
    const response = await apiClient.get(endpoint, { params, ...options });
    return response;
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error.message);
    throw error;
  }
};

// Helper function to determine the filter category based on available filters
const determineCategoryFilter = (filters) => {
  // Priority 1: If category is specified, use it
  if (filters.category) {
    return filters.category;
  }
  
  // Priority 2: If animal exists but no category, use animal as category
  if (filters.animal) {
    return filters.animal;
  }
  
  // Priority 3: Default to category 1
  return 1;
};

// Enhanced client-side filtering - Only for filters not supported by Dolibarr API
const applyClientSideFilters = (products, filters, categories = []) => {
  let filteredProducts = [...products];

  // Brand filter (not supported by Dolibarr API)
  if (filters.brand) {
    filteredProducts = filteredProducts.filter(product => {
      const productBrand = product.array_options?.options_marque || '';
      return productBrand.toLowerCase().includes(filters.brand.toLowerCase());
    });
  }

  // Price filter (not supported by Dolibarr API)
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    filteredProducts = filteredProducts.filter(product => {
      let price = parseFloat(product.price_ttc || product.price || 0);
      
      if ((!price || price === 0) && product.multiprices_ttc && product.multiprices_ttc["1"]) {
        price = parseFloat(product.multiprices_ttc["1"]);
      }
      
      const passesMin = filters.priceMin === undefined || price >= filters.priceMin;
      const passesMax = filters.priceMax === undefined || price <= filters.priceMax;
      
      return passesMin && passesMax;
    });
  }

  // Animal filter (not supported by Dolibarr API - unless animal = category)
  if (filters.animal) {
    const animalId = filters.animal.toString();
    
    // Map animal IDs to names for text searching
    const animalMap = {
      '2': 'chien',
      '3': 'chat', 
      '184': 'lapin',
      '21': 'poisson',
      '31': 'reptile',
      '20': 'oiseau'
    };
    
    const animalName = animalMap[animalId] || animalId;
    
    filteredProducts = filteredProducts.filter(product => {
      // Method 1: Check if product has animal_id field
      if (product.animal_id && product.animal_id.toString() === animalId) {
        return true;
      }
      
      // Method 2: Check if product has animals array
      if (product.animals && Array.isArray(product.animals)) {
        const matchesAnimal = product.animals.some(prodAnimal => 
          prodAnimal.toString() === animalId
        );
        if (matchesAnimal) return true;
      }
      
      // Method 3: Text-based search as fallback
      const label = (product.label || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      const tags = (product.array_options?.options_tags || '').toLowerCase();
      
      return label.includes(animalName) || 
             description.includes(animalName) || 
             tags.includes(animalName);
    });
  }

  // Stock filter (not supported by Dolibarr API)
  if (filters.inStock) {
    filteredProducts = filteredProducts.filter(product => {
      const stock = parseInt(product.stock_reel || 0);
      return stock > 0;
    });
  }

  // Status filter (may be supported by Dolibarr API, but keeping as client-side for flexibility)
  if (filters.status !== undefined) {
    filteredProducts = filteredProducts.filter(product => {
      return product.status === filters.status.toString();
    });
  }

  return filteredProducts;
};

// Get all products with smart category filtering
const getProducts = async (limit = 100, page = 0) => {
  try {
    const params = {
      limit,
      page,
      sortfield: 't.datec',
      sortorder: 'DESC'
    };

    const response = await makeApiCall('products', params);
    return response.data || [];
  } catch (error) {
    throw new Error('Impossible de charger les produits');
  }
};

// Enhanced pagination - Uses Dolibarr's built-in pagination with API-level filtering
const getProductsWithPagination = async (limit = 50, page = 0, filters = {}, searchTerm = '') => {
  try {
    const params = {
      limit,
      page,
      sortfield: 't.datec',
      sortorder: 'DESC',
      pagination_data: true, // Essential for getting pagination metadata from Dolibarr
      includeimage: 1 // Include image data
    };

    // Determine the category filter based on simple priority logic
    const finalFilters = { ...filters };
    finalFilters.category = determineCategoryFilter(filters);

    console.log('📄 Pagination filter logic applied:', {
      page: page,
      limit: limit,
      searchTerm: searchTerm,
      originalFilters: filters,
      finalCategoryFilter: finalFilters.category,
      reasoning: filters.category ? 'Category specified' : 
                 filters.animal ? 'Animal used as category' : 
                 'Default category 1'
    });

    // Add category filter to API call
    if (finalFilters.category) {
      params.category = finalFilters.category;
    }

    // Add search to Dolibarr API if provided
    if (searchTerm && searchTerm.trim()) {
      params.sqlfilters = `(t.label:like:'%${searchTerm.trim()}%') OR (t.ref:like:'%${searchTerm.trim()}%') OR (t.description:like:'%${searchTerm.trim()}%')`;
    }

    // Let Dolibarr handle pagination and filtering
    const response = await makeApiCall('products', params);

    // Dolibarr should return the paginated data with pagination_data=true
    let productsData = [];
    let paginationData = null;

    // Check if response has pagination structure
    if (response.data && typeof response.data === 'object' && response.data.data && response.data.pagination) {
      productsData = response.data.data;
      paginationData = response.data.pagination;
    } else if (Array.isArray(response.data)) {
      // Fallback if pagination structure not present
      productsData = response.data;
      paginationData = {
        total: productsData.length,
        page: page,
        page_count: Math.ceil(productsData.length / limit),
        limit: limit,
        current_count: productsData.length,
        has_more: productsData.length === limit
      };
    }

    // Apply only client-side filters that Dolibarr doesn't support (brand, price, animal, stock, status)
    const clientSideFilters = {
      brand: finalFilters.brand,
      priceMin: finalFilters.priceMin,
      priceMax: finalFilters.priceMax,
      animal: finalFilters.animal,
      inStock: finalFilters.inStock,
      status: finalFilters.status
    };

    // Remove undefined filters
    Object.keys(clientSideFilters).forEach(key => {
      if (clientSideFilters[key] === undefined) {
        delete clientSideFilters[key];
      }
    });

    // Only apply client-side filtering if there are filters that need it
    if (Object.keys(clientSideFilters).length > 0) {
      productsData = applyClientSideFilters(productsData, clientSideFilters);
      
      // Update pagination info after client-side filtering
      paginationData = {
        ...paginationData,
        current_count: productsData.length
      };
    }

    return {
      data: productsData,
      pagination: paginationData
    };
  } catch (error) {
    throw new Error('Impossible de charger les produits avec pagination');
  }
};

// Get product categories
const getProductCategories = async () => {
  try {
    const products = await getProducts(1000, 0);
    const categoriesSet = new Set();
    
    products.forEach(product => {
      const tags = product.array_options?.options_tags || '';
      if (tags) {
        tags.split(',').forEach(tag => {
          const cleanTag = tag.trim();
          if (cleanTag && cleanTag.length > 2) {
            categoriesSet.add(cleanTag);
          }
        });
      }
      
      const label = product.label || '';
      const commonCategories = ['chien', 'chat', 'oiseau', 'poisson', 'rongeur', 'accessoire', 'nourriture', 'jouet', 'litière', 'collier'];
      commonCategories.forEach(cat => {
        if (label.toLowerCase().includes(cat)) {
          categoriesSet.add(cat.charAt(0).toUpperCase() + cat.slice(1));
        }
      });
    });

    const categories = Array.from(categoriesSet).map((name, index) => ({
      id: index + 1,
      label: name,
      name: name
    }));

    return categories;
  } catch (error) {
    console.error('Error loading product categories:', error);
    return [];
  }
};

// Main method used in ProductScreen - getProductsOnlyWithPagination
const getProductsOnlyWithPagination = async (limit = 50, page = 0, filters = {}, searchTerm = '') => {
  return await getProductsWithPagination(limit, page, filters, searchTerm);
};

// Export only the functions used in ProductScreen
export {
  getProductsOnlyWithPagination,
  getProductCategories,
};