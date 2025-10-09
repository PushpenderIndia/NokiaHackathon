import { Link } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions, ScrollView, Animated } from 'react-native'
import LottieView from 'lottie-react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'

const { width } = Dimensions.get('window')

// Coordinates for Kalkaji to Nehru Place
const kalkaji = { latitude: 28.5494, longitude: 77.2588 }
const nehruPlace = { latitude: 28.5494, longitude: 77.2500 }

const EmergencyScreen = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {/* Ambulance Animation */}
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../../assets/animations/ambulancia.json')}
          autoPlay
          loop
          style={styles.ambulanceAnimation}
        />
      </View>

      {/* Main Notification Card */}
      <View style={styles.mainCard}>
        {/* Emergency Alert Badge */}
        <Animated.View style={[styles.alertBadge, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.alertDot} />
          <Text style={styles.alertBadgeText}>Emergency Detected</Text>
        </Animated.View>

        <View style={styles.driverInfoRow}>
          <Text style={styles.driverLabel}>Driver:</Text>
          <Text style={styles.driverName}>Manoj (On the way)</Text>
        </View>

        {/* Google Map View */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 28.5494,
              longitude: 77.2544,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {/* Marker for Kalkaji (Start) */}
            <Marker
              coordinate={kalkaji}
              title="Your Location"
              description="Kalkaji"
              pinColor="blue"
            />

            {/* Marker for Nehru Place (Destination) */}
            <Marker
              coordinate={nehruPlace}
              title="Ambulance Location"
              description="Nehru Place"
              pinColor="red"
            />

            {/* Route Line */}
            <Polyline
              coordinates={[kalkaji, nehruPlace]}
              strokeColor="#14b8a6"
              strokeWidth={4}
            />
          </MapView>

          {/* Back to Home Button Overlay */}
          <Link href="/" asChild>
            <TouchableOpacity style={styles.backButtonOverlay}>
              <Text style={styles.backButtonOverlayText}>← Back to Home</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Location & ETA Info - Single Row */}
        <View style={styles.divider} />
        <View style={styles.infoRowSingle}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📍</Text>
            <View>
              <Text style={styles.infoLabelSmall}>Location</Text>
              <Text style={styles.infoValueSmall}>Kalkaji</Text>
            </View>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <View>
              <Text style={styles.infoLabelSmall}>Arrival</Text>
              <Text style={styles.infoValueSmall}>25 min</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.callDriverButton}>
            <Text style={styles.callDriverButtonText}>Call Driver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBookingButton}>
            <Text style={styles.cancelBookingButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Logo */}
      <View style={styles.bottomLogoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.bottomLogo}
          resizeMode="contain"
        />
      </View>
    </ScrollView>
  )
}

export default EmergencyScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  animationContainer: {
    width: '100%',
    marginBottom: 20,
  },
  ambulanceAnimation: {
    width: '100%',
    height: 130,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  alertBadgeText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  driverLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  mapContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonOverlayText: {
    color: '#0c4a6e',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  infoRowSingle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoLabelSmall: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  infoValueSmall: {
    fontSize: 15,
    color: '#0c4a6e',
    fontWeight: 'bold',
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  callDriverButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  callDriverButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBookingButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cancelBookingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomLogoContainer: {
    alignItems: 'center',
    marginTop: 0,
    paddingBottom: 20,
  },
  bottomLogo: {
    width: 100,
    height: 100,
    opacity: 0.6,
  },
})
