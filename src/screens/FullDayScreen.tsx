import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { TimePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider } from 'react-native-paper';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { savePunchRecord, loadPunchHistory } from '../utils/storage';
import { MMKV } from 'react-native-mmkv';
import LinearGradient from 'react-native-linear-gradient';

const storage = new MMKV();
const { width } = Dimensions.get('window');

type PunchRecord = {
  type: 'fullDay' | 'halfDay' | 'shortLeave';
  punchIn: string;
  punchOut: string;
};

export default function FullDayScreen() {
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const [punchHistory, setPunchHistory] = useState<PunchRecord[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resetPulseAnim = useRef(new Animated.Value(1)).current;

  // Load history + intro animation
  useEffect(() => {
    const history = loadPunchHistory();
    setPunchHistory(history);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation when punched in
  useEffect(() => {
    if (punchInTime) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [punchInTime]);

  // 🔔 Notification
  const scheduleNotification = async (secondsFromNow: number) => {
    await notifee.createChannel({ id: 'default', name: 'Default Channel' });
    const date = new Date(Date.now() + secondsFromNow * 1000);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };
    await notifee.createTriggerNotification(
      {
        title: 'TimeSnap',
        body: 'Your punch-out time is up!',
        android: { channelId: 'default' },
      },
      trigger
    );
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 🕐 Punch In
  const handlePunchIn = async () => {
    animateButton();
    const now = new Date();
    const outTime = new Date(now.getTime() + 8.5 * 60 * 60 * 1000);
    setPunchInTime(now);
    setPunchOutTime(outTime);
    const secondsUntilOut = Math.max(0, Math.floor((outTime.getTime() - now.getTime()) / 1000));
    await scheduleNotification(secondsUntilOut);
    savePunchRecord({ type: 'fullDay', punchIn: now.toISOString(), punchOut: outTime.toISOString() });
    setPunchHistory(loadPunchHistory());
    Alert.alert(
      '✓ Punched In',
      `You punched in at ${now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}\nExpected Punch Out: ${outTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`
    );
  };

  // ⚙️ Manual Add
  const handleManualAdd = (hours: number, minutes: number) => {
    const now = new Date();
    const inTime = new Date(now);
    inTime.setHours(hours, minutes, 0, 0);
    const outTime = new Date(inTime.getTime() + 8.5 * 60 * 60 * 1000);
    savePunchRecord({ type: 'fullDay', punchIn: inTime.toISOString(), punchOut: outTime.toISOString() });
    setPunchHistory(loadPunchHistory());
    setShowPicker(false);
    Alert.alert(
      '✓ Added',
      `Manual Punch In: ${inTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}\nExpected Punch Out: ${outTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`
    );
  };

  // 🧹 Clear History
  const handleClearHistory = () => {
    Alert.alert('Confirm Delete', 'Delete all punch history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          storage.clearAll();
          setPunchHistory([]);
          Alert.alert('Cleared', 'All punch history deleted.');
        },
      },
    ]);
  };

  // 🔄 Reset current punch
  const handleResetPunch = () => {
    if (!punchInTime) return Alert.alert('No Active Punch', 'You have not punched in yet.');
    Animated.sequence([
      Animated.timing(resetPulseAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(resetPulseAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    Alert.alert('Confirm Reset', 'Reset current punch in/out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setPunchInTime(null);
          setPunchOutTime(null);
          Alert.alert('Reset Done', 'Punch times cleared.');
        },
      },
    ]);
  };

  return (
    <PaperProvider>
      <LinearGradient colors={['#667eea', '#00c6ff', '#2af598']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Full Day</Text>
            <Text style={styles.subtitle}>8.5 Hours Work Schedule</Text>
          </Animated.View>

          <Animated.View style={[styles.punchCard, { opacity: fadeAnim, transform: [{ scale: punchInTime ? pulseAnim : 1 }] }]}>
            {!punchInTime ? (
              <TouchableOpacity activeOpacity={0.8} onPress={handlePunchIn} style={styles.punchButton}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <LinearGradient colors={['#4facfe', '#00f2fe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
                    <Text style={styles.punchButtonText}>🕐 Punch In Now</Text>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            ) : (
              <View style={styles.timeInfo}>
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Punched In</Text>
                  <Text style={styles.timeValue}>
                    {punchInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.timeBox}>
                  <Text style={styles.timeLabel}>Expected Out</Text>
                  <Text style={styles.timeValue}>
                    {punchOutTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* 🔄 Reset Button */}
          {punchInTime && (
            <Animated.View style={{ transform: [{ scale: resetPulseAnim }] }}>
              <TouchableOpacity onPress={handleResetPunch} activeOpacity={0.8} style={styles.resetButton}>
                <LinearGradient colors={['#ff758c', '#ff7eb3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resetGradient}>
                  <Text style={styles.resetText}>🔄 Reset</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Manual Add */}
          <Animated.View style={[styles.manualCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.cardTitle}>⚙️ Manual Entry</Text>
            <TouchableOpacity style={styles.manualButton} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
              <Text style={styles.manualButtonText}>Select Punch In Time</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>

          <TimePickerModal
            visible={showPicker}
            onDismiss={() => setShowPicker(false)}
            onConfirm={({ hours, minutes }) => handleManualAdd(hours, minutes)}
            hours={9}
            minutes={30}
            label="Select Punch In Time"
          />

          {/* History */}
          <Animated.View style={[styles.historyCard, { opacity: fadeAnim }]}>
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.historyTitle}>📊 Recent History</Text>
                <Text style={styles.historySubtitle}>Last 5 days</Text>
              </View>
              {punchHistory.length > 0 && (
                <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {punchHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No history found</Text>
              </View>
            ) : (
              punchHistory.map((record, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.historyItem,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.historyItemHeader}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{record.type === 'fullDay' ? 'Full Day' : record.type}</Text>
                    </View>
                    <Text style={styles.historyDate}>{new Date(record.punchIn).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.historyTimes}>
                    <View style={styles.historyTimeItem}>
                      <Text style={styles.historyTimeLabel}>In</Text>
                      <Text style={styles.historyTimeValue}>
                        {new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Text>
                    </View>
                    <Text style={styles.historyArrow}>→</Text>
                    <View style={styles.historyTimeItem}>
                      <Text style={styles.historyTimeLabel}>Out</Text>
                      <Text style={styles.historyTimeValue}>
                        {new Date(record.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  punchCard: {
    width: width - 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  punchButton: { alignItems: 'center' },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 16,
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  punchButtonText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  timeBox: { alignItems: 'center', flex: 1 },
  timeLabel: { fontSize: 12, color: '#888', marginBottom: 8, fontWeight: '600' },
  timeValue: { fontSize: 28, fontWeight: '800', color: '#667eea' },
  divider: { width: 2, height: 50, backgroundColor: '#e0e0e0', marginHorizontal: 10 },

  // 🔄 Reset Button Styles
  resetButton: { width: width - 200, marginBottom: 20 },
  resetGradient: {
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#ff7eb3',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  resetText: { fontSize: 16, color: '#fff', fontWeight: '700' },

  manualCard: {
    width: width - 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 15 },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  manualButtonText: { fontSize: 16, color: '#555', fontWeight: '500' },
  arrow: { fontSize: 20, color: '#667eea', fontWeight: '700' },
  historyCard: {
    width: width - 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  historySubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  clearButton: { backgroundColor: '#ffe5e5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  clearText: { color: '#ff4444', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#888' },
  historyItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    backgroundColor: '#667eea',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  typeBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  historyDate: { fontSize: 12, color: '#999' },
  historyTimes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  historyTimeItem: { alignItems: 'center' },
  historyTimeLabel: { fontSize: 12, color: '#777', marginBottom: 4 },
  historyTimeValue: { fontSize: 18, fontWeight: '700', color: '#333' },
  historyArrow: { fontSize: 20, color: '#f5576c', fontWeight: '700' },
});
