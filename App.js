import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ReportPotholeScreen from './src/screens/ReportPotholeScreen';
import PotholeListScreen from './src/screens/PotholeListScreen';
import MapScreen from './src/screens/MapScreen';
import PotholeDetailScreen from './src/screens/PotholeDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ReportPothole" component={ReportPotholeScreen} />
        <Stack.Screen name="PotholeList" component={PotholeListScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="PotholeDetail" component={PotholeDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;