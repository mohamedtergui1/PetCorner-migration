import { customApiClient } from '../axiosInstance/AxiosInstance';

// Product interfaces based on actual v2 API response
export interface ProductArrayOptions {
  options_marque: string;
  options_tags: string;
  options_similaire: string;
  options_ecommerceng_short_description_1: string;
  options_option_sante: string;
  options_gout: string;
  options_option_nutritionnel: string;
  options_ages: string;
}

export interface EnhancedProduct {
  id: number;
  ref: string;
  label: string;
  description: string;
  price: string;
  price_ttc: string;
  tva_tx: string;
  stock_reel: number;
  weight: number;
  barcode: string;
  photo_link: string;
  image_link: string;
  category_label: string;
  cost_price: string;
  date_creation: string | null;
  date_modification: string | null;
  entity: number;
  tosell: number;
  tobuy: number;
  fk_product_type: number;
  multiprices: null;
  url: string;
  array_options: ProductArrayOptions;
  
  // Mobile simplified fields
  Marque: string;
  tag: string;
  Similaire: string;
  stock: number;
  'Option Santé': string;
  'Goût': string;
  'Option Nutritionnel': string;
  Ages: string;
  similar_products_ids: string[];
}

export interface SingleProductResponse {
  success: boolean;
  data: EnhancedProduct;
  code: number;
}

export interface MultipleProductsResponse {
  success: boolean;
  data: EnhancedProduct[];
  count: number;
  code: number;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: number;
  debug?: any;
}

class CustomProductApiService {
  
  /**
   * Get the full image URL for a product with authentication parameters
   * Handles Dolibarr's authenticated viewimage.php endpoint
   */
  getProductImageUrl(product: EnhancedProduct): string {
    if (!product) return '';
    
    // Priority 1: Use image_link if it's a full URL (from your working examples)
    if (product.image_link && (product.image_link.startsWith('http://') || product.image_link.startsWith('https://'))) {
      return product.image_link;
    }
    
    // Priority 2: Use authenticated viewimage.php URL if image_link starts with /
    if (product.image_link && product.image_link.startsWith('/')) {
      // Add authentication token to viewimage.php URL
      const authenticatedUrl = `https://ipos.ma${product.image_link}`;
      // You might need to add DOLAPIKEY parameter here
      return authenticatedUrl;
    }
    
    // Priority 3: Construct direct document path (bypasses viewimage.php authentication)
    if (product.photo_link && product.ref) {
      const id = product.id;
      const lastDigit = id % 10;
      const secondToLastDigit = Math.floor(id / 10) % 10;
      const encodedPhotoLink = encodeURIComponent(product.photo_link);
      
      return `https://ipos.ma/fide/documents/produit/${lastDigit}/${secondToLastDigit}/${id}/photos/${encodedPhotoLink}`;
    }
    
    return '';
  }

  /**
   * Get authenticated image URL for use with Image component
   * This method returns the image URL with necessary auth headers
   */
  getAuthenticatedImageProps(product: EnhancedProduct): { uri: string; headers?: any } {
    const imageUrl = this.getProductImageUrl(product);
    
    // If using viewimage.php, add authentication headers
    if (imageUrl.includes('viewimage.php')) {
      return {
        uri: imageUrl,
        headers: {
          'Authorization': `Bearer YOUR_TOKEN_HERE`, // Replace with actual token
          'Cookie': 'PHPSESSID=your_session_id', // If using session-based auth
          'User-Agent': 'YourApp/1.0'
        }
      };
    }
    
    // For direct document access, no auth needed
    return { uri: imageUrl };
  }

  /**
   * Get alternative image URLs for fallback handling
   */
  getAlternativeImageUrls(product: EnhancedProduct): string[] {
    if (!product) return [];
    
    const urls = [];
    const entity = product.entity || 1;
    const ref = product.ref || '';
    const id = product.id;
    
    // Calculate folder structure using Dolibarr's algorithm
    const firstDigit = id % 10;
    const secondDigit = Math.floor(id / 10) % 10;
    
    // Add primary URL first (direct document path)
    const primaryUrl = this.getProductImageUrl(product);
    if (primaryUrl) urls.push(primaryUrl);
    
    // Add alternative encodings if photo_link exists
    if (product.photo_link) {
      const photoLink = product.photo_link;
      
      // Different encoding strategies for direct document path
      const directPathAlternatives = [
        // URL encoded (spaces as %20)
        `https://ipos.ma/fide/documents/produit/${firstDigit}/${secondDigit}/${id}/photos/${encodeURIComponent(photoLink)}`,
        // Spaces as +
        `https://ipos.ma/fide/documents/produit/${firstDigit}/${secondDigit}/${id}/photos/${photoLink.replace(/\s+/g, '+')}`,
        // No encoding
        `https://ipos.ma/fide/documents/produit/${firstDigit}/${secondDigit}/${id}/photos/${photoLink}`,
      ];
      
      directPathAlternatives.forEach(url => {
        if (!urls.includes(url)) urls.push(url);
      });
      
      // Try old string-based calculation as fallback (in case algorithm is different)
      const idString = id.toString();
      const oldFirstDigit = idString[0] || '0';
      const oldSecondDigit = idString[1] || '0';
      
      const oldFormatAlternatives = [
        `https://ipos.ma/fide/documents/produit/${oldFirstDigit}/${oldSecondDigit}/${id}/photos/${encodeURIComponent(photoLink)}`,
        `https://ipos.ma/fide/documents/produit/${oldFirstDigit}/${oldSecondDigit}/${id}/photos/${photoLink.replace(/\s+/g, '+')}`,
        `https://ipos.ma/fide/documents/produit/${oldFirstDigit}/${oldSecondDigit}/${id}/photos/${photoLink}`,
      ];
      
      oldFormatAlternatives.forEach(url => {
        if (!urls.includes(url)) urls.push(url);
      });
      
      // Fallback to old viewimage.php format
      const viewImageAlternatives = [
        // Spaces as +
        `https://ipos.ma/fide/viewimage.php?modulepart=product&entity=${entity}&file=${ref}/${photoLink.replace(/\s+/g, '+')}`,
        // URL encoded
        `https://ipos.ma/fide/viewimage.php?modulepart=product&entity=${entity}&file=${encodeURIComponent(ref)}/${encodeURIComponent(photoLink)}`,
        // Spaces as %20
        `https://ipos.ma/fide/viewimage.php?modulepart=product&entity=${entity}&file=${ref}/${photoLink.replace(/\s+/g, '%20')}`,
        // No encoding
        `https://ipos.ma/fide/viewimage.php?modulepart=product&entity=${entity}&file=${ref}/${photoLink}`,
      ];
      
      viewImageAlternatives.forEach(url => {
        if (!urls.includes(url)) urls.push(url);
      });
    }
    
    // Add image_link as fallback
    if (product.image_link && product.image_link.startsWith('/')) {
      const fallbackUrl = `https://ipos.ma${product.image_link}`;
      if (!urls.includes(fallbackUrl)) urls.push(fallbackUrl);
    }
    
    // Common fallback image names using direct document path
    if (ref) {
      const fallbackNames = ['photo.jpg', 'image.jpg', 'product.jpg', `${ref}.jpg`];
      fallbackNames.forEach(imageName => {
        const fallbackUrl = `https://ipos.ma/fide/documents/produit/${firstDigit}/${secondDigit}/${id}/photos/${imageName}`;
        if (!urls.includes(fallbackUrl)) urls.push(fallbackUrl);
      });
    }
    
    return urls;
  }

  /**
   * Debug image URLs
   */
  debugImageUrl(product: EnhancedProduct): void {
    console.log('=== IMAGE DEBUG INFO ===');
    console.log('Product ID:', product?.id);
    console.log('Product Ref:', product?.ref);
    console.log('Photo Link:', product?.photo_link);
    console.log('Image Link:', product?.image_link);
    console.log('Entity:', product?.entity);
    console.log('Primary URL:', this.getProductImageUrl(product));
    console.log('Alternative URLs:', this.getAlternativeImageUrls(product));
    console.log('========================');
  }

  /**
   * Format product price in DH currency
   */
  formatProductPrice(product: EnhancedProduct, includeTax: boolean = true): string {
    if (!product) return '0.00 DH';
    
    const price = includeTax ? parseFloat(product.price_ttc || '0') : parseFloat(product.price || '0');
    return `${price.toFixed(2)} DH`;
  }

  /**
   * Check if product is in stock
   */
  isProductInStock(product: EnhancedProduct): boolean {
    if (!product) return false;
    return product.stock_reel > 0 && product.tosell === 1;
  }

  /**
   * Get a single product by ID
   * Uses the v2 API: getproduct.php?id=2875&form=mobile&v=2
   */
  async getProduct(id: string | number, form: 'basic' | 'pricing' | 'inventory' | 'detailed' | 'mobile' = 'mobile'): Promise<EnhancedProduct> {
    try {
      const response = await customApiClient.get('/products/getproduct.php', {
        params: { 
          id,
          form
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch product');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching product:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch product');
    }
  }

  /**
   * Get multiple products by comma-separated IDs
   * Uses the v2 API: getproduct.php?ids=1,2,3&v=2
   */
  async getProductsByIds(ids: (string | number)[]): Promise<EnhancedProduct[]> {
    try {
      const idsString = ids.join(',');
      const response = await customApiClient.get('/products/getproduct.php', {
        params: { 
          ids: idsString
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch products');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching products by IDs:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch products');
    }
  }

  /**
   * Get similar products based on a product's similaire field
   */
  async getSimilarProducts(productId: string | number): Promise<EnhancedProduct[]> {
    try {
      // First get the main product to extract similar product IDs
      const mainProduct = await this.getProduct(productId);
      
      if (!mainProduct.similar_products_ids || mainProduct.similar_products_ids.length === 0) {
        return [];
      }

      // Get the similar products, filtering out non-numeric IDs
      const validIds = mainProduct.similar_products_ids
        .filter(id => id && !isNaN(Number(id)))
        .slice(0, 10); // Limit to 10 similar products for performance

      if (validIds.length === 0) {
        return [];
      }

      const similarProducts = await this.getProductsByIds(validIds);
      
      // Filter out the current product from results
      return similarProducts.filter(product => product.id.toString() !== productId.toString());
    } catch (error: any) {
      console.error('Error fetching similar products:', error);
      // Return empty array instead of throwing error for similar products
      return [];
    }
  }

  /**
   * Get product pricing information only
   */
  async getProductPricing(id: string | number): Promise<any> {
    try {
      const response = await customApiClient.get('/products/getproduct.php', {
        params: { 
          id,
          form: 'pricing'
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch product pricing');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching product pricing:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch product pricing');
    }
  }

  /**
   * Get product inventory information only
   */
  async getProductInventory(id: string | number): Promise<any> {
    try {
      const response = await customApiClient.get('/products/getproduct.php', {
        params: { 
          id,
          form: 'inventory'
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch product inventory');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching product inventory:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch product inventory');
    }
  }

  /**
   * Get basic product information only
   */
  async getProductBasic(id: string | number): Promise<any> {
    try {
      const response = await customApiClient.get('/products/getproduct.php', {
        params: { 
          id,
          form: 'basic'
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch basic product info');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching basic product info:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch basic product info');
    }
  }

  /**
   * Get detailed product information
   */
  async getProductDetailed(id: string | number): Promise<any> {
    try {
      const response = await customApiClient.get('/products/getproduct.php', {
        params: { 
          id,
          form: 'detailed'
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch detailed product info');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching detailed product info:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch detailed product info');
    }
  }

  /**
   * Check product availability and stock
   */
  async checkProductAvailability(productId: string | number): Promise<{ available: boolean; stock: number }> {
    try {
      const product = await this.getProduct(productId, 'mobile');
      
      return {
        available: this.isProductInStock(product),
        stock: product.stock_reel
      };
    } catch (error: any) {
      console.error('Error checking product availability:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to check product availability');
    }
  }

  /**
   * Get product extrafields (array_options)
   */
  getProductExtrafields(product: EnhancedProduct): ProductArrayOptions {
    return product?.array_options || {
      options_marque: '',
      options_tags: '',
      options_similaire: '',
      options_ecommerceng_short_description_1: '',
      options_option_sante: '',
      options_gout: '',
      options_option_nutritionnel: '',
      options_ages: ''
    };
  }

  /**
   * Get product stock status text
   */
  getStockStatusText(product: EnhancedProduct): string {
    if (!product) return 'Statut inconnu';
    
    if (product.stock_reel > 0) {
      return `En stock (${product.stock_reel})`;
    } else if (product.stock_reel === 0) {
      return 'Rupture de stock';
    } else {
      return `Stock négatif (${product.stock_reel})`;
    }
  }

  /**
   * Get price without tax
   */
  getPriceHT(product: EnhancedProduct): string {
    if (!product || !product.price) return '0.00 DH';
    
    const priceHT = parseFloat(product.price);
    return `${priceHT.toFixed(2)} DH`;
  }

  /**
   * Calculate tax amount
   */
  getTaxAmount(product: EnhancedProduct): string {
    if (!product || !product.price_ttc || !product.tva_tx) return '0.00 DH';
    
    const priceTTC = parseFloat(product.price_ttc);
    const taxRate = parseFloat(product.tva_tx);
    const taxAmount = priceTTC * (taxRate / (100 + taxRate));
    
    return `${taxAmount.toFixed(2)} DH`;
  }

  /**
   * Format weight with unit
   */
  getFormattedWeight(product: EnhancedProduct): string {
    if (!product || !product.weight) return '';
    
    return `${product.weight} kg`;
  }

  /**
   * Get brand from array_options
   */
  getBrand(product: EnhancedProduct): string {
    return product?.array_options?.options_marque || product?.Marque || '';
  }

  /**
   * Get tags from array_options
   */
  getTags(product: EnhancedProduct): string[] {
    const tags = product?.array_options?.options_tags || product?.tag || '';
    return tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
  }

  /**
   * Check if product has similar products
   */
  hasSimilarProducts(product: EnhancedProduct): boolean {
    return !!(product?.similar_products_ids?.length > 0 || product?.array_options?.options_similaire);
  }
}

// Export singleton instance
export const customProductApiService = new CustomProductApiService();
export default customProductApiService;