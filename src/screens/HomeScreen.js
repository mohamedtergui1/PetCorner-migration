import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Dimensions,
  Linking,
  Alert,
} from "react-native"
import { useCallback, useEffect, useState } from "react"
import Ionicons from "react-native-vector-icons/Ionicons"
import HomeProduct from "../components/Home/HomeProduct"
import Header from "../components/layout/Header"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect } from "@react-navigation/native"
import { useTheme } from "../context/ThemeContext"
import MapView, { Marker } from "react-native-maps"

const { width, height } = Dimensions.get("window")

export default function HomeScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme()
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [isMapModalVisible, setIsMapModalVisible] = useState(false)

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
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }

  const openMapModal = () => {
    setIsMapModalVisible(true)
  }

  const closeMapModal = () => {
    setIsMapModalVisible(false)
  }

  // Function to open directions
  const openDirections = () => {
    const { latitude, longitude } = petCornerLocation
    const url = `https://maps.google.com/maps?daddr=${latitude},${longitude}`

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url)
        } else {
          Alert.alert("Error", "Unable to open maps application")
        }
      })
      .catch((err) => {
        console.error("Error opening directions:", err)
        Alert.alert("Error", "Unable to open directions")
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
          Alert.alert("Error", "Unable to make phone call")
        }
      })
      .catch((err) => {
        console.error("Error making phone call:", err)
        Alert.alert("Error", "Unable to make phone call")
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

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Ionicons name="location" size={24} color={theme.primary} />
            <Text style={[styles.mapTitle, { color: theme.textColor }]}>Pet Corner Location</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.mapContainer,
              {
                shadowColor: isDarkMode ? "#000" : "#000",
                backgroundColor: theme.cardBackground,
              },
            ]}
            onPress={openMapModal}
            activeOpacity={0.8}
          >
            <MapView
              style={styles.map}
              initialRegion={petCornerLocation}
              provider="apple"
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: petCornerLocation.latitude,
                  longitude: petCornerLocation.longitude,
                }}
                title="Pet Corner"
                description="Pet Corner Store Location"
                pinColor={theme.primary}
              />
            </MapView>

            {/* Overlay with tap indicator */}
            <View style={styles.mapOverlay}>
              <View style={[styles.tapIndicator, { backgroundColor: theme.primary }]}>
                <Ionicons name="location-outline" size={20} color="#fff" />
                <Text style={styles.tapText}>Tap to expand</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Store Info */}
          <View style={[styles.storeInfo, { backgroundColor: theme.rowBackground }]}>
            <View style={styles.infoRow}>
              <Ionicons name="storefront-outline" size={18} color={theme.textColor} />
              <Text style={[styles.infoText, { color: theme.textColor }]}>Pet Corner Store</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={theme.textColor} />
              <Text style={[styles.infoText, { color: theme.textColor }]}>Rabat, Morocco</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Map Modal */}
      <Modal visible={isMapModalVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: theme.backgroundColor,
                borderBottomColor: theme.borderColor,
              },
            ]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={closeMapModal}>
              <Ionicons name="arrow-back" size={24} color={theme.textColor} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Pet Corner Location</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Full Screen Map */}
          <MapView
            style={styles.fullScreenMap}
            initialRegion={petCornerLocation}
            provider="apple"
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            <Marker
              coordinate={{
                latitude: petCornerLocation.latitude,
                longitude: petCornerLocation.longitude,
              }}
              title="Pet Corner"
              description="Pet Corner Store Location - Your trusted pet supplies destination"
              pinColor={theme.primary}
            />
          </MapView>

          {/* Bottom Info Card */}
          <View
            style={[
              styles.bottomCard,
              {
                backgroundColor: theme.backgroundColor,
                borderTopColor: theme.borderColor,
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons name="storefront" size={24} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.textColor }]}>Pet Corner</Text>
              </View>
              <Text style={[styles.cardAddress, { color: theme.secondaryTextColor }]}>Rabat, Morocco</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={openDirections}
                >
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.primary },
                  ]}
                  onPress={makePhoneCall}
                >
                  <Ionicons name="call" size={18} color={theme.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.primary }]}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  mapSection: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  map: {
    height: 200,
    width: "100%",
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  tapIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tapText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  storeInfo: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  fullScreenMap: {
    flex: 1,
  },
  bottomCard: {
    borderTopWidth: 1,
    paddingBottom: 34,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  cardAddress: {
    fontSize: 16,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
})
