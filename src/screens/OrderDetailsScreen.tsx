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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
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
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [noteType, setNoteType] = useState<'delivery' | 'private' | 'cancellation'>('delivery');

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

  // Handle delivery with note
  const handleSetAsDelivered = () => {
    if (order.status === 3) {
      Alert.alert('Information', 'Cette commande est déjà marquée comme livrée.');
      return;
    }

    Alert.alert(
      'Marquer comme livrée',
      'Voulez-vous ajouter une note de livraison ?',
      [
        {
          text: 'Sans note',
          style: 'default',
          onPress: () => {
            OrderService.setOrderAsDeliveredWithConfirmation(
              order.id,
              order.ref,
              () => {
                // Refresh order data
                refreshOrderData();
              },
              (error) => {
                console.error('Error setting order as delivered:', error);
              }
            );
          },
        },
        {
          text: 'Avec note',
          style: 'default',
          onPress: () => {
            setNoteType('delivery');
            setNoteText('');
            setShowNoteModal(true);
          },
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  // Handle updating private note
  const handleUpdatePrivateNote = () => {
    setNoteType('private');
    setNoteText(order.note_private || '');
    setShowNoteModal(true);
  };

  // Handle submitting note
  const handleSubmitNote = () => {
    if (!noteText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une note.');
      return;
    }

    if (noteType === 'delivery') {
      // Add delivery note to private note, then mark as delivered
      const deliveryNote = `Livrée - ${noteText.trim()}`;
      
      OrderService.addNoteToOrderWithConfirmation(
        order.id,
        order.ref,
        deliveryNote,
        true, // isPrivate = true for private note
        () => {
          // After adding the note, mark as delivered
          OrderService.setOrderAsDeliveredWithConfirmation(
            order.id,
            order.ref,
            () => {
              setShowNoteModal(false);
              setNoteText('');
              refreshOrderData();
            },
            (error) => {
              console.error('Error setting order as delivered:', error);
            }
          );
        },
        (error) => {
          console.error('Error adding delivery note:', error);
        }
      );
    } else if (noteType === 'cancellation') {
      // First add the cancellation reason to private note, then cancel the order
      const cancellationNote = `Commande annulée - Raison: ${noteText.trim()}`;
      
      OrderService.addNoteToOrderWithConfirmation(
        order.id,
        order.ref,
        cancellationNote,
        true, // isPrivate = true for private note
        () => {
          // After adding the note, cancel the order
          OrderService.cancelOrderWithConfirmation(
            order.id,
            order.ref,
            noteText.trim(), // Pass the reason to the cancel function
            () => {
              setShowNoteModal(false);
              setNoteText('');
              refreshOrderData();
            },
            (error) => {
              console.error('Error cancelling order:', error);
            }
          );
        },
        (error) => {
          console.error('Error adding cancellation note:', error);
        }
      );
    } else if (noteType === 'private') {
      // Update private note
      OrderService.addNoteToOrderWithConfirmation(
        order.id,
        order.ref,
        noteText.trim(),
        true, // isPrivate = true for private note
        () => {
          setShowNoteModal(false);
          setNoteText('');
          refreshOrderData();
        },
        (error) => {
          console.error('Error updating private note:', error);
        }
      );
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

  // Handle status change
  const handleStatusChange = (newStatus: number, statusText: string) => {
    OrderService.updateOrderStatusWithConfirmation(
      order.id,
      order.ref,
      newStatus,
      statusText,
      () => {
        refreshOrderData();
      },
      (error) => {
        console.error('Error updating order status:', error);
      }
    );
  };

  // Handle cancel order
  const handleCancelOrder = () => {
    setNoteType('cancellation');
    setNoteText('');
    setShowNoteModal(true);
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

  // Render status action buttons based on current status
  const renderStatusActions = () => {
    const actions = [];
    
    // Get numeric status for comparison
    const currentStatus = typeof order.statut === 'string' ? parseInt(order.statut, 10) : (order.statut || order.status);

    switch (currentStatus) {
      case 0: // Draft - User can only cancel
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

      case 1: // Validated - User can mark as delivered
        actions.push(
          <TouchableOpacity
            key="deliver"
            style={[styles.actionButton, { backgroundColor: '#009688' }]}
            onPress={handleSetAsDelivered}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="truck-delivery" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Marquer comme livrée</Text>
          </TouchableOpacity>
        );
        break;

      case 2: // Processing - User can mark as delivered
        actions.push(
          <TouchableOpacity
            key="deliver"
            style={[styles.actionButton, { backgroundColor: '#009688' }]}
            onPress={handleSetAsDelivered}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="truck-delivery" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Marquer comme livrée</Text>
          </TouchableOpacity>
        );
        break;
    }

    // No general private note editing - only through cancel/delivery actions

    return actions;
  };

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

          {(order.note_private && order.note_private.trim().length > 0) && (
            <View style={[styles.noteContainer, { backgroundColor: isDarkMode ? '#252525' : '#f5f5f5' }]}>
              <View style={styles.noteSection}>
                <Text style={[styles.noteLabel, { color: TEXT_COLOR_SECONDARY }]}>Note privée:</Text>
                <Text style={[styles.noteText, { color: TEXT_COLOR }]}>{order.note_private}</Text>
              </View>
            </View>
          )}
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

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: CARD_BACKGROUND }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>
                {noteType === 'delivery' ? 'Note de livraison' : 
                 noteType === 'cancellation' ? 'Raison de l\'annulation' :
                 noteType === 'private' ? 
                 (order.note_private && order.note_private.trim().length > 0 ? 'Éditer note privée' : 'Ajouter note privée') :
                 'Note'}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
                onPress={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                }}
              >
                <Ionicons name="close" size={20} color={TEXT_COLOR_SECONDARY} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.noteInput, { 
                backgroundColor: isDarkMode ? '#252525' : '#f5f5f5',
                color: TEXT_COLOR,
                borderColor: BORDER_COLOR
              }]}
              placeholder={noteType === 'delivery' ? 'Détails de la livraison...' : 
                          noteType === 'cancellation' ? 'Raison de l\'annulation (obligatoire)...' :
                          noteType === 'private' ? 'Note privée pour votre usage...' :
                          'Note...'}
              placeholderTextColor={TEXT_COLOR_SECONDARY}
              multiline={true}
              numberOfLines={4}
              value={noteText}
              onChangeText={setNoteText}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { 
                  backgroundColor: isDarkMode ? '#2c2c2c' : '#ffffff',
                  borderColor: isDarkMode ? '#404040' : '#e0e0e0'
                }]}
                onPress={() => {
                  setShowNoteModal(false);
                  setNoteText('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: TEXT_COLOR }]}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { 
                  backgroundColor: noteType === 'cancellation' ? '#f44336' : PRIMARY_COLOR 
                }]}
                onPress={handleSubmitNote}
              >
                <Text style={styles.submitButtonText}>
                  {noteType === 'delivery' ? 'Livrer' : 
                   noteType === 'cancellation' ? 'Annuler la commande' :
                   noteType === 'private' ?
                   (order.note_private && order.note_private.trim().length > 0 ? 'Mettre à jour' : 'Ajouter') :
                   'Confirmer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  noteContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteSection: {
    marginBottom: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    paddingRight: 16,
  },
  noteInput: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrderDetailsScreen;