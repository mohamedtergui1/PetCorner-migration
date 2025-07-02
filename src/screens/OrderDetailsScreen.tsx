"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useTheme } from "../context/ThemeContext"
import type { Order, OrderLine, OrderStatusInfo } from "../types/order.types"
import OrderService from "../service/order.service"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Responsive breakpoints
const isSmallScreen = SCREEN_WIDTH < 360
const isMediumScreen = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414
const isLargeScreen = SCREEN_WIDTH >= 414

// Responsive dimensions
const getResponsiveDimension = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small
  if (isMediumScreen) return medium
  return large
}

// JSON Note Data Interfaces
interface CancellationNote {
  type: 'cancellation'
  reason: string
  timestamp: number
  orderId: string
  orderRef: string
}

interface FeedbackNote {
  type: 'feedback'
  delivery: {
    rating: number
    comment: string
  }
  product: {
    rating: number
    comment: string
  }
  timestamp: number
  orderId: string
  orderRef: string
}

interface OrderDetailsScreenProps {
  navigation: any
  route: {
    params: {
      order: Order
    }
  }
}

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({ navigation, route }) => {
  const { theme, isDarkMode, colorTheme } = useTheme()
  const [order, setOrder] = useState<Order>(route.params.order)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false)
  const [showEditFeedbackModal, setShowEditFeedbackModal] = useState<boolean>(false)
  const [cancellationReason, setCancellationReason] = useState<string>("")
  const [deliveryFeedback, setDeliveryFeedback] = useState<string>("")
  const [productFeedback, setProductFeedback] = useState<string>("")
  const [deliveryRating, setDeliveryRating] = useState<number>(0)
  const [productRating, setProductRating] = useState<number>(0)
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false)

  // Existing feedback data
  const [existingFeedback, setExistingFeedback] = useState<FeedbackNote | null>(null)
  const [existingCancellation, setExistingCancellation] = useState<CancellationNote | null>(null)

  // Define theme colors
  const PRIMARY_COLOR = colorTheme === "blue" ? "#007afe" : "#fe9400"
  const SECONDARY_COLOR = colorTheme === "blue" ? "#fe9400" : "#007afe"

  // Dark mode colors
  const BACKGROUND_COLOR = isDarkMode ? "#121212" : "#f8f8f8"
  const CARD_BACKGROUND = isDarkMode ? "#1e1e1e" : "#ffffff"
  const TEXT_COLOR = isDarkMode ? "#ffffff" : "#000000"
  const TEXT_COLOR_SECONDARY = isDarkMode ? "#b3b3b3" : "#666666"
  const BORDER_COLOR = isDarkMode ? "#2c2c2c" : "#e0e0e0"
  const MODAL_BACKGROUND = isDarkMode ? "#1e1e1e" : "#ffffff"
  const OVERLAY_COLOR = isDarkMode ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)"

  // JSON Serialization Utilities
  const serializeNoteData = (data: CancellationNote | FeedbackNote): string => {
    try {
      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error("❌ Error serializing note data:", error)
      throw new Error("Failed to serialize note data")
    }
  }

  const deserializeNoteData = (jsonString: string): CancellationNote | FeedbackNote | null => {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return null
      }

      // Clean the JSON string from potential formatting issues
      const cleanedJson = jsonString.trim()
      if (!cleanedJson.startsWith('{') || !cleanedJson.endsWith('}')) {
        return null
      }

      const parsed = JSON.parse(cleanedJson)
      
      // Validate the structure
      if (!parsed.type || !parsed.timestamp || !parsed.orderId) {
        console.warn("⚠️ Invalid note structure:", parsed)
        return null
      }

      return parsed as CancellationNote | FeedbackNote
    } catch (error) {
      console.error("❌ Error deserializing note data:", error)
      return null
    }
  }

  // Load existing notes from order
  const loadExistingNotes = () => {
    try {
      // Check if order has notes and try to parse them
      if (order.notes && Array.isArray(order.notes) && order.notes.length > 0) {
        order.notes.forEach(note => {
          if (note.note && typeof note.note === 'string') {
            const noteData = deserializeNoteData(note.note)
            if (noteData) {
              if (noteData.type === 'cancellation') {
                setExistingCancellation(noteData as CancellationNote)
              } else if (noteData.type === 'feedback') {
                setExistingFeedback(noteData as FeedbackNote)
              }
            }
          }
        })
      }
    } catch (error) {
      console.error("❌ Error loading existing notes:", error)
    }
  }

  // Load notes when component mounts or order changes
  useEffect(() => {
    loadExistingNotes()
  }, [order])

  // Format price to show 2 decimal places
  const formatPrice = (price: number): string => {
    return Number.parseFloat(price.toString()).toFixed(2)
  }

  // Format timestamp to readable date only (without time)
  const formatDate = (timestamp: number): string => {
    const adjustedTimestamp = (timestamp + 43200) * 1000
    const date = new Date(adjustedTimestamp)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Format timestamp for notes display
  const formatNoteTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Get status text and color based on order status
  const getStatusInfo = (status: string | number): OrderStatusInfo => {
    const numericStatus = typeof status === "string" ? Number.parseInt(status, 10) : status

    switch (numericStatus) {
      case 0:
        return {
          text: "Brouillon",
          color: "#ff9800",
          bgColor: isDarkMode ? "rgba(255,152,0,0.2)" : "rgba(255,152,0,0.1)",
        }
      case 1:
        return {
          text: "Validée",
          color: "#4caf50",
          bgColor: isDarkMode ? "rgba(76,175,80,0.2)" : "rgba(76,175,80,0.1)",
        }
      case 2:
        return {
          text: "En traitement",
          color: "#2196f3",
          bgColor: isDarkMode ? "rgba(33,150,243,0.2)" : "rgba(33,150,243,0.1)",
        }
      case 3:
        return {
          text: "Livrée",
          color: "#009688",
          bgColor: isDarkMode ? "rgba(0,150,136,0.2)" : "rgba(0,150,136,0.1)",
        }
      case -1:
        return {
          text: "Annulée",
          color: "#f44336",
          bgColor: isDarkMode ? "rgba(244,67,54,0.2)" : "rgba(244,67,54,0.1)",
        }
      default:
        return {
          text: "Inconnu",
          color: "#9e9e9e",
          bgColor: isDarkMode ? "rgba(158,158,158,0.2)" : "rgba(158,158,158,0.1)",
        }
    }
  }

  // Refresh order data
  const refreshOrderData = () => {
    OrderService.fetchOrderDetailsWithState(
      order.id,
      (updatedOrder) => {
        if (updatedOrder) {
          setOrder(updatedOrder)
          loadExistingNotes() // Reload notes after refresh
        }
      },
      setIsLoading,
    )
  }

  // Handle cancel order confirmation
  const handleCancelOrder = () => {
    setShowCancelModal(true)
  }

  // Submit cancellation with JSON note
  const submitCancellation = async () => {
    if (!cancellationReason.trim()) {
      Alert.alert("Erreur", "Veuillez indiquer la raison de l'annulation")
      return
    }

    setIsSubmittingCancel(true)
    try {
      // Create structured cancellation note
      const cancellationNote: CancellationNote = {
        type: 'cancellation',
        reason: cancellationReason.trim(),
        timestamp: Date.now(),
        orderId: order.id.toString(),
        orderRef: order.ref
      }

      // Serialize to JSON
      const serializedNote = serializeNoteData(cancellationNote)

      // Call the order service with the JSON note as PUBLIC note
      await OrderService.cancelOrderWithReason(
        order.id,
        order.ref,
        serializedNote,
        () => {
          console.log("✅ Order cancelled successfully")
          setExistingCancellation(cancellationNote)
          setShowCancelModal(false)
          setCancellationReason("")
          refreshOrderData()
          Alert.alert("Succès", "Votre commande a été annulée avec succès")
        },
        (error) => {
          console.error("❌ Error cancelling order:", error)
          Alert.alert("Erreur", "Erreur lors de l'annulation de la commande")
        },
      )
    } catch (error) {
      console.error("❌ Unexpected error:", error)
      Alert.alert("Erreur", "Une erreur inattendue est survenue lors de la sérialisation")
    } finally {
      setIsSubmittingCancel(false)
    }
  }

  // Handle adding comprehensive feedback
  const handleAddComprehensiveFeedback = () => {
    if (existingFeedback) {
      // Load existing feedback for editing
      setDeliveryRating(existingFeedback.delivery.rating)
      setDeliveryFeedback(existingFeedback.delivery.comment)
      setProductRating(existingFeedback.product.rating)
      setProductFeedback(existingFeedback.product.comment)
      setShowEditFeedbackModal(true)
    } else {
      // Clear form for new feedback
      setDeliveryRating(0)
      setDeliveryFeedback("")
      setProductRating(0)
      setProductFeedback("")
      setShowFeedbackModal(true)
    }
  }

  // Submit comprehensive feedback with JSON note
  const submitComprehensiveFeedback = async (isEdit: boolean = false) => {
    if (!deliveryFeedback.trim() && !productFeedback.trim() && deliveryRating === 0 && productRating === 0) {
      Alert.alert("Erreur", "Veuillez ajouter au moins un commentaire ou une note")
      return
    }

    setIsSubmittingFeedback(true)
    try {
      // Create structured feedback note
      const feedbackNote: FeedbackNote = {
        type: 'feedback',
        delivery: {
          rating: deliveryRating,
          comment: deliveryFeedback.trim()
        },
        product: {
          rating: productRating,
          comment: productFeedback.trim()
        },
        timestamp: Date.now(),
        orderId: order.id.toString(),
        orderRef: order.ref
      }

      // Serialize to JSON
      const serializedNote = serializeNoteData(feedbackNote)

      const result = await OrderService.addOrderNote(
        order.id,
        serializedNote,
        false, // false = PUBLIC note for user visibility
      )

      if (result.success) {
        setExistingFeedback(feedbackNote)
        setShowFeedbackModal(false)
        setShowEditFeedbackModal(false)
        setDeliveryFeedback("")
        setProductFeedback("")
        setDeliveryRating(0)
        setProductRating(0)
        refreshOrderData()
        Alert.alert("Succès", isEdit ? "Votre évaluation a été mise à jour avec succès" : "Votre évaluation a été ajoutée avec succès")
      } else {
        Alert.alert("Erreur", result.error || "Erreur lors de l'ajout de l'évaluation")
      }
    } catch (error) {
      console.error("❌ Error adding comprehensive feedback:", error)
      Alert.alert("Erreur", "Une erreur inattendue est survenue lors de la sérialisation")
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  // Render star rating component with improved responsiveness
  const renderStarRating = (rating: number, setRating: (rating: number) => void, label: string) => (
    <View style={styles.ratingContainer}>
      <Text style={[styles.ratingLabel, { color: TEXT_COLOR }]}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity 
            key={star} 
            onPress={() => setRating(star)} 
            style={styles.starButton}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={getResponsiveDimension(24, 28, 32)}
              color={star <= rating ? "#FFD700" : TEXT_COLOR_SECONDARY}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  // Render existing feedback display
  const renderExistingFeedback = () => {
    if (!existingFeedback) return null

    return (
      <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
        <View style={styles.existingFeedbackHeader}>
          <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Votre évaluation</Text>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: PRIMARY_COLOR + '20', borderColor: PRIMARY_COLOR }]}
            onPress={handleAddComprehensiveFeedback}
          >
            <MaterialCommunityIcons name="pencil" size={16} color={PRIMARY_COLOR} />
            <Text style={[styles.editButtonText, { color: PRIMARY_COLOR }]}>Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Rating Display */}
        <View style={styles.feedbackDisplaySection}>
          <View style={styles.feedbackDisplayHeader}>
            <MaterialCommunityIcons name="truck-delivery" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.feedbackDisplayTitle, { color: TEXT_COLOR }]}>Livraison</Text>
          </View>
          <View style={styles.ratingDisplay}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= existingFeedback.delivery.rating ? "star" : "star-outline"}
                size={20}
                color={star <= existingFeedback.delivery.rating ? "#FFD700" : TEXT_COLOR_SECONDARY}
              />
            ))}
            <Text style={[styles.ratingText, { color: TEXT_COLOR_SECONDARY }]}>
              ({existingFeedback.delivery.rating}/5)
            </Text>
          </View>
          {existingFeedback.delivery.comment && (
            <Text style={[styles.feedbackComment, { color: TEXT_COLOR_SECONDARY }]}>
              "{existingFeedback.delivery.comment}"
            </Text>
          )}
        </View>

        {/* Product Rating Display */}
        <View style={styles.feedbackDisplaySection}>
          <View style={styles.feedbackDisplayHeader}>
            <MaterialCommunityIcons name="package-variant" size={18} color={PRIMARY_COLOR} />
            <Text style={[styles.feedbackDisplayTitle, { color: TEXT_COLOR }]}>Produits</Text>
          </View>
          <View style={styles.ratingDisplay}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= existingFeedback.product.rating ? "star" : "star-outline"}
                size={20}
                color={star <= existingFeedback.product.rating ? "#FFD700" : TEXT_COLOR_SECONDARY}
              />
            ))}
            <Text style={[styles.ratingText, { color: TEXT_COLOR_SECONDARY }]}>
              ({existingFeedback.product.rating}/5)
            </Text>
          </View>
          {existingFeedback.product.comment && (
            <Text style={[styles.feedbackComment, { color: TEXT_COLOR_SECONDARY }]}>
              "{existingFeedback.product.comment}"
            </Text>
          )}
        </View>

        <Text style={[styles.feedbackTimestamp, { color: TEXT_COLOR_SECONDARY }]}>
          Évalué le {formatNoteTimestamp(existingFeedback.timestamp)}
        </Text>
      </View>
    )
  }

  // Render existing cancellation display
  const renderExistingCancellation = () => {
    if (!existingCancellation) return null

    return (
      <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: "#f44336" }]}>
        <View style={styles.cancellationHeader}>
          <MaterialCommunityIcons name="cancel" size={24} color="#f44336" />
          <Text style={[styles.cancellationTitle, { color: "#f44336" }]}>Commande annulée</Text>
        </View>
        <Text style={[styles.cancellationReason, { color: TEXT_COLOR }]}>
          Raison: {existingCancellation.reason}
        </Text>
        <Text style={[styles.cancellationTimestamp, { color: TEXT_COLOR_SECONDARY }]}>
          Annulée le {formatNoteTimestamp(existingCancellation.timestamp)}
        </Text>
      </View>
    )
  }

  // Enhanced cancellation modal with better responsiveness
  const renderCancellationModal = () => (
    <Modal
      visible={showCancelModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCancelModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: OVERLAY_COLOR }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalKeyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={[styles.modalContainer, styles.cancelModalContainer, { backgroundColor: MODAL_BACKGROUND }]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconContainer, { backgroundColor: "rgba(244,67,54,0.1)" }]}>
                  <MaterialCommunityIcons 
                    name="cancel" 
                    size={getResponsiveDimension(28, 32, 36)} 
                    color="#f44336" 
                  />
                </View>
                <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>Annuler la commande</Text>
                <Text style={[styles.modalSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                  Commande {order.ref}
                </Text>
              </View>

              <View style={styles.modalContent}>
                <Text style={[styles.inputLabel, { color: TEXT_COLOR }]}>
                  Raison de l'annulation *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.multilineInput,
                    {
                      backgroundColor: isDarkMode ? "#252525" : "#f5f5f5",
                      color: TEXT_COLOR,
                      borderColor: BORDER_COLOR,
                      minHeight: getResponsiveDimension(80, 100, 120),
                    },
                  ]}
                  placeholder="Expliquez pourquoi vous souhaitez annuler cette commande..."
                  placeholderTextColor={TEXT_COLOR_SECONDARY}
                  value={cancellationReason}
                  onChangeText={setCancellationReason}
                  multiline={true}
                  numberOfLines={isSmallScreen ? 3 : 4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={[styles.characterCount, { color: TEXT_COLOR_SECONDARY }]}>
                  {cancellationReason.length}/500
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonSecondary, 
                  { borderColor: BORDER_COLOR }
                ]}
                onPress={() => {
                  setShowCancelModal(false)
                  setCancellationReason("")
                }}
                disabled={isSubmittingCancel}
              >
                <Text style={[styles.modalButtonText, { color: TEXT_COLOR_SECONDARY }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonPrimary, 
                  { backgroundColor: "#f44336" }
                ]}
                onPress={submitCancellation}
                disabled={isSubmittingCancel}
              >
                {isSubmittingCancel ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )

  // Enhanced feedback modal with better responsiveness
  const renderFeedbackModal = () => (
    <Modal
      visible={showFeedbackModal || showEditFeedbackModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        setShowFeedbackModal(false)
        setShowEditFeedbackModal(false)
      }}
    >
      <View style={[styles.modalOverlay, { backgroundColor: OVERLAY_COLOR }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalKeyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={[styles.modalContainer, styles.feedbackModalContainer, { backgroundColor: MODAL_BACKGROUND }]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.feedbackModalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconContainer, { backgroundColor: "rgba(76,175,80,0.1)" }]}>
                  <MaterialCommunityIcons 
                    name="star-outline" 
                    size={getResponsiveDimension(28, 32, 36)} 
                    color="#4caf50" 
                  />
                </View>
                <Text style={[styles.modalTitle, { color: TEXT_COLOR }]}>
                  {showEditFeedbackModal ? "Modifier votre évaluation" : "Évaluer votre commande"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: TEXT_COLOR_SECONDARY }]}>
                  Commande {order.ref}
                </Text>
              </View>

              <View style={styles.modalContent}>
                {/* Delivery Rating */}
                <View style={styles.feedbackSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                      name="truck-delivery" 
                      size={getResponsiveDimension(18, 20, 22)} 
                      color={PRIMARY_COLOR} 
                    />
                    <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Livraison</Text>
                  </View>
                  {renderStarRating(deliveryRating, setDeliveryRating, "Comment s'est passée la livraison ?")}
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.feedbackTextInput,
                      {
                        backgroundColor: isDarkMode ? "#252525" : "#f5f5f5",
                        color: TEXT_COLOR,
                        borderColor: BORDER_COLOR,
                        minHeight: getResponsiveDimension(60, 80, 90),
                      },
                    ]}
                    placeholder="Commentaire sur la livraison (optionnel)..."
                    placeholderTextColor={TEXT_COLOR_SECONDARY}
                    value={deliveryFeedback}
                    onChangeText={setDeliveryFeedback}
                    multiline={true}
                    numberOfLines={isSmallScreen ? 2 : 3}
                    textAlignVertical="top"
                    maxLength={300}
                  />
                  <Text style={[styles.characterCount, { color: TEXT_COLOR_SECONDARY }]}>
                    {deliveryFeedback.length}/300
                  </Text>
                </View>

                {/* Product Rating */}
                <View style={styles.feedbackSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                      name="package-variant" 
                      size={getResponsiveDimension(18, 20, 22)} 
                      color={PRIMARY_COLOR} 
                    />
                    <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Produits</Text>
                  </View>
                  {renderStarRating(productRating, setProductRating, "Êtes-vous satisfait des produits ?")}
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.feedbackTextInput,
                      {
                        backgroundColor: isDarkMode ? "#252525" : "#f5f5f5",
                        color: TEXT_COLOR,
                        borderColor: BORDER_COLOR,
                        minHeight: getResponsiveDimension(60, 80, 90),
                      },
                    ]}
                    placeholder="Commentaire sur les produits (optionnel)..."
                    placeholderTextColor={TEXT_COLOR_SECONDARY}
                    value={productFeedback}
                    onChangeText={setProductFeedback}
                    multiline={true}
                    numberOfLines={isSmallScreen ? 2 : 3}
                    textAlignVertical="top"
                    maxLength={300}
                  />
                  <Text style={[styles.characterCount, { color: TEXT_COLOR_SECONDARY }]}>
                    {productFeedback.length}/300
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonSecondary, 
                  { borderColor: BORDER_COLOR }
                ]}
                onPress={() => {
                  setShowFeedbackModal(false)
                  setShowEditFeedbackModal(false)
                  setDeliveryFeedback("")
                  setProductFeedback("")
                  setDeliveryRating(0)
                  setProductRating(0)
                }}
                disabled={isSubmittingFeedback}
              >
                <Text style={[styles.modalButtonText, { color: TEXT_COLOR_SECONDARY }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonPrimary, 
                  { backgroundColor: "#4caf50" }
                ]}
                onPress={() => submitComprehensiveFeedback(showEditFeedbackModal)}
                disabled={isSubmittingFeedback}
              >
                {isSubmittingFeedback ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>
                    {showEditFeedbackModal ? "Mettre à jour" : "Envoyer"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )

  // Render status action buttons
  const renderStatusActions = () => {
    const actions = []
    const currentStatus =
      typeof order.statut === "string" ? Number.parseInt(order.statut, 10) : order.statut || order.status

    switch (currentStatus) {
      case 0: // Draft - User can ONLY cancel (if not already cancelled)
        if (!existingCancellation) {
          actions.push(
            <TouchableOpacity
              key="cancel"
              style={[styles.actionButton, styles.cancelActionButton, { backgroundColor: "#f44336" }]}
              onPress={handleCancelOrder}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cancel" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Annuler la commande</Text>
            </TouchableOpacity>,
          )
        }
        break

      case 3: // Delivered - Can add/edit comprehensive feedback
        actions.push(
          <TouchableOpacity
            key="feedback"
            style={[styles.actionButton, { backgroundColor: "#4caf50" }]}
            onPress={handleAddComprehensiveFeedback}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name={existingFeedback ? "pencil" : "star-outline"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>
              {existingFeedback ? "Modifier l'évaluation" : "Évaluer la commande"}
            </Text>
          </TouchableOpacity>,
        )
        break
    }

    return actions
  }

  // Render product item
  const renderProductItem = (line: OrderLine, index: number) => (
    <View
      key={`${order.id}-${line.id}-${index}`}
      style={[
        styles.productItem,
        {
          backgroundColor: CARD_BACKGROUND,
          borderColor: BORDER_COLOR,
        },
      ]}
    >
      <View
        style={[
          styles.imageContainer,
          {
            borderColor: BORDER_COLOR,
            backgroundColor: isDarkMode ? "#252525" : "#f5f5f5",
          },
        ]}
      >
        {line.photo_link ? (
          <Image source={{ uri: line.photo_link }} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={32} color={TEXT_COLOR_SECONDARY} />
          </View>
        )}
      </View>

      <View style={styles.productDetails}>
        <Text style={[styles.productName, { color: TEXT_COLOR }]}>{line.libelle}</Text>
        {line.desc && (
          <Text style={[styles.productDescription, { color: TEXT_COLOR_SECONDARY }]} numberOfLines={2}>
            {line.desc}
          </Text>
        )}
        <View style={styles.productMeta}>
          <View style={styles.quantityPriceContainer}>
            <View style={[styles.quantityBadge, { backgroundColor: isDarkMode ? "#252525" : "#f0f0f0" }]}>
              <Text style={[styles.quantity, { color: TEXT_COLOR_SECONDARY }]}>Qté: {line.qty}</Text>
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
  )

  const statusInfo = getStatusInfo(order.statut || order.status)

  return (
    <View style={[styles.container, { backgroundColor: BACKGROUND_COLOR }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#000000" : "#ffffff"}
      />

      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: PRIMARY_COLOR }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la commande</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshOrderData} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="refresh" size={24} color="#fff" />
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
              <MaterialCommunityIcons name="shopping-outline" size={24} color={PRIMARY_COLOR} />
              <Text style={[styles.orderRef, { color: TEXT_COLOR }]}>Commande {order.ref}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusInfo.bgColor,
                  borderColor: statusInfo.color,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
            </View>
          </View>

          <View style={styles.orderInfoRow}>
            <MaterialCommunityIcons name="calendar" size={18} color={TEXT_COLOR_SECONDARY} />
            <Text style={[styles.orderDate, { color: TEXT_COLOR_SECONDARY }]}>
              Commandé le {formatDate(order.date_commande)}
            </Text>
          </View>
        </View>

        {/* Existing Cancellation Display */}
        {renderExistingCancellation()}

        {/* Existing Feedback Display */}
        {renderExistingFeedback()}

        {/* Products List */}
        <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
          <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
            Articles commandés ({order.lines.length})
          </Text>
          {order.lines.map((line, index) => renderProductItem(line, index))}
        </View>

        {/* Order Summary */}
        <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
          <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Résumé de la commande</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: TEXT_COLOR_SECONDARY }]}>Sous-total HT:</Text>
            <Text style={[styles.summaryValue, { color: TEXT_COLOR }]}>{formatPrice(order.total_ht)} dhs</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: TEXT_COLOR_SECONDARY }]}>TVA:</Text>
            <Text style={[styles.summaryValue, { color: TEXT_COLOR }]}>{formatPrice(order.total_tva)} dhs</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: BORDER_COLOR }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: TEXT_COLOR }]}>Total TTC:</Text>
            <Text style={[styles.totalValue, { color: PRIMARY_COLOR }]}>{formatPrice(order.total_ttc)} dhs</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {renderStatusActions().length > 0 && (
          <View style={[styles.card, { backgroundColor: CARD_BACKGROUND, borderColor: BORDER_COLOR }]}>
            <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Actions</Text>
            {renderStatusActions()}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderCancellationModal()}
      {renderFeedbackModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    height: 60,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTitle: {
    fontSize: getResponsiveDimension(16, 18, 20),
    fontWeight: "600",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: getResponsiveDimension(12, 16, 20),
    paddingBottom: 100,
  },
  card: {
    borderRadius: getResponsiveDimension(12, 16, 20),
    marginBottom: getResponsiveDimension(12, 16, 20),
    padding: getResponsiveDimension(12, 16, 20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  orderHeaderSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderRefContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  orderRef: {
    fontSize: getResponsiveDimension(16, 18, 20),
    fontWeight: "bold",
    marginLeft: 8,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: getResponsiveDimension(8, 12, 16),
    paddingVertical: getResponsiveDimension(4, 6, 8),
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: getResponsiveDimension(10, 12, 14),
    fontWeight: "600",
  },
  orderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  orderDate: {
    fontSize: getResponsiveDimension(12, 14, 16),
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: getResponsiveDimension(14, 16, 18),
    fontWeight: "bold",
    marginBottom: 16,
  },

  // Existing Feedback Display Styles
  existingFeedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  feedbackDisplaySection: {
    marginBottom: 16,
  },
  feedbackDisplayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  feedbackDisplayTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  ratingDisplay: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 6,
  },
  feedbackComment: {
    fontSize: 13,
    fontStyle: "italic",
    marginLeft: 4,
  },
  feedbackTimestamp: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 8,
  },

  // Existing Cancellation Display Styles
  cancellationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cancellationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  cancellationReason: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  cancellationTimestamp: {
    fontSize: 11,
    textAlign: "right",
  },

  productItem: {
    flexDirection: "row",
    marginBottom: 16,
    padding: getResponsiveDimension(8, 12, 16),
    borderRadius: 12,
    borderWidth: 1,
  },
  imageContainer: {
    width: getResponsiveDimension(60, 80, 100),
    height: getResponsiveDimension(60, 80, 100),
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  productDetails: {
    flex: 1,
    marginLeft: getResponsiveDimension(8, 12, 16),
    justifyContent: "space-between",
  },
  productName: {
    fontSize: getResponsiveDimension(14, 16, 18),
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: getResponsiveDimension(18, 22, 26),
  },
  productDescription: {
    fontSize: getResponsiveDimension(11, 13, 15),
    marginBottom: 8,
    lineHeight: getResponsiveDimension(15, 18, 21),
  },
  productMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  quantityPriceContainer: {
    flex: 1,
  },
  quantityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: getResponsiveDimension(6, 8, 10),
    paddingVertical: getResponsiveDimension(2, 4, 6),
    borderRadius: 12,
    marginBottom: 4,
  },
  quantity: {
    fontSize: getResponsiveDimension(10, 12, 14),
    fontWeight: "500",
  },
  unitPrice: {
    fontSize: getResponsiveDimension(10, 12, 14),
  },
  totalLinePrice: {
    fontSize: getResponsiveDimension(14, 16, 18),
    fontWeight: "bold",
    textAlign: "right",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: getResponsiveDimension(12, 14, 16),
  },
  summaryValue: {
    fontSize: getResponsiveDimension(12, 14, 16),
  },
  totalLabel: {
    fontSize: getResponsiveDimension(14, 16, 18),
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: getResponsiveDimension(16, 18, 20),
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveDimension(12, 14, 16),
    paddingHorizontal: getResponsiveDimension(16, 20, 24),
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelActionButton: {
    marginTop: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: getResponsiveDimension(14, 16, 18),
    fontWeight: "600",
    marginLeft: 8,
  },

  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsiveDimension(16, 20, 24),
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: 500,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: getResponsiveDimension(16, 20, 24),
  },
  feedbackModalScrollContent: {
    paddingVertical: getResponsiveDimension(16, 20, 24),
  },
  modalContainer: {
    width: "100%",
    borderRadius: getResponsiveDimension(16, 20, 24),
    padding: getResponsiveDimension(16, 20, 24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 500,
  },
  cancelModalContainer: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  feedbackModalContainer: {
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: getResponsiveDimension(16, 20, 24),
  },
  modalIconContainer: {
    width: getResponsiveDimension(56, 64, 72),
    height: getResponsiveDimension(56, 64, 72),
    borderRadius: getResponsiveDimension(28, 32, 36),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: getResponsiveDimension(12, 16, 20),
  },
  modalTitle: {
    fontSize: getResponsiveDimension(18, 20, 22),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: getResponsiveDimension(12, 14, 16),
    textAlign: "center",
  },
  modalContent: {
    marginBottom: getResponsiveDimension(16, 20, 24),
  },
  inputLabel: {
    fontSize: getResponsiveDimension(14, 16, 18),
    fontWeight: "600",
    marginBottom: getResponsiveDimension(6, 8, 10),
  },
  textInput: {
    borderWidth: 1,
    borderRadius: getResponsiveDimension(8, 12, 16),
    paddingHorizontal: getResponsiveDimension(12, 16, 20),
    paddingVertical: getResponsiveDimension(10, 12, 14),
    fontSize: getResponsiveDimension(14, 16, 18),
    textAlignVertical: "top",
  },
  multilineInput: {
    textAlignVertical: "top",
  },
  feedbackTextInput: {
    marginBottom: 4,
  },
  characterCount: {
    fontSize: getResponsiveDimension(10, 12, 14),
    textAlign: "right",
    marginBottom: getResponsiveDimension(8, 12, 16),
  },
  modalActions: {
    flexDirection: isSmallScreen ? "column" : "row",
    justifyContent: "space-between",
    gap: getResponsiveDimension(8, 12, 16),
  },
  modalButton: {
    flex: isSmallScreen ? undefined : 1,
    paddingVertical: getResponsiveDimension(12, 14, 16),
    borderRadius: getResponsiveDimension(8, 12, 16),
    alignItems: "center",
    justifyContent: "center",
    minHeight: getResponsiveDimension(44, 48, 52),
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonPrimary: {
    // backgroundColor will be set dynamically
  },
  modalButtonText: {
    fontSize: getResponsiveDimension(14, 16, 18),
    fontWeight: "600",
  },
  modalButtonTextPrimary: {
    color: "#fff",
    fontSize: getResponsiveDimension(14, 16, 18),
    fontWeight: "600",
  },

  // Enhanced Feedback Modal Specific Styles
  feedbackSection: {
    marginBottom: getResponsiveDimension(20, 24, 28),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveDimension(12, 16, 20),
  },
  ratingContainer: {
    marginBottom: getResponsiveDimension(12, 16, 20),
  },
  ratingLabel: {
    fontSize: getResponsiveDimension(12, 14, 16),
    fontWeight: "500",
    marginBottom: getResponsiveDimension(6, 8, 10),
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: getResponsiveDimension(8, 12, 16),
    flexWrap: "wrap",
  },
  starButton: {
    paddingHorizontal: getResponsiveDimension(2, 4, 6),
    paddingVertical: getResponsiveDimension(4, 6, 8),
  },
})

export default OrderDetailsScreen