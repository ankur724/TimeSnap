import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FullDayScreen from './src/screens/FullDayScreen';
import HalfDayScreen from './src/screens/HalfDayScreen';
import ShortLeaveScreen from './src/screens/ShortLeaveScreen';

export type RootTabParamList = {
  FullDay: undefined;
  HalfDay: undefined;
  ShortLeave: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="FullDay">
        <Tab.Screen name="FullDay" component={FullDayScreen} options={{ title: 'Full Day' }} />
        <Tab.Screen name="HalfDay" component={HalfDayScreen} options={{ title: 'Half Day' }} />
        <Tab.Screen name="ShortLeave" component={ShortLeaveScreen} options={{ title: 'Short Leave' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
