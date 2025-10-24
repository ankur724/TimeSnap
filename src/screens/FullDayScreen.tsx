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
import { TimePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider } from 'react-native-paper';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { savePunchRecord, loadPunchHistory } from '../utils/storage';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

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

  useEffect(() => {
    const history = loadPunchHistory();
    setPunchHistory(history);
  }, []);

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
        body: 'Your punch out time is up!',
        android: { channelId: 'default' },
      },
      trigger
    );
  };

  const handlePunchIn = async () => {
    const now = new Date();
    const outTime = new Date(now.getTime() + 8.5 * 60 * 60 * 1000);

    setPunchInTime(now);
    setPunchOutTime(outTime);

    await scheduleNotification(10);

    savePunchRecord({
      type: 'fullDay',
      punchIn: now.toISOString(),
      punchOut: outTime.toISOString(),
    });

    setPunchHistory(loadPunchHistory());

    Alert.alert(
      'Punched In',
      `You punched in at ${now.toLocaleTimeString()}\nExpected Punch Out: ${outTime.toLocaleTimeString()}`
    );
  };

  const handleManualAdd = (hours: number, minutes: number) => {
    const now = new Date();
    const inTime = new Date(now);
    inTime.setHours(hours, minutes, 0, 0);

    const outTime = new Date(inTime.getTime() + 8.5 * 60 * 60 * 1000);

    savePunchRecord({
      type: 'fullDay',
      punchIn: inTime.toISOString(),
      punchOut: outTime.toISOString(),
    });

    setPunchHistory(loadPunchHistory());
    setShowPicker(false);

    Alert.alert(
      'Added',
      `Manual Punch In: ${inTime.toLocaleTimeString()}\nExpected Punch Out: ${outTime.toLocaleTimeString()}`
    );
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Full Day</Text>

        {!punchInTime ? (
          <Button title="Punch In (Now)" onPress={handlePunchIn} />
        ) : (
          <>
            <Text style={styles.info}>Punched In: {punchInTime.toLocaleTimeString()}</Text>
            <Text style={styles.info}>Expected Punch Out: {punchOutTime?.toLocaleTimeString()}</Text>
          </>
        )}

        {/* Manual Punch In Section */}
        <View style={styles.manualContainer}>
          <Text style={[styles.title, { fontSize: 20 }]}>Manual Entry</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.dateButtonText}>Select Punch In Time</Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker Modal */}
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
          {punchHistory.map((record, index) => (
            <View
              key={index}
              style={{ marginVertical: 5, padding: 10, backgroundColor: '#fff', borderRadius: 8 }}
            >
              <Text>Type: {record.type}</Text>
              <Text>Punch In: {new Date(record.punchIn).toLocaleString()}</Text>
              <Text>Punch Out: {new Date(record.punchOut).toLocaleString()}</Text>
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
