import React, { useContext, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl, 
  SafeAreaView, 
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LogIn, LogOut, Clock, Calendar, RefreshCw, User, Award, CheckCircle2 } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const { employee, logout, token, apiUrl } = useContext(AuthContext);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [todayLogs, setTodayLogs] = useState([]);
  const [checkInTime, setCheckInTime] = useState('--:--');
  const [checkOutTime, setCheckOutTime] = useState('--:--');

  // Real-time ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Clock
      let hh = String(now.getHours()).padStart(2, '0');
      let mm = String(now.getMinutes()).padStart(2, '0');
      let ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss}`);

      // Date
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('id-ID', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAttendanceToday = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/attendance/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Filter logs matching today's date in YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0]; // UTC today, but let's check local
        
        // Let's filter local today
        const offset = 7 * 60; // Jakarta is UTC+7
        const localTodayStr = new Date(new Date().getTime() + (offset + new Date().getTimezoneOffset()) * 60 * 1000)
                              .toISOString().split('T')[0];

        const todayRecords = data.logs.filter(log => log.waktu.startsWith(localTodayStr));
        setTodayLogs(todayRecords);

        // Find Check-In and Check-Out times
        const checkIn = todayRecords.find(log => log.tipe === 'Check-In');
        const checkOut = todayRecords.find(log => log.tipe === 'Check-Out');

        if (checkIn) {
          const time = new Date(checkIn.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          setCheckInTime(time);
        } else {
          setCheckInTime('--:--');
        }

        if (checkOut) {
          const time = new Date(checkOut.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          setCheckOutTime(time);
        } else {
          setCheckOutTime('--:--');
        }
      }
    } catch (e) {
      console.error('Error fetching today attendance:', e);
    }
  };

  useEffect(() => {
    fetchAttendanceToday();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceToday();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header Profile Info */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {employee?.nama_lengkap ? employee.nama_lengkap.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>Selamat Datang,</Text>
            <Text style={styles.nameText}>{employee?.nama_lengkap}</Text>
            <Text style={styles.nikText}>NIK: {employee?.nik} • {employee?.divisi || 'Staff'}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <RefreshCw color="#a5b4fc" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
      >
        {/* Clock Card */}
        <View style={styles.clockCard}>
          <Clock color="#818cf8" size={32} style={styles.clockIcon} />
          <Text style={styles.timeText}>{currentTime || '00:00:00'}</Text>
          <View style={styles.dateRow}>
            <Calendar color="#94a3b8" size={16} />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>

        {/* Status Grid */}
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <LogIn color="#10b981" size={24} />
            <Text style={styles.statusLabel}>Absen Masuk</Text>
            <Text style={[styles.statusTime, checkInTime !== '--:--' && styles.activeTime]}>
              {checkInTime}
            </Text>
          </View>

          <View style={styles.statusCard}>
            <LogOut color="#f43f5e" size={24} />
            <Text style={styles.statusLabel}>Absen Keluar</Text>
            <Text style={[styles.statusTime, checkOutTime !== '--:--' && styles.activeTimeOut]}>
              {checkOutTime}
            </Text>
          </View>
        </View>

        {/* Action Panel */}
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: '#312e81' }]}
            onPress={() => navigation.navigate('CheckInOut', { type: 'Check-In' })}
          >
            <LogIn color="#34d399" size={28} />
            <Text style={styles.menuItemTitle}>Absen Masuk</Text>
            <Text style={styles.menuItemDesc}>Catat kehadiran masuk</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: '#4c0519' }]}
            onPress={() => {
              if (checkInTime === '--:--') {
                Alert.alert(
                  'Belum Absen Masuk',
                  'Anda harus melakukan Absen Masuk terlebih dahulu sebelum bisa melakukan Absen Keluar.'
                );
              } else {
                navigation.navigate('CheckInOut', { type: 'Check-Out' });
              }
            }}
          >
            <LogOut color="#fb7185" size={28} />
            <Text style={styles.menuItemTitle}>Absen Keluar</Text>
            <Text style={styles.menuItemDesc}>Catat pulang kerja</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  welcomeText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nikText: {
    color: '#818cf8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  refreshBtn: {
    padding: 10,
    backgroundColor: '#334155',
    borderRadius: 12,
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  clockCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clockIcon: {
    marginBottom: 12,
  },
  timeText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'monospace',
    letterSpacing: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  statusTime: {
    color: '#475569',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
  },
  activeTime: {
    color: '#10b981',
  },
  activeTimeOut: {
    color: '#f43f5e',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  menuGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  menuItem: {
    flex: 1,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
  },
  menuItemDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },
  activityList: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyActivity: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  activityType: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activityDetail: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  activityTimeStr: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
});
