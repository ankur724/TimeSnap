import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
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
      <Tab.Navigator
        initialRouteName="FullDay"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
          tabBarLabelStyle: styles.tabLabel,
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
          tabBarItemStyle: styles.tabItem,
tabBarIcon: ({ color, focused }) => {
  let iconName: string = 'ellipse-outline';
  
  if (route.name === 'FullDay') {
    iconName = focused ? 'ellipse' : 'ellipse-outline';
  } else if (route.name === 'HalfDay') {
    iconName = focused ? 'ellipse' : 'ellipse-outline';
  } else if (route.name === 'ShortLeave') {
    iconName = focused ? 'ellipse' : 'ellipse-outline';
  }
  
  return (
    <Icon 
      name={iconName} 
      size={focused ? 26 : 24} 
      color={color}
    />
  );
},  
    })}
      >
        <Tab.Screen 
          name="FullDay" 
          component={FullDayScreen} 
          options={{ title: 'Full Day' }} 
        />
        <Tab.Screen 
          name="HalfDay" 
          component={HalfDayScreen} 
          options={{ title: 'Half Day' }} 
        />
        <Tab.Screen 
          name="ShortLeave" 
          component={ShortLeaveScreen} 
          options={{ title: 'Short Leave' }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 60,
    marginHorizontal: 16,
    marginBottom: 5,
    borderRadius: 20,
    overflow: 'hidden',
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  iconFocused: {
    transform: [{ scale: 1.05 }],
  },
});