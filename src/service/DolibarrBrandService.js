// BrandService.js - Functional Service using Dolibarr Dictionary APIs
import apiClient from "../axiosInstance/AxiosInstance";

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
let cache = {
  brands: null,
  categories: null,
  expiry: null
};

// Check if cache is valid
const isCacheValid = () => {
  return cache.expiry && Date.now() < cache.expiry;
};

// Clear cache
const clearCache = () => {
  cache = {
    brands: null,
    categories: null,
    expiry: null
  };
  console.log('Cache cleared');
};

// Helper to determine better formatting (prefer proper case over ALL CAPS)
const isBetterFormatted = (newName, existingName) => {
  // If existing is all caps and new is mixed case, prefer new
  if (existingName === existingName.toUpperCase() && newName !== newName.toUpperCase()) {
    return true;
  }
  // If new is all caps and existing is mixed case, keep existing
  if (newName === newName.toUpperCase() && existingName !== existingName.toUpperCase()) {
    return false;
  }
  // If both are same case type, prefer the longer one (more descriptive)
  return newName.length > existingName.length;
};

// Generate consistent brand ID
const generateBrandId = (brandName) => {
  return brandName.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

// Transform brand data for UI consistency
const transformBrandForUI = (brand) => {
  return {
    id: brand.id || generateBrandId(brand.name || brand.label),
    name: brand.name || brand.label || 'Unknown Brand',
    label: brand.label || brand.name || 'Unknown Brand',
    description: brand.description || brand.name || '',
    code: brand.code || brand.id || '',
    url: brand.url || '',
    image: brand.image || null,
    isActive: brand.status === '1' || brand.status === 1 || brand.active === 1,
    productCount: brand.productCount || 0
  };
};

// Transform category data for UI consistency
const transformCategoryForUI = (category) => {
  return {
    id: category.id || category.rowid,
    name: category.label || category.name || 'Unknown Category',
    label: category.label || category.name || 'Unknown Category',
    description: category.description || category.note || '',
    type: category.type || 'product',
    parent: category.fk_parent || null,
    isActive: category.visible === '1' || category.visible === 1
  };
};

// Extract brands from products (as backup)
const extractBrandsFromProducts = async () => {
  const brandDetails = new Map();
  let page = 1;
  const limit = 100;
  const maxPages = 5; // Limit for performance

  while (page <= maxPages) {
    try {
      console.log(`Fetching products page ${page} for brand extraction...`);
      const response = await apiClient.get(`/products?limit=${limit}&page=${page}`);
      const products = response.data || [];

      if (!products || products.length === 0) break;

      products.forEach(product => {
        const brand = product.array_options?.options_marque;
        if (brand && brand.trim() !== '') {
          const brandName = brand.trim();
          const brandKey = brandName.toLowerCase(); // Use lowercase for deduplication
          
          // Only add if we haven't seen this brand before (case-insensitive)
          if (!brandDetails.has(brandKey)) {
            brandDetails.set(brandKey, {
              id: generateBrandId(brandName),
              name: brandName,
              label: brandName,
              description: `Products from ${brandName}`,
              status: '1',
              productCount: 1
            });
          } else {
            // Increment product count for existing brand
            const existingBrand = brandDetails.get(brandKey);
            existingBrand.productCount++;
            
            // Keep the brand name with better formatting (prefer proper case over ALL CAPS)
            if (isBetterFormatted(brandName, existingBrand.name)) {
              existingBrand.name = brandName;
              existingBrand.label = brandName;
              existingBrand.description = `Products from ${brandName}`;
            }
          }
        }
      });

      page++;
    } catch (error) {
      console.error(`Error fetching products page ${page}:`, error);
      break;
    }
  }

  // Convert to array and sort by name
  const brandsArray = Array.from(brandDetails.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  console.log(`🧹 Deduplicated to ${brandsArray.length} unique brands`);
  return brandsArray;
};

// Get all brands by extracting from products
const getAllBrands = async (forceRefresh = false) => {
  try {
    // Check cache first
    if (!forceRefresh && isCacheValid() && cache.brands) {
      console.log('Returning cached brands');
      return cache.brands;
    }

    console.log('Fetching brands from products...');
    
    // Extract brands from products (the working method)
    const brands = await extractBrandsFromProducts();

    // Transform brands to consistent format
    const transformedBrands = brands.map(brand => transformBrandForUI(brand));

    // Cache the results
    cache.brands = transformedBrands;
    cache.expiry = Date.now() + CACHE_DURATION;

    console.log(`📦 Loaded ${transformedBrands.length} brands using product extraction`);
    return transformedBrands;

  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
};

// Get all categories using categories API
const getAllCategories = async (forceRefresh = false) => {
  try {
    // Check cache first
    if (!forceRefresh && isCacheValid() && cache.categories) {
      console.log('Returning cached categories');
      return cache.categories;
    }

    console.log('Fetching categories from API...');
    
    // Try the categories endpoint (most likely to work)
    let categories = [];
    
    try {
      console.log('Trying endpoint: /categories');
      const response = await apiClient.get('/categories');
      
      if (response.data && Array.isArray(response.data)) {
        categories = response.data;
        console.log(`✅ Success with /categories endpoint`);
      }
    } catch (error) {
      console.log(`❌ Failed endpoint: /categories - ${error.message}`);
      
      // Try with product type filter as fallback
      try {
        console.log('Trying endpoint: /categories?type=product');
        const response = await apiClient.get('/categories?type=product');
        
        if (response.data && Array.isArray(response.data)) {
          categories = response.data;
          console.log(`✅ Success with /categories?type=product endpoint`);
        }
      } catch (fallbackError) {
        console.log(`❌ Failed endpoint: /categories?type=product - ${fallbackError.message}`);
      }
    }

    // Transform categories to consistent format
    const transformedCategories = categories.map(category => transformCategoryForUI(category));

    // Cache the results
    cache.categories = transformedCategories;
    cache.expiry = Date.now() + CACHE_DURATION;

    console.log(`📁 Loaded ${transformedCategories.length} categories`);
    return transformedCategories;

  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get brands formatted for UI
const getBrandsForUI = async () => {
  try {
    return await getAllBrands();
  } catch (error) {
    console.error('Error getting brands for UI:', error);
    return [];
  }
};

// Get categories formatted for UI  
const getCategoriesForUI = async () => {
  try {
    return await getAllCategories();
  } catch (error) {
    console.error('Error getting categories for UI:', error);
    return [];
  }
};

// Test API connection
const testConnection = async () => {
  try {
    // Try a simple endpoint first
    const response = await apiClient.get('/status');
    return true;
  } catch (error) {
    try {
      // Fallback test with products
      const response = await apiClient.get('/products?limit=1');
      return true;
    } catch (fallbackError) {
      console.error('API connection test failed:', fallbackError);
      return false;
    }
  }
};

// Get cache status
const getCacheStatus = () => {
  return {
    isCached: cache.brands !== null || cache.categories !== null,
    brandsCount: cache.brands ? cache.brands.length : 0,
    categoriesCount: cache.categories ? cache.categories.length : 0,
    expiresAt: cache.expiry,
    isExpired: cache.expiry ? Date.now() > cache.expiry : true
  };
};

// Debug: Get available API endpoints
const getAvailableEndpoints = async () => {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (error) {
    console.error('Could not fetch available endpoints:', error);
    return null;
  }
};

// Export main functions
export const getBrands = async () => {
  try {
    return await getBrandsForUI();
  } catch (error) {
    console.error('Error in getBrands:', error);
    return [];
  }
};

export const getCategories = async () => {
  try {
    return await getCategoriesForUI();
  } catch (error) {
    console.error('Error in getCategories:', error);
    return [];
  }
};

export const getBrandsWithCount = async () => {
  try {
    // Now returns actual product counts per brand
    return await getBrandsForUI();
  } catch (error) {
    console.error('Error getting brands with count:', error);
    return [];
  }
};

// Utility functions
export const refreshCache = async () => {
  try {
    clearCache();
    const brands = await getAllBrands(true);
    const categories = await getAllCategories(true);
    return { brands, categories };
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return { brands: [], categories: [] };
  }
};

export const testBrandApiConnection = async () => {
  try {
    return await testConnection();
  } catch (error) {
    console.error('Brand API test failed:', error);
    return false;
  }
};

export const getCacheInfo = () => {
  return getCacheStatus();
};

export { getAvailableEndpoints, clearCache };

// Default export for backward compatibility
export default {
  getBrands,
  getCategories,
  getBrandsWithCount,
  refreshCache,
  testBrandApiConnection,
  getCacheInfo,
  getAvailableEndpoints,
  clearCache
};