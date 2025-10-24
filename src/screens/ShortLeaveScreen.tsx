import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { TimePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider } from 'react-native-paper';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import LinearGradient from 'react-native-linear-gradient';
import { savePunchRecord, loadPunchHistory } from '../utils/storage';
import { MMKV } from 'react-native-mmkv';

const { width } = Dimensions.get('window');
const storage = new MMKV();

type PunchRecord = {
  type: 'fullDay' | 'halfDay' | 'shortLeave';
  leaveType?: 'firstHalf' | 'secondHalf';
  punchIn: string;
  punchOut: string;
};

export default function ShortLeaveScreen() {
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const [leaveType, setLeaveType] = useState<'firstHalf' | 'secondHalf'>('firstHalf');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: '🌅 First Half', value: 'firstHalf' },
    { label: '🌆 Second Half', value: 'secondHalf' },
  ]);
  const [punchHistory, setPunchHistory] = useState<PunchRecord[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const history = await loadPunchHistory();
      setPunchHistory(history);
    };
    fetchHistory();
  }, []);

  const scheduleNotification = async (secondsFromNow: number) => {
    await notifee.createChannel({ id: 'default', name: 'Default Channel' });
    const date = new Date(Date.now() + secondsFromNow * 1000);
    const trigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: date.getTime() };
    await notifee.createTriggerNotification(
      {
        title: 'TimeSnap',
        body: 'Your short leave punch-out time is up!',
        android: { channelId: 'default' },
      },
      trigger
    );
  };

  const calculatePunchOut = (inTime: Date): Date => {
    const punchOut = new Date(inTime);
    punchOut.setMinutes(punchOut.getMinutes() + 390); // 6.5 hours
    return punchOut;
  };

  const handlePunchIn = async () => {
    const now = new Date();
    const outTime = calculatePunchOut(now);
    setPunchInTime(now);
    setPunchOutTime(outTime);
    const secondsUntilOut = Math.max(0, Math.floor((outTime.getTime() - now.getTime()) / 1000));

    await scheduleNotification(secondsUntilOut);

    await savePunchRecord({
      type: 'shortLeave',
      punchIn: now.toISOString(),
      punchOut: outTime.toISOString(),
      leaveType,
    });

    const history = await loadPunchHistory();
    setPunchHistory(history);

    Alert.alert(
      '✓ Punched In',
      `You punched in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}\nExpected Punch Out: ${outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`
    );
  };

  const handleManualAdd = async (hours: number, minutes: number) => {
    const now = new Date();
    const inTime = new Date(now);
    inTime.setHours(hours, minutes, 0, 0);
    const outTime = calculatePunchOut(inTime);

    await savePunchRecord({
      type: 'shortLeave',
      punchIn: inTime.toISOString(),
      punchOut: outTime.toISOString(),
      leaveType,
    });

    const history = await loadPunchHistory();
    setPunchHistory(history);
    setShowPicker(false);

    Alert.alert(
      '✓ Added',
      `Manual Punch In: ${inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}\nExpected Punch Out: ${outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`
    );
  };

  const handleReset = () => {
    setPunchInTime(null);
    setPunchOutTime(null);
    Alert.alert('Reset', 'Punch In/Out reset successfully.');
  };

  const handleClearHistory = () => {
    Alert.alert('Confirm Delete', 'Delete all punch history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          storage.delete('punchHistory');
          setPunchHistory([]);
          Alert.alert('Cleared', 'Punch history deleted.');
        },
      },
    ]);
  };

  return (
    <PaperProvider>
      <LinearGradient colors={['#fa709a', '#fee140', '#ffeaa7']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.icon}>🕒</Text>
            <Text style={styles.title}>Short Leave</Text>
            <Text style={styles.subtitle}>Quick Break Work Mode</Text>
          </View>

          <View style={styles.punchCard}>
            {!punchInTime ? (
              <>
                <Text style={styles.selectLabel}>Select Half</Text>
                <View style={{ zIndex: 1000, marginBottom: 20 }}>
                  <DropDownPicker
                    open={open}
                    value={leaveType}
                    items={items}
                    setOpen={setOpen}
                    setValue={setLeaveType}
                    setItems={setItems}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    placeholderStyle={styles.dropdownPlaceholder}
                  />
                </View>

                <TouchableOpacity activeOpacity={0.8} onPress={handlePunchIn} style={styles.punchButton}>
                  <LinearGradient
                    colors={['#f093fb', '#f5576c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.punchButtonText}>🕐 Punch In Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
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

                {/* Reset Button */}
                <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                  <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.manualCard}>
            <Text style={styles.cardTitle}>⚙️ Manual Entry</Text>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.manualButtonText}>Select Punch In Time</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>

          <TimePickerModal
            visible={showPicker}
            onDismiss={() => setShowPicker(false)}
            onConfirm={({ hours, minutes }) => handleManualAdd(hours, minutes)}
            hours={9}
            minutes={30}
            label="Select Punch In Time"
          />

          <View style={styles.historyHeaderContainer}>
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
            punchHistory.map((record, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>Short Leave</Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {new Date(record.punchIn).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.historyTimes}>
                  <View style={styles.historyTimeItem}>
                    <Text style={styles.historyTimeLabel}>In</Text>
                    <Text style={styles.historyTimeValue}>
                      {new Date(record.punchIn).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>
                  <Text style={styles.historyArrow}>→</Text>
                  <View style={styles.historyTimeItem}>
                    <Text style={styles.historyTimeLabel}>Out</Text>
                    <Text style={styles.historyTimeValue}>
                      {new Date(record.punchOut).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  icon: { fontSize: 48, marginBottom: 10 },
  title: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
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
  selectLabel: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 12, textAlign: 'center' },
  dropdown: { borderColor: '#e0e0e0', borderRadius: 12, backgroundColor: '#f9f9f9' },
  dropdownContainer: { borderColor: '#e0e0e0', borderRadius: 12 },
  dropdownText: { fontSize: 16, fontWeight: '500' },
  dropdownPlaceholder: { color: '#999' },
  punchButton: { alignItems: 'center' },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 16,
    shadowColor: '#f5576c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  punchButtonText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap' },
  timeBox: { alignItems: 'center', flex: 1 },
  timeLabel: { fontSize: 12, color: '#888', marginBottom: 8, fontWeight: '600' },
  timeValue: { fontSize: 28, fontWeight: '800', color: '#f5576c' },
  divider: { width: 2, height: 50, backgroundColor: '#e0e0e0', marginHorizontal: 10 },
  resetButton: {
    marginTop: 15,
    backgroundColor: '#ffe5e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  resetText: { color: '#ff4444', fontWeight: '700', fontSize: 14 },
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
  arrow: { fontSize: 20, color: '#f5576c', fontWeight: '700' },
  historyHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: width - 40,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  historyTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  historySubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  clearButton: {
    backgroundColor: '#ffe5e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearText: { color: '#ff4444', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40, width: width - 40 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#888' },
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f5576c',
    width: width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: { backgroundColor: '#f5576c', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  typeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  historyDate: { fontSize: 13, color: '#888', fontWeight: '500' },
  historyTimes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  historyTimeItem: { alignItems: 'center' },
  historyTimeLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  historyTimeValue: { fontSize: 18, fontWeight: '700', color: '#333' },
  historyArrow: { fontSize: 20, color: '#ccc', marginHorizontal: 10 },
});
