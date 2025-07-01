// screens/OrderDetailsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { Order, OrderLine, OrderStatusInfo } from '../types/order.types';
import OrderService from '../service/order.service';

interface OrderDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      order: Order;
    };
  };
}

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ navigation, route }) => {
  const { theme, isDarkMode, colorTheme } = useTheme();
  const [order, setOrder] = useState<Order>(route.params.order);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Define theme colors
  const PRIMARY_COLOR = colorTheme === 'blue' ? '#007afe' : '#fe9400';
  const SECONDARY_COLOR = colorTheme === 'blue' ? '#fe9400' : '#007afe';
  
  // Dark mode colors
  const BACKGROUND_COLOR = isDarkMode ? '#121212' : '#f8f8f8';
  const CARD_BACKGROUND = isDarkMode ? '#1e1e1e' : '#ffffff';
  const TEXT_COLOR = isDarkMode ? '#ffffff' : '#000000';
  const TEXT_COLOR_SECONDARY = isDarkMode ? '#b3b3b3' : '#666666';
  const BORDER_COLOR = isDarkMode ? '#2c2c2c' : '#e0e0e0';

  // Format price to show 2 decimal places
  const formatPrice = (price: number): string => {
    return parseFloat(price.toString()).toFixed(2);
  };

  // Format timestamp to readable date only (without time)
  const formatDate = (timestamp: number): string => {
    // Add 12 hours (43200 seconds) to server timestamp for timezone adjustment
    const adjustedTimestamp = (timestamp + 43200) * 1000;
    const date = new Date(adjustedTimestamp);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Get status text and color based on order status
  const getStatusInfo = (status: string | number): OrderStatusInfo => {
    // Convert string status to number for consistent handling
    const numericStatus = typeof status === 'string' ? parseInt(status, 10) : status;
    
    switch(numericStatus) {
      case 0:
        return { 
          text: 'Brouillon', 
          color: '#ff9800', 
          bgColor: isDarkMode ? 'rgba(255,152,0,0.2)' : 'rgba(255,152,0,0.1)' 
        };
      case 1:
        return { 
          text: 'Validée', 
          color: '#4caf50', 
          bgColor: isDarkMode ? 'rgba(76,175,80,0.2)' : 'rgba(76,175,80,0.1)' 
        };
      case 2:
        return { 
          text: 'En traitement', 
          color: '#2196f3', 
          bgColor: isDarkMode ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.1)' 
        };
      case 3:
        return { 
          text: 'Livrée', 
          color: '#009688', 
          bgColor: isDarkMode ? 'rgba(0,150,136,0.2)' : 'rgba(0,150,136,0.1)' 
        };
      case -1:
        return { 
          text: 'Annulée', 
          color: '#f44336', 
          bgColor: isDarkMode ? 'rgba(244,67,54,0.2)' : 'rgba(244,67,54,0.1)' 
        };
      default:
        return { 
          text: 'Inconnu', 
          color: '#9e9e9e', 
          bgColor: isDarkMode ? 'rgba(158,158,158,0.2)' : 'rgba(158,158,158,0.1)' 
        };
    }
  };

  // Refresh order data
  const refreshOrderData = () => {
    OrderService.fetchOrderDetailsWithState(
      order.id,
      (updatedOrder) => {
        if (updatedOrder) {
          setOrder(updatedOrder);
        }
      },
      setIsLoading
    );
  };

  // Handle cancel order - Only available for draft orders
  const handleCancelOrder = () => {
    console.log('🚫 Cancel order button pressed for order:', order.ref);
    
    OrderService.cancelOrderWithConfirmation(
      order.id,
      order.ref,
      undefined, // No predefined cancellation reason
      () => {
        console.log('✅ Order cancelled successfully, refreshing data...');
        refreshOrderData(); // Refresh order data on success
      },
      (error) => {
        console.error('❌ Error cancelling order:', error);
      }
    );
  };

  // Handle adding feedback to delivered order
  const handleAddDeliveryFeedback = () => {
    console.log('💬 Add delivery feedback button pressed for order:', order.ref);
    
    Alert.prompt(
      'Ajouter un commentaire',
      `Comment s'est passée la livraison de votre commande ${order.ref} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Ajouter le commentaire',
          style: 'default',
          onPress: async (feedback) => {
            if (feedback && feedback.trim()) {
              try {
                const result = await OrderService.addOrderNote(
                  order.id, 
                  `Commentaire de livraison ajouté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}:\n${feedback.trim()}`, 
                  false // false = public note
                );
                
                if (result.success) {
                  Alert.alert('Succès', 'Votre commentaire a été ajouté avec succès');
                  refreshOrderData(); // Refresh to show updated notes
                } else {
                  Alert.alert('Erreur', result.error || 'Erreur lors de l\'ajout du commentaire');
                }
              } catch (error) {
                console.error('❌ Error adding delivery feedback:', error);
                Alert.alert('Erreur', 'Une erreur inattendue est survenue');
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  // Render status action buttons - FIXED: Only cancel in draft, only feedback in delivered
  const renderStatusActions = () => {
    const actions = [];
    
    // Get numeric status for comparison
    const currentStatus = typeof order.statut === 'string' ? parseInt(order.statut, 10) : (order.statut || order.status);

    console.log('🎯 Rendering actions for order status:', currentStatus);

    switch (currentStatus) {
      case 0: // Draft - User can ONLY cancel
        console.log('📝 Draft order - showing cancel button');
        actions.push(
          <TouchableOpacity
            key="cancel"
            style={[styles.actionButton, styles.cancelActionButton, { backgroundColor: '#f44336' }]}
            onPress={handleCancelOrder}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cancel" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Annuler la commande</Text>
          </TouchableOpacity>
        );
        break;

      case 1: // Validated - No actions for users
        console.log('✅ Validated order - no user actions available');
        break;

      case 2: // Processing - No actions for users
        console.log('⚙️ Processing order - no user actions available');
        break;

      case 3: // Delivered - Can ONLY add feedback
        console.log('📦 Delivered order - showing feedback button');
        actions.push(
          <TouchableOpacity
            key="feedback"
            style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
            onPress={handleAddDeliveryFeedback}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="comment-plus" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Ajouter un commentaire</Text>
          </TouchableOpacity>
        );
        break;

      case -1: // Cancelled - No actions available
        console.log('❌ Cancelled order - no actions available');
        break;

      default: // Unknown status - No actions available
        console.log('❓ Unknown order status - no actions available');
        break;
    }

    console.log('🎬 Total actions rendered:', actions.length);
    return actions;
  };

  // Render product item
  const renderProductItem = (line: OrderLine, index: number) => (
    <View key={`${order.id}-${line.id}-${index}`} style={[
      styles.productItem,
      { 
        backgroundColor: CARD_BACKGROUND,
        borderColor: BORDER_COLOR,
      }
    ]}>
      <View style={[styles.imageContainer, { 
        borderColor: BORDER_COLOR, 
        backgroundColor: isDarkMode ? '#252525' : '#f5f5f5' 
      }]}>
        {line.photo_link ? (
          <Image 
            source={{ uri: line.photo_link }} 
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={32} color={TEXT_COLOR_SECONDARY} />
          </View>
        )}
      </View>
      
      <View style={styles.productDetails}>
        <Text style={[styles.productName, { color: TEXT_COLOR }]}>
          {line.libelle}
        </Text>
        
        {line.desc && (
          <Text style={[styles.productDescription, { color: TEXT_COLOR_SECONDARY }]} numberOfLines={2}>
            {line.desc}
          </Text>
        )}
        
        <View style={styles.productMeta}>
          <View style={styles.quantityPriceContainer}>
            <View style={[styles.quantityBadge, { backgroundColor: isDarkMode ? '#252525' : '#f0f0f0' }]}>
              <Text style={[styles.quantity, { color: TEXT_COLOR_SECONDARY }]}>
                Qté: {line.qty}
              </Text>
            </View>
            <Text style={[styles.unitPrice, { color: TEXT_COLOR_SECONDARY }]}>
              {formatPrice(line.subprice)} dhs/unité
            </Text>
          </View>
          <Text style={[styles.totalLinePrice, { color: PRIMARY_COLOR }]}>
            {formatPrice(line.subprice * line.qty)} dhs
          </Text>
        </View>
      </View>
    </View>
  );

  const statusInfo = getStatusInfo(order.statut || order.status);

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
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la commande</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshOrderData}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons 
              name="refresh" 
              size={24} 
              color="#fff" 
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Header Card */}
        <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
          <View style={styles.orderHeaderSection}>
            <View style={styles.orderRefContainer}>
              <MaterialCommunityIcons 
                name="shopping-outline" 
                size={24} 
                color={PRIMARY_COLOR}
              />
              <Text style={[styles.orderRef, { color: TEXT_COLOR }]}>
                Commande {order.ref}
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

          <View style={styles.orderInfoRow}>
            <MaterialCommunityIcons 
              name="calendar" 
              size={18} 
              color={TEXT_COLOR_SECONDARY}
            />
            <Text style={[styles.orderDate, { color: TEXT_COLOR_SECONDARY }]}>
              Commandé le {formatDate(order.date_commande)}
            </Text>
          </View>
        </View>

        {/* Products List */}
        <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
          <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
            Articles commandés ({order.lines.length})
          </Text>
          
          {order.lines.map((line, index) => renderProductItem(line, index))}
        </View>

        {/* Order Summary */}
        <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
          <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
            Résumé de la commande
          </Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: TEXT_COLOR_SECONDARY }]}>
              Sous-total HT:
            </Text>
            <Text style={[styles.summaryValue, { color: TEXT_COLOR }]}>
              {formatPrice(order.total_ht)} dhs
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: TEXT_COLOR_SECONDARY }]}>
              TVA:
            </Text>
            <Text style={[styles.summaryValue, { color: TEXT_COLOR }]}>
              {formatPrice(order.total_tva)} dhs
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: BORDER_COLOR }]} />
          
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: TEXT_COLOR }]}>
              Total TTC:
            </Text>
            <Text style={[styles.totalValue, { color: PRIMARY_COLOR }]}>
              {formatPrice(order.total_ttc)} dhs
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {renderStatusActions().length > 0 && (
          <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
            <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
              Actions
            </Text>
            
            {renderStatusActions()}
          </View>
        )}
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  orderHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderRefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderRef: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
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
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
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
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  productDescription: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  quantityPriceContainer: {
    flex: 1,
  },
  quantityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  quantity: {
    fontSize: 12,
    fontWeight: '500',
  },
  unitPrice: {
    fontSize: 12,
  },
  totalLinePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelActionButton: {
    marginTop: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrderDetailsScreen;