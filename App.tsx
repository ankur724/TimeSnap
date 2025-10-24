import React from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
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

const Tab = createMaterialTopTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <Tab.Navigator
          initialRouteName="FullDay"
          screenOptions={({ route }) => ({
            tabBarShowLabel: true,
            tabBarScrollEnabled: false,
            tabBarStyle: styles.tabBar,
            tabBarBackground: () => (
              <LinearGradient
                colors={['#4b6cb7', '#182848']} // darker blue gradient for contrast
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            ),
            tabBarLabelStyle: styles.tabLabel,
            tabBarActiveTintColor: '#fff',
            tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
            tabBarItemStyle: styles.tabItem,
            tabBarIndicatorStyle: styles.indicator,
            tabBarPressColor: 'rgba(255, 255, 255, 0.15)',
            tabBarIndicatorContainerStyle: styles.indicatorContainer,
            tabBarContentContainerStyle: styles.tabBarContent,
            tabBarIcon: ({ color, focused }) => {
              let iconName: string = 'ellipse-outline';
              if (route.name === 'FullDay') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'HalfDay') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'ShortLeave') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              }

              return (
                <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                  <Icon name={iconName} size={20} color={color} />
                </View>
              );
            },
          })}
        >
          <Tab.Screen name="FullDay" component={FullDayScreen} options={{ title: 'Full Day' }} />
          <Tab.Screen name="HalfDay" component={HalfDayScreen} options={{ title: 'Half Day' }} />
          <Tab.Screen name="ShortLeave" component={ShortLeaveScreen} options={{ title: 'Short Leave' }} />
        </Tab.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6b63d3',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  tabBar: {
    elevation: 6,
    shadowOpacity: 0.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    height: 75,
  },
  tabBarContent: {
    paddingHorizontal: 12,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 14, // 🔹 add some bottom padding to push label up
    
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: -2,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    transform: [{ scale: 1.08 }],
    shadowColor: '#ae4141ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  indicator: {
    backgroundColor: '#fff', // bright yellow indicator
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  indicatorContainer: {
    borderBottomWidth: 0,
  },
});
