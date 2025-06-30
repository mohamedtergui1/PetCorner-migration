// services/order.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, ToastAndroid } from 'react-native';
import apiClient from '../axiosInstance/AxiosInstance'; // Use existing API client
import Toast from 'react-native-simple-toast';
import {
  Order,
  OrderFilterParams,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse
} from '../types/order.types';

// Enhanced types for cart integration
interface CartProduct {
  id: number;
  label: string;
  price_ttc: string | number;
  photo_link: string;
  description: string;
  stock: number;
}

interface CartQuantities {
  [productId: number]: number;
}

interface CreateOrderRequest {
  products: CartProduct[];
  quantities: CartQuantities;
  address: string;
  city: string;
  zipCode: string;
  paymentMethod: string;
  cardDetails?: {
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
  };
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  deliveryCost: number;
}

interface CreateOrderResponse {
  success: boolean;
  orderId?: number;
  message?: string;
  error?: string;
}

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
   * Calculate total price from products and quantities (returns HT total)
   */
  private calculateTotal(products: CartProduct[], quantities: CartQuantities): number {
    return products.reduce((acc, item) => {
      const quantity = quantities[item.id] || 1;
      const priceTTC = parseFloat(item.price_ttc?.toString() || '0') || 0;
      // Since price_ttc already includes 20% VAT, calculate HT price
      const priceHT = priceTTC / 1.20; // Remove 20% VAT to get HT price
      const itemTotal = priceHT * quantity;
      return acc + itemTotal;
    }, 0);
  }

  /**
   * Show toast message based on platform
   */
  private showToast(message: string, isLong: boolean = false) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, isLong ? ToastAndroid.LONG : ToastAndroid.SHORT);
    } else {
      Toast.show(message, isLong ? Toast.LONG : Toast.SHORT);
    }
  }

  /**
   * Create a new order from cart data
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const userData = await this.getCurrentUser();
      const clientID = userData.id;

      if (!clientID) {
        throw new Error('User ID not found');
      }

      // Validate required fields
      if (!orderData.address || !orderData.city || !orderData.zipCode) {
        return {
          success: false,
          error: 'Adresse de livraison incomplète'
        };
      }

      if (!orderData.paymentMethod) {
        return {
          success: false,
          error: 'Mode de paiement requis'
        };
      }

      if (orderData.paymentMethod === 'credit_card' && !orderData.cardDetails) {
        return {
          success: false,
          error: 'Détails de carte bancaire requis'
        };
      }

      if (!orderData.products || orderData.products.length === 0) {
        return {
          success: false,
          error: 'Aucun produit dans le panier'
        };
      }

      // Calculate subtotal and total with proper tax breakdown
      let subtotalHT = 0;
      let subtotalTTC = 0;

      // Calculate both HT and TTC totals in one loop
      orderData.products.forEach(product => {
        const quantity = orderData.quantities[product.id] || 1;
        const priceTTC = parseFloat(product.price_ttc?.toString() || '0') || 0;
        // Correct VAT calculation: Price HT = Price TTC / (1 + VAT rate)
        // With 20% VAT: Price HT = Price TTC / 1.20
        const priceHT = priceTTC / 1.20;

        subtotalHT += priceHT * quantity;
        subtotalTTC += priceTTC * quantity;
      });

      const totalTax = subtotalTTC - subtotalHT; // Total tax amount
      const deliveryCost = orderData.deliveryCost || 0;
      const totalAmountTTC = subtotalTTC + deliveryCost;

      // Create order lines with proper tax calculation from TTC price
      const orderLines = orderData.products.map(product => {
        const quantity = orderData.quantities[product.id] || 1;
        const priceTTC = parseFloat(product.price_ttc?.toString() || '0') || 0;

        // Correct VAT calculation from TTC price
        // Formula: Price HT = Price TTC / (1 + VAT rate)
        // With 20% VAT: Price HT = Price TTC / 1.20
        const priceHT = Math.round((priceTTC / 1.20) * 100) / 100; // Round to 2 decimal places
        const taxAmount = Math.round((priceTTC - priceHT) * 100) / 100; // Tax amount per unit

        return {
          fk_product: product.id,
          qty: quantity,
          price: priceHT, // Send HT price to Dolibarr
          subprice: Math.round((priceHT * quantity) * 100) / 100, // Total HT for this line
          total_tva: Math.round((taxAmount * quantity) * 100) / 100, // Total tax for this line
          tva_tx: 20, // 20% VAT rate
        };
      });

      // Create comprehensive private note with all order information
      let privateNote = `Commande créée depuis l'application mobile\n`;
      privateNote += `Client ID: ${clientID}\n`;
      privateNote += `Date: ${new Date().toLocaleDateString('fr-FR')}\n`;
      privateNote += `Nombre d'articles: ${orderData.products.length}\n\n`;

      // Financial details
      privateNote += `--- DÉTAILS FINANCIERS ---\n`;
      privateNote += `Total HT: ${subtotalHT.toFixed(2)} DH\n`;
      privateNote += `Total TTC: ${subtotalTTC.toFixed(2)} DH\n`;
      privateNote += `TVA: ${totalTax.toFixed(2)} DH\n`;
      if (deliveryCost > 0) {
        privateNote += `Frais de livraison: ${deliveryCost.toFixed(2)} DH\n`;
      }
      privateNote += `Total final: ${totalAmountTTC.toFixed(2)} DH\n\n`;

      // Delivery details
      privateNote += `--- LIVRAISON ---\n`;
      privateNote += `Adresse: ${orderData.address}\n`;
      privateNote += `Ville: ${orderData.city}\n`;
      privateNote += `Code postal: ${orderData.zipCode}\n`;
      if (orderData.distance !== undefined && orderData.distance !== null) {
        privateNote += `Distance: ${orderData.distance.toFixed(1)}km\n`;
      }
      privateNote += `\n`;

      // Payment details
      privateNote += `--- PAIEMENT ---\n`;
      privateNote += `Mode: ${orderData.paymentMethod}\n`;
      if (orderData.paymentMethod === 'credit_card' && orderData.cardDetails) {
        privateNote += `Carte: ****${orderData.cardDetails.number.slice(-4)}\n`;
      } else if (orderData.paymentMethod === 'espèces') {
        privateNote += `Paiement en espèces à la livraison\n`;
      }

      // Prepare order data for your custom Dolibarr API
      // Based on your backend: { "socid": 2, "date": 1595196000, "type": 0, "lines": [{ "fk_product": 2, "qty": 1 }] }
      const dolibarrOrderData = {
        socid: clientID,
        date: Math.floor(Date.now() / 1000), // Unix timestamp as shown in your example
        type: 0,
        lines: orderLines.map(line => ({
          fk_product: line.fk_product,
          qty: line.qty,
          price: line.price, // HT price
          subprice: line.subprice, // Total HT for this line
          total_tva: line.total_tva, // Total tax for this line
          tva_tx: line.tva_tx // VAT rate (20%)
        })),
        // Only use private note with all comprehensive information
        note_private: privateNote
      };

      // Create the order
      const response = await apiClient.post('/orders', dolibarrOrderData);

      // Your backend returns "id :12345" format based on the code
      if (response.data) {
        let orderId;

        // Handle different response formats
        if (typeof response.data === 'string' && response.data.includes('id :')) {
          // Extract ID from "id :12345" format
          orderId = parseInt(response.data.split('id :')[1]);
        } else if (response.data.id) {
          // Standard ID field
          orderId = response.data.id;
        } else if (typeof response.data === 'number') {
          // Direct ID number
          orderId = response.data;
        }

        if (orderId) {
          return {
            success: true,
            orderId: orderId,
            message: 'Commande créée avec succès'
          };
        }
      }

      throw new Error('Invalid response from server');

    } catch (error) {
      console.error('Error creating order:', error);

      let errorMessage = 'Erreur lors de la création de la commande';

      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'Aucune réponse du serveur';
      } else {
        errorMessage = error.message || errorMessage;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Create order with UI integration (shows toasts and handles navigation)
   */
  async createOrderWithUI(
    orderData: CreateOrderRequest,
    clearCart: () => Promise<void>,
    navigation: any,
    setIsLoading?: (loading: boolean) => void
  ): Promise<void> {
    try {
      if (setIsLoading) {
        setIsLoading(true);
      }

      const result = await this.createOrder(orderData);

      if (result.success) {
        // Clear the cart
        await clearCart();

        // Show success message
        this.showToast('Les articles seront livrés BIENTÔT !', true);

        // Navigate to orders screen
        navigation.navigate('OrderScreen');

      } else {
        // Show error message
        Alert.alert('Erreur', result.error || 'Une erreur est survenue lors de la commande');
      }

    } catch (error) {
      console.error('Error in createOrderWithUI:', error);
      Alert.alert('Erreur', 'Une erreur inattendue est survenue');
    } finally {
      if (setIsLoading) {
        setIsLoading(false);
      }
    }
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
    await this.fetchAllOrdersWithState(setOrders, () => { }, setRefreshing);
  }
}

// Export singleton instance
export default new OrderService();