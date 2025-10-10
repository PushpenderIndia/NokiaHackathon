import { Link, useRouter } from 'expo-router'
import React, { useState, useEffect, useRef } from 'react'
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, Alert, Platform, ActivityIndicator } from 'react-native'
import Vapi from '@vapi-ai/react-native'
import LottieView from 'lottie-react-native'
import { analyzeQuery } from '../services/api'

const VAPI_PUBLIC_KEY = '1046cad0-14a3-4b6b-bb62-4370bae50c86'

const FirstScreen = () => {
  const router = useRouter()
  const [transcript, setTranscript] = useState<Array<{speaker: string, text: string}>>([])
  const transcriptRef = useRef<Array<{speaker: string, text: string}>>([])
  const scrollViewRef = useRef<ScrollView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const [isConnected, setIsConnected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const vapiRef = useRef<any>(null)
  const lottieRef = useRef<LottieView>(null)
  const callStartTimeRef = useRef<Date | null>(null)

  // Pulse animation for doctor icon
  useEffect(() => {
    const pulse = Animated.loop(
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
    )
    pulse.start()
    return () => pulse.stop()
  }, [])

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [transcript])

  // Initialize Vapi on component mount
  useEffect(() => {
    vapiRef.current = new Vapi(VAPI_PUBLIC_KEY)

    // Set up event listeners
    vapiRef.current.on('call-start', () => {
      console.log('Call started')
      setIsConnected(true)
      callStartTimeRef.current = new Date()
      const newMessage = {
        speaker: 'doctor',
        text: 'Connected! The Symptom Assistant is listening...'
      }
      transcriptRef.current = [...transcriptRef.current, newMessage]
      setTranscript(prev => [...prev, newMessage])
    })

    vapiRef.current.on('call-end', async () => {
      console.log('Call ended')
      setIsConnected(false)
      const endMessage = {
        speaker: 'doctor',
        text: 'Call ended. Analyzing your consultation...'
      }
      transcriptRef.current = [...transcriptRef.current, endMessage]
      setTranscript(prev => [...prev, endMessage])

      // Trigger analysis with current transcript
      await handleCallAnalysis()
    })

    vapiRef.current.on('speech-start', () => {
      console.log('Assistant speech started')
    })

    vapiRef.current.on('speech-end', () => {
      console.log('Assistant speech ended')
    })

    vapiRef.current.on('message', (message: any) => {
      console.log('Message:', message)

      // Handle different message types
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const newMessage = {
          speaker: message.role === 'assistant' ? 'doctor' : 'patient',
          text: message.transcript
        }
        transcriptRef.current = [...transcriptRef.current, newMessage]
        setTranscript(prev => [...prev, newMessage])
      } else if (message.type === 'conversation-update') {
        // Handle conversation updates
        console.log('Conversation update:', message)
      }
    })

    vapiRef.current.on('error', (error: any) => {
      console.error('Vapi error:', error)
      Alert.alert('Error', 'Call connection failed')
    })

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [])

  const handleCallAnalysis = async () => {
    console.log('=== handleCallAnalysis started ===')
    setIsProcessing(true)

    try {
      // Calculate call duration
      const duration = callStartTimeRef.current
        ? Math.floor((new Date().getTime() - callStartTimeRef.current.getTime()) / 1000)
        : 0

      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      const durationStr = `${minutes} minutes ${seconds} seconds`

      // Generate unique call ID
      const callId = `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Format the entire transcript as a conversation using the ref (most up-to-date)
      const fullTranscript = transcriptRef.current
        .map(msg => `${msg.speaker === 'doctor' ? 'Doctor' : 'Patient'}: ${msg.text}`)
        .join('\n')

      // Build query for multi-agent API with full transcript
      const query = `Call ID: ${callId}. Patient name: Patient. Patient had a voice consultation lasting ${durationStr}.

Full conversation transcript:
${fullTranscript}`

      console.log('Generated Call ID:', callId)
      console.log('Call duration:', durationStr)
      console.log('Full transcript:', fullTranscript)
      console.log('Full query being sent to /analyze API:', query)
      console.log('Calling analyzeQuery API...')

      // Call multi-agent analyze API
      const analyzeResult = await analyzeQuery(query)
      console.log('Analysis result:', analyzeResult)

      if (analyzeResult.classification === 'emergency') {
        // Emergency detected
        Alert.alert(
          'Emergency Detected',
          'Emergency services have been notified. Redirecting to emergency tracking...',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push({
                  pathname: '/emergency',
                  params: { callId }
                })
              },
            },
          ]
        )
      } else {
        // Non-emergency
        Alert.alert(
          'Consultation Complete',
          'Your consultation report is ready. Redirecting...',
          [
            {
              text: 'View Report',
              onPress: () => {
                router.push({
                  pathname: '/report',
                  params: { callId }
                })
              },
            },
          ]
        )
      }
    } catch (error) {
      console.error('Error analyzing call:', error)
      Alert.alert(
        'Processing Error',
        'Failed to process consultation. Showing report with default data.',
        [
          {
            text: 'View Report',
            onPress: () => router.push('/report'),
          },
        ]
      )
    } finally {
      setIsProcessing(false)
      callStartTimeRef.current = null
    }
  }

  const startVapiCall = async () => {
    try {
      if (!vapiRef.current) {
        Alert.alert('Error', 'Vapi not initialized.')
        return
      }

      // Start call with inline/transient assistant configuration
      await vapiRef.current.start({
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an AI medical assistant helping patients describe their symptoms.
Be empathetic, ask clarifying questions about their symptoms, duration, severity, and any other relevant medical history.
Do not diagnose - your role is to gather comprehensive information to help match them with the right doctor.
Keep your responses concise and conversational. After gathering sufficient information about their symptoms, summarize what you learned.`
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel voice
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en"
        },
        clientMessages: [
          "transcript",
          "hang",
          "function-call",
          "speech-update",
          "metadata",
          "conversation-update"
        ],
        serverMessages: [
          "end-of-call-report",
          "status-update",
          "hang",
          "function-call"
        ],
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
        backgroundSound: "off",
        backchannelingEnabled: false,
        firstMessage: "Hello! I'm your AI medical assistant. I'm here to help understand your symptoms so we can find the right doctor for you. Can you tell me what's been bothering you?"
      })
    } catch (error: any) {
      console.error('Failed to start call:', error)
      Alert.alert('Error', error.message || 'Failed to start voice consultation')
    }
  }

  const handleStartCall = async () => {
    if (isConnected) {
      // End call
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    } else {
      // Start call
      await startVapiCall()
    }
  }

  return (
    <View style={styles.container}>
      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={styles.processingText}>Analyzing consultation...</Text>
            <Text style={styles.processingSubtext}>Please wait</Text>
          </View>
        </View>
      )}

      {/* Doctor Animation Container */}
      <View style={styles.doctorAnimationContainer}>
        <View style={styles.doctorIconWrapper}>
          <LottieView
            ref={lottieRef}
            source={require('../../assets/animations/ai-bot.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
          {isConnected && (
            <View style={styles.activePulse} />
          )}
        </View>
        <Text style={styles.doctorTitle}>Symptom Assistant</Text>
        <Text style={styles.doctorSubtitle}>
          {isConnected ? 'Listening...' : 'Tap below to start consultation'}
        </Text>
      </View>

      {/* Conversation Transcript Container */}
      <View style={styles.transcriptContainer}>
        <Text style={styles.transcriptTitle}>Conversation</Text>
        <ScrollView
          ref={scrollViewRef}
          style={styles.transcriptScrollView}
          showsVerticalScrollIndicator={false}
        >
          {transcript.map((message, index) => (
            <View key={index} style={styles.messageContainer}>
              <Text style={message.speaker === 'doctor' ? styles.aiMessage : styles.patientMessage}>
                {message.speaker === 'doctor' ? '🩺 Symptom Assistant: ' : '👤 You: '}
                {message.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Voice Control Button */}
      <TouchableOpacity
        style={[styles.voiceButton, isConnected && styles.voiceButtonActive]}
        onPress={handleStartCall}
      >
        <Text style={styles.voiceButtonText}>
          {isConnected ? '🔴 End Consultation' : '🎤 Start Consultation'}
        </Text>
      </TouchableOpacity>

      {/* Back Button */}
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
    </View>
  )
}

export default FirstScreen


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    padding: 20,
    paddingTop: 50,
  },
  doctorAnimationContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
  },
  doctorIconWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 70,
    shadowColor: '#14b8a6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  doctorIcon: {
    width: 100,
    height: 100,
  },
  lottieAnimation: {
    width: 140,
    height: 140,
  },
  activePulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#14b8a6',
    opacity: 0.2,
  },
  doctorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginTop: 16,
    marginBottom: 8,
  },
  doctorSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  transcriptContainer: {
    flex: 1,
    maxHeight: 200,
    backgroundColor: 'white',
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
  transcriptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 12,
    textAlign: 'center',
  },
  transcriptScrollView: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  aiMessage: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  patientMessage: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  voiceButton: {
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
  voiceButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  continueButton: {
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
  continueButtonText: {
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
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomLogoContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 10,
  },
  bottomLogo: {
    width: 160,
    height: 160,
    opacity: 0.7,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0c4a6e',
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
})
