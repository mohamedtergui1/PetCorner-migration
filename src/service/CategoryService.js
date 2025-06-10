// CategoryService.js - Fixed service for Dolibarr categories
import apiClient from "../axiosInstance/AxiosInstance";

class DolibarrCategoryService {
  constructor() {
    this.apiClient = apiClient;
  }

  // Get all categories from Dolibarr API
  async getAllCategories() {
    try {
      const response = await this.apiClient.get('/categories');
       
      return response.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get category by ID with products
  async getCategoryById(categoryId) {
    try {
      const response = await this.apiClient.get(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  }

  // Get products for a specific category
  async getCategoryProducts(categoryId) {
    try {
      const response = await this.apiClient.get(`/categories/allc/${categoryId}`);
     
      
      if (response.data && response.data.length > 0) {
        return {
          category: response.data[0],
          products: response.data[0].products || [],
          count: response.data[0].product_count || (response.data[0].products ? response.data[0].products.length : 0)
        };
      }
      return { category: null, products: [], count: 0 };
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw error;
    }
  }

  // Get subcategories of a parent category
  async getSubcategories(parentId) {
    try {
      const response = await this.apiClient.get(`/categories/${parentId}/children`);
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return []; // Return empty array on error
    }
  }

  // Find category by label (name)
  async findCategoryByLabel(labelToFind) {
    try {
      const categories = await this.getAllCategories();
      return categories.find(cat => 
        cat.label && cat.label.toLowerCase() === labelToFind.toLowerCase()
      );
    } catch (error) {
      console.error('Error finding category by label:', error);
      return null;
    }
  }

  // Find subcategory by parent label and subcategory label
  async findSubcategoryByLabels(parentLabel, subLabel) {
    try {
      // First find the parent category
      const parentCategory = await this.findCategoryByLabel(parentLabel);
      if (!parentCategory) {
        throw new Error(`Parent category "${parentLabel}" not found`);
      }

      // Get subcategories of the parent
      const subcategories = await this.getSubcategories(parentCategory.id);
      
      // Find the specific subcategory
      return subcategories.find(subcat => 
        subcat.label && subcat.label.toLowerCase() === subLabel.toLowerCase()
      );
    } catch (error) {
      console.error('Error finding subcategory by labels:', error);
      return null;
    }
  }

  // Build hierarchical category tree
  buildCategoryTree(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // Create map of all categories
    categories.forEach(cat => {
      categoryMap.set(cat.id.toString(), { 
        ...cat, 
        subcategories: [] 
      });
    });

    // Build tree structure
    categories.forEach(cat => {
      const categoryNode = categoryMap.get(cat.id.toString());
      if (cat.fk_parent === 0 || cat.fk_parent === null || cat.fk_parent === "0") {
        rootCategories.push(categoryNode);
      } else {
        const parent = categoryMap.get(cat.fk_parent.toString());
        if (parent) {
          parent.subcategories.push(categoryNode);
        }
      }
    });

    return rootCategories;
  }

  // Transform Dolibarr category to match your existing structure
  transformCategoryForUI(category) {
    // Try to get a default image from your existing filterData
    let defaultImage = null;
    try {
      // Import the Database file to get filterData
      const { filterData } = require('../database/Database');
      // Use the first category's image as default, or a fallback
      defaultImage = filterData && filterData.length > 0 ? filterData[0].image : null;
    } catch (error) {
      console.log('Could not load default image from Database');
    }

    return {
      id: category.id.toString(),
      name: category.label || category.description || 'Catégorie',
      label: category.label || category.description || 'Catégorie',
      description: category.description || category.label || '',
      color: category.color || '',
      fk_parent: category.fk_parent || 0,
      // Use default image from filterData or null
      image: defaultImage,
      subcategories: category.subcategories || []
    };
  }

  // Get categories formatted for your existing UI
  async getCategoriesForUI() {
    try {
      const categories = await this.getAllCategories();
       
      
      if (!categories || categories.length === 0) {
         
        return [];
      }
      
      const categoryTree = this.buildCategoryTree(categories);
       
      
      return categoryTree.map(cat => this.transformCategoryForUI(cat));
    } catch (error) {
      console.error('Error getting categories for UI:', error);
      return [];
    }
  }

  // Search categories with text filter
  searchCategories(categories, searchText) {
    if (!searchText.trim()) {
      return categories;
    }

    const filterCategory = (category) => {
      const matchesSearch = 
        (category.label && category.label.toLowerCase().includes(searchText.toLowerCase())) ||
        (category.description && category.description.toLowerCase().includes(searchText.toLowerCase()));
      
      const filteredSubcategories = category.subcategories
        ? category.subcategories.map(filterCategory).filter(Boolean)
        : [];

      if (matchesSearch || filteredSubcategories.length > 0) {
        return {
          ...category,
          subcategories: filteredSubcategories
        };
      }
      
      return null;
    };

    return categories.map(filterCategory).filter(Boolean);
  }

  // Get category path (breadcrumb)
  async getCategoryPath(categoryId) {
    const path = [];
    let currentId = categoryId;

    while (currentId && currentId !== 0) {
      try {
        const category = await this.getCategoryById(currentId);
        if (category) {
          path.unshift(category.label);
          currentId = category.fk_parent;
        } else {
          break;
        }
      } catch (error) {
        console.error('Error getting category path:', error);
        break;
      }
    }

    return path;
  }

  // Example usage functions
  async findCatAccessoire() {
    try {
      // Find "Chat" category and "Accessoire" subcategory
      const result = await this.findSubcategoryByLabels('Chat', 'Accessoire');
      return result;
    } catch (error) {
      console.error('Error finding Chat > Accessoire:', error);
      return null;
    }
  }

  // Get all products from a category and its subcategories
  async getAllProductsFromCategoryTree(categoryId) {
    try {
      const allProducts = [];
      
      // Get products from main category
      const { products } = await this.getCategoryProducts(categoryId);
      allProducts.push(...products);
      
      // Get products from subcategories
      const subcategories = await this.getSubcategories(categoryId);
      for (const subcat of subcategories) {
        const { products: subProducts } = await this.getCategoryProducts(subcat.id);
        allProducts.push(...subProducts);
      }
      
      return allProducts;
    } catch (error) {
      console.error('Error getting all products from category tree:', error);
      return [];
    }
  }
}

// Export singleton instance
const categoryService = new DolibarrCategoryService();
export default categoryService;

// Updated getCategories function for backward compatibility
export const getCategories = async () => {
  try {
    
    const result = await categoryService.getCategoriesForUI();
    
    return result;
  } catch (error) {
    console.error('Error in getCategories:', error);
    return [];
  }
};

// Export additional utility functions
export const getCategoryProducts = async (categoryId) => {
  try {
     
    const result = await categoryService.getCategoryProducts(categoryId);
  
    return result;
  } catch (error) {
    console.error('Error getting category products:', error);
    return { category: null, products: [], count: 0 };
  }
};

export const getSubcategories = async (parentId) => {
  try {
     
    const result = await categoryService.getSubcategories(parentId);
     
    return result;
  } catch (error) {
    console.error('Error getting subcategories:', error);
    return [];
  }
};

export const findCategoryByLabel = async (label) => {
  try {
    return await categoryService.findCategoryByLabel(label);
  } catch (error) {
    console.error('Error finding category by label:', error);
    return null;
  }
};

export const findSubcategoryByLabels = async (parentLabel, subLabel) => {
  try {
    return await categoryService.findSubcategoryByLabels(parentLabel, subLabel);
  } catch (error) {
    console.error('Error finding subcategory by labels:', error);
    return null;
  }
};

// Simple function to test API connection
export const testApiConnection = async () => {
  try {
    
    const categories = await categoryService.getAllCategories();
    
    return true;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
};

// Example usage and testing:
/*
// Test API connection
const isConnected = await testApiConnection();

// Get all categories
const categories = await getCategories();

// Find specific category
const catCategory = await findCategoryByLabel('Chat');

// Find subcategory
const accessoire = await findSubcategoryByLabels('Chat', 'Accessoire');

// Get products from a category
const { products, count } = await getCategoryProducts(catCategory.id);

// Get subcategories
const subcats = await getSubcategories(catCategory.id);
*/