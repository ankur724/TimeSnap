import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { TimePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider } from 'react-native-paper';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { savePunchRecord, loadPunchHistory } from '../utils/storage';
import { MMKV } from 'react-native-mmkv';

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
    { label: 'First Half', value: 'firstHalf' },
    { label: 'Second Half', value: 'secondHalf' },
  ]);
  const [punchHistory, setPunchHistory] = useState<PunchRecord[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const history = await loadPunchHistory();
      setPunchHistory(history);
    };
    fetchHistory();
  }, []);

  // Schedule notification
  const scheduleNotification = async (secondsFromNow: number) => {
    await notifee.createChannel({ id: 'default', name: 'Default Channel' });
    const date = new Date(Date.now() + secondsFromNow * 1000);
    const trigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: date.getTime() };

    await notifee.createTriggerNotification(
      {
        title: 'TimeSnap',
        body: 'Your punch out time is up!',
        android: { channelId: 'default' },
      },
      trigger
    );
  };

  // Calculate punch out time based on short leave (6.5 hours)
  const calculatePunchOut = (inTime: Date): Date => {
    const punchOut = new Date(inTime);
    punchOut.setMinutes(punchOut.getMinutes() + 390); // 6.5 hours = 390 minutes
    return punchOut;
  };

  // Punch in now
  const handlePunchIn = async () => {
    const now = new Date();
    const outTime = calculatePunchOut(now);

    setPunchInTime(now);
    setPunchOutTime(outTime);

    await scheduleNotification(10); // test notification in 10 seconds

    await savePunchRecord({
      type: 'shortLeave',
      punchIn: now.toISOString(),
      punchOut: outTime.toISOString(),
      leaveType,
    });

    const history = await loadPunchHistory();
    setPunchHistory(history);

    Alert.alert(
      'Punched In',
      `You punched in at ${now.toLocaleTimeString()}\nExpected Punch Out: ${outTime.toLocaleTimeString()}`
    );
  };

  // Manual punch in
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
      'Added',
      `Manual Punch In: ${inTime.toLocaleTimeString()}\nExpected Punch Out: ${outTime.toLocaleTimeString()}`
    );
  };

  // Clear history
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Short Leave</Text>

        {!punchInTime && (
          <>
            <Text style={{ marginBottom: 10 }}>Select Half:</Text>
            <DropDownPicker
              open={open}
              value={leaveType}
              items={items}
              setOpen={setOpen}
              setValue={setLeaveType}
              setItems={setItems}
              containerStyle={{ width: 200, marginBottom: 20, zIndex: 1000 }}
            />
            <Button title="Punch In (Now)" onPress={handlePunchIn} />
          </>
        )}

        {punchInTime && (
          <>
            <Text style={styles.info}>Punched In: {punchInTime.toLocaleTimeString()}</Text>
            <Text style={styles.info}>Expected Punch Out: {punchOutTime?.toLocaleTimeString()}</Text>
          </>
        )}

        {/* Manual Punch In */}
        <View style={styles.manualContainer}>
          <Text style={[styles.title, { fontSize: 20 }]}>Manual Entry</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateButtonText}>Select Punch In Time</Text>
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

        {/* Punch History */}
        <View style={{ marginTop: 30, width: '90%' }}>
          <View style={styles.historyHeader}>
            <Text style={[styles.title, { fontSize: 22 }]}>Last 5 Days Punch History</Text>
            {punchHistory.length > 0 && (
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.deleteText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {punchHistory.length === 0 && <Text style={styles.info}>No history found.</Text>}
          {punchHistory.map((record: PunchRecord, index: number) => (
            <View key={index} style={styles.historyItem}>
              <Text>Type: {record.type}</Text>
              <Text>Half: {record.leaveType}</Text>
              <Text>Punch In: {new Date(record.punchIn).toLocaleTimeString()}</Text>
              <Text>Punch Out: {new Date(record.punchOut).toLocaleTimeString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingVertical: 20,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  info: { fontSize: 18, marginVertical: 5 },
  manualContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
    elevation: 2,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    backgroundColor: '#f8f8f8',
  },
  dateButtonText: { fontSize: 16, color: '#333' },
  deleteText: { color: 'red', fontWeight: 'bold', fontSize: 16 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyItem: { marginVertical: 5, padding: 10, backgroundColor: '#fff', borderRadius: 8 },
});
