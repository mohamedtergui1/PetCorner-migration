import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ visible = false }) {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoSlideAnim = useRef(new Animated.Value(-100)).current;
  const textSlideAnim = useRef(new Animated.Value(100)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Start animations sequence
      Animated.sequence([
        // 1. Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        
        // 2. Scale and slide in logo
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(logoSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        
        // 3. Slide in text from bottom
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start sparkle animation
      setTimeout(() => {
        Animated.loop(
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ).start();
      }, 1000);

      // Start pulse animation
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 1500);
    }
  }, [visible]);

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor="#4A90E2" barStyle="light-content" />
      
      {/* Background Container */}
      <View style={styles.backgroundContainer}>
        {/* Animated Background Pattern */}
        <Animated.View
          style={[
            styles.backgroundPattern,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Pet paw prints decoration */}
          <View style={styles.pawPrintContainer}>
            <Text style={styles.pawPrint}>🐾</Text>
            <Text style={[styles.pawPrint, styles.pawPrint2]}>🐾</Text>
            <Text style={[styles.pawPrint, styles.pawPrint3]}>🐾</Text>
            <Text style={[styles.pawPrint, styles.pawPrint4]}>🐾</Text>
          </View>
        </Animated.View>

        {/* Main Content Container */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Logo Container */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { translateY: logoSlideAnim },
                  { scale: scaleAnim },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            {/* Replace this with your actual logo */}
            <View style={styles.logoPlaceholder}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Sparkle Effect around logo */}
            <Animated.View
              style={[
                styles.sparkleContainer,
                {
                  transform: [{ rotate: sparkleRotation }],
                },
              ]}
            >
              <Text style={[styles.sparkle, styles.sparkle1]}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle2]}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle4]}>✨</Text>
            </Animated.View>
          </Animated.View>

          {/* App Name and Tagline */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                transform: [{ translateY: textSlideAnim }],
              },
            ]}
          >
            <Text style={styles.appName}>PetShop</Text>
            <Text style={styles.tagline}>Tout pour vos compagnons</Text>
            <View style={styles.petIcons}>
              <Text style={styles.petIcon}>🐱</Text>
              <Text style={styles.petIcon}>🐶</Text>
              <Text style={styles.petIcon}>🦜</Text>
            </View>
          </Animated.View>

          {/* Loading Animation */}
          <Animated.View
            style={[
              styles.loadingContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <LottieView
              source={require('../assets/animations/loader.json')}
              autoPlay
              loop
              style={styles.lottieLoader}
            />
            <Text style={styles.loadingText}>Chargement...</Text>
          </Animated.View>
        </Animated.View>

        {/* Bottom Decoration */}
        <Animated.View
          style={[
            styles.bottomDecoration,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.bottomText}>Accessoires • Nourriture • Soins</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width,
    height: height,
    zIndex: 1000,
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pawPrintContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pawPrint: {
    position: 'absolute',
    fontSize: 30,
    opacity: 0.1,
    color: 'white',
  },
  pawPrint2: {
    top: '20%',
    right: '20%',
    fontSize: 25,
  },
  pawPrint3: {
    bottom: '30%',
    left: '15%',
    fontSize: 35,
  },
  pawPrint4: {
    top: '60%',
    right: '10%',
    fontSize: 28,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  logo: {
    width: 140,
    height: 140,
  },
  sparkleContainer: {
    position: 'absolute',
    width: 220,
    height: 220,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
    color: '#FFD700',
  },
  sparkle1: {
    top: 10,
    left: '50%',
    marginLeft: -10,
  },
  sparkle2: {
    right: 10,
    top: '50%',
    marginTop: -10,
  },
  sparkle3: {
    bottom: 10,
    left: '50%',
    marginLeft: -10,
  },
  sparkle4: {
    left: 10,
    top: '50%',
    marginTop: -10,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  petIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  petIcon: {
    fontSize: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  lottieLoader: {
    width: 80,
    height: 80,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  bottomText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 1,
  },
});