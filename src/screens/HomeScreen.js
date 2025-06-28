import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Linking,
  Alert,
  Platform,
} from "react-native"
import { useCallback, useEffect, useState } from "react"
import Ionicons from "react-native-vector-icons/Ionicons"
import HomeProduct from "../components/Home/HomeProduct"
import Header from "../components/layout/Header"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "@react-navigation/native"
import { useTheme } from "../context/ThemeContext"

const { width, height } = Dimensions.get("window")

export default function HomeScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme()
  const [cartItemsCount, setCartItemsCount] = useState(0)

  const getCartItemsCount = async () => {
    try {
      const cartItems = JSON.parse(await AsyncStorage.getItem("cartItems")) || []
      setCartItemsCount(cartItems.length)
    } catch (error) {
      console.error("Failed to retrieve cart items", error)
    }
  }

  useEffect(() => {
    getCartItemsCount()
  }, [])

  useFocusEffect(
    useCallback(() => {
      getCartItemsCount()
    }, []),
  )

  // Coordinates for Pet Corner
  const petCornerLocation = {
    latitude: 33.95130166886704,
    longitude: -6.8852589153111134,
  }

  // Function to open directions
  const openDirections = () => {
    const { latitude, longitude } = petCornerLocation
    
    // Platform-specific URLs for better compatibility
    let url
    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?daddr=${latitude},${longitude}`
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url)
        } else {
          Alert.alert("Erreur", "Impossible d'ouvrir l'application de cartes")
        }
      })
      .catch((err) => {
        console.error("Error opening directions:", err)
        Alert.alert("Erreur", "Impossible d'ouvrir l'itinéraire")
      })
  }

  // Function to make a phone call
  const makePhoneCall = () => {
    const phoneNumber = "tel:+212537123456" // Replace with actual phone number

    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneNumber)
        } else {
          Alert.alert("Erreur", "Impossible de passer l'appel")
        }
      })
      .catch((err) => {
        console.error("Error making phone call:", err)
        Alert.alert("Erreur", "Impossible de passer l'appel")
      })
  }

  // Function to open website
  const openWebsite = () => {
    const websiteUrl = "https://petcorner.ma" // Replace with actual website

    Linking.canOpenURL(websiteUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(websiteUrl)
        } else {
          Alert.alert("Erreur", "Impossible d'ouvrir le site web")
        }
      })
      .catch((err) => {
        console.error("Error opening website:", err)
        Alert.alert("Erreur", "Impossible d'ouvrir le site web")
      })
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.backgroundColor,
      }}
    >
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBackground} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header component with theme support */}
        <Header navigation={navigation} cartItemsCount={cartItemsCount} theme={theme} />

        {/* HomeProduct component with theme support */}
        <HomeProduct navigation={navigation} theme={theme} />

        {/* Store Location Section */}
        <View style={styles.locationSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Visitez Notre Magasin</Text>
          </View>

          {/* Store Info Card */}
          <View style={[styles.storeCard, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.storeHeader}>
              <Ionicons name="storefront" size={32} color={theme.primary} />
              <View style={styles.storeHeaderText}>
                <Text style={[styles.storeName, { color: theme.textColor }]}>Pet Corner</Text>
                <Text style={[styles.storeTagline, { color: theme.secondaryTextColor }]}>
                  Votre destination de confiance pour les animaux
                </Text>
              </View>
            </View>

            <View style={styles.storeDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color={theme.textColor} />
                <Text style={[styles.detailText, { color: theme.textColor }]}>Rabat, Maroc</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color={theme.textColor} />
                <Text style={[styles.detailText, { color: theme.textColor }]}>
                 Ouvert 7 jours sur 7 : de 9h00 à 23h00
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color={theme.textColor} />
                <Text style={[styles.detailText, { color: theme.textColor }]}>+212636041114</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={openDirections}
              >
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Itinéraire</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  { borderColor: theme.primary }
                ]}
                onPress={makePhoneCall}
              >
                <Ionicons name="call" size={20} color={theme.primary} />
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Appeler</Text>
              </TouchableOpacity>
            </View>

            {/* Additional Actions */}
            <View style={styles.additionalActions}>
              <TouchableOpacity
                style={[styles.additionalAction, { backgroundColor: theme.rowBackground }]}
                onPress={openWebsite}
              >
                <Ionicons name="globe-outline" size={18} color={theme.textColor} />
                <Text style={[styles.additionalActionText, { color: theme.textColor }]}>Site Web</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.secondaryTextColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.additionalAction, { backgroundColor: theme.rowBackground }]}
                onPress={() => Alert.alert("Réseaux Sociaux", "Suivez-nous sur Instagram @petcorner_ma")}
              >
                <Ionicons name="logo-instagram" size={18} color={theme.textColor} />
                <Text style={[styles.additionalActionText, { color: theme.textColor }]}>Nous Suivre</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.secondaryTextColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Info */}
          <View style={[styles.quickInfo, { backgroundColor: theme.rowBackground }]}>
            
             
            <View style={styles.quickInfoItem}>
              <Ionicons name="card-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickInfoText, { color: theme.textColor }]}>Carte Acceptée</Text>
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoItem}>
              <Ionicons name="cube-outline" size={24} color={theme.primary} />
              <Text style={[styles.quickInfoText, { color: theme.textColor }]}>Livraison</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  locationSection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  storeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  storeHeaderText: {
    flex: 1,
  },
  storeName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  storeTagline: {
    fontSize: 14,
  },
  storeDetails: {
    marginBottom: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    // backgroundColor set via theme
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  additionalActions: {
    gap: 8,
  },
  additionalAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  additionalActionText: {
    fontSize: 16,
    flex: 1,
  },
  quickInfo: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  quickInfoItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  quickInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
  },
  quickInfoText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
})