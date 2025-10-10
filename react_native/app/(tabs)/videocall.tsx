import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {
  RTCView,
  MediaStream,
  mediaDevices,
} from '@daily-co/react-native-webrtc';
import Peer, { MediaConnection } from 'peerjs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { analyzeQuery, pollStatus, type AnalyzeResponse } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function VideoCall() {
  const router = useRouter();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [remotePeerId, setRemotePeerId] = useState<string>('');
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [peerReady, setPeerReady] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const peerInstance = useRef<Peer | null>(null);
  const currentCall = useRef<MediaConnection | null>(null);
  const callTimer = useRef<NodeJS.Timeout | null>(null);
  const callStartTime = useRef<Date | null>(null);

  useEffect(() => {
    requestPermissions();
    initializePeer();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isCallActive) {
      callTimer.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimer.current) {
        clearInterval(callTimer.current);
        callTimer.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (callTimer.current) {
        clearInterval(callTimer.current);
      }
    };
  }, [isCallActive]);

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const cameraGranted =
          granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED;
        const audioGranted =
          granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;

        if (!cameraGranted || !audioGranted) {
          Alert.alert('Permissions Required', 'Camera and microphone permissions are required');
        }
      } catch (err) {
        console.warn('Permission error:', err);
      }
    }
  };

  const initializePeer = () => {
    try {
      // Initialize PeerJS with cloud server
      const peer = new Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peer.on('open', (id) => {
        console.log('My peer ID is:', id);
        setPeerId(id);
        setPeerReady(true);
      });

      peer.on('call', async (call) => {
        console.log('Incoming call from:', call.peer);

        Alert.alert(
          'Incoming Call',
          `Call from ${call.peer}`,
          [
            {
              text: 'Decline',
              onPress: () => {
                call.close();
              },
              style: 'cancel',
            },
            {
              text: 'Accept',
              onPress: () => answerCall(call),
            },
          ],
          { cancelable: false }
        );
      });

      peer.on('connection', (conn) => {
        console.log('Data connection established');
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        Alert.alert('Connection Error', err.message);
        setPeerReady(false);
      });

      peer.on('disconnected', () => {
        console.log('Peer disconnected');
        setPeerReady(false);
        // Try to reconnect
        peer.reconnect();
      });

      peerInstance.current = peer;
    } catch (error) {
      console.error('Failed to initialize PeerJS:', error);
      Alert.alert('Error', 'Failed to initialize peer connection');
    }
  };

  const answerCall = async (call: MediaConnection) => {
    try {
      setIsCalling(true);
      const stream = await startLocalStream();

      // Answer the call with our stream
      call.answer(stream);

      currentCall.current = call;

      // Listen for the remote stream
      call.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        setRemoteStream(remoteStream as unknown as MediaStream);
        setIsCallActive(true);
        setIsCalling(false);
        callStartTime.current = new Date();
      });

      call.on('close', () => {
        console.log('Call closed');
        endCall();
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        Alert.alert('Call Error', err.message);
        endCall();
      });
    } catch (error) {
      console.error('Error answering call:', error);
      Alert.alert('Error', 'Failed to answer call');
      setIsCalling(false);
    }
  };

  const startLocalStream = async (): Promise<MediaStream> => {
    try {
      const stream = (await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 1280,
          height: 720,
          frameRate: 30,
          facingMode: 'user',
        },
      })) as unknown as MediaStream;

      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      Alert.alert('Error', 'Could not access camera/microphone');
      throw error;
    }
  };

  const startCall = async () => {
    if (!remotePeerId.trim()) {
      Alert.alert('Error', 'Please enter a peer ID to call');
      return;
    }

    if (!peerReady || !peerInstance.current) {
      Alert.alert('Error', 'Peer connection not ready');
      return;
    }

    setIsCalling(true);

    try {
      const stream = await startLocalStream();

      // Make the call
      const call = peerInstance.current.call(remotePeerId, stream as any);

      if (!call) {
        throw new Error('Failed to initiate call');
      }

      currentCall.current = call;

      // Listen for the remote stream
      call.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        setRemoteStream(remoteStream as unknown as MediaStream);
        setIsCallActive(true);
        setIsCalling(false);
        callStartTime.current = new Date();
      });

      call.on('close', () => {
        console.log('Call closed');
        endCall();
      });

      call.on('error', (err) => {
        console.error('Call error:', err);
        Alert.alert('Call Error', 'Failed to establish call');
        setIsCalling(false);
        endCall();
      });
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Error', 'Failed to start call');
      setIsCalling(false);
    }
  };

  const handleCallAnalysis = async () => {
    console.log('handleCallAnalysis started');
    setIsProcessing(true);

    try {
      // Calculate call duration
      const duration = callStartTime.current
        ? Math.floor((new Date().getTime() - callStartTime.current.getTime()) / 1000)
        : 0;

      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationStr = `${minutes} minutes ${seconds} seconds`;

      // Generate a unique call ID
      const callId = `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // For demo purposes, using a sample query with embedded call_id
      // In production, this should be the actual transcription from the call
      // You can alternate between emergency and non-emergency scenarios for testing
      const isEmergencyTest = Math.random() > 0.5; // Random for demo

      let query: string;
      if (isEmergencyTest) {
        query = `Call ID: ${callId}. Patient name: Emergency Patient. Location: Patient Home. Patient had a video consultation lasting ${durationStr}. Patient is experiencing severe chest pain radiating to left arm with heavy sweating and shortness of breath.`;
      } else {
        query = `Call ID: ${callId}. Patient name: John Smith. Patient had a video consultation lasting ${durationStr}. Patient reported mild headaches and feeling tired for the past 3 days.`;
      }

      console.log('Generated Call ID:', callId);
      console.log('Call duration:', durationStr);
      console.log('Full query being sent to /analyze API:', query);
      console.log('Calling analyzeQuery API...');

      // Step 1: Analyze the query with multi-agent API
      const analyzeResult = await analyzeQuery(query);
      console.log('Analysis result:', analyzeResult);

      // Step 2: Poll status API to get the stored data from backend
      console.log('Polling status API for call ID:', callId);
      const statusResult = await pollStatus(callId, {
        maxAttempts: 5,
        interval: 2000,
        onProgress: (attempt, maxAttempts) => {
          console.log(`Polling status: attempt ${attempt}/${maxAttempts}`);
        }
      });
      console.log('Status result:', statusResult);

      if (analyzeResult.classification === 'emergency') {
        // Emergency detected - extract call_id from query or use from result
        const extractedCallId = analyzeResult.result.call_sid || callId;

        Alert.alert(
          'Emergency Detected',
          'Emergency services have been notified. Redirecting to emergency tracking...',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to emergency screen with verified data
                router.push({
                  pathname: '/emergency',
                  params: { callId: callId } // Use the callId we sent in the query
                });
              },
            },
          ]
        );
      } else {
        // Non-emergency - extract call_id from result
        const extractedCallId = analyzeResult.result.call_id || callId;

        Alert.alert(
          'Consultation Complete',
          'Your consultation report is ready. Redirecting...',
          [
            {
              text: 'View Report',
              onPress: () => {
                // Navigate to report screen with verified data
                router.push({
                  pathname: '/report',
                  params: { callId: callId } // Use the callId we sent in the query
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error analyzing call:', error);
      // Don't show error alert, just silently handle it
      setIsProcessing(false);
      callStartTime.current = null;
    } finally {
      setIsProcessing(false);
      callStartTime.current = null;
    }
  };

  const endCall = () => {
    console.log('endCall triggered, callStartTime:', callStartTime.current);

    // Check if we should trigger analysis BEFORE clearing state
    const shouldAnalyze = callStartTime.current !== null;

    // Close the call
    if (currentCall.current) {
      currentCall.current.close();
      currentCall.current = null;
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track: any) => track.stop());
      setLocalStream(null);
    }

    // Clear remote stream
    setRemoteStream(null);

    setIsCallActive(false);
    setIsCalling(false);
    setIsMuted(false);
    setIsVideoOff(false);

    // Trigger analysis if call had started
    if (shouldAnalyze) {
      console.log('Triggering handleCallAnalysis...');
      handleCallAnalysis();
    } else {
      console.log('Call analysis skipped - no callStartTime');
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        (audioTrack as any).enabled = !(audioTrack as any).enabled;
        setIsMuted(!(audioTrack as any).enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        (videoTrack as any).enabled = !(videoTrack as any).enabled;
        setIsVideoOff(!(videoTrack as any).enabled);
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Speaker toggle would be handled by native audio routing
    // This is a visual toggle for now
  };

  const flipCamera = async () => {
    if (!localStream) return;

    try {
      // Stop current video track
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        (videoTrack as any).stop();
      }

      // Get new stream with flipped camera
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      const newStream = (await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 1280,
          height: 720,
          frameRate: 30,
          facingMode: newFacingMode,
        },
      })) as unknown as MediaStream;

      // Replace track in the peer connection
      if (currentCall.current && currentCall.current.peerConnection) {
        const sender = (currentCall.current.peerConnection as any)
          .getSenders()
          .find((s: any) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newStream.getVideoTracks()[0]);
        }
      }

      setLocalStream(newStream);
      setFacingMode(newFacingMode);
    } catch (error) {
      console.error('Error flipping camera:', error);
      Alert.alert('Error', 'Could not flip camera');
    }
  };

  const cleanup = () => {
    endCall();
    if (peerInstance.current) {
      peerInstance.current.destroy();
      peerInstance.current = null;
    }
  };

  // Setup Screen - Not in call
  if (!isCallActive && !isCalling) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.setupContainer}>
          <View style={styles.setupHeader}>
            <View style={styles.setupTitleRow}>
              <TouchableOpacity
                style={styles.backButtonSetup}
                onPress={() => router.push('/')}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.setupTitle}>Video Call</Text>
              <View style={styles.headerSpacer} />
            </View>
            {peerId && (
              <View style={styles.peerIdContainer}>
                <Text style={styles.label}>Your ID:</Text>
                <Text style={styles.peerId} selectable>
                  {peerId}
                </Text>
                <Text style={styles.statusText}>
                  {peerReady ? '🟢 Ready' : '🔴 Connecting...'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter Contact ID</Text>
            <TextInput
              style={styles.input}
              value={remotePeerId}
              onChangeText={setRemotePeerId}
              placeholder="Enter peer ID to call"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.startCallButton, !peerReady && styles.disabledButton]}
              onPress={startCall}
              disabled={!peerReady}
            >
              <Text style={styles.startCallButtonText}>Start Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Active Call Screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

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

      {/* Video Container - Full Screen */}
      <View style={styles.videoContainer}>
        {/* Remote Video (or Audio-Only Mode) */}
        {remoteStream && !isVideoOff ? (
          <RTCView
            streamURL={(remoteStream as any).toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
            mirror={false}
          />
        ) : (
          <View style={styles.audioOnlyContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {remotePeerId.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Header Overlay */}
        <View style={styles.callHeader}>
          <TouchableOpacity style={styles.backButton} onPress={endCall}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.callInfo}>
            <Text style={styles.contactName}>
              {remotePeerId.substring(0, 12)}...
            </Text>
            <Text style={styles.callDurationText}>{formatCallDuration(callDuration)}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Local Video PIP (only when video is on) */}
        {localStream && !isVideoOff && (
          <View style={styles.pipContainer}>
            <RTCView
              streamURL={(localStream as any).toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={facingMode === 'user'}
            />
          </View>
        )}

        {/* Control Bar */}
        <View style={styles.controlsOverlay}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={toggleVideo}
            >
              <Ionicons
                name={isVideoOff ? "videocam-off" : "videocam"}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            {!isVideoOff && (
              <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
                <Ionicons
                  name="camera-reverse"
                  size={28}
                  color="#fff"
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.controlButton, !isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <Ionicons
                name={isSpeakerOn ? "volume-high" : "volume-mute"}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
              <MaterialIcons
                name="call-end"
                size={30}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Setup Screen Styles
  setupContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  setupHeader: {
    marginBottom: 48,
  },
  setupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButtonSetup: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  peerIdContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  peerId: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#888',
  },
  inputContainer: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  startCallButton: {
    backgroundColor: '#14b8a6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  startCallButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.5,
  },

  // Active Call Screen Styles
  videoContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  audioOnlyContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Header Overlay
  callHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  callInfo: {
    flex: 1,
    alignItems: 'center',
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  callDurationText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  headerSpacer: {
    width: 40,
  },

  // PIP Window
  pipContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#14b8a6',
    backgroundColor: '#000',
  },
  localVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },

  // Controls Overlay
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Processing Overlay
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
