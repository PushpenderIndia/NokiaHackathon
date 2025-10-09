import { Link } from 'expo-router'
import React from 'react'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import LottieView from 'lottie-react-native'
import { Ionicons } from '@expo/vector-icons'

export default function Index() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Doctor Animation */}
      <View style={styles.animationContainer}>
        <LottieView
          source={require('../../assets/animations/doctor.json')}
          autoPlay
          loop
          style={styles.doctorAnimation}
        />
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome to HealthCare</Text>
        <Text style={styles.welcomeSubtitle}>Your health, our priority</Text>
      </View>

      {/* Services Grid */}
      <View style={styles.servicesGrid}>
        <Link href="/firstscreen" asChild>
          <TouchableOpacity style={styles.serviceCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="medical" size={32} color="#0284c7" />
            </View>
            <Text style={styles.serviceTitle}>Start Triage</Text>
            <Text style={styles.serviceSubtitle}>For Patients</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/doctor" asChild>
          <TouchableOpacity style={styles.serviceCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="briefcase" size={32} color="#16a34a" />
            </View>
            <Text style={styles.serviceTitle}>Dashboard</Text>
            <Text style={styles.serviceSubtitle}>For Doctors</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/emergency" asChild>
          <TouchableOpacity style={styles.serviceCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="warning" size={32} color="#dc2626" />
            </View>
            <Text style={styles.serviceTitle}>Emergency</Text>
            <Text style={styles.serviceSubtitle}>Ambulance</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/videocall" asChild>
          <TouchableOpacity style={styles.serviceCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#ede9fe' }]}>
              <Ionicons name="videocam" size={32} color="#7c3aed" />
            </View>
            <Text style={styles.serviceTitle}>Video Call</Text>
            <Text style={styles.serviceSubtitle}>Consultation</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  animationContainer: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  doctorAnimation: {
    width: '100%',
    height: '100%',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
})
