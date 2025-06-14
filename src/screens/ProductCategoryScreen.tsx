import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Image, 
  SafeAreaView, 
  StyleSheet,
  Text, 
  TouchableOpacity, 
  View,
  StatusBar,
  Alert,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ImageSourcePropType,
  ListRenderItemInfo
} from 'react-native';
import { COLOURS, filterData } from '../database/Database';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import ProductCard2, { ProductCard2Props } from '../components/Product/ProductCard2';
import ProductService from '../service/CustomProductApiService';

// Type definitions
interface Product {
  id: string;
  image_link?: string | null;
  photo_link?: string | null;
  [key: string]: any;
}

interface Category {
  id: string;
  name: string;
  image?: ImageSourcePropType;
}

interface ProductCategoryScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params: { productId: string; product: Product }) => void;
  };
  route: {
    params?: {
      categoryId?: string;
    };
  };
}

interface PaginationResponse {
  data: Product[];
  pagination?: {
    total: number;
    page: number;
    page_count: number;
  };
}

interface FilterParams {
  limit: number;
  page: number;
  category: number;
  sortfield: string;
  sortorder: string;
}

// Style type definitions
interface Styles {
  container: StyleProp<ViewStyle>;
  header: StyleProp<ViewStyle>;
  backButton: StyleProp<ViewStyle>;
  headerTitle: StyleProp<TextStyle>;
  headerRightPlaceholder: StyleProp<ViewStyle>;
  categoriesContainer: StyleProp<ViewStyle>;
  categoriesListContent: StyleProp<ViewStyle>;
  categoryButton: StyleProp<ViewStyle>;
  categoryCard: StyleProp<ViewStyle>;
  categoryImageWrapper: StyleProp<ViewStyle>;
  categoryImage: StyleProp<ImageStyle>;
  categoryText: StyleProp<TextStyle>;
  categoryBadge: StyleProp<ViewStyle>;
  categoryName: StyleProp<TextStyle>;
  countBadge: StyleProp<ViewStyle>;
  countText: StyleProp<TextStyle>;
  loadingContainer: StyleProp<ViewStyle>;
  loadingText: StyleProp<TextStyle>;
  loadingFooter: StyleProp<ViewStyle>;
  loadingFooterText: StyleProp<TextStyle>;
  emptyContainer: StyleProp<ViewStyle>;
  emptyIcon: StyleProp<ViewStyle>;
  emptyTitle: StyleProp<TextStyle>;
  emptySubtitle: StyleProp<TextStyle>;
  productRow: StyleProp<ViewStyle>;
  productsListContent: StyleProp<ViewStyle>;
  productContainer: StyleProp<ViewStyle>;
}

const ProductCategoryScreen: React.FC<ProductCategoryScreenProps> = ({ navigation, route }) => {
  // Theme colors with explicit types
  const { isDarkMode, colorTheme } = useTheme();
  const PRIMARY_COLOR: string = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR: string = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BACKGROUND_COLOR: string = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND: string = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR: string = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY: string = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR: string = isDarkMode ? '#2c2c2c' : '#e0e0e0';

  // State management with explicit types
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    route.params?.categoryId || filterData[0]?.id || "2"
  );
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [failedImageLoads, setFailedImageLoads] = useState<Set<string>>(new Set());
  const PAGE_SIZE: number = 10;
  const isLoadingRef = useRef<boolean>(false);

  // Fixed loadProducts function - removed currentPage from dependency array
  const loadProducts = useCallback(async (categoryId: string, resetPagination: boolean = true): Promise<void> => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      if (resetPagination) {
        setLoading(true);
        setCurrentPage(0);
        setFailedImageLoads(new Set());
      } else {
        setLoadingMore(true);
      }

      const pageToLoad: number = resetPagination ? 0 : currentPage;
      const selectedCategory: Category | undefined = filterData.find(
        (cat: Category) => cat.id === categoryId
      );

      const params: FilterParams = {
        limit: PAGE_SIZE,
        page: pageToLoad,
        category: parseInt(categoryId),
        sortfield: 'datec',
        sortorder: 'DESC'
      };

      const result: Product[] | PaginationResponse = await ProductService.getFilteredProducts(params);
      
      const newProducts: Product[] = Array.isArray(result) ? result : (result.data || []);
      const total: number = Array.isArray(result) 
        ? newProducts.length 
        : (result.pagination?.total || newProducts.length);

      if (resetPagination) {
        setProducts(newProducts);
      } else {
        setProducts((prev: Product[]) => [...prev, ...newProducts]);
      }
      setTotalProducts(total);
      setCategoryName(selectedCategory?.name || '');
      setCurrentPage(pageToLoad + 1);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, []); // Empty dependency array to prevent unnecessary re-renders

  // Effect for initial load and category changes
  useEffect(() => {
    loadProducts(selectedCategoryId, true);
  }, [selectedCategoryId]); // Only depend on selectedCategoryId

  // Separate function for loading more products
  const loadMoreProducts = useCallback((): void => {
    if (!loadingMore && products.length < totalProducts && !isLoadingRef.current) {
      loadProducts(selectedCategoryId, false);
    }
  }, [loadingMore, products.length, totalProducts, selectedCategoryId, loadProducts]);

  // Fixed category selection handler
  const handleCategorySelect = useCallback((categoryId: string): void => {
    if (selectedCategoryId !== categoryId) {
      // Reset loading states immediately
      setLoading(true);
      setProducts([]);
      setTotalProducts(0);
      setCurrentPage(0);
      setFailedImageLoads(new Set());
      
      // Update selected category
      setSelectedCategoryId(categoryId);
    }
  }, [selectedCategoryId]);

  const handleImageError = useCallback((productId: string): void => {
    setFailedImageLoads((prev: Set<string>) => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });
  }, []);

  const renderProduct = useCallback(({ item }: ListRenderItemInfo<Product>): JSX.Element => {
    const hasImageFailed: boolean = failedImageLoads.has(item.id);
    const productCardProps: ProductCard2Props = {
      navigation,
      product: {
        ...item,
        image_link: hasImageFailed ? null : item.image_link,
        photo_link: hasImageFailed ? null : item.photo_link
      },
      onPress: () => navigation.navigate('ProductDetails', { 
        productId: item.id, 
        product: item 
      }),
      viewMode: "grid",
      isDarkMode,
      colorTheme,
      onImageError: () => handleImageError(item.id)
    };
    
    return (
      <View style={styles.productContainer}>
        <ProductCard2 {...productCardProps} />
      </View>
    );
  }, [navigation, isDarkMode, colorTheme, failedImageLoads, handleImageError]);

  const renderCategoryItem = useCallback(({ item }: ListRenderItemInfo<Category>): JSX.Element => {
    const isSelected: boolean = selectedCategoryId === item.id;
    const cardStyle: StyleProp<ViewStyle> = [
      styles.categoryCard,
      {
        backgroundColor: isSelected 
          ? PRIMARY_COLOR 
          : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#f0f0f0')
      }
    ];
    
    const imageWrapperStyle: StyleProp<ViewStyle> = [
      styles.categoryImageWrapper,
      {
        backgroundColor: isSelected 
          ? 'rgba(255,255,255,0.15)' 
          : (isDarkMode ? '#333' : '#e0e0e0')
      }
    ];

    const textStyle: StyleProp<TextStyle> = [
      styles.categoryText,
      { 
        color: isSelected ? '#ffffff' : TEXT_COLOR_SECONDARY,
        fontWeight: isSelected ? '600' : '500'
      }
    ];

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleCategorySelect(item.id)}
        style={styles.categoryButton}
      >
        <View style={cardStyle}>
          <View style={imageWrapperStyle}>
            {item.image ? (
              <Image source={item.image} style={styles.categoryImage} />
            ) : (
              <Ionicons 
                name="paw-outline" 
                size={30} 
                color={isSelected ? '#ffffff' : PRIMARY_COLOR} 
              />
            )}
          </View>
          <Text style={textStyle} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [selectedCategoryId, isDarkMode, PRIMARY_COLOR, TEXT_COLOR_SECONDARY, handleCategorySelect]);

  // Main render with typed styles
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'} 
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Catégories</Text>
        
        <View style={styles.headerRightPlaceholder} />
      </View>
      
      {/* Categories Filter */}
      <View style={[styles.categoriesContainer, { 
        backgroundColor: CARD_BACKGROUND,
        borderColor: BORDER_COLOR
      }]}>
        <FlatList<Category>
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterData}
          keyExtractor={(item: Category) => `cat-${item.id}`}
          renderItem={renderCategoryItem}
          extraData={selectedCategoryId}
          contentContainerStyle={styles.categoriesListContent}
        />
      </View>
      
      {/* Category info */}
      {categoryName && (
        <View style={[styles.categoryBadge, { backgroundColor: `${PRIMARY_COLOR}15` }]}>
          <MaterialCommunityIcons 
            name="tag-outline" 
            size={18} 
            color={PRIMARY_COLOR}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.categoryName, { color: TEXT_COLOR }]}>
            {categoryName}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: PRIMARY_COLOR }]}>
            <Text style={styles.countText}>
              {totalProducts}
            </Text>
          </View>
        </View>
      )}
      
      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: TEXT_COLOR_SECONDARY }]}>
            Chargement en cours...
          </Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' }]}>
            <Feather name="package" size={60} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.emptyTitle, { color: TEXT_COLOR }]}>
            Aucun produit
          </Text>
          <Text style={[styles.emptySubtitle, { color: TEXT_COLOR_SECONDARY }]}>
            Aucun produit disponible dans cette catégorie
          </Text>
        </View>
      ) : (
        <FlatList<Product>
          data={products}
          keyExtractor={(item: Product) => `product-${item.id}`}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productsListContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                <Text style={[styles.loadingFooterText, { color: TEXT_COLOR_SECONDARY }]}>
                  Chargement des produits supplémentaires...
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

// Styles with TypeScript types
const styles: Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  categoriesContainer: {
    margin: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoriesListContent: {
    paddingHorizontal: 8,
  },
  categoryButton: {
    marginHorizontal: 5,
    marginVertical: 8,
  },
  categoryCard: {
    width: 90,
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  categoryText: {
    fontSize: 12,
    textAlign: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingFooterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 22,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  productContainer: {
    flex: 1,
    maxWidth: '50%',
    paddingHorizontal: 8,
  },
});

export default ProductCategoryScreen;