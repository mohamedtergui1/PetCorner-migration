// services/order.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import apiClient from '../axiosInstance/AxiosInstance'; // Use existing API client
import { 
  Order, 
  OrderFilterParams, 
  UpdateOrderStatusRequest, 
  UpdateOrderStatusResponse 
} from '../types/order.types';

class OrderService {
  
  private async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      return JSON.parse(userData);
    } catch (error) {
      throw new Error('Failed to get user data');
    }
  }

  /**
   * Normalize status value to number for consistent handling
   */
  private normalizeStatus(status: string | number): number {
    if (typeof status === 'string') {
      return parseInt(status, 10);
    }
    return status;
  }

  /**
   * Get the actual status from order (handles both statut and status fields)
   */
  private getOrderStatus(order: any): number {
    // Try statut first (French), then status (English)
    const status = order.statut || order.status;
    return this.normalizeStatus(status);
  }

  /**
   * Get all orders for the current user
   */
  async getAllOrders(): Promise<Order[]> {
    try {
      const userData = await this.getCurrentUser();
      if (!userData || !userData.id) {
        throw new Error('User ID not found');
      }

      const params: OrderFilterParams = {
        thirdparty_ids: userData.id,
        limit: 100,
        sortfield: 'date_commande',
        sortorder: 'DESC'
      };

      const response = await apiClient.get<Order[]>('/orders', { params });
      return response.data || [];

    } catch (error) {
      if (error.response?.status === 404) {
        return []; // No orders found
      }
      throw error;
    }
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Commande introuvable');
      }
      throw error;
    }
  }

  /**
   * Update order status - Fixed to use proper Dolibarr field names
   */
  async updateOrderStatus(
    orderId: number, 
    updateData: UpdateOrderStatusRequest
  ): Promise<UpdateOrderStatusResponse> {
    try {
      // Get current order to preserve existing notes
      const currentOrder = await this.getOrderById(orderId);
      
      // Use proper Dolibarr field names
      const dolibarrUpdateData: any = {};
      
      // Preserve existing notes
      if (currentOrder.note_private) {
        dolibarrUpdateData.note_private = currentOrder.note_private;
      }
      if (currentOrder.note_public) {
        dolibarrUpdateData.note_public = currentOrder.note_public;
      }
      
      // Add new data
      if (updateData.status !== undefined) {
        dolibarrUpdateData.statut = updateData.status.toString(); // Convert to string for Dolibarr
      }
      
      if (updateData.note_private) {
        dolibarrUpdateData.note_private = updateData.note_private;
      }
      
      if (updateData.note_public) {
        dolibarrUpdateData.note_public = updateData.note_public;
      }

      await apiClient.put(`/orders/${orderId}`, dolibarrUpdateData);

      return {
        success: true,
        message: 'Commande mise à jour avec succès'
      };

    } catch (error) {
      console.error(`Failed to update order ${orderId}:`, error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour'
      };
    }
  }

  /**
   * Add note to order - Fixed to preserve existing notes
   */
  async addOrderNote(orderId: number, note: string, isPrivate: boolean = true): Promise<UpdateOrderStatusResponse> {
    try {
      // Get current order
      const currentOrder = await this.getOrderById(orderId);
      
      const updateData: any = {};
      
      // Preserve existing notes
      if (currentOrder.note_private) {
        updateData.note_private = currentOrder.note_private;
      }
      if (currentOrder.note_public) {
        updateData.note_public = currentOrder.note_public;
      }
      
      // Add new note
      if (isPrivate) {
        updateData.note_private = note;
      } else {
        updateData.note_public = note;
      }

      await apiClient.put(`/orders/${orderId}`, updateData);

      return {
        success: true,
        message: `Note ${isPrivate ? 'privée' : 'publique'} ajoutée avec succès`
      };

    } catch (error) {
      return {
        success: false,
        error: `Impossible d'ajouter la note: ${error.message}`
      };
    }
  }

  /**
   * Set order as delivered
   */
  async setOrderAsDelivered(orderId: number, deliveryNote?: string): Promise<UpdateOrderStatusResponse> {
    const updateData: UpdateOrderStatusRequest = {
      status: 3, // Status 3 = Delivered
      note_private: deliveryNote ? `Delivery Note: ${deliveryNote}` : undefined,
    };

    return this.updateOrderStatus(orderId, updateData);
  }

  /**
   * Validate order (change status from draft to validated)
   */
  async validateOrder(orderId: number): Promise<UpdateOrderStatusResponse> {
    const updateData: UpdateOrderStatusRequest = {
      status: 1, // Status 1 = Validated
    };

    return this.updateOrderStatus(orderId, updateData);
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: number, cancelReason?: string): Promise<UpdateOrderStatusResponse> {
    const updateData: UpdateOrderStatusRequest = {
      status: -1, // Status -1 = Cancelled
      note_private: cancelReason ? `Cancellation Reason: ${cancelReason}` : undefined,
    };

    return this.updateOrderStatus(orderId, updateData);
  }

  /**
   * Set order to processing status
   */
  async setOrderToProcessing(orderId: number): Promise<UpdateOrderStatusResponse> {
    const updateData: UpdateOrderStatusRequest = {
      status: 2, // Status 2 = Processing
    };

    return this.updateOrderStatus(orderId, updateData);
  }

  // =============================================================================
  // UI Integration Methods
  // =============================================================================

  /**
   * Fetch all orders with loading state management
   */
  async fetchAllOrdersWithState(
    setOrders: (orders: Order[]) => void,
    setIsLoading: (loading: boolean) => void,
    setRefreshing?: (refreshing: boolean) => void
  ): Promise<void> {
    try {
      setIsLoading(true);
      const orders = await this.getAllOrders();
      setOrders(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      Alert.alert('Erreur', 'Impossible de récupérer les commandes');
    } finally {
      setIsLoading(false);
      if (setRefreshing) {
        setRefreshing(false);
      }
    }
  }

  /**
   * Fetch single order details with state management
   */
  async fetchOrderDetailsWithState(
    orderId: number,
    setOrder: (order: Order | null) => void,
    setIsLoading: (loading: boolean) => void
  ): Promise<void> {
    try {
      setIsLoading(true);
      const order = await this.getOrderById(orderId);
      setOrder(order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les détails de la commande');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Set order as delivered with confirmation dialog
   */
  async setOrderAsDeliveredWithConfirmation(
    orderId: number,
    orderRef: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    Alert.alert(
      'Confirmer la livraison',
      `Voulez-vous marquer la commande ${orderRef} comme livrée ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            try {
              const result = await this.setOrderAsDelivered(orderId);
              
              if (result.success) {
                Alert.alert('Succès', 'La commande a été marquée comme livrée');
                if (onSuccess) {
                  onSuccess();
                }
              } else {
                Alert.alert('Erreur', result.error || 'Une erreur est survenue');
                if (onError) {
                  onError(result.error || 'Erreur');
                }
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
              Alert.alert('Erreur', errorMessage);
              if (onError) {
                onError(errorMessage);
              }
            }
          },
        },
      ]
    );
  }

  /**
   * Set order as delivered with delivery note
   */
  async setOrderAsDeliveredWithNoteAndConfirmation(
    orderId: number,
    orderRef: string,
    deliveryNote: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      const result = await this.setOrderAsDelivered(orderId, deliveryNote);
      
      if (result.success) {
        Alert.alert('Succès', 'La commande a été marquée comme livrée avec la note de livraison');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue');
        if (onError) {
          onError(result.error || 'Erreur');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
      Alert.alert('Erreur', errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  }

  /**
   * Add note to order with confirmation
   */
  async addNoteToOrderWithConfirmation(
    orderId: number,
    orderRef: string,
    note: string,
    isPrivate: boolean = true,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      const result = await this.addOrderNote(orderId, note, isPrivate);
      
      if (result.success) {
        Alert.alert('Succès', 'La note a été ajoutée à la commande');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue');
        if (onError) {
          onError(result.error || 'Erreur');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
      Alert.alert('Erreur', errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  }

  /**
   * Update order status with confirmation dialog
   */
  async updateOrderStatusWithConfirmation(
    orderId: number,
    orderRef: string,
    newStatus: number,
    statusText: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    Alert.alert(
      'Confirmer le changement de statut',
      `Voulez-vous changer le statut de la commande ${orderRef} vers "${statusText}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            try {
              const result = await this.updateOrderStatus(orderId, { status: newStatus });
              
              if (result.success) {
                Alert.alert('Succès', `Le statut de la commande a été changé vers "${statusText}"`);
                if (onSuccess) {
                  onSuccess();
                }
              } else {
                Alert.alert('Erreur', result.error || 'Une erreur est survenue');
                if (onError) {
                  onError(result.error || 'Erreur');
                }
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
              Alert.alert('Erreur', errorMessage);
              if (onError) {
                onError(errorMessage);
              }
            }
          },
        },
      ]
    );
  }

  /**
   * Cancel order with confirmation and reason
   */
  async cancelOrderWithConfirmation(
    orderId: number,
    orderRef: string,
    cancelReason?: string,
    onSuccess?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    Alert.alert(
      'Confirmer l\'annulation',
      `Êtes-vous sûr de vouloir annuler la commande ${orderRef} ?`,
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await this.cancelOrder(orderId, cancelReason);
              
              if (result.success) {
                Alert.alert('Succès', 'La commande a été annulée');
                if (onSuccess) {
                  onSuccess();
                }
              } else {
                Alert.alert('Erreur', result.error || 'Une erreur est survenue');
                if (onError) {
                  onError(result.error || 'Erreur');
                }
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
              Alert.alert('Erreur', errorMessage);
              if (onError) {
                onError(errorMessage);
              }
            }
          },
        },
      ]
    );
  }

  /**
   * Refresh orders list
   */
  async refreshOrdersList(
    setOrders: (orders: Order[]) => void,
    setRefreshing: (refreshing: boolean) => void
  ): Promise<void> {
    setRefreshing(true);
    await this.fetchAllOrdersWithState(setOrders, () => {}, setRefreshing);
  }
}

// Export singleton instance
export default new OrderService();