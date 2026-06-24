import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  SafeAreaView 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Clock, Calendar, MapPin, CheckCircle } from 'lucide-react-native';

export default function HistoryScreen() {
  const { token, apiUrl } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/attendance/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const renderLogItem = ({ item }) => {
    const isCheckIn = item.tipe === 'Check-In';
    
    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.logTypeRow}>
            <CheckCircle color={isCheckIn ? '#10b981' : '#f43f5e'} size={18} />
            <Text style={[styles.logType, isCheckIn ? styles.checkInText : styles.checkOutText]}>
              {item.tipe}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Clock color="#94a3b8" size={14} />
            <Text style={styles.logTime}>{formatTime(item.waktu)}</Text>
          </View>
        </View>

        <Text style={styles.logDateStr}>{formatDate(item.waktu)}</Text>
        
        {item.keterangan ? (
          <View style={styles.locationContainer}>
            <MapPin color="#6366f1" size={14} style={{ marginTop: 2 }} />
            <Text style={styles.locationText}>{item.keterangan}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Kehadiran</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#6366f1" size="large" />
          <Text style={styles.loadingText}>Memuat riwayat absensi...</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar color="#475569" size={48} />
              <Text style={styles.emptyText}>Tidak ada riwayat absensi ditemukan.</Text>
            </View>
          }
        />
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
  listContent: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  logCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logType: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  checkInText: {
    color: '#10b981',
  },
  checkOutText: {
    color: '#f43f5e',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logTime: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logDateStr: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  locationText: {
    color: '#94a3b8',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
});
