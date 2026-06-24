import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  ScrollView, 
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import * as Location from 'expo-location';
import { Camera, CameraView } from 'expo-camera';
import { MapPin, Camera as CameraIcon, CheckCircle2, ChevronLeft, Send, Sparkles } from 'lucide-react-native';

export default function CheckInOutScreen({ route, navigation }) {
  const { type } = route.params;
  const { token, apiUrl } = useContext(AuthContext);

  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locError, setLocError] = useState('');
  
  // Camera state
  const [hasCamPermission, setHasCamPermission] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [facing, setFacing] = useState('front');

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Hold to submit simulation state
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef(null);

  // Camera Ref
  const cameraRef = useRef(null);

  useEffect(() => {
    // 1. Get GPS Location
    (async () => {
      setLocating(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Izin akses lokasi ditolak. Lokasi GPS diperlukan.');
        setLocating(false);
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);
      } catch (err) {
        setLocError('Gagal mendeteksi lokasi GPS Anda.');
      } finally {
        setLocating(false);
      }
    })();

    // 2. Request Camera Permission
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCamPermission(status === 'granted');
    })();
  }, []);

  const startCamera = () => {
    if (hasCamPermission) {
      setCameraActive(true);
    } else {
      Alert.alert('Izin Kamera', 'Aplikasi memerlukan izin kamera untuk selfie absensi.');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const options = { quality: 0.5, skipProcessing: false };
        const photo = await cameraRef.current.takePictureAsync(options);
        setCapturedPhoto(photo.uri);
        setCameraActive(false);
      } catch (error) {
        console.error('Failed to take photo:', error);
        Alert.alert('Error', 'Gagal mengambil gambar.');
      }
    }
  };

  // Hold-to-confirm button handlers
  const handlePressIn = () => {
    if (locating || submitting) return;
    
    // Increment progress
    let start = Date.now();
    holdTimer.current = setInterval(() => {
      let elapsed = Date.now() - start;
      let progress = Math.min(elapsed / 1500, 1); // 1.5 seconds hold
      setHoldProgress(progress);
      
      if (progress >= 1) {
        clearInterval(holdTimer.current);
        triggerSubmit();
      }
    }, 50);
  };

  const handlePressOut = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
    }
    if (holdProgress < 1) {
      setHoldProgress(0);
    }
  };

  const triggerSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        type: type,
        latitude: location?.coords?.latitude || null,
        longitude: location?.coords?.longitude || null,
        keterangan: notes + (capturedPhoto ? ' [Selfie uploaded]' : '')
      };

      const response = await fetch(`${apiUrl}/api/attendance/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Absen Berhasil', `${type} Anda berhasil dicatat pada pukul ${new Date(data.data.waktu).toLocaleTimeString('id-ID')}`, [
          { text: 'OK', onPress: () => navigation.replace('Home') }
        ]);
      } else {
        Alert.alert('Gagal', data.message || 'Terjadi kesalahan sistem.');
        setHoldProgress(0);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal menghubungi server backend.');
      setHoldProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* GPS Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin color="#6366f1" size={22} />
            <Text style={styles.cardTitle}>Lokasi GPS Anda</Text>
          </View>

          {locating ? (
            <View style={styles.row}>
              <ActivityIndicator color="#6366f1" style={{ marginRight: 10 }} />
              <Text style={styles.cardText}>Mendeteksi koordinat...</Text>
            </View>
          ) : locError ? (
            <Text style={styles.errorText}>{locError}</Text>
          ) : (
            <View>
              <Text style={styles.coordsText}>Latitude: {location?.coords?.latitude?.toFixed(6)}</Text>
              <Text style={styles.coordsText}>Longitude: {location?.coords?.longitude?.toFixed(6)}</Text>
              <Text style={styles.accuracyText}>Akurasi: ±{location?.coords?.accuracy?.toFixed(1)} meter</Text>
            </View>
          )}
        </View>

        {/* Selfie Camera Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CameraIcon color="#10b981" size={22} />
            <Text style={styles.cardTitle}>Selfie Kehadiran (Opsional)</Text>
          </View>

          {cameraActive ? (
            <View style={styles.cameraWrapper}>
              <CameraView 
                style={styles.cameraPreview}
                facing={facing}
                ref={cameraRef}
              >
                <View style={styles.cameraOverlay}>
                  <TouchableOpacity style={styles.snapButton} onPress={takePicture}>
                    <View style={styles.snapInner} />
                  </TouchableOpacity>
                </View>
              </CameraView>
            </View>
          ) : capturedPhoto ? (
            <View style={styles.photoContainer}>
              <Text style={styles.photoSuccessText}>Selfie berhasil diambil!</Text>
              <TouchableOpacity style={styles.retakeBtn} onPress={startCamera}>
                <Text style={styles.retakeBtnText}>Ambil Ulang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cameraPlaceholder} onPress={startCamera}>
              <CameraIcon color="#64748b" size={40} />
              <Text style={styles.cameraPlaceholderText}>Ketuk untuk Ambil Foto Selfie</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitleNotes}>Catatan Tambahan</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="Tulis catatan (misal: tugas luar, meeting klien, dll)..."
            placeholderTextColor="#64748b"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Hold to Confirm Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity 
            style={[
              styles.holdButton,
              (locating || submitting) && styles.disabledButton
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            disabled={locating || submitting}
          >
            {/* Animated Background Progress bar */}
            <View style={[styles.progressOverlay, { width: `${holdProgress * 100}%` }]} />
            
            <View style={styles.holdContent}>
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : holdProgress > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Sparkles color="#ffffff" size={20} className="animate-spin" />
                  <Text style={styles.holdText}>Tahan terus... {Math.round(holdProgress * 100)}%</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Send color="#ffffff" size={20} />
                  <Text style={styles.holdText}>Tekan & Tahan untuk Absen</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.holdDesc}>Tahan selama 1,5 detik untuk memvalidasi absensi Anda</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 24,
    gap: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cardTitleNotes: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  cardText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  coordsText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  accuracyText: {
    color: '#818cf8',
    fontSize: 13,
    marginTop: 6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    height: 140,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  cameraPlaceholderText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
  },
  cameraWrapper: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraOverlay: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  snapButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
  },
  photoContainer: {
    height: 140,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoSuccessText: {
    color: '#34d399',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 12,
  },
  retakeBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retakeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderColor: '#334155',
    borderWidth: 1,
    color: '#ffffff',
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
  },
  submitContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  holdButton: {
    width: '100%',
    height: 58,
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#334155',
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3b82f6', // Bright blue progress overlay
  },
  holdContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  holdText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  holdDesc: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
