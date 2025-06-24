// utils/order.utils.ts

import { Order, OrderStatusInfo } from '../types/order.types';

export class OrderUtils {
  /**
   * Format price to show 2 decimal places with currency
   */
  static formatPrice(price: number, currency: string = 'dhs'): string {
    return `${parseFloat(price.toString()).toFixed(2)} ${currency}`;
  }

  /**
   * Format timestamp to readable date
   */
  static formatDate(timestamp: number, includeTime: boolean = false): string {
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} à ${hours}:${minutes}`;
    }
    
    return `${day}-${month}-${year}`;
  }

  /**
   * Format date to relative time (e.g., "il y a 2 jours")
   */
  static formatRelativeTime(timestamp: number): string {
    const now = new Date().getTime();
    const orderDate = new Date(timestamp * 1000).getTime();
    const diffInMs = now - orderDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return diffInDays === 1 ? 'il y a 1 jour' : `il y a ${diffInDays} jours`;
    } else if (diffInHours > 0) {
      return diffInHours === 1 ? 'il y a 1 heure' : `il y a ${diffInHours} heures`;
    } else if (diffInMinutes > 0) {
      return diffInMinutes === 1 ? 'il y a 1 minute' : `il y a ${diffInMinutes} minutes`;
    } else {
      return 'à l\'instant';
    }
  }

  /**
   * Get status information with text, color and background color
   */
  static getStatusInfo(status: number, isDarkMode: boolean = false): OrderStatusInfo {
    switch(status) {
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
  }

  /**
   * Get available status transitions for an order
   */
  static getAvailableStatusTransitions(currentStatus: number): Array<{ status: number; text: string; action: string }> {
    const transitions: Array<{ status: number; text: string; action: string }> = [];

    switch(currentStatus) {
      case 0: // Draft
        transitions.push(
          { status: 1, text: 'Validée', action: 'Valider la commande' },
          { status: -1, text: 'Annulée', action: 'Annuler la commande' }
        );
        break;
      case 1: // Validated
        transitions.push(
          { status: 2, text: 'En traitement', action: 'Mettre en traitement' },
          { status: 3, text: 'Livrée', action: 'Marquer comme livrée' },
          { status: -1, text: 'Annulée', action: 'Annuler la commande' }
        );
        break;
      case 2: // Processing
        transitions.push(
          { status: 3, text: 'Livrée', action: 'Marquer comme livrée' },
          { status: -1, text: 'Annulée', action: 'Annuler la commande' }
        );
        break;
      // Status 3 (Delivered) and -1 (Cancelled) are final states
    }

    return transitions;
  }

  /**
   * Check if order can be modified
   */
  static canModifyOrder(status: number): boolean {
    return status === 0 || status === 1; // Draft or Validated
  }

  /**
   * Check if order can be cancelled
   */
  static canCancelOrder(status: number): boolean {
    return status === 0 || status === 1 || status === 2; // Draft, Validated, or Processing
  }

  /**
   * Check if order can be set as delivered
   */
  static canSetAsDelivered(status: number): boolean {
    return status === 1 || status === 2; // Validated or Processing
  }

  /**
   * Calculate order summary statistics
   */
  static calculateOrderSummary(orders: Order[]): {
    totalOrders: number;
    totalAmount: number;
    statusCounts: { [key: number]: number };
    averageOrderValue: number;
  } {
    const summary = {
      totalOrders: orders.length,
      totalAmount: 0,
      statusCounts: {} as { [key: number]: number },
      averageOrderValue: 0,
    };

    orders.forEach(order => {
      summary.totalAmount += order.total_ttc;
      summary.statusCounts[order.status] = (summary.statusCounts[order.status] || 0) + 1;
    });

    summary.averageOrderValue = summary.totalOrders > 0 ? summary.totalAmount / summary.totalOrders : 0;

    return summary;
  }

  /**
   * Filter orders by status
   */
  static filterOrdersByStatus(orders: Order[], status: number): Order[] {
    return orders.filter(order => order.status === status);
  }

  /**
   * Filter orders by date range
   */
  static filterOrdersByDateRange(orders: Order[], startDate: Date, endDate: Date): Order[] {
    const startTimestamp = startDate.getTime() / 1000;
    const endTimestamp = endDate.getTime() / 1000;
    
    return orders.filter(order => 
      order.date_commande >= startTimestamp && order.date_commande <= endTimestamp
    );
  }

  /**
   * Sort orders by date (newest first)
   */
  static sortOrdersByDate(orders: Order[], ascending: boolean = false): Order[] {
    return [...orders].sort((a, b) => {
      const dateA = a.date_commande;
      const dateB = b.date_commande;
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Sort orders by amount
   */
  static sortOrdersByAmount(orders: Order[], ascending: boolean = false): Order[] {
    return [...orders].sort((a, b) => {
      const amountA = a.total_ttc;
      const amountB = b.total_ttc;
      return ascending ? amountA - amountB : amountB - amountA;
    });
  }

  /**
   * Get order status color for charts/UI elements
   */
  static getStatusColor(status: number): string {
    switch(status) {
      case 0: return '#ff9800'; // Draft - Orange
      case 1: return '#4caf50'; // Validated - Green
      case 2: return '#2196f3'; // Processing - Blue
      case 3: return '#009688'; // Delivered - Teal
      case -1: return '#f44336'; // Cancelled - Red
      default: return '#9e9e9e'; // Unknown - Grey
    }
  }

  /**
   * Validate order data
   */
  static validateOrder(order: Partial<Order>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!order.id) {
      errors.push('Order ID is required');
    }

    if (!order.ref || order.ref.trim() === '') {
      errors.push('Order reference is required');
    }

    if (!order.lines || order.lines.length === 0) {
      errors.push('Order must have at least one line item');
    }

    if (typeof order.total_ttc !== 'number' || order.total_ttc <= 0) {
      errors.push('Order total must be a positive number');
    }

    if (!order.date_commande) {
      errors.push('Order date is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate order export data for CSV/Excel
   */
  static generateOrderExportData(orders: Order[]): Array<{ [key: string]: any }> {
    return orders.map(order => ({
      'Numéro de commande': order.ref,
      'Date de commande': this.formatDate(order.date_commande, true),
      'Statut': this.getStatusInfo(order.status).text,
      'Nombre d\'articles': order.lines.length,
      'Total HT': order.total_ht,
      'TVA': order.total_tva,
      'Total TTC': order.total_ttc,
      'Note publique': order.note_public || '',
      'Note privée': order.note_private || '',
    }));
  }

  /**
   * Search orders by reference or product name
   */
  static searchOrders(orders: Order[], searchTerm: string): Order[] {
    if (!searchTerm.trim()) {
      return orders;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return orders.filter(order => {
      // Search in order reference
      if (order.ref.toLowerCase().includes(term)) {
        return true;
      }

      // Search in product names
      const hasMatchingProduct = order.lines.some(line => 
        line.libelle.toLowerCase().includes(term)
      );

      return hasMatchingProduct;
    });
  }
}