import { Link, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, Alert } from 'react-native'
import LottieView from 'lottie-react-native'
import { pollStatus, type StatusResponse } from '../services/api'

const ReportScreen = () => {
  const params = useLocalSearchParams<{ callId?: string }>()
  const [isLoading, setIsLoading] = useState(true)
  const [reportData, setReportData] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReportData = async () => {
      if (!params.callId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const data = await pollStatus(params.callId, {
          maxAttempts: 20,
          interval: 3000,
          onProgress: (attempt, max) => {
            console.log(`Polling report data: ${attempt}/${max}`)
          },
        })
        setReportData(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching report data:', err)
        setError('Failed to load report details')
        Alert.alert('Error', 'Could not load consultation report. Showing default data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [params.callId])

  // Extract medical record details with fallbacks
  const medicalRecord =
    reportData?.medical_record_details && typeof reportData.medical_record_details === 'object'
      ? reportData.medical_record_details
      : null

  const patientName = medicalRecord?.patient_information?.name || 'John Doe'
  const consultationDate = medicalRecord?.patient_information?.date || 'October 5, 2025'
  const duration = medicalRecord?.patient_information?.duration || '5 minutes 32 seconds'
  const chiefComplaint = medicalRecord?.chief_complaint || 'Patient reports persistent headache with occasional dizziness for the past 3 days.'
  const symptoms = medicalRecord?.reported_symptoms || [
    'Headache (moderate intensity, frontal region)',
    'Dizziness (intermittent)',
    'Mild nausea',
    'Light sensitivity'
  ]
  const aiAnalysis = medicalRecord?.ai_analysis ||
    'Based on the symptoms described, this appears to be consistent with tension-type headache or possible migraine. No red flag symptoms were identified. Recommend consultation with a primary care physician or neurologist for proper diagnosis.'
  const recommendedSpecialty = medicalRecord?.recommended_specialty || 'Neurologist or Primary Care Physician'

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading consultation report...</Text>
      </View>
    )
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consultation Report</Text>
        <Text style={styles.headerSubtitle}>AI Medical Triage Summary</Text>
        <LottieView
          source={require('../../assets/animations/DNA-Doctor.json')}
          autoPlay
          loop
          style={styles.dnaAnimation}
        />
      </View>

      {/* Patient Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Patient Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{patientName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date:</Text>
          <Text style={styles.infoValue}>{consultationDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duration:</Text>
          <Text style={styles.infoValue}>{duration}</Text>
        </View>
      </View>

      {/* Chief Complaint Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chief Complaint</Text>
        <Text style={styles.description}>
          {chiefComplaint}
        </Text>
      </View>

      {/* Symptoms Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reported Symptoms</Text>
        {symptoms.map((symptom, index) => (
          <View key={index} style={styles.symptomItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.symptomText}>{symptom}</Text>
          </View>
        ))}
      </View>

      {/* AI Analysis Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Analysis</Text>
        <Text style={styles.description}>
          {aiAnalysis}
        </Text>
      </View>

      {/* Recommended Specialist Card */}
      <View style={[styles.card, styles.highlightCard]}>
        <Text style={styles.cardTitle}>Recommended Specialist</Text>
        <Text style={styles.specialistName}>{recommendedSpecialty}</Text>
        <Text style={styles.urgencyLevel}>Urgency Level: Routine (Non-Emergency)</Text>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Find Matching Doctors</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Download Report PDF</Text>
      </TouchableOpacity>

      {/* Back to Home */}
      <Link href="/" asChild>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </Link>

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

export default ReportScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  dnaAnimation: {
    width: '100%',
    height: 200,
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  highlightCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#14b8a6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#0c4a6e',
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  symptomItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#14b8a6',
    marginRight: 8,
    fontWeight: 'bold',
  },
  symptomText: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  specialistName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 8,
  },
  urgencyLevel: {
    fontSize: 15,
    color: '#0c4a6e',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#14b8a6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#0c4a6e',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0c4a6e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomLogoContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 30,
  },
  bottomLogo: {
    width: 160,
    height: 160,
    opacity: 0.7,
  },
})
