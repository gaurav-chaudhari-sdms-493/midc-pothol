import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, Alert } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import { reportPothole } from '../utils/api';

const ReportPotholeScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);

  const takePicture = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: false,
    });

    if (result.didCancel) {
      console.log('User cancelled image picker');
    } else if (result.errorCode) {
      console.log('ImagePicker Error: ', result.errorMessage);
    } else {
      setImage(result.assets[0].uri);
    }
  };

  const getLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
      },
      (error) => {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!image || !location) {
      Alert.alert('Missing Information', 'Please take a picture and get the location.');
      return;
    }

    const data = new FormData();
    data.append('image', {
      uri: image,
      name: 'pothole.jpg',
      type: 'image/jpeg',
    });
    data.append('latitude', location.coords.latitude);
    data.append('longitude', location.coords.longitude);

    try {
      await reportPothole(data);
      Alert.alert('Success', 'Pothole reported successfully.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to report pothole.');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Report a Pothole</Text>
      <Button title="Take Picture" onPress={takePicture} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Button title="Get Location" onPress={getLocation} />
      {location && (
        <Text>
          Latitude: {location.coords.latitude}, Longitude: {location.coords.longitude}
        </Text>
      )}
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
});

export default ReportPotholeScreen;