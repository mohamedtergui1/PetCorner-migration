// screens/OrderScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  RefreshControl
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Order, OrderLine, OrderStatusInfo } from '../types/order.types';
import OrderService from '../service/order.service';
import { OrderUtils } from '../utils/order.utils';

interface OrderScreenProps {
  navigation: any; // Consider using proper navigation type from @react-navigation
}

const OrderScreen: React.FC<OrderScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode, colorTheme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Define theme colors
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  const BORDER_COLOR = isDarkMode ? '#333333' : '#e0e0e0';
  
  // Dark mode colors
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const ERROR_COLOR = '#f44336';

  // Enhanced price formatter for large numbers
  const formatPrice = useCallback((price: number | string): string => {
    const numPrice = parseFloat(price.toString());
    if (isNaN(numPrice)) return '0.00 dhs';
    
    // For large numbers, add spacing and better formatting
    if (numPrice >= 1000) {
      return `${numPrice.toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })} dhs`;
    }
    
    return `${numPrice.toFixed(2)} dhs`;
  }, []);

  // Memoized date formatters
  const formatDate = useCallback((timestamp: number): string => {
    const adjustedTimestamp = (timestamp + 43200) * 1000;
    const date = new Date(adjustedTimestamp);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }, []);

  const formatRelativeTime = useCallback((timestamp: number): string => {
    const adjustedTimestamp = (timestamp + 43200) * 1000;
    const now = Date.now();
    const diffMs = now - adjustedTimestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `il y a ${diffMinutes}min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `il y a ${diffDays}j`;
    return formatDate(timestamp);
  }, [formatDate]);

  // Memoized status info getter
  const getStatusInfo = useCallback((status: string | number): OrderStatusInfo => {
    const numericStatus = typeof status === 'string' ? parseInt(status, 10) : status;
    
    switch(numericStatus) {
      case 0: return { 
        text: 'Brouillon', 
        color: '#ff9800', 
        bgColor: isDarkMode ? 'rgba(255,152,0,0.2)' : 'rgba(255,152,0,0.1)' 
      };
      case 1: return { 
        text: 'Validée', 
        color: '#4caf50', 
        bgColor: isDarkMode ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.1)' 
      };
      case 2: return { 
        text: 'En traitement', 
        color: '#2196f3', 
        bgColor: isDarkMode ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.1)' 
      };
      case 3: return { 
        text: 'Livrée', 
        color: '#009688', 
        bgColor: isDarkMode ? 'rgba(0,150,136,0.2)' : 'rgba(0,150,136,0.1)' 
      };
      case -1: return { 
        text: 'Annulée', 
        color: '#f44336', 
        bgColor: isDarkMode ? 'rgba(244,67,54,0.2)' : 'rgba(244,67,54,0.1)' 
      };
      default: return { 
        text: 'Inconnu', 
        color: '#9e9e9e', 
        bgColor: isDarkMode ? 'rgba(158,158,158,0.2)' : 'rgba(158,158,158,0.1)' 
      };
    }
  }, [isDarkMode]);

  const canSetAsDelivered = useCallback((status: string | number): boolean => {
    const numericStatus = typeof status === 'string' ? parseInt(status, 10) : status;
    return numericStatus === 2;
  }, []);

  // Fetch orders with error handling
  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      await OrderService.fetchAllOrdersWithState(setOrders, setIsLoading);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const navigateToOrderDetails = useCallback((order: Order) => {
    navigation.navigate('OrderDetails', { order });
  }, [navigation]);

  const handleQuickDelivery = useCallback(async (order: Order) => {
    try {
      await OrderService.setOrderAsDeliveredWithConfirmation(
        order.id,
        order.ref,
        () => fetchOrders(),
        (error: string) => {
          console.error('Failed to mark order as delivered:', error);
          setError('Failed to update order status.');
        }
      );
    } catch (err) {
      console.error('Error in quick delivery:', err);
      setError('An error occurred while processing your request.');
    }
  }, [fetchOrders]);

  // Memoized order item component
  const OrderItem = React.memo(({ item }: { item: Order }) => {
    const orderStatus = item.statut || item.status;
    const statusInfo = getStatusInfo(orderStatus);
    
    return (
      <TouchableOpacity 
        style={[styles.orderCard, { 
          backgroundColor: CARD_BACKGROUND,
          borderColor: BORDER_COLOR,
        }]}
        onPress={() => navigateToOrderDetails(item)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`Order ${item.ref}, status ${statusInfo.text}`}
        accessibilityRole="button"
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <MaterialCommunityIcons 
              name="shopping-outline" 
              size={18} 
              color={PRIMARY_COLOR}
              style={styles.orderIcon}
            />
            <Text style={[styles.orderNumberLabel, { color: TEXT_COLOR_SECONDARY }]}>
              Commande N°
            </Text>
            <Text style={[styles.orderNumber, { color: TEXT_COLOR }]}>
              {item.ref}
            </Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: statusInfo.bgColor,
            borderColor: statusInfo.color,
          }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons 
              name="calendar-clock" 
              size={16} 
              color={TEXT_COLOR_SECONDARY}
            />
            <Text style={[styles.date, { color: TEXT_COLOR_SECONDARY }]}>
              {formatDate(item.date_commande)}
            </Text>
            <Text style={[styles.relativeTime, { color: TEXT_COLOR_SECONDARY }]}>
              • {formatRelativeTime(item.date_commande)}
            </Text>
          </View>

          <View style={styles.itemsContainer}>
            {item.lines.slice(0, 2).map((line: OrderLine, index: number) => (
              <View key={`${item.id}-${line.id}`} style={[
                styles.productItem,
                { borderBottomColor: index === 0 && item.lines.length > 1 ? BORDER_COLOR : 'transparent' }
              ]}>
                <View style={[styles.imageContainer, { 
                  borderColor: BORDER_COLOR, 
                  backgroundColor: isDarkMode ? '#252525' : '#f5f5f5' 
                }]}>
                  {line.photo_link ? (
                    <Image 
                      source={{ uri: line.photo_link }} 
                      style={styles.image}
                      resizeMode="contain"
                      accessibilityIgnoresInvertColors={true}
                    />
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Ionicons name="image-outline" size={24} color={TEXT_COLOR_SECONDARY} />
                    </View>
                  )}
                </View>
                <View style={styles.productDetails}>
                  <Text 
                    style={[styles.productName, { color: TEXT_COLOR }]}
                    numberOfLines={2}
                  >
                    {line.libelle}
                  </Text>
                  <View style={styles.productMeta}>
                    <View style={[styles.quantityBadge, { 
                      backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' 
                    }]}>
                      <Text style={[styles.quantity, { color: TEXT_COLOR_SECONDARY }]}>
                        {`Qté: ${line.qty}`}
                      </Text>
                    </View>
                    <Text style={[styles.price, { color: PRIMARY_COLOR }]}>
                      {formatPrice(line.subprice)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            
            {item.lines.length > 2 && (
              <View style={[styles.moreItemsContainer, { 
                backgroundColor: isDarkMode ? '#252525' : '#f5f5f5' 
              }]}>
                <Text style={[styles.moreItems, { color: TEXT_COLOR_SECONDARY }]}>
                  + {item.lines.length - 2} autres articles
                </Text>
                <Ionicons name="chevron-forward" size={16} color={TEXT_COLOR_SECONDARY} />
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: BORDER_COLOR }]} />

          <View style={styles.orderFooter}>
            <Text style={[styles.totalLabel, { color: TEXT_COLOR_SECONDARY }]}>
              Total:
            </Text>
            <View style={[styles.totalContainer, { backgroundColor: PRIMARY_COLOR + '15' }]}>
              <Text style={[styles.totalAmount, { color: PRIMARY_COLOR }]}>
                {formatPrice(item.total_ttc)}
              </Text>
            </View>
          </View>

          {canSetAsDelivered(orderStatus) && (
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#009688' }]}
                onPress={() => handleQuickDelivery(item)}
                activeOpacity={0.8}
                accessibilityLabel="Mark as delivered"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="truck-delivery" size={16} color="#fff" />
                <Text style={styles.quickActionText}>Livrer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  });

  // Memoized filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return orders.sort((a, b) => {
      const dateA = typeof a.date_commande === 'number' ? a.date_commande : parseInt(a.date_commande, 10);
      const dateB = typeof b.date_commande === 'number' ? b.date_commande : parseInt(b.date_commande, 10);
      return dateB - dateA;
    });
  }, [orders]);

  const filterOrdersByStatus = useCallback((targetStatus: number): Order[] => {
    return orders.filter(order => {
      const orderStatus = order.statut || order.status;
      const numericStatus = typeof orderStatus === 'string' ? parseInt(orderStatus, 10) : orderStatus;
      return numericStatus === targetStatus;
    });
  }, [orders]);

  const calculateOrderSummary = useCallback((): { totalAmount: number } => {
    const totalAmount = orders.reduce((sum, order) => {
      const total = parseFloat(order.total_ttc.toString());
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    return { totalAmount };
  }, [orders]);

  const renderEmptyState = () => (
    <View style={styles.centerContent}>
      <View style={[styles.emptyIconContainer, { backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' }]}>
        <Ionicons 
          name="bag-outline" 
          size={60} 
          color={PRIMARY_COLOR} 
        />
      </View>
      <Text style={[styles.emptyTitle, { color: TEXT_COLOR }]}>
        Aucune commande
      </Text>
      <Text style={[styles.emptySubtitle, { color: TEXT_COLOR_SECONDARY }]}>
        Vous n'avez pas encore passé de commande
      </Text>
      <TouchableOpacity 
        style={[styles.shopButton, { backgroundColor: PRIMARY_COLOR }]}
        onPress={() => navigation.navigate('ProductsScreen')}
        activeOpacity={0.8}
        accessibilityLabel="Start shopping"
        accessibilityRole="button"
      >
        <Ionicons name="cart-outline" size={18} color="#fff" style={styles.shopButtonIcon} />
        <Text style={styles.shopButtonText}>
          Commencer vos achats
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      <Text style={[styles.messageText, { color: TEXT_COLOR_SECONDARY }]}>
        Chargement de vos commandes...
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContent}>
      <Ionicons name="warning-outline" size={60} color={ERROR_COLOR} />
      <Text style={[styles.emptyTitle, { color: ERROR_COLOR }]}>
        Erreur de chargement
      </Text>
      <Text style={[styles.emptySubtitle, { color: TEXT_COLOR_SECONDARY }]}>
        {error}
      </Text>
      <TouchableOpacity 
        style={[styles.shopButton, { backgroundColor: PRIMARY_COLOR }]}
        onPress={fetchOrders}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={18} color="#fff" style={styles.shopButtonIcon} />
        <Text style={styles.shopButtonText}>
          Réessayer
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'} 
      />
      
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes commandes</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleManualRefresh}
          accessibilityLabel="Refresh orders"
          accessibilityRole="button"
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Orders Summary */}
      {!isLoading && orders.length > 0 && (
        <View style={[styles.summaryContainer, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: PRIMARY_COLOR }]}>
              {orders.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: TEXT_COLOR_SECONDARY }]}>
              Commandes
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: BORDER_COLOR }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: PRIMARY_COLOR }]}>
              {filterOrdersByStatus(3).length}
            </Text>
            <Text style={[styles.summaryLabel, { color: TEXT_COLOR_SECONDARY }]}>
              Livrées
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: BORDER_COLOR }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: PRIMARY_COLOR }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatPrice(calculateOrderSummary().totalAmount)}
            </Text>
            <Text style={[styles.summaryLabel, { color: TEXT_COLOR_SECONDARY }]}>
              Total
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {error ? (
        renderErrorState()
      ) : isLoading ? (
        renderLoadingState()
      ) : orders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={({ item }) => <OrderItem item={item} />}
          keyExtractor={(item: Order) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[PRIMARY_COLOR]}
              tintColor={PRIMARY_COLOR}
              title="Pull to refresh"
              titleColor={TEXT_COLOR_SECONDARY}
            />
          }
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={21}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Increased padding to avoid tab menu overlap
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  messageText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 22,
  },
  shopButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  shopButtonIcon: {
    marginRight: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  orderCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIcon: {
    marginRight: 6,
  },
  orderNumberLabel: {
    fontSize: 14,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  date: {
    fontSize: 13,
    marginLeft: 6,
  },
  relativeTime: {
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  itemsContainer: {
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 20,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantity: {
    fontSize: 13,
    fontWeight: '500',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  moreItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  moreItems: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default OrderScreen;