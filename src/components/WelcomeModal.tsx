import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UserData {
  id: number;
  name?: string;
  phone: string;
  email?: string;
  loggedIn: boolean;
}

interface Theme {
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  primary: string;
  cardBackground?: string;
}

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  userData: UserData | null;
  theme: Theme;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  onClose,
  userData,
  theme,
}) => {
  // Animation refs
  const modalAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  // Start welcome modal animations
  const startWelcomeAnimation = (): void => {
    // Animate modal background
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate modal content slide up
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animate modal content scale and fade
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ).start();
    }, 500);
  };

  // Close welcome modal
  const closeWelcomeModal = async (): Promise<void> => {
    // Animate out
    Animated.parallel([
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });

    // Mark that user has seen welcome
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
    } catch (error) {
      console.error('Error saving welcome status:', error);
    }
  };

  // Get user's first name from full name
  const getFirstName = (): string => {
    if (userData?.name) {
      return userData.name.split(' ')[0];
    }
    return 'Utilisateur';
  };

  // Start animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      startWelcomeAnimation();
    }
  }, [visible]);

  // Confetti animation transform
  const confettiTransform = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenHeight],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={closeWelcomeModal}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: modalAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        ]}
      >
        {/* Confetti Animation */}
        <Animated.View
          style={[
            styles.confetti,
            {
              transform: [{ translateY: confettiTransform }],
            }
          ]}
        >
          {[...Array(15)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.confettiPiece,
                {
                  left: Math.random() * screenWidth,
                  backgroundColor: index % 2 === 0 ? theme.primary : '#FFD700',
                }
              ]}
            />
          ))}
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.backgroundColor,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons
              name="party-popper"
              size={64}
              color={theme.primary}
            />
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              Bienvenue {getFirstName()}! 🎉
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.secondaryTextColor }]}>
              Votre compte a été créé avec succès
            </Text>
          </View>

          {/* Modal Body */}
          <View style={styles.modalBody}>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="truck-delivery"
                  size={28}
                  color={theme.primary}
                />
                <Text style={[styles.featureText, { color: theme.textColor }]}>
                  Livraison rapide à domicile
                </Text>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={28}
                  color={theme.primary}
                />
                <Text style={[styles.featureText, { color: theme.textColor }]}>
                  Paiement par carte en ligne bientôt disponible
                </Text>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="heart"
                  size={28}
                  color={theme.primary}
                />
                <Text style={[styles.featureText, { color: theme.textColor }]}>
                  Produits de qualité pour vos animaux
                </Text>
              </View>
            </View>

            <View style={[styles.welcomeGift, { backgroundColor: theme.primary + '20' }]}>
              <MaterialCommunityIcons
                name="star"
                size={32}
                color={theme.primary}
              />
              <Text style={[styles.giftText, { color: theme.primary }]}>
                Bienvenue dans la famille PetCorner! Découvrez nos produits de qualité pour vos compagnons.
              </Text>
            </View>
          </View>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: theme.primary }]}
              onPress={closeWelcomeModal}
            >
              <Text style={styles.startButtonText}>Commencer mes achats</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBody: {
    marginBottom: 24,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
    lineHeight: 22,
  },
  welcomeGift: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  giftText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  modalFooter: {
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  // Confetti Styles
  confetti: {
    position: 'absolute',
    top: 0,
    width: screenWidth,
    height: screenHeight,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default WelcomeModal;