import React, { useContext, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  SafeAreaView, 
  Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Mail, Briefcase, MapPin, Phone, Landmark } from 'lucide-react-native';

export default function ProfileScreen() {
  const { employee, logout, token, apiUrl, setEmployee } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const fetchFullProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEmployee(data.employee);
      }
    } catch (e) {
      console.error('Error fetching full profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#6366f1" size="large" />
          <Text style={styles.loadingText}>Memuat data profil...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar and Name */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {employee?.nama_lengkap ? employee.nama_lengkap.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.nameText}>{employee?.nama_lengkap}</Text>
            <Text style={styles.roleText}>{employee?.pekerjaan || 'Karyawan'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{employee?.status || 'Active'}</Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Informasi Pekerjaan</Text>

            <View style={styles.infoRow}>
              <Briefcase color="#818cf8" size={20} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Nomor Induk Karyawan (NIK)</Text>
                <Text style={styles.infoValue}>{employee?.nik || '-'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Landmark color="#818cf8" size={20} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Divisi</Text>
                <Text style={styles.infoValue}>{employee?.divisi || '-'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MapPin color="#818cf8" size={20} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Cabang Penempatan</Text>
                <Text style={styles.infoValue}>{employee?.cabang || '-'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Informasi Kontak & Pribadi</Text>

            <View style={styles.infoRow}>
              <Mail color="#818cf8" size={20} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{employee?.email || '-'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Phone color="#818cf8" size={20} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>No. Handphone</Text>
                <Text style={styles.infoValue}>{employee?.no_hp || '-'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <User color="#818cf8" size={20} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Jenis Kelamin</Text>
                <Text style={styles.infoValue}>{employee?.jenis_kelamin || '-'}</Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color="#ffffff" size={20} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
    gap: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  nameText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  roleText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    marginTop: 12,
  },
  badgeText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
