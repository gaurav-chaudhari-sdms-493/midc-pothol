import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      <Button
        title="Report a Pothole"
        onPress={() => navigation.navigate('ReportPothole')}
      />
      <Button
        title="View Potholes"
        onPress={() => navigation.navigate('PotholeList')}
      />
      <Button
        title="View Map"
        onPress={() => navigation.navigate('Map')}
      />
      <Button
        title="Settings"
        onPress={() => navigation.navigate('Settings')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;