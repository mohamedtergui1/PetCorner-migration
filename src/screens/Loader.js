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

const { width, height } = Dimensions.get('window');

// Define the theme colors
const BLUE = '#007afe';
const ORANGE = '#fe9400';
const DARK_BLUE = '#005dc0';
const DARK_ORANGE = '#d27b00';
const WHITE = '#ffffff';

export default function SplashScreen({ visible = false }) {
  // Animation refs (removed sparkle animation)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoSlideAnim = useRef(new Animated.Value(-100)).current;
  const textSlideAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colorShiftAnim = useRef(new Animated.Value(0)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;
  const birdFloatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations sequence
      Animated.sequence([
        // 1. Fade in background with gradient animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(gradientAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
        ]),
        
        // 2. Scale and slide in logo
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(logoSlideAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        
        // 3. Slide in text from bottom
        Animated.spring(textSlideAnim, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start color shifting animation
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(colorShiftAnim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: false,
            }),
            Animated.timing(colorShiftAnim, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }, 500);

      // Start bird floating animation (replaces sparkle)
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(birdFloatAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(birdFloatAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 1000);

      // Start pulse animation
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 1500);
    }
  }, [visible]);

  const backgroundColor = colorShiftAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [BLUE, DARK_BLUE, ORANGE],
  });

  const logoBackgroundColor = colorShiftAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['rgba(254, 148, 0, 0.1)', 'rgba(255, 255, 255, 0.15)', 'rgba(0, 122, 254, 0.1)'],
  });

  // Bird floating animation
  const birdFloat1 = birdFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const birdFloat2 = birdFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const birdFloat3 = birdFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar translucent={false} backgroundColor={BLUE} barStyle="light-content" />
      
      {/* Animated Background Container */}
      <Animated.View style={[styles.backgroundContainer, { backgroundColor }]}>
        {/* Background Pattern */}
        <Animated.View
          style={[
            styles.backgroundPattern,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Pet paw prints decoration with blue/orange theme */}
          <View style={styles.pawPrintContainer}>
            <Text style={[styles.pawPrint, { color: 'rgba(255, 255, 255, 0.15)' }]}>🐾</Text>
            <Text style={[styles.pawPrint, styles.pawPrint2, { color: 'rgba(254, 148, 0, 0.2)' }]}>🐾</Text>
            <Text style={[styles.pawPrint, styles.pawPrint3, { color: 'rgba(255, 255, 255, 0.1)' }]}>🐾</Text>
            <Text style={[styles.pawPrint, styles.pawPrint4, { color: 'rgba(254, 148, 0, 0.15)' }]}>🐾</Text>
            <Text style={[styles.pawPrint, styles.pawPrint5, { color: 'rgba(255, 255, 255, 0.08)' }]}>🐾</Text>
            <Text style={[styles.pawPrint, styles.pawPrint6, { color: 'rgba(254, 148, 0, 0.12)' }]}>🐾</Text>
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
            {/* Logo with dynamic background */}
            <Animated.View style={[styles.logoPlaceholder, { backgroundColor: logoBackgroundColor }]}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
              {/* Corner accent */}
              <View style={[styles.cornerAccent, { backgroundColor: ORANGE }]} />
            </Animated.View>

            {/* Floating Birds Effect (replaces sparkles) */}
            <Animated.View style={styles.floatingBirdsContainer}>
              <Animated.Text 
                style={[
                  styles.floatingBird, 
                  styles.bird1,
                  { transform: [{ translateY: birdFloat1 }] }
                ]}
              >
                🦜
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.floatingBird, 
                  styles.bird2,
                  { transform: [{ translateY: birdFloat2 }] }
                ]}
              >
                🐦
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.floatingBird, 
                  styles.bird3,
                  { transform: [{ translateY: birdFloat3 }] }
                ]}
              >
                🕊️
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.floatingBird, 
                  styles.bird4,
                  { transform: [{ translateY: birdFloat1 }] }
                ]}
              >
                🦅
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.floatingBird, 
                  styles.bird5,
                  { transform: [{ translateY: birdFloat2 }] }
                ]}
              >
                🐤
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.floatingBird, 
                  styles.bird6,
                  { transform: [{ translateY: birdFloat3 }] }
                ]}
              >
                🦆
              </Animated.Text>
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
            <View style={styles.appNameContainer}>
              <Text style={[styles.appName, { color: WHITE }]}>Pet</Text>
              <Text style={[styles.appName, styles.appNameAccent, { color: ORANGE }]}>Corner</Text>
            </View>
            <Text style={styles.tagline}>Votre coin préféré pour vos animaux</Text>
            <View style={styles.petIcons}>
              <Text style={styles.petIcon}>🐱</Text>
              <Text style={styles.petIcon}>🐶</Text>
              <Text style={styles.petIcon}>🦜</Text>
              <Text style={styles.petIcon}>🐰</Text>
            </View>
          </Animated.View>

          {/* Enhanced Loading Animation */}
          <Animated.View
            style={[
              styles.loadingContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Custom Loading Animation */}
            <View style={styles.customLoader}>
              <Animated.View 
                style={[
                  styles.loadingDot, 
                  { backgroundColor: ORANGE },
                  {
                    transform: [
                      { 
                        translateX: birdFloatAnim.interpolate({
                          inputRange: [0, 0.25, 0.5, 0.75, 1],
                          outputRange: [0, 15, 0, -15, 0],
                        })
                      }
                    ],
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.loadingDot, 
                  { backgroundColor: WHITE },
                  {
                    transform: [
                      { 
                        translateX: birdFloatAnim.interpolate({
                          inputRange: [0, 0.25, 0.5, 0.75, 1],
                          outputRange: [0, -10, 0, 10, 0],
                        })
                      }
                    ],
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.loadingDot, 
                  { backgroundColor: ORANGE },
                  {
                    transform: [
                      { 
                        translateX: birdFloatAnim.interpolate({
                          inputRange: [0, 0.25, 0.5, 0.75, 1],
                          outputRange: [0, 12, 0, -12, 0],
                        })
                      }
                    ],
                  }
                ]} 
              />
            </View>
            <Text style={styles.loadingText}>Chargement en cours...</Text>
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
          <View style={styles.bottomTextContainer}>
            <Text style={styles.bottomText}>Accessoires</Text>
            <Text style={[styles.bottomDot, { color: ORANGE }]}>•</Text>
            <Text style={styles.bottomText}>Nourriture</Text>
            <Text style={[styles.bottomDot, { color: ORANGE }]}>•</Text>
            <Text style={styles.bottomText}>Soins</Text>
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </Animated.View>
      </Animated.View>
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
  },
  pawPrint2: {
    top: '15%',
    right: '15%',
    fontSize: 25,
  },
  pawPrint3: {
    bottom: '25%',
    left: '10%',
    fontSize: 35,
  },
  pawPrint4: {
    top: '55%',
    right: '8%',
    fontSize: 28,
  },
  pawPrint5: {
    top: '35%',
    left: '5%',
    fontSize: 22,
  },
  pawPrint6: {
    bottom: '45%',
    right: '25%',
    fontSize: 26,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 50,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 4,
    borderColor: 'rgba(254, 148, 0, 0.3)',
    position: 'relative',
  },
  logo: {
    width: 160,
    height: 160,
  },
  cornerAccent: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.8,
  },
  // New floating birds styles (replaces sparkle styles)
  floatingBirdsContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
  },
  floatingBird: {
    position: 'absolute',
    fontSize: 20,
  },
  bird1: {
    top: 20,
    left: '50%',
    marginLeft: -10,
  },
  bird2: {
    right: 25,
    top: '30%',
    marginTop: -10,
  },
  bird3: {
    bottom: 20,
    left: '50%',
    marginLeft: -10,
  },
  bird4: {
    left: 25,
    top: '30%',
    marginTop: -10,
  },
  bird5: {
    right: 35,
    top: '70%',
    fontSize: 18,
  },
  bird6: {
    left: 35,
    top: '70%',
    fontSize: 18,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  appNameAccent: {
    marginLeft: 8,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  petIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  petIcon: {
    fontSize: 36,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  customLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },
  bottomTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  bottomDot: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '400',
  },
});