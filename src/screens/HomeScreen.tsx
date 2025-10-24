// import React, { useState, useEffect } from 'react';
// import { View, Text, Button, Alert, StyleSheet } from 'react-native';
// import DropDownPicker from 'react-native-dropdown-picker';
// import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';

// export default function HomeScreen() {
//   const [punchInTime, setPunchInTime] = useState<Date | null>(null);
//   const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  
//   const [leaveType, setLeaveType] = useState<string>('full'); // full, firstHalf, secondHalf
//   const [open, setOpen] = useState(false);
//   const [items, setItems] = useState([
//     { label: 'Full Day', value: 'full' },
//     { label: 'First Half', value: 'firstHalf' },
//     { label: 'Second Half', value: 'secondHalf' },
//   ]);

//   const scheduleNotification = async (secondsFromNow: number) => {
//     const date = new Date(Date.now() + secondsFromNow * 1000);
//     const trigger: TimestampTrigger = {
//       type: TriggerType.TIMESTAMP,
//       timestamp: date.getTime(),
//       alarmManager: true,
//     };

//     await notifee.createTriggerNotification(
//       {
//         title: 'TimeSnap',
//         body: 'Your punch out time is up! You can go now.',
//         android: { channelId: 'default' },
//       },
//       trigger
//     );
//   };

//   const handlePunchIn = async () => {
//     const now = new Date();
//     let outTime: Date = new Date(); // default to satisfy TS

//     if (leaveType === 'full') {
//       outTime = new Date(now.getTime() + 8.5 * 60 * 60 * 1000);
//     } else if (leaveType === 'secondHalf') {
//       outTime = new Date(now.getTime() + 6.5 * 60 * 60 * 1000);
//     } else if (leaveType === 'firstHalf') {
//       outTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
//     }

//     setPunchInTime(now);
//     setPunchOutTime(outTime);

//     await scheduleNotification(10); // For testing, 10 seconds

//     Alert.alert(
//       'Punched In',
//       `You punched in at ${now.toLocaleTimeString()}\nYou’ll be notified at ${outTime.toLocaleTimeString()}`
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>TimeSnap</Text>

//       {!punchInTime && (
//         <>
//           <Text style={{ marginBottom: 10 }}>Select Leave Type:</Text>
//           <DropDownPicker
//             open={open}
//             value={leaveType}
//             items={items}
//             setOpen={setOpen}
//             setValue={setLeaveType}
//             setItems={setItems}
//             containerStyle={{ width: 200, marginBottom: 20 }}
//           />
//           <Button title="Punch In" onPress={handlePunchIn} />
//         </>
//       )}

//       {punchInTime && (
//         <>
//           <Text style={styles.info}>Punched In: {punchInTime.toLocaleTimeString()}</Text>
//           <Text style={styles.info}>Expected Punch Out: {punchOutTime?.toLocaleTimeString()}</Text>
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' },
//   title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
//   info: { fontSize: 18, marginVertical: 10 },
// });
