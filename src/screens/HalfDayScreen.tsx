import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
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

export default function HalfDayScreen() {
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const [half, setHalf] = useState<'firstHalf' | 'secondHalf'>('firstHalf');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: '🌅 First Half (4h)', value: 'firstHalf' },
    { label: '🌆 Second Half (4.5h)', value: 'secondHalf' },
  ]);
  const [punchHistory, setPunchHistory] = useState<PunchRecord[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchHistory = async () => {
      const history = await loadPunchHistory();
      setPunchHistory(history);
    };
    fetchHistory();

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

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

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

  const handlePunchIn = async () => {
    animateButton();
    const now = new Date();
    const hoursToWork = half === 'firstHalf' ? 4 : 4.5;
    const outTime = new Date(now.getTime() + hoursToWork * 60 * 60 * 1000);

    setPunchInTime(now);
    setPunchOutTime(outTime);
    const secondsUntilOut = Math.max(0, Math.floor((outTime.getTime() - now.getTime()) / 1000));

    await scheduleNotification(secondsUntilOut);

    await savePunchRecord({
      type: 'halfDay',
      punchIn: now.toISOString(),
      punchOut: outTime.toISOString(),
    });

    const history = await loadPunchHistory();
    setPunchHistory(history);

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

  const handleResetPunch = () => {
    setPunchInTime(null);
    setPunchOutTime(null);
    Alert.alert('Reset', 'Punch In/Out reset successfully.');
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderHeader = () => (
    <View style={{ alignItems: 'center' }}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.Text style={[styles.icon, { transform: [{ rotate: spin }] }]}>
          ⏰
        </Animated.Text>
        <Text style={styles.title}>Half Day</Text>
        <Text style={styles.subtitle}>Flexible Work Schedule</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.punchCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: punchInTime ? pulseAnim : 1 }],
          },
        ]}
      >
        {!punchInTime ? (
          <>
            <Text style={styles.selectLabel}>Select Your Half</Text>
            <View style={{ zIndex: 1000, marginBottom: 20 }}>
              <DropDownPicker
                open={open}
                value={half}
                items={items}
                setOpen={setOpen}
                setValue={setHalf}
                setItems={setItems}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                placeholderStyle={styles.dropdownPlaceholder}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePunchIn}
              style={styles.punchButton}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.punchButtonText}>🕐 Punch In Now</Text>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.timeInfo}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Punched In</Text>
              <Text style={styles.timeValue}>
                {punchInTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Expected Out</Text>
              <Text style={styles.timeValue}>
                {punchOutTime?.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>
            <TouchableOpacity onPress={handleResetPunch} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      <Animated.View
        style={[
          styles.manualCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.cardTitle}>⚙️ Manual Entry</Text>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
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

      {punchHistory.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No history found</Text>
        </View>
      )}
    </View>
  );

  return (
    <PaperProvider>
      <LinearGradient colors={['#fa709a', '#fee140', '#ffeaa7']} style={styles.gradient}>
        <FlatList
          contentContainerStyle={styles.container}
          data={punchHistory}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <Animated.View
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
                  <Text style={styles.typeBadgeText}>Half Day</Text>
                </View>
                <Text style={styles.historyDate}>
                  {new Date(item.punchIn).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.historyTimes}>
                <View style={styles.historyTimeItem}>
                  <Text style={styles.historyTimeLabel}>In</Text>
                  <Text style={styles.historyTimeValue}>
                    {new Date(item.punchIn).toLocaleTimeString([], {
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
                    {new Date(item.punchOut).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        />
      </LinearGradient>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
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
  selectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdown: {
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  dropdownContainer: {
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
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
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  timeBox: { alignItems: 'center', flex: 1 },
  timeLabel: { fontSize: 12, color: '#888', marginBottom: 8, fontWeight: '600' },
  timeValue: { fontSize: 28, fontWeight: '800', color: '#f5576c' },
  divider: { width: 2, height: 50, backgroundColor: '#e0e0e0', marginHorizontal: 10 },
  resetButton: {
    backgroundColor: '#ffe5e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 10,
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
  historySubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  clearButton: {
    backgroundColor: '#ffe5e5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearText: { color: '#ff4444', fontWeight: '700', fontSize: 12 },
  emptyState: { alignItems: 'center', marginTop: 30 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#777' },
  historyItem: {
    width: width - 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    backgroundColor: '#f093fb',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  typeBadgeText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  historyDate: { fontSize: 12, color: '#999', fontWeight: '600' },
  historyTimes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  historyTimeItem: { alignItems: 'center' },
  historyTimeLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  historyTimeValue: { fontSize: 18, fontWeight: '700', color: '#333' },
  historyArrow: { fontSize: 20, fontWeight: '700', color: '#f5576c' },
});
