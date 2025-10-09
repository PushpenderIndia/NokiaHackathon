import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SPECIALITIES = [
  'General Physician',
  'Cardiologist',
  'Pediatrician',
  'Dermatologist',
  'Neurologist',
  'Orthopedic',
  'Gynecologist',
  'Psychiatrist',
];

const INCOMING_REQUESTS = [
  {
    id: '1',
    patientName: 'John Doe',
    age: 45,
    concern: 'Chest pain and breathing difficulty',
    waitTime: '2 min',
    severity: 'high',
  },
  {
    id: '2',
    patientName: 'Sarah Smith',
    age: 32,
    concern: 'Skin rash on arms',
    waitTime: '5 min',
    severity: 'medium',
  },
  {
    id: '3',
    patientName: 'Michael Brown',
    age: 28,
    concern: 'Persistent headache',
    waitTime: '8 min',
    severity: 'low',
  },
];

export default function DoctorDashboard() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [selectedSpeciality, setSelectedSpeciality] = useState('General Physician');
  const [showSpecialityPicker, setShowSpecialityPicker] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <TouchableOpacity
              style={styles.specialitySelector}
              onPress={() => setShowSpecialityPicker(!showSpecialityPicker)}
            >
              <Ionicons name="medical" size={20} color="#0284c7" />
              <Text style={styles.specialityText} numberOfLines={1}>
                {selectedSpeciality}
              </Text>
              <Ionicons
                name={showSpecialityPicker ? "chevron-up" : "chevron-down"}
                size={16}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.statusRight}>
            <Text style={styles.availabilityLabel}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#cbd5e1', true: '#86efac' }}
              thumbColor={isOnline ? '#16a34a' : '#f1f5f9'}
            />
          </View>
        </View>
      </View>

      {/* Speciality Picker Dropdown - Outside Banner */}
      {showSpecialityPicker && (
        <View style={styles.specialityDropdownContainer}>
          <ScrollView style={styles.specialityDropdown} nestedScrollEnabled>
            {SPECIALITIES.map((speciality, index) => (
              <TouchableOpacity
                key={speciality}
                style={[
                  styles.specialityOption,
                  selectedSpeciality === speciality && styles.specialityOptionSelected,
                  index === SPECIALITIES.length - 1 && styles.specialityOptionLast,
                ]}
                onPress={() => {
                  setSelectedSpeciality(speciality);
                  setShowSpecialityPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.specialityOptionText,
                    selectedSpeciality === speciality && styles.specialityOptionTextSelected,
                  ]}
                >
                  {speciality}
                </Text>
                {selectedSpeciality === speciality && (
                  <Ionicons name="checkmark" size={20} color="#0284c7" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Incoming Requests Section */}
      <ScrollView style={styles.requestsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Incoming Consultation Requests</Text>
          <View style={styles.requestCount}>
            <Text style={styles.requestCountText}>{INCOMING_REQUESTS.length}</Text>
          </View>
        </View>

        {isOnline ? (
          INCOMING_REQUESTS.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.patientInfo}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {request.patientName.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{request.patientName}</Text>
                    <Text style={styles.patientAge}>Age: {request.age}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: `${getSeverityColor(request.severity)}15` },
                  ]}
                >
                  <View
                    style={[
                      styles.severityDot,
                      { backgroundColor: getSeverityColor(request.severity) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.severityText,
                      { color: getSeverityColor(request.severity) },
                    ]}
                  >
                    {request.severity}
                  </Text>
                </View>
              </View>

              <View style={styles.concernContainer}>
                <Text style={styles.concernLabel}>Chief Complaint:</Text>
                <Text style={styles.concernText}>{request.concern}</Text>
              </View>

              <View style={styles.requestFooter}>
                <View style={styles.waitTimeContainer}>
                  <Ionicons name="time-outline" size={16} color="#64748b" />
                  <Text style={styles.waitTimeText}>Waiting: {request.waitTime}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.declineButton}>
                    <Ionicons name="close" size={20} color="#ef4444" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptButton}>
                    <Ionicons name="videocam" size={20} color="#fff" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.offlineContainer}>
            <Ionicons name="moon" size={64} color="#cbd5e1" />
            <Text style={styles.offlineTitle}>You're Offline</Text>
            <Text style={styles.offlineText}>
              Turn on availability to receive consultation requests
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  statusBanner: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flex: 1,
  },
  specialitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  specialityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
    flex: 1,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 12,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  specialityDropdownContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  specialityDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 280,
  },
  specialityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  specialityOptionLast: {
    borderBottomWidth: 0,
  },
  specialityOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  specialityOptionText: {
    fontSize: 15,
    color: '#475569',
  },
  specialityOptionTextSelected: {
    color: '#0284c7',
    fontWeight: '600',
  },
  requestsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  requestCount: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  requestCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  patientAge: {
    fontSize: 13,
    color: '#64748b',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  concernContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  concernLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  concernText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waitTimeText: {
    fontSize: 13,
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  offlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 250,
  },
});
