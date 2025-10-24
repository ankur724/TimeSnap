import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  FlatList,
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
  punchIn: string;
  punchOut: string;
};

export default function HalfDayScreen() {
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const [half, setHalf] = useState<'firstHalf' | 'secondHalf'>('firstHalf');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'First Half', value: 'firstHalf' },
    { label: 'Second Half', value: 'secondHalf' },
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
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        title: 'TimeSnap',
        body: 'Your half day punch out is up!',
        android: { channelId: 'default' },
      },
      trigger
    );
  };

  const handlePunchIn = async () => {
    const now = new Date();
    const hoursToWork = half === 'firstHalf' ? 4 : 4.5;
    const outTime = new Date(now.getTime() + hoursToWork * 60 * 60 * 1000);

    setPunchInTime(now);
    setPunchOutTime(outTime);

    await scheduleNotification(10);

    await savePunchRecord({
      type: 'halfDay',
      punchIn: now.toISOString(),
      punchOut: outTime.toISOString(),
    });

    const history = await loadPunchHistory();
    setPunchHistory(history);

    Alert.alert(
      'Punched In',
      `You punched in at ${now.toLocaleTimeString()}\nExpected Punch Out: ${outTime.toLocaleTimeString()}`
    );
  };

  const handleManualAdd = async (hours: number, minutes: number) => {
    const now = new Date();
    const inTime = new Date(now);
    inTime.setHours(hours, minutes, 0, 0);

    const hoursToWork = half === 'firstHalf' ? 4 : 4.5;
    const outTime = new Date(inTime.getTime() + hoursToWork * 60 * 60 * 1000);

    await savePunchRecord({
      type: 'halfDay',
      punchIn: inTime.toISOString(),
      punchOut: outTime.toISOString(),
    });

    const history = await loadPunchHistory();
    setPunchHistory(history);
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

  // Render the top section above history
  const renderHeader = () => (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.title}>Half Day</Text>

      {!punchInTime && (
        <>
          <Text style={{ marginBottom: 10 }}>Select Half:</Text>
          <DropDownPicker
            open={open}
            value={half}
            items={items}
            setOpen={setOpen}
            setValue={setHalf}
            setItems={setItems}
            containerStyle={{ width: 200, marginBottom: 20, zIndex: 1000 }}
          />
          <Button title="Punch In (Now)" onPress={handlePunchIn} />
        </>
      )}

      {punchInTime && (
        <>
          <Text style={styles.info}>
            Punched In: {punchInTime.toLocaleTimeString()}
          </Text>
          <Text style={styles.info}>
            Expected Punch Out: {punchOutTime?.toLocaleTimeString()}
          </Text>
        </>
      )}

      <View style={styles.manualContainer}>
        <Text style={[styles.title, { fontSize: 20 }]}>Manual Entry</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
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

      <View style={styles.historyHeader}>
        <Text style={[styles.title, { fontSize: 22 }]}>
          Last 5 Days Punch History
        </Text>
        {punchHistory.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.deleteText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <PaperProvider>
      <FlatList
        contentContainerStyle={styles.container}
        data={punchHistory}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text>Type: {item.type}</Text>
            <Text>Punch In: {new Date(item.punchIn).toLocaleString()}</Text>
            <Text>Punch Out: {new Date(item.punchOut).toLocaleString()}</Text>
          </View>
        )}
      />
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
    alignItems: 'center',
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
    width: '90%',
    marginTop: 20,
  },
  historyItem: { marginVertical: 5, padding: 10, backgroundColor: '#fff', borderRadius: 8, width: '90%' },
});
